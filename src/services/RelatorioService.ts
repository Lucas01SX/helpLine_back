import pool from '../database/db';
import { CachedData, cacheRel } from '../models/Cache';
import { getCacheRel, getCachedData, cacheRelatorio } from './cacheService';

export class RelatorioService{
    private static async consultaRelatorioSuporte(suporte: string, gestor: string, coordenador: string, fila: string, segmento: string, dataInicio: string, dataFim: string, agruparPor: string): Promise<any> {
        let entrada1: keyof cacheRel;
        let entrada2: keyof cacheRel | null = null;

        switch (agruparPor) {
            case 'suporte':
                entrada1 = 'suporte';
                entrada2 = 'gestor';
                break;
            case 'fila':
                entrada1 = 'fila';
                entrada2 = 'segmento';
                break;
            case 'coordenador':
                entrada1 = 'coordenador';
                entrada2 = null;
                break;
            case 'supervisor':
                entrada1 = 'gestor';
                entrada2 = 'coordenador';
                break;
            case 'data':
                entrada1 = 'data';
                entrada2 = null;
                break;
            case 'ns_suporte':
                entrada1 = 'data';
                entrada2 = null;
                break;
            default:
                throw new Error('Agrupamento inválido');
        }

        //console.log(`Agrupar por: ${agruparPor}`);
        try {
            console.log('Verificando dados no cache...');
            let cache: cacheRel[] = await getCacheRel();

            if (!cache || cache.length === 0) {
                console.log('Cache vazio, atualizando...');
                await cacheRelatorio(); //ATUALIZACACHE
                cache = await getCacheRel();
            }

            if (!cache || cache.length === 0) {
                throw new Error('Cache não retornou nada');
            }

            const dataInicioDate = new Date(dataInicio);
            const dataFimDate = new Date(dataFim);

            const filtroDatas = cache.filter((dado) => {
                const dataRegistro = new Date(dado.data || dado.avaliacao).toISOString().split('T')[0];
                const dataInicioISO = dataInicioDate.toISOString().split('T')[0];
                const dataFimISO = dataFimDate.toISOString().split('T')[0];
                return dataRegistro >= dataInicioISO && dataRegistro <= dataFimISO;
            });

            const filtroGestor = gestor ? filtroDatas.filter(dado => dado.gestor === gestor) : filtroDatas;
            const filtroSuporte = suporte ? filtroGestor.filter(dado => dado.suporte === suporte) : filtroGestor;
            const filtroSegmento = segmento ? filtroSuporte.filter(dado => dado.segmento === segmento) : filtroSuporte;
            const filtroFilas = fila ? filtroSegmento.filter(dado => dado.fila === fila) : filtroSegmento;

            interface Agrupamento {
                quant: number;
                somaNotas: number;
                totalNotas: number;
                somaTme: number;
                somaTma: number;
                agrupamento1: string;
                agrupamento2?: string;
                somaAbandonadas: number;
                somaSla: number;
                somaAtendidas: number;
                somaAtn_TME:number;
                somaAtn_maior_tme:number;
                sla:number;
            }

            const agrupamento: { [key: string]: Agrupamento } = {};

            filtroFilas.forEach(item => {
                const chave = entrada2 ? `${item[entrada1]}-${item[entrada2]}` : item[entrada1];
                if (!agrupamento[chave]) {
                    agrupamento[chave] = {
                        somaAbandonadas: 0,
                        somaSla: 0,
                        quant: 0,
                        somaNotas: 0,
                        totalNotas: 0,
                        somaTme: 0,
                        somaTma: 0,
                        somaAtendidas: 0,
                        somaAtn_TME: 0,
                        somaAtn_maior_tme:0,
                        sla:0,
                        agrupamento1: item[entrada1] as string,
                        agrupamento2: entrada2 ? item[entrada2] as string : undefined
                    };
                }
                if (item.avaliacao) {
                    agrupamento[chave].somaNotas += item.avaliacao; // soma das avaliações
                    agrupamento[chave].totalNotas += 1;
                }

                if (item.hora_inicio_suporte == null) {
                    agrupamento[chave].somaAbandonadas += 1;
                }

                if (item.hora_inicio_suporte !== null) {
                    agrupamento[chave].somaAtendidas += 1;
                    
                }
            
                agrupamento[chave].quant += 1; // soma com null
                //console.log(agrupamento[chave].somaAtendidas, agrupamento[chave].quant)
                
                const horaInicioSuporte = item.hora_inicio_suporte ? new Date(new Date(`1970-01-01T${item.hora_inicio_suporte}`).getTime() - 3 * 60 * 60 * 1000) : null;
                const horaSolicitacaoSuporte = item.hora_solicitacao_suporte ? new Date(new Date(`1970-01-01T${item.hora_solicitacao_suporte}`).getTime() - 3 * 60 * 60 * 1000) : null;
                const horaFimSuporte = item.hora_fim_suporte ? new Date(new Date(`1970-01-01T${item.hora_fim_suporte}`).getTime() - 3 * 60 * 60 * 1000) : null;

                if (horaInicioSuporte && horaSolicitacaoSuporte && !isNaN(horaInicioSuporte.getTime()) && !isNaN(horaSolicitacaoSuporte.getTime())) {
                    agrupamento[chave].somaTme += (horaInicioSuporte.getTime() - horaSolicitacaoSuporte.getTime());
                
                    const diferenca = horaInicioSuporte.getTime() - horaSolicitacaoSuporte.getTime();
                    if (diferenca <= 60000){ //60000 milissegundos=1 minuto
                        agrupamento[chave].somaAtn_TME += 1;
                    }

                    if(diferenca > 60000){
                        agrupamento[chave].somaAtn_maior_tme+=1;
                    }
                    
                }

                if (horaInicioSuporte && horaFimSuporte && !isNaN(horaInicioSuporte.getTime()) && !isNaN(horaFimSuporte.getTime())) {
                    agrupamento[chave].somaTma += (horaFimSuporte.getTime() - horaInicioSuporte.getTime());
                }
            });

            

            const find = Object.values(agrupamento).map(item => {
                const nota = item.totalNotas > 0 ? (item.somaNotas / item.totalNotas).toFixed(2) : 'N/A';
                const tme = item.somaAtendidas > 0 ? new Date(item.somaTme / item.somaAtendidas).toISOString().substr(11, 8) : '00:00:00';
                const tma = item.somaAtendidas > 0 ? new Date(item.somaTma / item.somaAtendidas).toISOString().substr(11, 8) : '00:00:00';

                const totalSolicitacoes = item.somaAtendidas + item.somaAbandonadas;
                if (totalSolicitacoes > 0) {
                    item.sla = parseFloat(((item.somaAtn_TME / totalSolicitacoes) * 100).toFixed(2));
                } else {
                    item.sla = 0;
                }
                
                return {
                    ...item,
                    nota,
                    tme,
                    tma
                };
            });
            //console.log(find)
            return find;

        } catch (e) {
            console.error('Erro na consulta relatorio:', e);
            throw e;
        }
    }

    public static async relatorioCP(): Promise<any> {
        try {
            const cp: CachedData[] = await getCachedData();
            if (cp) {
                const codGestao = [1110,765,572];
                const codTeste = [677];
                const codSuporte = [791, 14943, 524, 14938, 572, 574, 1110, 61, 836, 1113, 232, 14937, 944];
            
                const cpAtualizado = cp.map(item => {
                    if (item.cod !== undefined && item.cod !== null) {
                        const codInt = parseInt(item.cod.replace(/^0+/, ''), 10);
                        
                        
                        return {
                            nomeSuporte: codSuporte.includes(codInt) ? item.nome : null,
                            nomeGestao: codGestao.includes(codInt) ? item.nome : null
                        };
                    }
                });
                //console.log(cpAtualizado);
                return cpAtualizado;
            }
        } catch (e) {
            console.error('Erro ao buscar informações do CP no Cache:', e);
        }
    }
    public static async relatorioSuporte(suporte: string, gestor: string, coordenador: string, fila: string, segmento: string, dataInicio: string, dataFim: string, agruparPor: string): Promise<any> {
        const relatorio = await this.consultaRelatorioSuporte(suporte, gestor, coordenador, fila, segmento, dataInicio, dataFim, agruparPor);
        return relatorio;
    }
}