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

      const usuarios = result.rows.map((usuario: any) => ({
        id: usuario.pk_id_usuario,
        segmento: usuario.segmento,
        mcdu: usuario.mcdu,
        fila: usuario.fila,
        hr_login: usuario.hr_login ? this.horaParaMinutos(usuario.hr_login) : 0,
        hr_logoff: usuario.hr_logoff ? this.horaParaMinutos(usuario.hr_logoff) : 1440, // 1440 minutos = 24:00
      }));

      const intervalos = this.gerarIntervalosHora();
      const contagemPorHora: any = {};

      intervalos.forEach(hora => {
        contagemPorHora[hora] = {
          logados: 0,
          segmentos: {},
          filas: {}
        };
      });

      usuarios.forEach(usuario => {
        intervalos.forEach(hora => {
          const horaMinutos = this.horaParaMinutos(hora + ':00');
          if (usuario.hr_login <= horaMinutos && usuario.hr_logoff >= horaMinutos) {
            contagemPorHora[hora].logados += 1;

            usuario.segmento.split(',').forEach((seg: string) => {
              if (!contagemPorHora[hora].segmentos[seg]) {
                contagemPorHora[hora].segmentos[seg] = 0;
              }
              contagemPorHora[hora].segmentos[seg] += 1;
            });

            usuario.fila.split(',').forEach((fila: string) => {
              if (!contagemPorHora[hora].filas[fila]) {
                contagemPorHora[hora].filas[fila] = 0;
              }
              contagemPorHora[hora].filas[fila] += 1;
            });
          }
        });
      });

      return contagemPorHora;
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
        WHERE a.dt_solicitacao_suporte = CURRENT_DATE 
        GROUP BY a.id_suporte, b.segmento, b.mcdu, b.fila, 
          a.hora_solicitacao_suporte, a.tempo_aguardando_suporte, a.cancelar_suporte`
      );

      console.log("🚀 Dados brutos do banco (Chamados):", JSON.stringify(result.rows, null, 2));

      const chamados = result.rows.map((chamado: any) => ({
        ...chamado,
        hora_solicitacao_suporte: chamado.hora_solicitacao_suporte
          ? this.horaParaMinutos(chamado.hora_solicitacao_suporte)
          : 0,
      }));

      const intervalos = this.gerarIntervalosHora();
      const resultado: any[] = intervalos.map(hora => ({
        horario: hora,
        segmentos: {}
      }));

      chamados.forEach((chamado: any) => {
        const horaSolicitacao = chamado.hora_solicitacao_suporte;
        const hora = intervalos.find((h: string) => this.horaParaMinutos(h + ':00') <= horaSolicitacao && this.horaParaMinutos(h + ':59') >= horaSolicitacao);

        if (hora) {
          const segmento = chamado.segmento;
          const fila = chamado.fila;

          if (!resultado.find((r: any) => r.horario === hora)?.segmentos[segmento]) {
            resultado.find((r: any) => r.horario === hora).segmentos[segmento] = { filas: {} };
          }

          if (!resultado.find((r: any) => r.horario === hora).segmentos[segmento].filas[fila]) {
            resultado.find((r: any) => r.horario === hora).segmentos[segmento].filas[fila] = {
              acionamentos: 0,
              tempoTotalEspera: 0,
              chamadosCancelados: 0
            };
          }

          resultado.find((r: any) => r.horario === hora).segmentos[segmento].filas[fila].acionamentos += 1;
          resultado.find((r: any) => r.horario === hora).segmentos[segmento].filas[fila].tempoTotalEspera += chamado.tempo_aguardando_suporte || 0;
          resultado.find((r: any) => r.horario === hora).segmentos[segmento].filas[fila].chamadosCancelados += chamado.cancelar_suporte ? 1 : 0;
        }
      });

      return resultado;
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
      return {
        usuariosLogados: usuariosLogadosDash,
        dadosGerais: dadosGeraisSuporteDash
      };
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
