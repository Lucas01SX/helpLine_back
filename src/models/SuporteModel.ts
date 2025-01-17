export interface Suporte {
    id: number;
    solicitante: number;
    dataSolicitacao: string;
    horaSolicitacao: string;
    mcdu: number;
    telefone: string;
    uniqueIdLigacao: string;
    status: 'aberto' | 'atendido';
    operadorAtendimento?: number;
}