import pool from '../database/db';
import { FilasService } from './FilasServices';  // Importando o serviço de filas

interface FilaSegmentoData {
    logados: number;
    acionamentos: number;
    tempoMedioEspera: number;
    chamadosCancelados: number;
}

interface SegmentoData {
    [segmento: string]: {
        filas: { 
            [fila: string]: {
                mcdus: { 
                    [mcdu: string]: FilaSegmentoData 
                }
            }
        }
    }
}

// Ajuste a estrutura da filaData para incluir as propriedades necessárias
type filaData = {
  logados: number;
  acionamentos: number;
  tempoMedioEspera: number;
  chamadosCancelados: number;
};

// Ajuste o tipo filaSegmento para ter um mapeamento de filas por segmento
type filaSegmentoData = {
  [segmento: string]: {
    filas: {
      [fila: string]: filaData;  // Aqui estamos mapeando cada fila dentro do segmento
    };
    acionamentos: number;
    tempoMedioEspera: number;
    chamadosCancelados: number;
  };
};


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

        // Inicializando a estrutura de resultado
        const resultado: any[] = faixasFiltradas.map(faixa => ({
            hora: faixa,
            logados: 0,
            acionamentos: 0,
            tempoMedioEspera: 0,
            chamadosCancelados: 0,
            segmentos: {}  // Para agrupar os dados por segmentos
        }));

        // Processando dados de filas e segmentos
        dadosGerais.forEach((registro: any) => {
            // Para cada faixa horária, verificamos se ela corresponde à hora de solicitação
            resultado.forEach(faixa => {
                const [h, m] = faixa.hora.split(':').map(Number);
                const horaSolicitacao = new Date(registro.dt_solicitacao_suporte);
                const [horaChamado, minutoChamado] = [horaSolicitacao.getHours(), horaSolicitacao.getMinutes()];

                // Verificando se a faixa horária corresponde à hora da solicitação
                if (horaChamado === h && minutoChamado <= m) {
                    // Inicializando o segmento se necessário
                    const segmento = registro.segmento;

                    if (!faixa.segmentos[segmento]) {
                        faixa.segmentos[segmento] = { mcdus: {} };
                    }

                    const mcdu = registro.mcdu;

                    // Inicializando o mcdu no segmento
                    if (!faixa.segmentos[segmento].mcdus[mcdu]) {
                        faixa.segmentos[segmento].mcdus[mcdu] = {
                            logados: 0,
                            acionamentos: 0,
                            tempoMedioEspera: 0,
                            chamadosCancelados: 0
                        };
                    }

                    // Pegando o objeto do MCDU para agregação de dados
                    const mcduObj = faixa.segmentos[segmento].mcdus[mcdu];

                    // Atualizando os valores no MCDU
                    mcduObj.logados += 1;  // Exemplo de incremento
                    mcduObj.acionamentos += registro.acionamentos;
                    mcduObj.tempoMedioEspera += registro.tempo_aguardando_suporte;
                    mcduObj.chamadosCancelados += registro.cancelar_suporte;

                    // Atualizando os totais da faixa horária
                    faixa.logados += 1;
                    faixa.acionamentos += registro.acionamentos;
                    faixa.tempoMedioEspera += registro.tempo_aguardando_suporte;
                    faixa.chamadosCancelados += registro.cancelar_suporte;
                }
            });
        });

        // Ajustando o resultado para o formato desejado
        return resultado.map(faixa => ({
            hora: faixa.hora,
            logados: faixa.logados,
            acionamentos: faixa.acionamentos,
            tempoMedioEspera: faixa.tempoMedioEspera,
            chamadosCancelados: faixa.chamadosCancelados,
            segmentos: Object.fromEntries(
                Object.entries(faixa.segmentos).map(([segmento, data]: [string, any]) => [
                    segmento,
                    {
                        mcdus: Object.fromEntries(
                            Object.entries(data.mcdus).map(([mcdu, mcduData]: [string, any]) => [
                                mcdu,
                                {
                                    logados: mcduData.logados,
                                    acionamentos: mcduData.acionamentos,
                                    tempoMedioEspera: mcduData.tempoMedioEspera,
                                    chamadosCancelados: mcduData.chamadosCancelados
                                }
                            ])
                        )
                    }
                ])
            )
        }));

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


