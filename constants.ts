import { AidRequest, Modality, RequestStatus, User, UserRole } from "./types";

export const APP_NAME = "CITI Medicina Reprodutiva";
export const PROGRAM_NAME = "Programa de Auxílios";

export const MOCK_USER: User = {
  id: "emp-001",
  name: "Dr. João Silva",
  email: "joao.silva@citimedicina.com.br",
  role: UserRole.EMPLOYEE,
  department: "Embriologia"
};

export const INITIAL_REQUESTS: AidRequest[] = [
  {
    id: "req-101",
    employeeId: "emp-001",
    employeeName: "Dr. João Silva",
    employeeInputName: "João da Silva Sauro",
    eventName: "Congresso Brasileiro de Reprodução Assistida",
    eventLocation: "São Paulo, SP",
    eventDate: "2024-08-15",
    modality: Modality.I,
    status: RequestStatus.PENDING_APPROVAL,
    submissionDate: "2024-06-01",
    eventParamsText: "https://evento.com.br/regras",
    documents: [{ name: "resumo_trabalho.pdf", size: "1.2MB", date: "2024-06-01" }],
    accountabilityDocuments: []
  },
  {
    id: "req-102",
    employeeId: "emp-002",
    employeeName: "Dra. Maria Souza",
    employeeInputName: "Maria Souza",
    eventName: "ASRM Scientific Congress",
    eventLocation: "Denver, USA",
    eventDate: "2024-10-20",
    modality: Modality.II,
    status: RequestStatus.APPROVED,
    submissionDate: "2024-05-20",
    eventParamsText: "",
    documents: [
      { name: "aceite_artigo.pdf", size: "2.4MB", date: "2024-05-20" },
      { name: "print_regras.jpg", size: "0.5MB", date: "2024-05-20" }
    ],
    accountabilityDocuments: []
  }
];

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
  ACCOUNTABILITY: {
    deadline: "Máximo 30 dias após o evento.",
    refundPeriod: "Até 60 dias após o evento.",
    documents: [
      "Certificado de participação",
      "Certificado de apresentação",
      "Foto no evento",
      "Notas fiscais (Aéreo, Hotel, Alimentação)"
    ]
  }
};