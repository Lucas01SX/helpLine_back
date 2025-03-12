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
    return h * 60 + (m || 0);
  }

  private static async usuariosLogadosDash(): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT DISTINCT ON (a.pk_id_usuario) 
          a.pk_id_usuario, 
          STRING_AGG(DISTINCT d.segmento, ',') AS segmento, 
          STRING_AGG(DISTINCT d.mcdu::TEXT, ',') AS mcdu, 
          STRING_AGG(DISTINCT d.fila, ',') AS fila, 
          a.hr_login, 
          a.hr_logoff 
        FROM suporte.tb_login_logoff_suporte a 
        JOIN suporte.tb_login_suporte b ON a.pk_id_usuario = b.id_usuario 
        JOIN suporte.tb_skills_staff c ON b.matricula = c.matricula::INT 
        JOIN trafego.tb_anexo1g d ON c.mcdu::INT = d.mcdu 
        WHERE a.dt_login = CURRENT_DATE 
        GROUP BY a.pk_id_usuario, a.id_login 
        ORDER BY a.pk_id_usuario, a.id_login DESC`
      );

      console.log("🚀 Dados brutos do banco (Usuários logados):", JSON.stringify(result.rows, null, 2));

      return result.rows.map((usuario: any) => ({
        id: usuario.pk_id_usuario,
        segmento: usuario.segmento,
        mcdu: usuario.mcdu,
        fila: usuario.fila,
        hr_login: usuario.hr_login ? String(usuario.hr_login).match(/\d+/)?.[0].padStart(2, '0') : '00',
        hr_logoff: usuario.hr_logoff ? String(usuario.hr_logoff).match(/\d+/)?.[0].padStart(2, '0') : '00',
      }));
    } catch (e) {
      console.error('❌ Erro ao obter usuários logados:', e);
      throw e;
    }
  }

  private static async dadosGeraisSuporteDash(): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT a.id_suporte, 
          b.segmento, 
          b.mcdu, 
          b.fila, 
          a.hora_solicitacao_suporte, 
          a.tempo_aguardando_suporte, 
          a.cancelar_suporte 
        FROM suporte.tb_chamado_suporte a 
        JOIN trafego.tb_anexo1g b ON a.mcdu::int = b.mcdu 
        WHERE a.dt_solicitacao_suporte AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo' = CURRENT_DATE 
        GROUP BY a.id_suporte, b.segmento, b.mcdu, b.fila, 
          a.hora_solicitacao_suporte, a.tempo_aguardando_suporte, a.cancelar_suporte`
      );

      console.log("🚀 Dados brutos do banco (Chamados):", JSON.stringify(result.rows, null, 2));

      return result.rows.map((chamado: any) => ({
        ...chamado,
        hora_solicitacao_suporte: chamado.hora_solicitacao_suporte
          ? String(chamado.hora_solicitacao_suporte).match(/\d+/)?.[0].padStart(2, '0')
          : '00',
      }));
    } catch (e) {
      console.error('❌ Erro ao obter dados gerais de suporte:', e);
      throw e;
    }
  }

  private static gerarIntervalosHora(): string[] {
    const intervalos: string[] = [];
    for (let h = 8; h <= 21; h++) {
      intervalos.push(h.toString().padStart(2, '0'));
    }
    return intervalos;
  }

  private static async tratamentoDadosDash(usuariosLogadosDash: any, dadosGeraisSuporteDash: any): Promise<any> {
    try {
      console.log("🚀 Horários antes do filtro:", 
        dadosGeraisSuporteDash.map((d: any) => d.hora_solicitacao_suporte)
      );

      const faixasHorarias = this.gerarIntervalosHora();
      const resultado: any[] = faixasHorarias.map(faixa => ({
        horario: faixa,
        segmentos: {}
      }));

      // Processamento dos dados gerais de suporte
      dadosGeraisSuporteDash.forEach((chamado: any) => {
        const horaSolicitacao = chamado.hora_solicitacao_suporte
          ? parseInt(chamado.hora_solicitacao_suporte)
          : 0;

        if (!isNaN(horaSolicitacao) && horaSolicitacao >= 8 && horaSolicitacao <= 21) {
          let faixa = resultado.find(item => item.horario === chamado.hora_solicitacao_suporte);

          if (!faixa) {
            faixa = {
              horario: chamado.hora_solicitacao_suporte,
              segmentos: {}
            };
            resultado.push(faixa);
          }

          const segmento = chamado.segmento;
          const fila = chamado.fila;

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
          faixa.segmentos[segmento].filas[fila].tempoTotalEspera += chamado.tempo_aguardando_suporte || 0;
          faixa.segmentos[segmento].filas[fila].chamadosCancelados += chamado.cancelar_suporte ? 1 : 0;
        }
      });

      // Processamento dos usuários logados
      usuariosLogadosDash.forEach((usuario: any) => {
        const hrLogin = parseInt(usuario.hr_login);
        const hrLogoff = parseInt(usuario.hr_logoff);

        faixasHorarias.forEach(faixa => {
          const hora = parseInt(faixa);
          if (hora >= hrLogin && hora <= hrLogoff) {
            let faixaResultado = resultado.find(item => item.horario === faixa);

            if (!faixaResultado) {
              faixaResultado = {
                horario: faixa,
                segmentos: {}
              };
              resultado.push(faixaResultado);
            }

            const segmento = usuario.segmento;
            const fila = usuario.fila;

            if (!faixaResultado.segmentos[segmento]) {
              faixaResultado.segmentos[segmento] = { filas: {} };
            }

            if (!faixaResultado.segmentos[segmento].filas[fila]) {
              faixaResultado.segmentos[segmento].filas[fila] = {
                acionamentos: 0,
                tempoTotalEspera: 0,
                chamadosCancelados: 0
              };
            }

            faixaResultado.segmentos[segmento].filas[fila].acionamentos += 1;
          }
        });
      });

      console.log("✅ Horários finais após filtragem:", resultado.map((r: any) => r.horario));

      return { resultado };
    } catch (e) {
      console.error('❌ Erro no tratamento de dados do Dash:', e);
      throw e;
    }
  }

  public static async obterDashboard(): Promise<any> {
    try {
      console.log("🚀 Iniciando obtenção do Dashboard...");

      const usuariosLogados = await this.usuariosLogadosDash();
      const dadosGerais = await this.dadosGeraisSuporteDash();
      const resultado = await this.tratamentoDadosDash(usuariosLogados, dadosGerais);

      console.log("✅ Dashboard gerado com sucesso!");

      return resultado;
    } catch (e) {
      console.error('❌ Erro ao obter dados do dashboard:', e);
      throw e;
    }
  }
}
