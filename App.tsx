import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import emailjs from '@emailjs/browser'; // Certifique-se de instalar: npm install @emailjs/browser
import { 
  LogOut, User as UserIcon, Database, HardDrive, Loader2, 
  Lock, Mail, UserPlus, HelpCircle, CheckCircle,
  FileText, Upload, History, AlertCircle, Plus, ChevronRight, Download, 
  Award, DollarSign, Trash2, XCircle, Eye, AlertTriangle, ShieldCheck, CheckSquare
} from 'lucide-react';

// ==========================================
// CONFIGURAÇÃO EMAILJS (PREENCHA AQUI)
// ==========================================
const EMAILJS_SERVICE_ID = "service_rhz6qt7"; // Ex: service_xxxxx
const EMAILJS_TEMPLATE_ID = "template_r556fxl"; // Ex: template_xxxxx
const EMAILJS_PUBLIC_KEY = "illya2ue7-bVytDx-"; // Ex: user_xxxxx

// Função auxiliar de envio de e-mail
const sendEmailNotification = async (
  toName: string, 
  toEmail: string, 
  eventName: string, 
  newStatus: string
) => {
  if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID === "SEU_SERVICE_ID_AQUI") {
    console.warn("EmailJS não configurado no código. O e-mail não será enviado.");
    return;
  }

  const templateParams = {
    to_name: toName,
    to_email: toEmail,
    event_name: eventName,
    new_status: newStatus,
    // O e-mail pesquisaciti@gmail.com deve ser configurado como CC ou BCC 
    // diretamente no Template do Painel do EmailJS para garantir o recebimento,
    // ou adicionado no campo 'To Email' do template: {{to_email}}, pesquisaciti@gmail.com
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log("E-mail enviado com sucesso para", toEmail);
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
  }
};

// ==========================================
// 1. DEFINIÇÕES DE TIPOS
// ==========================================

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
  WAITING_REIMBURSEMENT = 'Aguardando Reembolso', 
  COMPLETED = 'Finalizado'
}

export interface SimpleFile {
  name: string;
  size: string;
  date: string;
  url?: string;
  data?: string;
}

export interface AidRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  
  employeeJobTitle: string; 
  registrationFee: string;  
  
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
  
  scientificApproved?: boolean;
  adminApproved?: boolean;
  
  rejectionReason?: string;
}

// ==========================================
// 2. CONSTANTES
// ==========================================

export const APP_NAME = "CITI Medicina Reprodutiva";
export const PROGRAM_NAME = "Programa de Auxílios";

export const MOCK_USER: User = {
  id: "emp-001",
  name: "João Silva",
  email: "joao.silva@citimedicina.com.br",
  role: UserRole.EMPLOYEE
};

export const INITIAL_REQUESTS: AidRequest[] = []; 

export const RULES = {
  MODALITY_I: {
    title: "Modalidade I",
    description: "Apresentação de trabalhos SEM perspectiva de publicação em revistas científicas.",
    requirements: [
      "Apresentação como autor.",
      "Apenas um beneficiário por trabalho.",
      "Concedido uma única vez anualmente."
    ],
    deadline: "15 dias de antecedência do encerramento da submissão."
  },
  MODALITY_II: {
    title: "Modalidade II",
    description: "Apresentação de trabalhos COM perspectiva de publicação em revistas científicas.",
    requirements: [
      "Apresentação como autor.",
      "Novo pedido só após comprovação da publicação do anterior.",
      "Necessário comprovante do Comitê de Ética/Plataforma Brasil."
    ],
    deadline: "15 dias de antecedência do encerramento da submissão."
  },
  ACCOUNTABILITY: {
    deadline: "Máximo 30 dias após o evento.",
    refundPeriod: "Até 60 dias após o evento.",
    reimbursableItems: [
      "Nota fiscal de passagens aéreas (com CPF).",
      "Nota fiscal de passagens de ônibus (com CPF).",
      "Nota fiscal de combustível (consumo 8Km/L + comprovante pedágio).",
      "Nota fiscal de hotel (limitado a 3 dias antes/depois).",
      "Comprovante de AirBnB (limitado a 3 dias antes/depois).",
      "Nota fiscal de restaurantes durante o evento (com CPF).",
      "Comprovante de inscrição do evento.",
      "Comprovante de inscrição em curso do evento."
    ]
  }
};

// ==========================================
// 3. SUPABASE & API CLIENT
// ==========================================

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
export const isSupabaseConnected = !!supabase;

const LS_REQUESTS_KEY = 'citi_requests';
const LS_USERS_KEY = 'citi_users';

export const api = {
  async getUsers(): Promise<User[]> {
    if (isSupabaseConnected && supabase) {
      const { data, error } = await supabase.from('users').select('content');
      if (!error && data) {
        return data.map((row: any) => row.content) as User[];
      }
    }
    const saved = localStorage.getItem(LS_USERS_KEY);
    return saved ? JSON.parse(saved) : [MOCK_USER];
  },

  async saveUser(user: User): Promise<void> {
    if (isSupabaseConnected && supabase) {
      const { error } = await supabase.from('users').upsert({ id: user.id, content: user });
      if (error) console.error("DB Error:", error);
    }
    const current = await api.getUsers();
    const exists = current.find(u => u.id === user.id);
    let updated = exists ? current.map(u => u.id === user.id ? user : u) : [...current, user];
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(updated));
  },

  async updateUser(user: User): Promise<void> {
    return api.saveUser(user);
  },

  async getRequests(): Promise<AidRequest[]> {
    if (isSupabaseConnected && supabase) {
      const { data, error } = await supabase.from('requests').select('content');
      if (!error && data) {
        return data.map((row: any) => row.content) as AidRequest[];
      }
    }
    const saved = localStorage.getItem(LS_REQUESTS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  },

  async saveRequest(req: AidRequest): Promise<void> {
    if (isSupabaseConnected && supabase) {
      const { error } = await supabase.from('requests').upsert({ id: req.id, content: req });
      if (error) console.error("DB Error:", error);
    }
    const current = await api.getRequests();
    const exists = current.find(r => r.id === req.id);
    let updated = exists ? current.map(r => r.id === req.id ? req : r) : [req, ...current];
    localStorage.setItem(LS_REQUESTS_KEY, JSON.stringify(updated));
  },

  async deleteRequest(id: string): Promise<void> {
    const currentRequests = await api.getRequests();
    const reqToDelete = currentRequests.find(r => r.id === id);

    if (reqToDelete && isSupabaseConnected && supabase) {
      const filesToDelete: string[] = [];
      const extractFileName = (url: string) => {
        const parts = url.split('/documentos/');
        return parts.length > 1 ? decodeURIComponent(parts[1]) : null;
      };
      
      [...(reqToDelete.documents || []), ...(reqToDelete.accountabilityDocuments || [])].forEach(doc => {
        if (doc.url) {
          const fn = extractFileName(doc.url);
          if (fn) filesToDelete.push(fn);
        }
      });

      if (filesToDelete.length > 0) {
        await supabase.storage.from('documentos').remove(filesToDelete);
      }
      await supabase.from('requests').delete().eq('id', id);
    } else if (isSupabaseConnected && supabase) {
        await supabase.from('requests').delete().eq('id', id);
    }

    const updated = currentRequests.filter(r => r.id !== id);
    localStorage.setItem(LS_REQUESTS_KEY, JSON.stringify(updated));
  },

  async uploadFile(file: File): Promise<string> {
    if (!isSupabaseConnected || !supabase) {
      return URL.createObjectURL(file);
    }
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${Date.now()}_${sanitizedName}`;
    const { error } = await supabase.storage.from('documentos').upload(fileName, file);

    if (error) throw new Error("Falha ao enviar arquivo.");

    const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(fileName);
    return urlData.publicUrl;
  }
};

// ==========================================
// 4. COMPONENTS
// ==========================================

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const MainLayout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-citi-900">
      <header className="bg-white text-citi-900 shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img 
              src="/citi-logo.png" 
              alt="CITI" 
              className="h-12 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center gap-4">
               <div className="h-10 w-10 bg-citi-900 rounded-full flex items-center justify-center text-white font-bold text-xl">C</div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-wide text-citi-900">{APP_NAME}</span>
                <span className="text-xs text-citi-600 uppercase tracking-wider">{PROGRAM_NAME}</span>
              </div>
            </div>
            <div className="hidden md:block h-8 w-px bg-gray-200"></div>
            <div className="hidden md:flex flex-col justify-center h-full">
               <span className="text-xs font-semibold text-citi-600 uppercase tracking-widest">{PROGRAM_NAME}</span>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-bold text-citi-900">{user.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {user.role === UserRole.ADMIN ? 'Administrador' : 'Colaborador'}
                </span>
              </div>
              <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-citi-600" title="Sair">
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 gap-4">
          <div>&copy; {new Date().getFullYear()} {APP_NAME}.</div>
          <div className="flex items-center gap-2 text-xs bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
             {isSupabaseConnected ? (
               <>
                <Database size={12} className="text-green-500" />
                <span className="text-green-700 font-medium">Online</span>
               </>
             ) : (
               <>
                <HardDrive size={12} className="text-orange-500" />
                <span className="text-orange-600 font-medium">Offline (Demo)</span>
               </>
             )}
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- LOGIN COMPONENT ---
interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (name: string, email: string, pass: string) => { success: boolean, message: string };
  onVerify: (email: string, pass: string) => { success: boolean, user?: User, message: string };
  onRequestReset: (email: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onVerify, onRequestReset }) => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'ADMIN' | 'RESET'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // State para o Checkbox de Segurança
  const [securityChecked, setSecurityChecked] = useState(false);

  const clearForm = () => { setEmail(''); setPassword(''); setName(''); setAdminPassword(''); setError(''); setSuccessMsg(''); setSecurityChecked(false); };
  const switchTab = (tab: any) => { setActiveTab(tab); clearForm(); };
  
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onVerify(email, password);
    if (result.success && result.user) onLogin(result.user);
    else setError(result.message);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityChecked) { setError("Você deve concordar com o aviso de segurança."); return; }
    if (password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return; }
    const result = onRegister(name, email, password);
    if (!result.success) setError(result.message);
  };

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const sent = onRequestReset(email);
    if (sent) { setSuccessMsg('Solicitação enviada!'); setError(''); }
    else setError('E-mail não encontrado.');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'citiadminciti') {
      onLogin({ id: 'admin-01', name: 'Gestão CITI', email: 'admin@citi.com', role: UserRole.ADMIN });
    } else setError('Senha de administrador incorreta.');
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in min-h-[80vh]">
      <div className="mb-8">
        <img src="/citi-logo.png" alt="CITI" className="h-24 w-auto object-contain mx-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </div>
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-citi-900 via-citi-600 to-citi-accent"></div>
        <div className="text-center pt-2">
          <h2 className="text-3xl font-bold text-citi-900">{activeTab === 'REGISTER' ? 'Criar Conta' : activeTab === 'RESET' ? 'Recuperar Senha' : 'Bem-vindo'}</h2>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['LOGIN', 'REGISTER', 'ADMIN'].map((tab) => (
            <button key={tab} onClick={() => switchTab(tab)} className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${activeTab === tab ? 'bg-white shadow text-citi-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'LOGIN' ? 'Login' : tab === 'REGISTER' ? 'Cadastro' : 'Admin'}
            </button>
          ))}
        </div>
        {activeTab === 'LOGIN' && (
          <div className="space-y-4 pt-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 border rounded-lg py-3 px-3" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Senha</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 border rounded-lg py-3 px-3" /></div>
              {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>}
              <button type="submit" className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-citi-600 hover:bg-citi-700">Entrar</button>
            </form>
            <div className="text-center mt-2"><button onClick={() => switchTab('RESET')} className="text-sm text-citi-600 hover:underline">Esqueceu a senha?</button></div>
          </div>
        )}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-4 pt-4">
             <div><label className="block text-sm font-medium text-gray-700">Nome Completo</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 border rounded-lg py-3 px-3" placeholder="Nome Sobrenome" /></div>
             <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 border rounded-lg py-3 px-3" /></div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Senha</label>
               <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 border rounded-lg py-3 px-3" />
               
               {/* 1º Alteração: Aviso de segurança e Checkbox */}
               <div className="mt-3 bg-red-50 border border-red-200 p-3 rounded-lg text-xs text-red-900 leading-relaxed">
                  <span className="font-bold text-red-600">Atenção:</span> esse é um site de uso interno, que possui menos camadas de segurança, portanto, crie uma <span className="font-bold">senha exclusiva para esse site</span>, diferente da que você costuma usar em serviços importantes.
               </div>
               
               <div className="mt-3 flex items-start gap-2">
                 <div className="flex items-center h-5">
                   <input
                    id="security-check"
                    name="security-check"
                    type="checkbox"
                    required
                    checked={securityChecked}
                    onChange={(e) => setSecurityChecked(e.target.checked)}
                    className="h-4 w-4 text-citi-600 border-gray-300 rounded focus:ring-citi-500"
                   />
                 </div>
                 <div className="ml-1 text-sm">
                   <label htmlFor="security-check" className="font-medium text-gray-700 cursor-pointer">
                     Li e compreendi a informação de segurança.
                   </label>
                 </div>
               </div>
             </div>
             {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>}
             {/* Botão desabilitado se não checar a caixa */}
             <button type="submit" disabled={!securityChecked} className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Cadastrar</button>
          </form>
        )}
        {activeTab === 'RESET' && (
          <form onSubmit={handleResetRequest} className="space-y-6 pt-4">
             {!successMsg ? (
               <>
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">Administrador precisará aprovar.</div>
                <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 border rounded-lg py-3 px-3" /></div>
                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                <button type="submit" className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-citi-600">Solicitar</button>
               </>
             ) : (
               <div className="text-center py-6"><CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" /><h3 className="text-lg font-bold">Enviado</h3><button type="button" onClick={() => switchTab('LOGIN')} className="mt-6 text-citi-600 hover:underline">Voltar</button></div>
             )}
          </form>
        )}
        {activeTab === 'ADMIN' && (
          <form onSubmit={handleAdminLogin} className="space-y-6 pt-4">
            <div><label className="block text-sm font-medium text-gray-700">Senha Admin</label><input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full mt-1 border rounded-lg py-3 px-3" /></div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <button type="submit" className="w-full flex justify-center py-3 px-4 rounded-lg text-white bg-citi-900">Acessar</button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- EMPLOYEE DASHBOARD COMPONENT ---
interface EmployeeDashboardProps {
  requests: AidRequest[];
  employeeId: string;
  onRequestSubmit: (req: Omit<AidRequest, 'id' | 'status' | 'submissionDate' | 'accountabilityDocuments' | 'employeeName'>) => void;
  onAccountabilitySubmit: (reqId: string, docs: SimpleFile[]) => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ requests, employeeId, onRequestSubmit, onAccountabilitySubmit }) => {
  const [view, setView] = useState<'HOME' | 'REQUEST' | 'ACCOUNTABILITY' | 'HISTORY'>('HOME');
  const myRequests = requests.filter(r => r.employeeId === employeeId);
  const currentYear = new Date().getFullYear();
  
  const hasApprovedModalityI = myRequests.some(r => r.modality === Modality.I && new Date(r.submissionDate).getFullYear() === currentYear && (r.status !== RequestStatus.REJECTED));
  const hasApprovedModalityII = myRequests.some(r => r.modality === Modality.II && new Date(r.submissionDate).getFullYear() === currentYear && (r.status !== RequestStatus.REJECTED));

  const handleFileUpload = async (file: File): Promise<SimpleFile> => {
    try {
      const url = await api.uploadFile(file);
      return {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
        date: new Date().toISOString(),
        url: url
      };
    } catch (e: any) {
      alert("Erro no upload: " + e.message);
      throw e;
    }
  };

  const Home = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      {[
        { id: 'REQUEST', icon: FileText, title: 'Solicitar Auxílio', desc: 'Inicie um novo processo.', color: 'text-citi-600', bg: 'bg-blue-50', hover: 'hover:border-citi-600' },
        { id: 'ACCOUNTABILITY', icon: Upload, title: 'Prestação de Contas', desc: 'Envie comprovantes.', color: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-500' },
        { id: 'HISTORY', icon: History, title: 'Histórico', desc: 'Acompanhe solicitações.', color: 'text-purple-600', bg: 'bg-purple-50', hover: 'hover:border-purple-500' }
      ].map((item: any) => (
        <button key={item.id} onClick={() => setView(item.id)} className={`group bg-white p-8 rounded-xl shadow-sm border border-gray-200 ${item.hover} hover:shadow-lg transition-all duration-300 text-left flex flex-col justify-between h-64`}>
          <div className={`p-4 ${item.bg} rounded-full w-fit transition-colors`}><item.icon className={`w-8 h-8 ${item.color}`} /></div>
          <div><h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3><p className="text-gray-500 text-sm">{item.desc}</p></div>
        </button>
      ))}
    </div>
  );

  const RequestForm = () => {
    const [formData, setFormData] = useState({ 
      employeeInputName: '', 
      employeeJobTitle: '', 
      eventName: '', 
      eventLocation: '', 
      eventDate: '', 
      registrationFee: '', 
      modality: '' as Modality | '', 
      eventParamsType: 'TEXT' as 'TEXT' | 'FILE', 
      eventParamsText: '', 
      summaryFile: null as SimpleFile | null, 
      paramsFile: null as SimpleFile | null,
      ethicalApprovalFile: null as SimpleFile | null 
    });
    const [dateError, setDateError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
      if (formData.eventDate) {
        const diffDays = Math.ceil((new Date(formData.eventDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
        setDateError(diffDays < 15 ? "Mínimo 15 dias de antecedência." : null);
      }
    }, [formData.eventDate]);

    const isBlocked = (formData.modality === Modality.I && hasApprovedModalityI) || (formData.modality === Modality.II && hasApprovedModalityII);
    
    const isFormatParamsFilled = formData.eventParamsType === 'TEXT' ? (formData.eventParamsText.trim().length > 0) : (!!formData.paramsFile);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (dateError) return alert("Prazo inválido.");
      if (!formData.modality) return alert("Selecione uma modalidade.");
      
      const docs: SimpleFile[] = [];
      if (formData.summaryFile) docs.push(formData.summaryFile);
      if (formData.paramsFile) docs.push(formData.paramsFile);
      if (formData.ethicalApprovalFile) docs.push(formData.ethicalApprovalFile);

      onRequestSubmit({ 
        employeeId, 
        employeeInputName: formData.employeeInputName, 
        employeeJobTitle: formData.employeeJobTitle,
        eventName: formData.eventName, 
        eventLocation: formData.eventLocation, 
        eventDate: formData.eventDate, 
        registrationFee: formData.registrationFee,
        modality: formData.modality, 
        eventParamsText: formData.eventParamsType === 'TEXT' ? formData.eventParamsText : undefined, 
        documents: docs 
      });
      setView('HISTORY');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'summary' | 'params' | 'ethical') => {
      if (e.target.files?.[0]) {
        setUploading(true);
        try {
          const file = e.target.files[0];
          const uploaded = await handleFileUpload(file);
          
          let prefix = "";
          if (type === 'summary') prefix = "Resumo: ";
          else if (type === 'params') prefix = "Regras: ";
          else if (type === 'ethical') prefix = "Ética/Plat. Brasil: ";
          
          uploaded.name = prefix + file.name;
          
          setFormData(prev => ({ 
            ...prev, 
            [type === 'summary' ? 'summaryFile' : type === 'params' ? 'paramsFile' : 'ethicalApprovalFile']: uploaded 
          }));
        } finally {
          setUploading(false);
        }
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4"><h2 className="text-2xl font-bold text-citi-900">Nova Solicitação</h2><button onClick={() => setView('HOME')} className="text-gray-500 hover:text-citi-600">Voltar</button></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
           <div className={`p-4 border rounded-lg cursor-pointer transition-all ${formData.modality === Modality.I ? 'border-citi-600 bg-blue-50 ring-2 ring-citi-600' : 'border-gray-200 hover:bg-gray-50'}`} onClick={() => setFormData({...formData, modality: Modality.I})}>
              <div className="flex items-center justify-between mb-2">
                 <h3 className="font-bold text-lg text-citi-900">{Modality.I}</h3>
                 {formData.modality === Modality.I && <CheckCircle className="text-citi-600" size={20}/>}
              </div>
              <p className="text-sm text-gray-600 mb-2">{RULES.MODALITY_I.description}</p>
              <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                <strong>Prazo:</strong> {RULES.MODALITY_I.deadline}
              </div>
           </div>

           <div className={`p-4 border rounded-lg cursor-pointer transition-all ${formData.modality === Modality.II ? 'border-citi-600 bg-blue-50 ring-2 ring-citi-600' : 'border-gray-200 hover:bg-gray-50'}`} onClick={() => setFormData({...formData, modality: Modality.II})}>
              <div className="flex items-center justify-between mb-2">
                 <h3 className="font-bold text-lg text-citi-900">{Modality.II}</h3>
                 {formData.modality === Modality.II && <CheckCircle className="text-citi-600" size={20}/>}
              </div>
              <p className="text-sm text-gray-600 mb-2">{RULES.MODALITY_II.description}</p>
              <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                <strong>Prazo:</strong> {RULES.MODALITY_II.deadline}
              </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isBlocked && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 text-sm mb-4">Limite anual atingido para esta modalidade.</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input required disabled={isBlocked} type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Nome Completo" value={formData.employeeInputName} onChange={e => setFormData({...formData, employeeInputName: e.target.value})} />
             <input required disabled={isBlocked} type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Cargo na Empresa" value={formData.employeeJobTitle} onChange={e => setFormData({...formData, employeeJobTitle: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input required disabled={isBlocked} type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Nome do Evento" value={formData.eventName} onChange={e => setFormData({...formData, eventName: e.target.value})} />
             <input required disabled={isBlocked} type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Local" value={formData.eventLocation} onChange={e => setFormData({...formData, eventLocation: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Data limite de submissão dos resumos</label>
                <input required disabled={isBlocked} type="date" className={`w-full px-3 py-2 border rounded-lg ${dateError ? 'border-red-500' : ''}`} value={formData.eventDate} onChange={e => setFormData({...formData, eventDate: e.target.value})} />
                {dateError && <p className="text-red-600 text-xs mt-1">{dateError}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Valor da Inscrição (R$)</label>
                <input required disabled={isBlocked} type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: 500,00" value={formData.registrationFee} onChange={e => setFormData({...formData, registrationFee: e.target.value})} />
              </div>
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
             <input required={!formData.summaryFile} type="file" className="hidden" id="sum-file" onChange={e => handleFileChange(e, 'summary')} disabled={isBlocked || uploading} />
             <label htmlFor="sum-file" className="cursor-pointer text-sm text-citi-600 flex flex-col items-center gap-2">
                <FileText size={24} />
                {uploading ? "Enviando..." : formData.summaryFile ? <span className="text-green-600 font-bold">{formData.summaryFile.name}</span> : "Upload: Resumo que deseja submeter, cumprindo os parâmetros exigidos pelo evento (PDF)"}
             </label>
          </div>
          
          {formData.modality === Modality.II && (
             <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <label className="block text-sm font-bold text-blue-900 mb-2">Comprovante de aprovação na Plataforma Brasil / Comitê de ética em pesquisa</label>
                <input required={!formData.ethicalApprovalFile} type="file" onChange={e => handleFileChange(e, 'ethical')} disabled={uploading} className="text-sm w-full" />
                {formData.ethicalApprovalFile && <div className="text-xs text-green-600 mt-1 font-bold">Arquivo anexado: {formData.ethicalApprovalFile.name}</div>}
             </div>
          )}

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
             <label className="block text-sm font-bold text-gray-900 mb-1">Formato de submissão de trabalho exigido pelo evento</label>
             <p className="text-xs text-gray-500 mb-3">
               Especifique a formatação do documento, número máximo de palavras, resumo, objetivo, etc. (Geralmente consta na página do evento). 
               Você pode colar o Link, digitar o texto, ou anexar um Print/PDF das instruções.
             </p>
             
             <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setFormData({...formData, eventParamsType: 'TEXT'})} className={`text-xs px-3 py-1 rounded border ${formData.eventParamsType === 'TEXT' ? 'bg-white font-bold border-citi-600 shadow-sm' : ''}`}>Link/Texto</button>
                <button type="button" onClick={() => setFormData({...formData, eventParamsType: 'FILE'})} className={`text-xs px-3 py-1 rounded border ${formData.eventParamsType === 'FILE' ? 'bg-white font-bold border-citi-600 shadow-sm' : ''}`}>Arquivo/Print</button>
             </div>
             
             {formData.eventParamsType === 'TEXT' ? 
               <textarea rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cole o link ou descreva as regras aqui..." value={formData.eventParamsText} onChange={e => setFormData({...formData, eventParamsText: e.target.value})} /> 
               : <input type="file" onChange={e => handleFileChange(e, 'params')} disabled={uploading} className="text-sm w-full" />
             }
             {formData.eventParamsType === 'FILE' && formData.paramsFile && <div className="text-xs text-green-600 mt-1 font-bold">Arquivo anexado: {formData.paramsFile.name}</div>}
          </div>

          <button type="submit" disabled={isBlocked || !!dateError || !formData.employeeInputName || !formData.summaryFile || uploading || !isFormatParamsFilled} className="w-full bg-citi-600 text-white py-3 rounded-lg font-bold hover:bg-citi-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all">
             {uploading ? "Aguarde o envio..." : "Submeter Solicitação"}
          </button>
        </form>
      </div>
    );
  };

  const AccountabilityView = () => {
    const pending = myRequests.filter(r => r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING_ACCOUNTABILITY);
    const [selectedId, setSelectedId] = useState("");
    const [files, setFiles] = useState<{part: SimpleFile|null, pres: SimpleFile|null, photo: SimpleFile|null, receipts: SimpleFile[]}>({part: null, pres: null, photo: null, receipts: []});
    const [uploading, setUploading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(selectedId && files.part && files.pres && files.photo) {
        onAccountabilitySubmit(selectedId, [files.part, files.pres, files.photo, ...files.receipts]);
        setView('HISTORY');
      }
    };

    const handleSingle = async (field: 'part'|'pres'|'photo', e: any, prefix: string) => {
       if (e.target.files?.[0]) {
         setUploading(true);
         try {
           const uploaded = await handleFileUpload(e.target.files[0]);
           uploaded.name = prefix + ": " + e.target.files[0].name;
           setFiles(p => ({...p, [field]: uploaded}));
         } finally { setUploading(false); }
       }
    };

    const handleReceipts = async (e: any) => {
       if (e.target.files) {
         setUploading(true);
         try {
           const newFiles = await Promise.all(Array.from(e.target.files).map(async (f: any) => {
             const up = await handleFileUpload(f);
             up.name = "Recibo: " + f.name;
             return up;
           }));
           setFiles(p => ({...p, receipts: [...p.receipts, ...newFiles]}));
         } finally { setUploading(false); }
       }
    };

    if (pending.length === 0) return <div className="text-center py-20 bg-white rounded-xl shadow-sm"><CheckCircle className="mx-auto h-16 w-16 text-gray-300 mb-4" /><p>Nenhuma pendência.</p><button onClick={() => setView('HOME')} className="mt-4 text-citi-600">Voltar</button></div>;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Prestação de Contas</h2>
        
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg mb-6">
           <h3 className="font-bold text-emerald-800 flex items-center mb-2"><DollarSign size={16} className="mr-1"/> Itens Passíveis de Reembolso</h3>
           <ul className="text-xs text-emerald-900 list-disc pl-5 space-y-1">
              {RULES.ACCOUNTABILITY.reimbursableItems.map((item, i) => <li key={i}>{item}</li>)}
              <li>Outros comprovantes combinados previamente com a Coordenação.</li>
           </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <select className="w-full px-3 py-3 border rounded-lg" value={selectedId} onChange={e => setSelectedId(e.target.value)} required>
             <option value="">Selecione o Auxílio...</option>
             {pending.map(r => <option key={r.id} value={r.id}>{r.eventName}</option>)}
           </select>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{id:'part', lbl:'Cert. Participação'}, {id:'pres', lbl:'Cert. Apresentação'}, {id:'photo', lbl:'Foto Evento'}].map((f: any) => (
                <div key={f.id} className="border p-4 rounded-lg text-center">
                  <label className="block text-sm font-bold mb-2">{f.lbl}</label>
                  <input type="file" onChange={e => handleSingle(f.id, e, f.lbl)} disabled={uploading} className="text-xs" />
                  {uploading && <div className="text-xs text-citi-600 mt-1">Carregando...</div>}
                </div>
              ))}
              <div className="border p-4 rounded-lg text-center">
                <label className="block text-sm font-bold mb-2">Recibos/Notas (Múltiplos)</label>
                <input type="file" multiple onChange={handleReceipts} disabled={uploading} className="text-xs" />
                <div className="text-xs mt-1 text-gray-500">{files.receipts.length} arquivos</div>
                {uploading && <div className="text-xs text-citi-600 mt-1">Carregando...</div>}
              </div>
           </div>
           <button type="submit" disabled={!selectedId || !files.part || !files.pres || !files.photo || uploading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 disabled:bg-gray-300">
             {uploading ? "Aguarde envio..." : "Enviar Prestação de Contas"}
           </button>
        </form>
      </div>
    );
  };

  const HistoryView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Histórico</h2><button onClick={() => setView('HOME')} className="text-sm text-citi-600">Voltar</button></div>
      <div className="grid gap-4">
         {myRequests.map(req => (
           <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border flex justify-between items-center">
             <div>
               <div className="flex gap-2 mb-1">
                 <span className={`px-2 py-1 rounded text-xs font-bold ${req.status.includes('Aprovado') || req.status === RequestStatus.COMPLETED ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{req.status}</span>
                 {req.modality === Modality.II && <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">Mod. II</span>}
               </div>
               <h3 className="font-bold text-lg">{req.eventName}</h3>
               <p className="text-sm text-gray-600">{new Date(req.eventDate).toLocaleDateString()} - {req.employeeJobTitle}</p>
             </div>
           </div>
         ))}
      </div>
    </div>
  );

  return <div>{view === 'HOME' && <Home />}{view === 'REQUEST' && <RequestForm />}{view === 'ACCOUNTABILITY' && <AccountabilityView />}{view === 'HISTORY' && <HistoryView />}</div>;
};

// --- ADMIN DASHBOARD COMPONENT ---
interface AdminDashboardProps {
  requests: AidRequest[];
  users: User[];
  onUpdateStatus: (id: string, status: RequestStatus, updates?: Partial<AidRequest>) => void;
  onDelete: (id: string) => void;
  onApproveReset: (userId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ requests, users, onUpdateStatus, onDelete, onApproveReset }) => {
  const [selectedRequest, setSelectedRequest] = useState<AidRequest | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const pendingCount = requests.filter(r => r.status === RequestStatus.PENDING_APPROVAL).length;
  const accReviewCount = requests.filter(r => r.status === RequestStatus.ACCOUNTABILITY_REVIEW).length;
  const refundCount = requests.filter(r => r.status === RequestStatus.WAITING_REIMBURSEMENT).length;
  
  const resetRequests = users.filter(u => u.resetRequested && u.role === UserRole.EMPLOYEE);

  const checkForModalityIIWarning = (req: AidRequest) => {
    if (req.modality !== Modality.II) return false;
    const previous = requests.find(r => 
      r.employeeId === req.employeeId && 
      r.modality === Modality.II && 
      r.id !== req.id &&
      (r.status === RequestStatus.APPROVED || r.status === RequestStatus.COMPLETED || r.status === RequestStatus.ACCOUNTABILITY_REVIEW || r.status === RequestStatus.WAITING_REIMBURSEMENT)
    );
    return !!previous;
  };

  const handleDownload = (file: SimpleFile) => {
    if (file.url) window.open(file.url, '_blank');
    else if (file.data) {
       const link = document.createElement('a'); link.href = file.data; link.download = file.name;
       document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } else alert("Arquivo indisponível.");
  };

  const StatusBadge = ({ status }: { status: RequestStatus }) => {
    let color = 'bg-gray-100 text-gray-800';
    if (status === RequestStatus.APPROVED) color = 'bg-green-100 text-green-800';
    if (status === RequestStatus.REJECTED) color = 'bg-red-100 text-red-800';
    if (status === RequestStatus.PENDING_APPROVAL) color = 'bg-yellow-100 text-yellow-800';
    if (status === RequestStatus.WAITING_REIMBURSEMENT) color = 'bg-orange-100 text-orange-800';
    if (status === RequestStatus.COMPLETED) color = 'bg-blue-100 text-blue-800';
    return <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${color}`}>{status}</span>;
  };

  // 9º Alteração: Lógica de Aprovação Dupla com EmailJS
  const handleApproval = (type: 'SCIENTIFIC' | 'ADMIN') => {
    if (!selectedRequest) return;
    const updates: Partial<AidRequest> = {};
    
    let isSci = selectedRequest.scientificApproved;
    let isAdmin = selectedRequest.adminApproved;

    if (type === 'SCIENTIFIC') { isSci = true; updates.scientificApproved = true; }
    if (type === 'ADMIN') { isAdmin = true; updates.adminApproved = true; }

    const requestOwner = users.find(u => u.id === selectedRequest.employeeId);
    const ownerEmail = requestOwner?.email || "";

    if (isSci && isAdmin) {
      onUpdateStatus(selectedRequest.id, RequestStatus.APPROVED, updates);
      // Dispara E-mail: APROVADO
      if (ownerEmail) sendEmailNotification(selectedRequest.employeeName, ownerEmail, selectedRequest.eventName, RequestStatus.APPROVED);
      setSelectedRequest(null);
    } else {
      // Atualiza apenas as flags, mas mantém status Pendente
      onUpdateStatus(selectedRequest.id, RequestStatus.PENDING_APPROVAL, updates);
      // Opcional: Avisar o usuário que uma das aprovações foi feita? 
      // Geralmente só avisa quando aprova tudo, mas podemos avisar aqui se quiser.
      // Por enquanto, só avisa no final para não spammar.
      setSelectedRequest(prev => prev ? ({...prev, ...updates}) : null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="grid grid-cols-4 gap-4">
        {[{l: 'Pendentes', v: pendingCount, c: 'border-l-yellow-400'}, {l: 'Em Análise', v: accReviewCount, c: 'border-l-blue-400'}, {l: 'Reembolso', v: refundCount, c: 'border-l-orange-400'}, {l: 'Total', v: requests.length, c: 'border-l-green-400'}].map((s:any, i) => (
          <div key={i} className={`bg-white p-6 rounded-xl shadow-sm border ${s.c}`}><div className="text-gray-500 text-sm">{s.l}</div><div className="text-3xl font-bold">{s.v}</div></div>
        ))}
      </div>

      {resetRequests.length > 0 && (
         <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
           <h2 className="font-bold text-orange-900 mb-2 flex items-center"><AlertTriangle size={16} className="mr-2"/> Resets de Senha Pendentes</h2>
           {resetRequests.map(u => (
             <div key={u.id} className="flex justify-between items-center bg-white p-2 rounded border border-orange-100 mb-2">
                <span className="text-sm">{u.name} ({u.email})</span>
                <button onClick={() => onApproveReset(u.id)} className="text-xs bg-orange-600 text-white px-2 py-1 rounded">Aprovar</button>
             </div>
           ))}
         </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 font-bold text-gray-700"><tr><th className="px-6 py-3">Nome</th><th className="px-6 py-3">Evento</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Ações</th></tr></thead>
          <tbody className="divide-y">
            {requests.map(req => (
              <tr key={req.id}>
                <td className="px-6 py-4">
                  <div className="font-medium">{req.employeeInputName}</div>
                  <div className="text-xs text-gray-500">{req.employeeJobTitle}</div>
                </td>
                <td className="px-6 py-4">{req.eventName}</td>
                <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setSelectedRequest(req)} className="text-citi-600 hover:bg-blue-50 p-1 rounded mr-2"><Eye size={18} /></button>
                  <button onClick={() => setDeleteConfirmId(req.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl text-center">
             <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
             <p className="text-gray-600 mb-6 text-sm">Essa ação removerá arquivos e dados permanentemente.</p>
             <div className="flex gap-3">
               <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
               <button onClick={() => { onDelete(deleteConfirmId); setDeleteConfirmId(null); setSelectedRequest(null); }} className="flex-1 py-2 bg-red-600 rounded-lg text-white">Excluir</button>
             </div>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Detalhes da Solicitação</h3><button onClick={() => setSelectedRequest(null)}><XCircle /></button></div>
            
            {selectedRequest.status === RequestStatus.PENDING_APPROVAL && checkForModalityIIWarning(selectedRequest) && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start">
                 <AlertTriangle className="text-yellow-600 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                 <div><h4 className="font-bold text-yellow-800 text-sm">Verificação Obrigatória - Modalidade II</h4><p className="text-yellow-700 text-sm mt-1">Verifique se o artigo científico anterior foi publicado.</p></div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                <div><label className="text-xs text-gray-500">Solicitante</label><div className="font-bold">{selectedRequest.employeeInputName}</div></div>
                <div><label className="text-xs text-gray-500">Cargo</label><div className="font-bold">{selectedRequest.employeeJobTitle}</div></div>
                <div><label className="text-xs text-gray-500">Evento</label><div className="font-bold">{selectedRequest.eventName}</div></div>
                <div><label className="text-xs text-gray-500">Data Limite</label><div>{new Date(selectedRequest.eventDate).toLocaleDateString()}</div></div>
                <div><label className="text-xs text-gray-500">Valor Inscrição</label><div className="font-bold">R$ {selectedRequest.registrationFee}</div></div>
                <div><label className="text-xs text-gray-500">Modalidade</label><div>{selectedRequest.modality}</div></div>
              </div>
              
              <div><h4 className="font-bold mb-2">Documentos de Solicitação</h4>
                {selectedRequest.documents.map((d,i) => <div key={i} className="text-sm bg-gray-100 p-2 rounded mb-1 flex justify-between">{d.name} <button onClick={() => handleDownload(d)} className="text-blue-600 hover:underline flex items-center"><Download size={14} className="mr-1"/> Baixar</button></div>)}
              </div>
              
              {selectedRequest.accountabilityDocuments.length > 0 && (
                <div><h4 className="font-bold mb-2 text-emerald-700">Prestação de Contas</h4>
                  {selectedRequest.accountabilityDocuments.map((d,i) => <div key={i} className="text-sm bg-emerald-50 p-2 rounded mb-1 flex justify-between">{d.name} <button onClick={() => handleDownload(d)} className="text-emerald-600 hover:underline flex items-center"><Download size={14} className="mr-1"/> Baixar</button></div>)}
                </div>
              )}
              
              <div className="flex gap-2 pt-4 border-t flex-col">
                {selectedRequest.status === RequestStatus.PENDING_APPROVAL && (
                  <div className="flex gap-2">
                     <button 
                       onClick={() => handleApproval('SCIENTIFIC')} 
                       disabled={selectedRequest.scientificApproved}
                       className={`flex-1 py-3 rounded font-bold flex items-center justify-center ${selectedRequest.scientificApproved ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-citi-600 text-white hover:bg-citi-700'}`}
                     >
                       {selectedRequest.scientificApproved ? <><CheckCircle size={16} className="mr-2"/> Aprovado (Científico)</> : "Aprovar (Científico)"}
                     </button>
                     
                     <button 
                       onClick={() => handleApproval('ADMIN')} 
                       disabled={selectedRequest.adminApproved}
                       className={`flex-1 py-3 rounded font-bold flex items-center justify-center ${selectedRequest.adminApproved ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-citi-900 text-white hover:bg-citi-800'}`}
                     >
                       {selectedRequest.adminApproved ? <><CheckCircle size={16} className="mr-2"/> Aprovado (Admin)</> : "Aprovar (Admin)"}
                     </button>

                     <button onClick={() => { 
                         onUpdateStatus(selectedRequest.id, RequestStatus.REJECTED); 
                         // Email de recusa
                         const owner = users.find(u => u.id === selectedRequest.employeeId);
                         if(owner) sendEmailNotification(selectedRequest.employeeName, owner.email, selectedRequest.eventName, RequestStatus.REJECTED);
                         setSelectedRequest(null); 
                       }} className="px-4 bg-red-100 text-red-700 hover:bg-red-200 rounded font-bold">Recusar</button>
                  </div>
                )}

                {/* 10º Alteração: Fluxo de Reembolso + EmailJS */}
                {(selectedRequest.status === RequestStatus.ACCOUNTABILITY_REVIEW) && (
                   <button onClick={() => { 
                       onUpdateStatus(selectedRequest.id, RequestStatus.WAITING_REIMBURSEMENT); 
                       // Email de Status atualizado
                       const owner = users.find(u => u.id === selectedRequest.employeeId);
                       if(owner) sendEmailNotification(selectedRequest.employeeName, owner.email, selectedRequest.eventName, RequestStatus.WAITING_REIMBURSEMENT);
                       setSelectedRequest(null); 
                     }} className="w-full bg-emerald-600 text-white py-3 rounded font-bold hover:bg-emerald-700">
                      Aprovar Contas & Aguardar Reembolso
                   </button>
                )}
                
                {(selectedRequest.status === RequestStatus.WAITING_REIMBURSEMENT) && (
                   <button onClick={() => { 
                       onUpdateStatus(selectedRequest.id, RequestStatus.COMPLETED); 
                       // Email de Pagamento
                       const owner = users.find(u => u.id === selectedRequest.employeeId);
                       if(owner) sendEmailNotification(selectedRequest.employeeName, owner.email, selectedRequest.eventName, "Pagamento Realizado / Finalizado");
                       setSelectedRequest(null); 
                     }} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">
                      <DollarSign className="inline mr-2"/> Confirmar Realização do Reembolso (Finalizar)
                   </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. APLICAÇÃO PRINCIPAL
// ==========================================

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<AidRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [fetchedRequests, fetchedUsers] = await Promise.all([api.getRequests(), api.getUsers()]);
        setRequests(fetchedRequests);
        setUsers(fetchedUsers);
      } catch (e) { console.error("Failed to load data", e); } 
      finally { setLoading(false); }
    };
    loadData();
  }, [refreshTrigger]);

  const refreshData = () => setRefreshTrigger(prev => prev + 1);
  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);

  const handleRegisterUser = (name: string, email: string, pass: string) => {
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      if (!existingUser.password) {
         const updatedUser = { ...existingUser, password: pass, name: name, resetRequested: false };
         api.saveUser(updatedUser).then(refreshData);
         setCurrentUser(updatedUser);
         return { success: true, message: 'Senha redefinida com sucesso!' };
      }
      return { success: false, message: 'Este e-mail já está cadastrado.' };
    }
    const newUser: User = { id: `emp-${Date.now()}`, name, email, role: UserRole.EMPLOYEE, password: pass };
    api.saveUser(newUser).then(refreshData);
    setCurrentUser(newUser);
    return { success: true, message: 'Cadastro realizado com sucesso!' };
  };

  const handleVerifyCredentials = (email: string, pass: string) => {
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      if (user.role === UserRole.EMPLOYEE && user.resetRequested) return { success: false, message: 'Redefinição pendente.' };
      return { success: true, user, message: 'Login OK.' };
    }
    return { success: false, message: 'Dados incorretos.' };
  };

  const handlePasswordResetRequest = (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) { api.saveUser({ ...user, resetRequested: true }).then(refreshData); return true; }
    return false;
  };

  const handleAdminResetApprove = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) api.saveUser({ ...user, password: '', resetRequested: false }).then(refreshData);
  };

  // 2º Alteração: Disparar e-mail na Submissão
  const handleNewRequest = (newReqData: any) => {
    api.saveRequest({ 
      ...newReqData, 
      id: `req-${Date.now()}`, 
      status: RequestStatus.PENDING_APPROVAL, 
      submissionDate: new Date().toISOString(), 
      accountabilityDocuments: [], 
      employeeName: currentUser?.name || 'Unknown',
      scientificApproved: false,
      adminApproved: false
    }).then(() => { 
        refreshData(); 
        if (currentUser?.email) {
          sendEmailNotification(currentUser.name, currentUser.email, newReqData.eventName, "Solicitação Submetida");
        }
        alert("Enviado com sucesso!"); 
    });
  };

  // 2º Alteração: Disparar e-mail na Prestação de Contas
  const handleAccountabilitySubmit = (reqId: string, docs: SimpleFile[]) => {
    const req = requests.find(r => r.id === reqId);
    if (req) {
        api.saveRequest({ ...req, status: RequestStatus.ACCOUNTABILITY_REVIEW, accountabilityDocuments: docs }).then(() => { 
            refreshData(); 
            const owner = users.find(u => u.id === req.employeeId);
            if (owner) sendEmailNotification(req.employeeName, owner.email, req.eventName, "Prestação de Contas Enviada");
            alert("Contas enviadas!"); 
        });
    }
  };

  const handleAdminStatusUpdate = (id: string, newStatus: RequestStatus, updates: Partial<AidRequest> = {}) => {
    const req = requests.find(r => r.id === id);
    if (req) {
        api.saveRequest({ ...req, ...updates, status: newStatus }).then(() => {
           refreshData();
           // Nota: O disparo de e-mail para aprovações admin acontece dentro do componente AdminDashboard
        });
    }
  };

  const handleDeleteRequest = (id: string) => api.deleteRequest(id).then(refreshData);

  if (loading && !currentUser) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="h-10 w-10 text-citi-600 animate-spin" /></div>;

  return (
    <MainLayout user={currentUser} onLogout={handleLogout}>
      {!currentUser ? (
        <Login onLogin={handleLogin} onRegister={handleRegisterUser} onVerify={handleVerifyCredentials} onRequestReset={handlePasswordResetRequest} />
      ) : (
        <div className="w-full">
          {currentUser.role === UserRole.EMPLOYEE ? (
            <EmployeeDashboard employeeId={currentUser.id} requests={requests} onRequestSubmit={handleNewRequest} onAccountabilitySubmit={handleAccountabilitySubmit} />
          ) : (
            <AdminDashboard requests={requests} users={users} onUpdateStatus={handleAdminStatusUpdate} onDelete={handleDeleteRequest} onApproveReset={handleAdminResetApprove} />
          )}
        </div>
      )}
    </MainLayout>
  );
};

export default App;
