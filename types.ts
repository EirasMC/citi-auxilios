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
  password?: string;
  resetRequested?: boolean;
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
  employeeName: string;
  employeeInputName: string;
  eventName: string;
  eventLocation: string;
  eventDate: string;
  eventParamsText?: string;
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
  url?: string; // Link real do Supabase Storage
}