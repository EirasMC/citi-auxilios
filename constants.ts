
import { AidRequest, Modality, RequestStatus, User, UserRole } from "./types";

export const APP_NAME = "CITI Medicina Reprodutiva";
export const PROGRAM_NAME = "Programa de Auxílios";

export const MOCK_USER: User = {
  id: "emp-001",
  name: "João Silva",
  email: "joao.silva@citimedicina.com.br",
  role: UserRole.EMPLOYEE,
  department: "Embriologia"
};

export const INITIAL_REQUESTS: AidRequest[] = [];

export const RULES = {
  MODALITY_I: {
    title: "Modalidade I",
    description: "Apresentação de trabalhos sem perspectiva de publicação em revistas científicas.",
    requirements: [
      "Apresentação como autor.",
      "Apenas um beneficiário por trabalho.",
      "Concedido uma única vez anualmente."
    ],
    deadline: "15 dias de antecedência do encerramento da submissão."
  },
  MODALITY_II: {
    title: "Modalidade II",
    description: "Apresentação de trabalhos com perspectiva de publicação em revistas científicas.",
    requirements: [
      "Apresentação como autor.",
      "Novo pedido só após comprovação da publicação do anterior."
    ],
    deadline: "15 dias de antecedência."
  },
  REIMBURSABLE_ITEMS: [
    "Nota fiscal de passagens aéreas, com o número do CPF do beneficiário.",
    "Nota fiscal de passagens de ônibus, com o número do CPF do beneficiário.",
    "Nota fiscal de posto de combustível (Consumo 8Km/L), com o CPF do beneficiário.",
    "Comprovante de praça de pedágio do dia e do percurso da viagem.",
    "Nota fiscal de hotel da cidade do evento (limite 3 dias antes/depois).",
    "Comprovante de hospedagem em AirBnB (limite 3 dias antes/depois).",
    "Nota fiscal de restaurantes do período, com o CPF do beneficiário.",
    "Comprovante de inscrição do evento no nome do beneficiário.",
    "Comprovante de inscrição em curso do evento no nome do beneficiário.",
    "Outros comprovantes combinados previamente com a Coordenação."
  ],
  ACCOUNTABILITY: {
    deadline: "Máximo 30 dias após o evento.",
    refundPeriod: "Até 60 dias após o evento.",
    documents: [
      "Certificado de participação",
      "Certificado de apresentação",
      "Foto no evento",
      "Notas fiscais"
    ]
  }
};
