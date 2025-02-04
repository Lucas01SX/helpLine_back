import pool from '../database/db';

export class DashboardService {
    private static async usuariosLogadosDash(): Promise<any> {
        try {
            const result = await pool.query(`select a.pk_id_usuario, a.hr_login, a.hr_logoff from suporte.tb_login_logoff_suporte a`);
            const usuarios = result.rows.map((usuario: any) => {
                const hr_login = new Date(`1970-01-01T${usuario.hr_login}Z`);
                const hr_login_formatted = hr_login.toTimeString().split(' ')[0];
                let hr_logoff_formatted = null;
                if (usuario.hr_logoff) {
                    const hr_logoff = new Date(`1970-01-01T${usuario.hr_logoff}Z`);
                    hr_logoff_formatted = hr_logoff.toTimeString().split(' ')[0];
                }
                return {
                    ...usuario,
                    hr_login: hr_login_formatted,
                    hr_logoff: hr_logoff_formatted
                };
            });
            return usuarios;
        } catch (e) {
            console.error('Erro em validar logados:', e);
            throw e;
        }
    }

    private static async dadosGeraisSuporteDash(): Promise<any> {
        try {
            const result = await pool.query(`select a.id_suporte, a.hora_solicitacao_suporte, a.dt_solicitacao_suporte, a.tempo_aguardando_suporte, a.cancelar_suporte from suporte.tb_chamado_suporte a`);
            return result.rows;
        } catch (e) {
            console.error('Erro na consulta de dados gerais:', e);
            throw e;
        }
    }

    // Função para gerar os intervalos de hora
    private static gerarIntervalosHora(inicio: string = "07:00", fim: string = "21:00"): string[] {
        const intervalos: string[] = [];
        let horaInicio = new Date(`1970-01-01T${inicio}:00Z`);
        let horaFim = new Date(`1970-01-01T${fim}:00Z`);
        
        while (horaInicio <= horaFim) {
            intervalos.push(horaInicio.toISOString().substr(11, 8));  // Formato HH:mm:ss
            horaInicio.setHours(horaInicio.getHours() + 1);  // Incrementa 1 hora
        }
        return intervalos;
    }

    private static horaParaMinutos(hora: string): number {
        const [h, m, s] = hora.split(':').map(Number);
        return h * 60 + m + s / 60;
    }

    // Função para converter tempo_aguardando_suporte de HH:mm:ss para minutos
    private static tempoParaMinutos(tempo: string): number {
        const [h, m, s] = tempo.split(':').map(Number);
        return h * 60 + m + s / 60;
    }

    private static async tratamentoDadosDash(usuariosLogadosDash: any, dadosGeraisSuporteDash: any): Promise<any> {
        const usuarios = usuariosLogadosDash;
        const dadosGerais = dadosGeraisSuporteDash;
        
        try {
            const faixasHorarias = this.gerarIntervalosHora();  // Gera das 07:00 até 21:00
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            const faixasFiltradas = faixasHorarias.filter(faixa => {
                const [h, m] = faixa.split(':').map(Number);
                return h < currentHour || (h === currentHour && m <= currentMinute);
            });

            // Inicializando a estrutura de resultado
            const resultado: any[] = faixasFiltradas.map(faixa => ({
                hora: faixa,
                logados: 0,
                acionamentos: 0,
                tempoMedioEspera: 0,
                chamadosCancelados: 0,
            }));

            // Processando dados de suporte
            dadosGerais.forEach((registro: any) => {
                // Para cada faixa horária, verificamos se ela corresponde à hora de solicitação
                resultado.forEach(faixa => {
                    const [h, m] = faixa.hora.split(':').map(Number);
                    const horaSolicitacao = new Date(registro.dt_solicitacao_suporte);
                    const [horaChamado, minutoChamado] = [horaSolicitacao.getHours(), horaSolicitacao.getMinutes()];

                    // Verificando se a faixa horária corresponde à hora da solicitação
                    if (horaChamado === h && minutoChamado <= m) {
                        // Atualizando os totais da faixa horária
                        faixa.logados += 1;  // Exemplo de incremento
                        faixa.acionamentos += registro.acionamentos;
                        faixa.tempoMedioEspera += registro.tempo_aguardando_suporte;
                        faixa.chamadosCancelados += registro.cancelar_suporte;
                    }
                });
            });

            // Ajustando o resultado para o formato desejado
            return resultado.map(faixa => ({
                hora: faixa.hora,
                logados: faixa.logados,
                acionamentos: faixa.acionamentos,
                tempoMedioEspera: faixa.tempoMedioEspera,
                chamadosCancelados: faixa.chamadosCancelados,
            }));

        } catch (e) {
            console.error('Erro no tratamento de dados do Dash:', e);
            throw e;
        }
    }

    public static async dadosSuporteDash(): Promise<any> {
        try {
            const usuariosLogados = await this.usuariosLogadosDash();
            const dadosGeraisSuporte = await this.dadosGeraisSuporteDash();
            const resultado = await this.tratamentoDadosDash(usuariosLogados, dadosGeraisSuporte);
            return resultado;
        } catch (e) {
            console.error('Erro ao obter dados do Dash:', e);
            throw e;
        }
    }
}
