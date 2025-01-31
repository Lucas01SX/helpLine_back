import pool from '../database/db';

export class DashboardService {
    private static async usuariosLogadosDash() :Promise<any> {
        try {
            const result = await pool.query(`select a.pk_id_usuario, string_agg(d.segmento,',') as segmento, string_agg(d.mcdu::text, ',') as mcdu, string_agg(d.fila, ',') as fila, a.hr_login, a.hr_logoff from suporte.tb_login_logoff_suporte a join suporte.tb_login_suporte b on a.pk_id_usuario = b.id_usuario join suporte.tb_skills_staff c on b.matricula::int = c.matricula::int join trafego.tb_anexo1g d on c.mcdu::int = d.mcdu::int where a.dt_login = current_date group by a.pk_id_usuario, a.hr_login, a.hr_logoff`);
            const usuarios = result.rows.map((usuario: any) => {
                const hr_login = new Date(`1970-01-01T${usuario.hr_login}Z`);
                hr_login.setHours(hr_login.getHours() );
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
            console.error('Erro em validar logados:', e);
            throw e;
        }
    }
    private static async dadosGeraisSuporteDash():Promise<any> {
        try {
            const result = await pool.query(`select a.id_suporte, a.hora_solicitacao_suporte, a.dt_solicitacao_suporte, a.tempo_aguardando_suporte, a.cancelar_suporte, a.mcdu, b.fila, b.segmento from suporte.tb_chamado_suporte a join trafego.tb_anexo1g b on a.mcdu::int = b.mcdu::int where a.dt_solicitacao_suporte = current_date`);
            return result.rows;
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    } 
    private static async tratamentoDadosDash(usuariosLogadosDash: any, dadosGeraisSuporteDash: any): Promise<any> {
        const usuarios = usuariosLogadosDash;
        const dadosGerais = dadosGeraisSuporteDash;
        try {
            const faixasHorarias = ['07:00:00', '08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00', '18:00:00', '19:00:00', '20:00:00', '21:00:00'];
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const faixasFiltradas = faixasHorarias.filter(faixa => {
                const [h, m, s] = faixa.split(':').map(Number);
                return h < currentHour || (h === currentHour && m <= currentMinute);
            });
            const resultado = faixasFiltradas.map(faixa => ({
                hora: faixa,
                logados: 0,
                acionamentos: 0,
                tempoMedioEspera: 0,
                chamadosCancelados: 0
            }));
            const horaParaMinutos = (hora: string) => {
                const [h, m, s] = hora.split(':').map(Number);
                return h * 60 + m + s / 60;
            };
            usuarios.forEach((usuario: any) => {
                const hrLoginMinutos = horaParaMinutos(usuario.hr_login);
                const hrLogoffMinutos = usuario.hr_logoff ? horaParaMinutos(usuario.hr_logoff) : Infinity;
                resultado.forEach(faixa => {
                    const faixaInicioMinutos = horaParaMinutos(faixa.hora);
                    const faixaFimMinutos = faixaInicioMinutos + 60;
                    if (hrLoginMinutos <= faixaFimMinutos && hrLogoffMinutos >= faixaInicioMinutos) {
                        faixa.logados += 1;
                    }
                });
            });
            dadosGerais.forEach((chamado: any) => {
                const horaSolicitacaoMinutos = horaParaMinutos(chamado.hora_solicitacao_suporte);
                resultado.forEach(faixa => {
                    const faixaInicioMinutos = horaParaMinutos(faixa.hora);
                    const faixaFimMinutos = faixaInicioMinutos + 60;
                    if (horaSolicitacaoMinutos >= faixaInicioMinutos && horaSolicitacaoMinutos <= faixaFimMinutos) {
                        faixa.acionamentos += 1;
                        if (chamado.tempo_aguardando_suporte && !chamado.cancelar_suporte) {
                            const tempoEsperaMinutos = horaParaMinutos(chamado.tempo_aguardando_suporte);
                            faixa.tempoMedioEspera += tempoEsperaMinutos;
                        }
                        if (chamado.cancelar_suporte) {
                            faixa.chamadosCancelados += 1;
                        }
                    }
                });
            });
            resultado.forEach(faixa => {
                if (faixa.acionamentos > 0) {
                    const totalMinutos = faixa.tempoMedioEspera / faixa.acionamentos;
                    faixa.tempoMedioEspera = totalMinutos;
                }
            });
            return resultado;
        } catch (e) {
            console.error('Erro no tratamento de dados do Dash:', e);
            throw e;
        }
    }
    public static async dadosSuporteDash(): Promise<any> {
        try {
            const result = await this.tratamentoDadosDash(await this.usuariosLogadosDash(),await this.dadosGeraisSuporteDash());
            return result;
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
}