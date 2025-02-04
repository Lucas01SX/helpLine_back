import pool from '../database/db';
import { FilasService } from './FilasService';  // Importando o serviço de filas

export class DashboardService {
    private static async usuariosLogadosDash(): Promise<any> {
        try {
            const result = await pool.query(`select a.pk_id_usuario, string_agg(d.segmento,',') as segmento, string_agg(d.mcdu::text, ',') as mcdu, string_agg(d.fila, ',') as fila, a.hr_login, a.hr_logoff from suporte.tb_login_logoff_suporte a join suporte.tb_login_suporte b on a.pk_id_usuario = b.id_usuario join suporte.tb_skills_staff c on b.matricula::int = c.matricula::int join trafego.tb_anexo1g d on c.mcdu::int = d.mcdu::int where a.dt_login = current_date group by a.pk_id_usuario, a.hr_login, a.hr_logoff`);
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
            console.error('Erro em validar logados:', e);
            throw e;
        }
    }

    private static async dadosGeraisSuporteDash(): Promise<any> {
        try {
            const result = await pool.query(`select a.id_suporte, a.hora_solicitacao_suporte, a.dt_solicitacao_suporte, a.tempo_aguardando_suporte, a.cancelar_suporte, a.mcdu, b.fila, b.segmento from suporte.tb_chamado_suporte a join trafego.tb_anexo1g b on a.mcdu::int = b.mcdu::int where a.dt_solicitacao_suporte = current_date`);
            return result.rows;
        } catch (e) {
            console.error('Erro na autenticação:', e);
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

            const resultado = faixasFiltradas.map(faixa => ({
                hora: faixa,
                logados: 0,
                acionamentos: 0,
                tempoMedioEspera: 0,
                chamadosCancelados: 0,
                filas: {}  // Para agrupar os dados de filas
            }));

            // Integrando com dados de filas e segmentos
            const filas = await FilasService.filasGerais();

            // Inicializando as estruturas de filas e segmentos para cada faixa horária
            filas.forEach(fila => {
                resultado.forEach(faixa => {
                    if (!faixa.filas[fila.fila]) {
                        faixa.filas[fila.fila] = {
                            logados: 0,
                            acionamentos: 0,
                            tempoMedioEspera: 0,
                            chamadosCancelados: 0
                        };
                    }
                    if (!faixa.filas[fila.segmento]) {
                        faixa.filas[fila.segmento] = {
                            logados: 0,
                            acionamentos: 0,
                            tempoMedioEspera: 0,
                            chamadosCancelados: 0
                        };
                    }
                });
            });

            // Filtrando os usuários logados
            usuarios.forEach((usuario: any) => {
                const hrLoginMinutos = this.horaParaMinutos(usuario.hr_login);
                const hrLogoffMinutos = usuario.hr_logoff ? this.horaParaMinutos(usuario.hr_logoff) : Infinity;

                resultado.forEach(faixa => {
                    const faixaInicioMinutos = this.horaParaMinutos(faixa.hora);
                    const faixaFimMinutos = faixaInicioMinutos + 60;
                    if (hrLoginMinutos <= faixaFimMinutos && hrLogoffMinutos >= faixaInicioMinutos) {
                        faixa.logados += 1;
                        // Acionando as filas e segmentos
                        usuario.fila.split(',').forEach(fila => {
                            if (faixa.filas[fila]) {
                                faixa.filas[fila].logados += 1;
                            }
                        });
                        usuario.segmento.split(',').forEach(segmento => {
                            if (faixa.filas[segmento]) {
                                faixa.filas[segmento].logados += 1;
                            }
                        });
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
                            const tempoEsperaMinutos = this.tempoParaMinutos(chamado.tempo_aguardando_suporte);
                            faixa.tempoMedioEspera += tempoEsperaMinutos;
                        }
                        if (chamado.cancelar_suporte) {
                            faixa.chamadosCancelados += 1;
                        }

                        // Acionamentos por fila e segmento
                        chamado.fila.split(',').forEach(fila => {
                            if (faixa.filas[fila]) {
                                faixa.filas[fila].acionamentos += 1;
                                if (chamado.tempo_aguardando_suporte) {
                                    const tempoEsperaMinutos = this.tempoParaMinutos(chamado.tempo_aguardando_suporte);
                                    faixa.filas[fila].tempoMedioEspera += tempoEsperaMinutos;
                                }
                                if (chamado.cancelar_suporte) {
                                    faixa.filas[fila].chamadosCancelados += 1;
                                }
                            }
                        });

                        chamado.segmento.split(',').forEach(segmento => {
                            if (faixa.filas[segmento]) {
                                faixa.filas[segmento].acionamentos += 1;
                                if (chamado.tempo_aguardando_suporte) {
                                    const tempoEsperaMinutos = this.tempoParaMinutos(chamado.tempo_aguardando_suporte);
                                    faixa.filas[segmento].tempoMedioEspera += tempoEsperaMinutos;
                                }
                                if (chamado.cancelar_suporte) {
                                    faixa.filas[segmento].chamadosCancelados += 1;
                                }
                            }
                        });
                    }
                });
            });

            // Calculando o tempo médio de espera por faixa, fila e segmento
            resultado.forEach(faixa => {
                if (faixa.acionamentos > 0) {
                    faixa.tempoMedioEspera = faixa.tempoMedioEspera / faixa.acionamentos;
                }

                // Para cada fila e segmento dentro da faixa
                Object.keys(faixa.filas).forEach(key => {
                    const filaOuSegmento = faixa.filas[key];
                    if (filaOuSegmento.acionamentos > 0) {
                        filaOuSegmento.tempoMedioEspera = filaOuSegmento.tempoMedioEspera / filaOuSegmento.acionamentos;
                    }
                });
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
            return resultado;
        } catch (e) {
            console.error('Erro na autenticação:', e);
            throw e;
        }
    }
}

