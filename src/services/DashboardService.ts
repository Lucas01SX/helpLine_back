import pool from '../database/db';

export class DashboardService {
    private static async usuariosLogadosDash(): Promise<any> {
        try {
            const result = await pool.query(`
                SELECT DISTINCT a.pk_id_usuario, a.hr_login, a.hr_logoff 
                FROM suporte.tb_login_logoff_suporte a
                JOIN suporte.tb_login_suporte b ON a.pk_id_usuario = b.id_usuario
                JOIN suporte.tb_skills_staff c ON b.matricula = c.matricula::int
                WHERE a.dt_login = CURRENT_DATE
            `);
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
                WHERE a.dt_solicitacao_suporte = CURRENT_DATE
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
        const horaFim = new Date(`1970-01-01T${fim}:00Z`);
        
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

    public static async dadosSuporteDash(): Promise<any> {
        try {
            const usuariosLogados = await this.usuariosLogadosDash();
            const dadosGeraisSuporte = await this.dadosGeraisSuporteDash();

            // Obtém a hora atual
            const agora = new Date();
            const horaAtual = agora.getHours();
            
            // Criar faixas horárias de 07:00 até a hora atual
            const intervalos = [];
            for (let h = 7; h <= horaAtual; h++) {
                intervalos.push(`${h.toString().padStart(2, '0')}:00:00`);
            }

            // Inicializa o resultado com as horas como chaves
            const resultado: { [hora: string]: { usuariosLogados: number, chamadosSuporte: number } } = {};
            intervalos.forEach(hora => {
                resultado[hora] = { usuariosLogados: 0, chamadosSuporte: 0 };
            });

            // Contabiliza usuários logados em cada faixa horária
            usuariosLogados.forEach(usuario => {
                const hrLogin = usuario.hr_login.split(':').map(Number);
                const hrLogoff = usuario.hr_logoff ? usuario.hr_logoff.split(':').map(Number) : null;

                const inicio = hrLogin[0];
                const fim = hrLogoff ? hrLogoff[0] : horaAtual;

                for (let h = inicio; h <= fim; h++) {
                    const horaKey = `${h.toString().padStart(2, '0')}:00:00`;
                    if (resultado[horaKey]) {
                        resultado[horaKey].usuariosLogados += 1;
                    }
                }
            });
            // Contabiliza chamados de suporte por hora
            dadosGeraisSuporte.forEach(chamado => {
                const horaChamado = chamado.hora_solicitacao_suporte.split(':').map(Number)[0];
                const horaKey = `${horaChamado.toString().padStart(2, '0')}:00:00`;

                if (resultado[horaKey]) {
                    resultado[horaKey].chamadosSuporte += 1;
                }
            });
            return { dadosDashboard: resultado };
        } catch (e) {
            console.error('Erro ao obter dados do dashboard:', e);
            throw e;
        }
    }
}
