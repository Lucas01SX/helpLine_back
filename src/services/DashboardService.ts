import pool from '../database/db';
import { format, parse } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

interface FaixaHoraria {
  hora: string;
  acionamentos: number;
  tempoTotalEspera: number;
  chamadosCancelados: number;
}

export class DashboardService {
  private static timeZone = 'America/Sao_Paulo';

  private static horaParaMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  private static normalizarHora(hora: string): string {
    const [h] = hora.split(':').map(Number);
    return h.toString().padStart(2, '0'); // Garante que fique no formato correto
  }

  private static async usuariosLogadosDash(): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT DISTINCT ON (a.pk_id_usuario) 
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
        GROUP BY A.pk_id_usuario, a.id_login 
        ORDER BY a.pk_id_usuario, a.id_login DESC
      `);

      return result.rows.map((usuario: any) => ({
        id: usuario.pk_id_usuario,
        segmento: usuario.segmento,
        mcdu: usuario.mcdu,
        fila: usuario.fila,
        hr_login: usuario.hr_login ? this.normalizarHora(usuario.hr_login) : null,
        hr_logoff: usuario.hr_logoff ? this.normalizarHora(usuario.hr_logoff) : null,
      }));
    } catch (e) {
      console.error('Erro ao obter usuários logados:', e);
      throw e;
    }
  }

  private static async dadosGeraisSuporteDash(): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT a.id_suporte, 
               b.segmento, 
               b.mcdu, 
               b.fila, 
               a.hora_solicitacao_suporte, 
               a.tempo_aguardando_suporte, 
               a.cancelar_suporte 
        FROM suporte.tb_chamado_suporte a 
        JOIN trafego.tb_anexo1g b ON a.mcdu::int = b.mcdu 
        WHERE a.dt_solicitacao_suporte = CURRENT_DATE
      `);

      return result.rows.map((chamado: any) => ({
        ...chamado,
        hora_solicitacao_suporte: this.normalizarHora(chamado.hora_solicitacao_suporte),
      }));
    } catch (e) {
      console.error('Erro ao obter dados gerais de suporte:', e);
      throw e;
    }
  }

  private static obterHoraAtual(): string {
    const agora = new Date();
    const horaSaoPaulo = utcToZonedTime(agora, this.timeZone);
    return format(horaSaoPaulo, 'HH'); // Retorna a hora no formato correto
  }

  private static gerarIntervalosHora(inicio: string = '08', fim: string = '21'): string[] {
    const intervalos: string[] = [];
    let horaInicio = parseInt(inicio, 10);
    const horaFim = parseInt(fim, 10);

    while (horaInicio <= horaFim) {
      intervalos.push(horaInicio.toString().padStart(2, '0'));
      horaInicio++;
    }

    return intervalos;
  }

  private static async tratamentoDadosDash(usuariosLogadosDash: any, dadosGeraisSuporteDash: any): Promise<any> {
    try {
      const faixasHorarias = this.gerarIntervalosHora();
      const horaAtual = this.obterHoraAtual();
      const faixasFiltradas = faixasHorarias.filter(faixa => faixa <= horaAtual);

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

      const logadosPorHora: any[] = faixasFiltradas.map(faixa => ({
        horario: faixa,
        usuarios: usuariosLogadosDash.filter((usuario: any) => {
          const hrLoginMinutos = this.horaParaMinutos(usuario.hr_login);
          const hrLogoffMinutos = usuario.hr_logoff ? this.horaParaMinutos(usuario.hr_logoff) : Infinity;
          const faixaInicioMinutos = this.horaParaMinutos(faixa);
          const faixaFimMinutos = faixaInicioMinutos + 60;
          return hrLoginMinutos <= faixaInicioMinutos && (hrLogoffMinutos >= faixaFimMinutos || usuario.hr_logoff === null);
        }).map((usuario: any) => ({
          id_usuario: usuario.id,
          segmento: usuario.segmento,
          mcdu: usuario.mcdu,
          fila: usuario.fila,
          logoff: usuario.hr_logoff !== null
        }))
      }));

      return { logados: logadosPorHora, resultado };
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
