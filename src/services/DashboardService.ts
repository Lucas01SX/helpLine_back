import pool from '../database/db';

export class DashboardService {
    private static async usuariosLogadosDash(): Promise<any> {
        try {
            const result = await pool.query(`
                select distinct a.pk_id_usuario, a.hr_login, a.hr_logoff 
                from suporte.tb_login_logoff_suporte a
                join suporte.tb_login_suporte b on a.pk_id_usuario = b.id_usuario
                join suporte.tb_skills_staff c on b.matricula = c.matricula::int
                where a.dt_login = current_date
            `);
            const usuarios = result.rows.map((usuario: any) => {
                const hr_login = new Date(`1970-01-01T${usuario.hr_login}Z`);
                hr_login.setHours(hr_login.getHours());
                const hr_login_formatted = hr_login.toTimeString().split(' ')[0];
                let hr_logoff_formatted = null;
                if (usuario.hr_logoff) {
                    const hr_logoff = new Date(`1970-01-01T${usuario.hr_logoff}Z`);
                    hr_logoff.setHours(hr_logoff.getHours());
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
            console.error('Erro ao obter usuários logados:', e);
            throw e;
        }
    }

    private static async dadosGeraisSuporteDash(): Promise<any> {
        try {
            const result = await pool.query(`
                select a.id_suporte, a.hora_solicitacao_suporte, a.dt_solicitacao_suporte,
                       a.tempo_aguardando_suporte, a.cancelar_suporte
                from suporte.tb_chamado_suporte a
                where a.dt_solicitacao_suporte = current_date
            `);
            return result.rows;
        } catch (e) {
            console.error('Erro ao obter dados gerais de suporte:', e);
            throw e;
        }
    }

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

            const resultado = faixasFiltradas.map(faixa => ({
                hora: faixa,
                logados: 0,
                acionamentos: 0,
                tempoMedioEspera: null,  // Inicialmente null
                tempoTotalEspera: 0,
                chamadosCancelados: 0
            }));

            // Filtrando os usuários logados
            usuarios.forEach((usuario: any) => {
                const hrLoginMinutos = this.horaParaMinutos(usuario.hr_login);
                const hrLogoffMinutos = usuario.hr_logoff ? this.horaParaMinutos(usuario.hr_logoff) : Infinity;

                resultado.forEach(faixa => {
                    const faixaInicioMinutos = this.horaParaMinutos(faixa.hora);
                    const faixaFimMinutos = faixaInicioMinutos + 60;
                    if (hrLoginMinutos <= faixaFimMinutos && hrLogoffMinutos >= faixaInicioMinutos) {
                        faixa.logados += 1;
                    }
                });
            });

            // Processando dados dos chamados
            dadosGerais.forEach((chamado: any) => {
                const horaSolicitacaoMinutos = this.horaParaMinutos(chamado.hora_solicitacao_suporte);

                resultado.forEach(faixa => {
                    const faixaInicioMinutos = this.horaParaMinutos(faixa.hora);
                    const faixaFimMinutos = faixaInicioMinutos + 60;

                    if (horaSolicitacaoMinutos >= faixaInicioMinutos && horaSolicitacaoMinutos <= faixaFimMinutos) {
                        faixa.acionamentos += 1;
                        if (chamado.tempo_aguardando_suporte && !chamado.cancelar_suporte) {
                            faixa.tempoTotalEspera += chamado.tempo_aguardando_suporte;  // Somando o tempo total de espera
                        }
                        if (chamado.cancelar_suporte) {
                            faixa.chamadosCancelados += 1;
                        }
                    }
                });
            });

            // Calculando o tempo médio de espera
            resultado.forEach(faixa => {
                if (faixa.acionamentos > 0) {
                    faixa.tempoMedioEspera = faixa.tempoTotalEspera / faixa.acionamentos;  // Média em minutos
                } else {
                    faixa.tempoMedioEspera = 0; // Se não houver acionamentos, a média é 0
                }
            });

            return resultado;  // Retorna os dados com tempoMedioEspera como número (minutos)
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
            return { dadosDashboard: resultado }; // Retornando os dados como esperado
        } catch (e) {
            console.error('Erro ao obter dados do dashboard:', e);
            throw e;
        }
    }
}
