private static async tratamentoDadosDash(usuariosLogadosDash: any, dadosGeraisSuporteDash: any): Promise<any> {
    try {
        const faixasHorarias = this.gerarIntervalosHora();

        // Garante que só serão considerados horários entre 08 e 21
        const faixasFiltradas = faixasHorarias.filter(faixa => {
            const hora = parseInt(faixa); // Converte para número para evitar erro na comparação
            return hora >= 8 && hora <= 21;
        });

        const resultado: any[] = faixasFiltradas.map(faixa => ({
            horario: faixa,
            segmentos: {}
        }));

        dadosGeraisSuporteDash.forEach((chamado: any) => {
            const horaSolicitacao = chamado.hora_solicitacao_suporte;
            const segmento = chamado.segmento;
            const fila = chamado.fila;

            resultado.forEach(faixa => {
                if (faixa.horario === horaSolicitacao) {
                    if (!faixa.segmentos[segmento]) {
                        faixa.segmentos[segmento] = { filas: {} };
                    }

                    if (!faixa.segmentos[segmento].filas[fila]) {
                        faixa.segmentos[segmento].filas[fila] = {
                            acionamentos: 0,
                            tempoTotalEspera: 0,
                            chamadosCancelados: 0
                        };
                    }

                    faixa.segmentos[segmento].filas[fila].acionamentos += 1;

                    if (chamado.tempo_aguardando_suporte && !chamado.cancelar_suporte) {
                        const tempoEsperaMinutos = this.horaParaMinutos(chamado.tempo_aguardando_suporte);
                        faixa.segmentos[segmento].filas[fila].tempoTotalEspera += tempoEsperaMinutos;
                    }

                    if (chamado.cancelar_suporte) {
                        faixa.segmentos[segmento].filas[fila].chamadosCancelados += 1;
                    }
                }
            });
        });

        const logadosPorHora: { horario: string, usuarios: { id_usuario: string, segmento: string, mcdu: string, fila: string, logoff: boolean }[] }[] = [];

        faixasFiltradas.forEach(faixa => {
            const usuariosNaHora: { id_usuario: string, segmento: string, mcdu: string, fila: string, logoff: boolean }[] = [];

            usuariosLogadosDash.forEach((usuario: any) => {
                const hrLoginMinutos = this.horaParaMinutos(usuario.hr_login);
                const hrLogoffMinutos = usuario.hr_logoff ? this.horaParaMinutos(usuario.hr_logoff) : Infinity;

                const faixaInicioMinutos = this.horaParaMinutos(faixa);
                const faixaFimMinutos = faixaInicioMinutos + 60;

                if (hrLoginMinutos <= faixaInicioMinutos && (hrLogoffMinutos >= faixaFimMinutos || usuario.hr_logoff === null)) {
                    usuariosNaHora.push({
                        id_usuario: usuario.id,
                        segmento: usuario.segmento,
                        mcdu: usuario.mcdu,
                        fila: usuario.fila,
                        logoff: usuario.hr_logoff !== null
                    });
                }
            });

            logadosPorHora.push({
                horario: faixa,
                usuarios: usuariosNaHora
            });
        });

        return { logados: logadosPorHora, resultado };
    } catch (e) {
        console.error('Erro no tratamento de dados do Dash:', e);
        throw e;
    }
}
