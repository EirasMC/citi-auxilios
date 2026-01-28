export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  password?: string; // Optional because Google auth wouldn't have it, but custom auth will
  resetRequested?: boolean; // Flag for password recovery flow
}

export enum Modality {
  I = 'Modalidade I',
  II = 'Modalidade II'
}

export enum RequestStatus {
  PENDING_APPROVAL = 'Pendente Aprovação',
  APPROVED = 'Aprovado',
  REJECTED = 'Recusado',
  PENDING_ACCOUNTABILITY = 'Aguardando Prestação de Contas',
  ACCOUNTABILITY_REVIEW = 'Análise de Contas',
  COMPLETED = 'Finalizado'
}

export interface AidRequest {
  id: string;
  employeeId: string;
  employeeName: string; // System name
  employeeInputName: string; // Manually input name
  eventName: string;
  eventLocation: string;
  eventDate: string;
  eventParamsText?: string; // For URL or text description of params
  modality: Modality;
  status: RequestStatus;
  submissionDate: string;
  documents: SimpleFile[];
  accountabilityDocuments: SimpleFile[];
  rejectionReason?: string;
}

export interface SimpleFile {
  name: string;
  size: string;
  date: string;
}