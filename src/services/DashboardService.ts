import pool from '../database/db';

interface FaixaHoraria {
  hora: string;
  logados: number;
  acionamentos: number;
  tempoMedioEspera: number;
  tempoTotalEspera: number;
  chamadosCancelados: number;
}

export class DashboardService {
    private static horaParaMinutos(hora: string): number {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + (m || 0); // Caso não haja minutos, assume 0
  }
  private static async usuariosLogadosDash(): Promise<any> {
    try {
      const result = await pool.query(`SELECT DISTINCT ON (a.pk_id_usuario) a.pk_id_usuario, string_agg(DISTINCT d.segmento, ',') AS segmento, string_agg(DISTINCT d.mcdu::text, ',') AS mcdu, string_agg(DISTINCT d.fila, ',') AS fila, a.hr_login AS hr_login, a.hr_logoff AS hr_logoff  FROM suporte.tb_login_logoff_suporte a  JOIN suporte.tb_login_suporte b ON a.pk_id_usuario = b.id_usuario  JOIN suporte.tb_skills_staff c ON b.matricula = c.matricula::int  JOIN trafego.tb_anexo1g d ON c.mcdu::int = d.mcdu  WHERE a.dt_login = CURRENT_DATE  GROUP BY a.pk_id_usuario, a.hr_login, a.hr_logoff  ORDER BY a.pk_id_usuario, a.hr_login DESC`);
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
      const result = await pool.query(`
        SELECT 
          a.id_suporte, 
          a.hora_solicitacao_suporte, 
          a.dt_solicitacao_suporte, 
          a.tempo_aguardando_suporte, 
          a.cancelar_suporte 
        FROM suporte.tb_chamado_suporte a 
        WHERE a.dt_solicitacao_suporte = CURRENT_DATE
      `);
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
        const resultado: FaixaHoraria[] = faixasHorarias.map(faixa => ({
            hora: faixa,
            logados: 0,
            acionamentos: 0,
            tempoMedioEspera: 0,
            tempoTotalEspera: 0,
            chamadosCancelados: 0
        }));

        const logadosPorHora: { horario: string, usuarios: { id_usuario: string, segmento: string, mcdu: string, fila: string }[] }[] = [];

        // Ajuste para considerar usuários logados em múltiplos horários
        faixasHorarias.forEach(faixa => {
            const usuariosNaHora: { id_usuario: string, segmento: string, mcdu: string, fila: string }[] = [];

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
                        fila: usuario.fila
                    });
                }
            });

            logadosPorHora.push({
                horario: faixa,
                usuarios: usuariosNaHora
            });
        });

        // Processa os dados gerais de suporte
        dadosGeraisSuporteDash.forEach((chamado: any) => {
            const horaSolicitacaoMinutos = this.horaParaMinutos(chamado.hora_solicitacao_suporte);
            resultado.forEach(faixa => {
                const faixaInicioMinutos = this.horaParaMinutos(faixa.hora);
                const faixaFimMinutos = faixaInicioMinutos + 60;

                if (horaSolicitacaoMinutos >= faixaInicioMinutos && horaSolicitacaoMinutos <= faixaFimMinutos) {
                    faixa.acionamentos += 1;
                    if (chamado.tempo_aguardando_suporte && !chamado.cancelar_suporte) {
                        faixa.tempoTotalEspera += this.horaParaMinutos(chamado.tempo_aguardando_suporte);
                    }
                    if (chamado.cancelar_suporte) {
                        faixa.chamadosCancelados += 1;
                    }
                }
            });
        });

        // Calcula o tempo médio de espera para cada faixa horária
        resultado.forEach(faixa => {
            if (faixa.acionamentos > 0) {
                faixa.tempoMedioEspera = faixa.tempoTotalEspera / faixa.acionamentos;
            }
        });

        // Calcula os totais
        const total = {
            logados: resultado[resultado.length - 1].logados,
            acionamentos: resultado.reduce((acc, faixa) => acc + faixa.acionamentos, 0),
            tempoTotalEspera: resultado.reduce((acc, faixa) => acc + faixa.tempoTotalEspera, 0),
            chamadosCancelados: resultado.reduce((acc, faixa) => acc + faixa.chamadosCancelados, 0),
            tempoMedioEspera: resultado.some(faixa => faixa.acionamentos > 0) ? resultado.reduce((acc, faixa) => acc + faixa.tempoTotalEspera, 0) / resultado.reduce((acc, faixa) => acc + faixa.acionamentos, 0) : 0
        };

        return { Logados: logadosPorHora, resultado, total };
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
