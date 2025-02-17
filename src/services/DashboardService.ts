import pool from '../database/db';

interface FaixaHoraria {
  hora: string;
  acionamentos: number;
  tempoTotalEspera: number;
  chamadosCancelados: number;
}

export class DashboardService {
  private static horaParaMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + (m || 0); // Garante que os minutos sejam tratados como decimais
  }

  private static async usuariosLogadosDash(): Promise<any> {
    try {
      const result = await pool.query(`SELECT DISTINCT ON (a.pk_id_usuario) a.pk_id_usuario, STRING_AGG(DISTINCT d.segmento, ',') AS segmento, STRING_AGG(DISTINCT d.mcdu::TEXT, ',') AS mcdu, STRING_AGG(DISTINCT d.fila, ',') AS fila, a.hr_login AS ultimo_login, a.hr_logoff AS ultimo_logoff FROM suporte.tb_login_logoff_suporte a JOIN suporte.tb_login_suporte b ON a.pk_id_usuario = b.id_usuario JOIN suporte.tb_skills_staff c ON b.matricula = c.matricula::INT JOIN trafego.tb_anexo1g d ON c.mcdu::INT = d.mcdu WHERE a.dt_login = CURRENT_DATE group by A.pk_id_usuario, a.id_login ORDER BY a.pk_id_usuario, a.id_login desc`);
      return result.rows.map((usuario: any) => ({
        id: usuario.pk_id_usuario,
        segmento: usuario.segmento,
        mcdu: usuario.mcdu,
        fila: usuario.fila,
        hr_login: usuario.hr_login ? usuario.hr_login.split(':')[0] : null, // Pegando apenas HH
        hr_logoff: usuario.hr_logoff ? usuario.hr_logoff.split(':')[0] : null, // Pegando apenas HH
      }));
    } catch (e) {
      console.error('Erro ao obter usuários logados:', e);
      throw e;
    }
  }

  private static async dadosGeraisSuporteDash(): Promise<any> {
    try {
      const result = await pool.query(`SELECT a.id_suporte, b.segmento, b.mcdu, b.fila, a.hora_solicitacao_suporte, a.tempo_aguardando_suporte, a.cancelar_suporte FROM suporte.tb_chamado_suporte a join trafego.tb_anexo1g b on a.mcdu::int = b.mcdu WHERE a.dt_solicitacao_suporte = CURRENT_DATE group by a.id_suporte, b.segmento, b.mcdu, b.fila, a.hora_solicitacao_suporte, a.tempo_aguardando_suporte, a.cancelar_suporte ;`);
      return result.rows.map((chamado: any) => ({
        ...chamado,
        hora_solicitacao_suporte: chamado.hora_solicitacao_suporte.split(':')[0], // Apenas HH
      }));
    } catch (e) {
      console.error('Erro ao obter dados gerais de suporte:', e);
      throw e;
    }
  }

  private static gerarIntervalosHora(inicio: string = '08', fim: string = '21'): string[] {
    const intervalos: string[] = [];
    let horaInicio = new Date(`1970-01-01T${inicio}:00:00Z`);
    const horaFim = new Date(`1970-01-01T${fim}:00:00Z`);

    while (horaInicio <= horaFim) {
      intervalos.push(horaInicio.toISOString().substr(11, 2)); // Pegando apenas HH
      horaInicio.setHours(horaInicio.getHours() + 1);
    }
    return intervalos;
  }

  private static async tratamentoDadosDash(usuariosLogadosDash: any, dadosGeraisSuporteDash: any): Promise<any> {
    try {
        const faixasHorarias = this.gerarIntervalosHora();
        const resultado: any[] = faixasHorarias.map(faixa => ({
            horario: faixa,
            segmentos: {}
        }));

        // Processamento dos dados gerais de suporte
        dadosGeraisSuporteDash.forEach((chamado: any) => {
            const horaSolicitacao = chamado.hora_solicitacao_suporte;
            const segmento = chamado.segmento;
            const fila = chamado.fila;

            resultado.forEach(faixa => {
                if (faixa.horario === horaSolicitacao) {
                    // Inicializa segmento se não existir
                    if (!faixa.segmentos[segmento]) {
                        faixa.segmentos[segmento] = { filas: {} };
                    }

                    // Inicializa fila se não existir
                    if (!faixa.segmentos[segmento].filas[fila]) {
                        faixa.segmentos[segmento].filas[fila] = {
                            acionamentos: 0,
                            tempoTotalEspera: 0, // Tempo total de espera em minutos
                            chamadosCancelados: 0
                        };
                    }

                    // Atualiza valores
                    faixa.segmentos[segmento].filas[fila].acionamentos += 1;

                    if (chamado.tempo_aguardando_suporte && !chamado.cancelar_suporte) {
                        // Converte o tempo de espera para minutos e soma ao total
                        const tempoEsperaMinutos = this.horaParaMinutos(chamado.tempo_aguardando_suporte);
                        faixa.segmentos[segmento].filas[fila].tempoTotalEspera += tempoEsperaMinutos;
                    }

                    if (chamado.cancelar_suporte) {
                        faixa.segmentos[segmento].filas[fila].chamadosCancelados += 1;
                    }
                }
            });
        });

        // Processamento dos usuários logados
        const logadosPorHora: { horario: string, usuarios: { id_usuario: string, segmento: string, mcdu: string, fila: string, logoff: boolean }[] }[] = [];

        faixasHorarias.forEach(faixa => {
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
                        logoff: usuario.hr_logoff !== null // Marca se o usuário deslogou ou não
                    });
                }
            });

            logadosPorHora.push({
                horario: faixa,
                usuarios: usuariosNaHora
            });
        });

        // Estrutura de retorno incluindo logados e resultado
        return { 
            logados: logadosPorHora, 
            resultado 
        };
    } catch (e) {
        console.error('Erro no tratamento de dados do Dash:', e);
        throw e;
    }
  } 

  public static async obterDashboard(): Promise<any> {
    try {
      const usuariosLogados = await this.usuariosLogadosDash();
      const dadosGerais = await this.dadosGeraisSuporteDash();
      const resultado = await this.tratamentoDadosDash(usuariosLogados, dadosGerais);

      return resultado;
    } catch (e) {
      console.error('Erro ao obter dados do dashboard:', e);
      throw e;
    }
  }
}
