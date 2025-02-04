import pool from '../database/db';

export class DashboardService {
    private static async usuariosLogadosDash(): Promise<any> {
        try {
            const result = await pool.query(`
                SELECT DISTINCT a.pk_id_usuario, a.hr_login, a.hr_logoff 
                FROM suporte.tb_login_logoff_suporte a
                JOIN suporte.tb_login_suporte b ON a.pk_id_usuario = b.id_usuario
                JOIN suporte.tb_skills_staff c ON b.matricula = c.matricula::int
                WHERE a.dt_login = current_date
            `);
            return result.rows.map((usuario: any) => {
                return {
                    ...usuario,
                    hr_login: usuario.hr_login.split('.')[0],
                    hr_logoff: usuario.hr_logoff ? usuario.hr_logoff.split('.')[0] : null
                };
            });
        } catch (e) {
            console.error('Erro ao obter usuários logados:', e);
            throw e;
        }
    }

    private static async dadosGeraisSuporteDash(): Promise<any> {
        try {
            const result = await pool.query(`
                SELECT a.id_suporte, a.hora_solicitacao_suporte, a.dt_solicitacao_suporte,
                       a.tempo_aguardando_suporte, a.cancelar_suporte
                FROM suporte.tb_chamado_suporte a
                WHERE a.dt_solicitacao_suporte = current_date
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
            intervalos.push(horaInicio.toISOString().substr(11, 8));
            horaInicio.setHours(horaInicio.getHours() + 1);
        }
        return intervalos;
    }

    private static horaParaMinutos(hora: string): number {
        const [h, m, s] = hora.split(':').map(Number);
        return h * 60 + m + s / 60;
    }

    private static async tratamentoDadosDash(usuariosLogadosDash: any, dadosGeraisSuporteDash: any): Promise<any> {
        try {
            const faixasHorarias = this.gerarIntervalosHora();
            const resultado = faixasHorarias.map(faixa => ({
                hora: faixa,
                logados: 0,
                acionamentos: 0,
                tempoMedioEspera: null,
                tempoTotalEspera: 0,
                chamadosCancelados: 0
            }));

            usuariosLogadosDash.forEach((usuario: any) => {
                const hrLoginMin = this.horaParaMinutos(usuario.hr_login);
                const hrLogoffMin = usuario.hr_logoff ? this.horaParaMinutos(usuario.hr_logoff) : Infinity;
                resultado.forEach(faixa => {
                    const faixaInicioMin = this.horaParaMinutos(faixa.hora);
                    if (hrLoginMin <= faixaInicioMin + 60 && hrLogoffMin >= faixaInicioMin) {
                        faixa.logados += 1;
                    }
                });
            });

            dadosGeraisSuporteDash.forEach((chamado: any) => {
                const horaSolicitacaoMin = this.horaParaMinutos(chamado.hora_solicitacao_suporte);
                resultado.forEach(faixa => {
                    const faixaInicioMin = this.horaParaMinutos(faixa.hora);
                    if (horaSolicitacaoMin >= faixaInicioMin && horaSolicitacaoMin < faixaInicioMin + 60) {
                        faixa.acionamentos += 1;
                        if (chamado.tempo_aguardando_suporte && !chamado.cancelar_suporte) {
                            faixa.tempoTotalEspera += chamado.tempo_aguardando_suporte;
                        }
                        if (chamado.cancelar_suporte) {
                            faixa.chamadosCancelados += 1;
                        }
                    }
                });
            });

            resultado.forEach(faixa => {
                faixa.tempoMedioEspera = faixa.acionamentos > 0 
                    ? (faixa.tempoTotalEspera / faixa.acionamentos) 
                    : 0;
            });

            return resultado;
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
            return { dadosDashboard: resultado };
        } catch (e) {
            console.error('Erro ao obter dados do dashboard:', e);
            throw e;
        }
    }
}
