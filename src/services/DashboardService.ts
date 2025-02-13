import pool from '../database/db';

interface FaixaHoraria {
  hora: string;
  logados: number;
  acionamentos: number;
  tempoMedioEspera: number;
  tempoTotalEspera: number;
  chamadosCancelados: number;
}

type LogadosPorHora = {
  [hora: string]: {
    [id: string]: {
      segmento: string;
      mcdu: string;
      fila: string;
    };
  };
};

export class DashboardService {
  private static async usuariosLogadosDash(): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT 
          a.pk_id_usuario, 
          string_agg(DISTINCT d.segmento, ',') AS segmento, 
          string_agg(DISTINCT d.mcdu::text, ',') AS mcdu, 
          string_agg(DISTINCT d.fila, ',') AS fila, 
          max(a.hr_login) AS hr_login, 
          max(a.hr_logoff) AS hr_logoff 
        FROM suporte.tb_login_logoff_suporte a 
        JOIN suporte.tb_login_suporte b ON a.pk_id_usuario = b.id_usuario 
        JOIN suporte.tb_skills_staff c ON b.matricula = c.matricula::int 
        JOIN trafego.tb_anexo1g d ON c.mcdu::int = d.mcdu 
        WHERE a.dt_login = CURRENT_DATE 
        GROUP BY a.pk_id_usuario
      `);

      return result.rows.map((usuario: any) => ({
        id: usuario.pk_id_usuario,
        segmento: usuario.segmento,
        mcdu: usuario.mcdu,
        fila: usuario.fila,
        hr_login: usuario.hr_login,
        hr_logoff: usuario.hr_logoff || null,
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
          a.id_suporte, a.hora_solicitacao_suporte, 
          a.dt_solicitacao_suporte, 
          a.tempo_aguardando_suporte, 
          a.cancelar_suporte 
        FROM suporte.tb_chamado_suporte a 
        WHERE a.dt_solicitacao_suporte = CURRENT_DATE
      `);
      return result.rows;
    } catch (e) {
      console.error('Erro ao obter dados gerais de suporte:', e);
      throw e;
    }
  }

  private static gerarIntervalosHora(inicio: string = '07:00', fim: string = '21:00'): string[] {
    const intervalos: string[] = [];
    let horaInicio = new Date(`1970-01-01T${inicio}:00Z`);
    const horaFim = new Date(`1970-01-01T${fim}:00Z`);
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
    const usuarios = usuariosLogadosDash;
    const dadosGerais = dadosGeraisSuporteDash;
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

      const logadosPorHora: LogadosPorHora = {};

      usuarios.forEach((usuario: any) => {
        const hrLoginMinutos = this.horaParaMinutos(usuario.hr_login);
        const hrLogoffMinutos = usuario.hr_logoff ? this.horaParaMinutos(usuario.hr_logoff) : Infinity;

        resultado.forEach(faixa => {
          const faixaInicioMinutos = this.horaParaMinutos(faixa.hora);
          const faixaFimMinutos = faixaInicioMinutos + 60;

          if (hrLoginMinutos <= faixaFimMinutos && hrLogoffMinutos >= faixaInicioMinutos) {
            faixa.logados += 1;
            if (!logadosPorHora[faixa.hora]) logadosPorHora[faixa.hora] = {};
            logadosPorHora[faixa.hora][usuario.id] = {
              segmento: usuario.segmento,
              mcdu: usuario.mcdu,
              fila: usuario.fila
            };
          }
        });
      });

      dadosGerais.forEach((chamado: any) => {
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

      resultado.forEach(faixa => {
        if (faixa.acionamentos > 0) {
          faixa.tempoMedioEspera = faixa.tempoTotalEspera / faixa.acionamentos;
        }
      });

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
      // 1. Obtém os usuários logados
      const usuariosLogados = await this.usuariosLogadosDash();

      // 2. Obtém os dados gerais de suporte
      const dadosGerais = await this.dadosGeraisSuporteDash();

      // 3. Processa e estrutura os dados
      const resultado = await this.tratamentoDadosDash(usuariosLogados, dadosGerais);

      return resultado;
    } catch (e) {
      console.error('Erro ao obter dados do dashboard:', e);
      throw e;
    }
  }
}

PS C:\Sistemas\suporte_back> npm run dev

> backend_suporte@1.0.0 dev C:\Sistemas\suporte_back
> ts-node src/app.ts

C:\Sistemas\suporte_back\node_modules\ts-node\src\index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
src/controllers/DashboardController.ts:8:59 - error TS2339: Property 'dadosSuporteDash' does not exist on type 'typeof DashboardService'.

8             const dadosDashboard = await DashboardService.dadosSuporteDash();
                                                            ~~~~~~~~~~~~~~~~

    at createTSError (C:\Sistemas\suporte_back\node_modules\ts-node\src\index.ts:859:12)
    at reportTSError (C:\Sistemas\suporte_back\node_modules\ts-node\src\index.ts:863:19)
    at getOutput (C:\Sistemas\suporte_back\node_modules\ts-node\src\index.ts:1077:36)
    at Object.compile (C:\Sistemas\suporte_back\node_modules\ts-node\src\index.ts:1433:41)
    at Module.m._compile (C:\Sistemas\suporte_back\node_modules\ts-node\src\index.ts:1617:30)
    at Module._extensions..js (internal/modules/cjs/loader.js:1158:10)
    at Object.require.extensions.<computed> [as .ts] (C:\Sistemas\suporte_back\node_modules\ts-node\src\index.ts:1621:12)
    at Module.load (internal/modules/cjs/loader.js:986:32)
    at Function.Module._load (internal/modules/cjs/loader.js:879:14)
    at Module.require (internal/modules/cjs/loader.js:1026:19) {
  diagnosticCodes: [ 2339 ]
}
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! backend_suporte@1.0.0 dev: `ts-node src/app.ts`
npm ERR! Exit status 1
npm ERR!
npm ERR! Failed at the backend_suporte@1.0.0 dev script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     C:\Users\P566873\AppData\Roaming\npm-cache\_logs\2025-02-13T16_20_19_986Z-debug.log
PS C:\Sistemas\suporte_back> ^C
PS C:\Sistemas\suporte_back> ^C
PS C:\Sistemas\suporte_back>
