export interface CachedData {
    matricula: string;
    cod: string;
    login: string;
    nome: string;
    mat_super: string;
    nome_super: string;
    mat_coord: string;
    coordenador: string;
}

export interface cacheRel {
    data: string;
    dt_solicitacao_suporte:string;
    suporte: string;
    gestor:string;
    coordenador:string;
    fila:string;
    segmento:string;    
    avaliacao: number;
    hora_inicio_suporte : string;
    hora_solicitacao_suporte : string;
    hora_fim_suporte: string;
}