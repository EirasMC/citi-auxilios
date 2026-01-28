import React, { useState, useEffect } from 'react';
import { 
  LogOut, User as UserIcon, Database, HardDrive, Loader2, 
  Lock, Mail, ArrowRight, UserPlus, HelpCircle, CheckCircle,
  FileText, Upload, History, AlertCircle, Plus, ChevronRight, Download, Link as LinkIcon, Image as ImageIcon, Award, DollarSign, Trash2,
  XCircle, Eye, AlertTriangle, MapPin
} from 'lucide-react';

import { User, UserRole, AidRequest, RequestStatus, SimpleFile, Modality } from './types';
import { api } from './services/api';
import { APP_NAME, PROGRAM_NAME, MOCK_USER, RULES } from './constants';
import { isSupabaseConnected } from './lib/supabase';

// ==========================================
// COMPONENTES EMBUTIDOS (Para corrigir erros de importação)
// ==========================================

// --- 1. MAIN LAYOUT ---
interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const MainLayout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white text-citi-900 shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img 
              src="/citi-logo.png" 
              alt="CITI Medicina Reprodutiva" 
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
          <div>&copy; {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.</div>
          <div className="flex items-center gap-2 text-xs bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
             {isSupabaseConnected ? (
               <>
                <Database size={12} className="text-green-500" />
                <span className="text-green-700 font-medium">Banco Conectado (Nuvem)</span>
               </>
             ) : (
               <>
                <HardDrive size={12} className="text-orange-500" />
                <span className="text-orange-600 font-medium">Modo Demonstração (Local)</span>
               </>
             )}
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- 2. LOGIN COMPONENT ---
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

  const clearForm = () => { setEmail(''); setPassword(''); setName(''); setAdminPassword(''); setError(''); setSuccessMsg(''); };
  const switchTab = (tab: any) => { setActiveTab(tab); clearForm(); };
  const handleGoogleLogin = () => onLogin(MOCK_USER);

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onVerify(email, password);
    if (result.success && result.user) onLogin(result.user);
    else setError(result.message);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return; }
    const result = onRegister(name, email, password);
    if (!result.success) setError(result.message);
  };

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const sent = onRequestReset(email);
    if (sent) { setSuccessMsg('Solicitação enviada! O administrador foi notificado.'); setError(''); }
    else setError('E-mail não encontrado na base de dados.');
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
          <p className="mt-2 text-sm text-gray-600">{activeTab === 'RESET' ? 'Informe seu e-mail.' : <span>Acesse o portal do <span className="font-semibold text-citi-600">Programa de Auxílios</span>.</span>}</p>
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
             <button onClick={handleGoogleLogin} className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5 mr-2" alt="Google" /> Entrar com Google
            </button>
            <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Ou use seu email</span></div></div>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700">Email</label><div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900" /></div></div>
              <div><label className="block text-sm font-medium text-gray-700">Senha</label><div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900" /></div></div>
              {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>}
              <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-citi-600 hover:bg-citi-700 transition-colors">Entrar</button>
            </form>
            <div className="text-center mt-2"><button onClick={() => switchTab('RESET')} className="text-sm text-citi-600 hover:underline flex items-center justify-center mx-auto"><HelpCircle size={14} className="mr-1" /> Esqueceu a senha?</button></div>
          </div>
        )}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-4 pt-4">
             <div><label className="block text-sm font-medium text-gray-700">Nome Completo</label><div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-gray-400" /></div><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900" placeholder="Dr. Nome" /></div></div>
             <div><label className="block text-sm font-medium text-gray-700">Email</label><div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900" /></div></div>
             <div><label className="block text-sm font-medium text-gray-700">Senha</label><div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900" /></div></div>
             {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>}
             <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors">Cadastrar</button>
          </form>
        )}
        {activeTab === 'RESET' && (
          <form onSubmit={handleResetRequest} className="space-y-6 pt-4">
             {!successMsg ? (
               <>
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-200">Caso tenha perdido o acesso, o administrador precisará autorizar a criação de uma nova senha.</div>
                <div><label className="block text-sm font-medium text-gray-700">Email</label><div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900" /></div></div>
                {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-citi-600 hover:bg-citi-700 transition-colors">Solicitar Redefinição</button>
               </>
             ) : (
               <div className="text-center py-6"><CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" /><h3 className="text-lg font-bold text-gray-900">Solicitação Enviada</h3><button type="button" onClick={() => switchTab('LOGIN')} className="mt-6 text-citi-600 hover:underline font-medium">Voltar para Login</button></div>
             )}
          </form>
        )}
        {activeTab === 'ADMIN' && (
          <form onSubmit={handleAdminLogin} className="space-y-6 pt-4">
            <div><label className="block text-sm font-medium text-gray-700">Senha Admin</label><div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div><input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900" /></div></div>
            {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-citi-900 hover:bg-citi-800 transition-colors">Acessar Painel</button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- 3. EMPLOYEE DASHBOARD COMPONENT ---
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
  const hasApprovedModalityI = myRequests.some(r => r.modality === Modality.I && new Date(r.submissionDate).getFullYear() === currentYear && (r.status === RequestStatus.APPROVED || r.status === RequestStatus.COMPLETED || r.status === RequestStatus.ACCOUNTABILITY_REVIEW || r.status === RequestStatus.PENDING_ACCOUNTABILITY));
  const hasApprovedModalityII = myRequests.some(r => r.modality === Modality.II && new Date(r.submissionDate).getFullYear() === currentYear && (r.status === RequestStatus.APPROVED || r.status === RequestStatus.COMPLETED || r.status === RequestStatus.ACCOUNTABILITY_REVIEW || r.status === RequestStatus.PENDING_ACCOUNTABILITY));

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
    const [formData, setFormData] = useState({ employeeInputName: '', eventName: '', eventLocation: '', eventDate: '', modality: Modality.I, eventParamsType: 'TEXT' as 'TEXT' | 'FILE', eventParamsText: '', summaryFile: null as SimpleFile | null, paramsFile: null as SimpleFile | null });
    const [dateError, setDateError] = useState<string | null>(null);

    useEffect(() => {
      if (formData.eventDate) {
        const diffDays = Math.ceil((new Date(formData.eventDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
        setDateError(diffDays < 15 ? "Mínimo 15 dias de antecedência." : null);
      }
    }, [formData.eventDate]);

    const isBlocked = (formData.modality === Modality.I && hasApprovedModalityI) || (formData.modality === Modality.II && hasApprovedModalityII);
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (dateError) return alert("Prazo inválido.");
      const docs: SimpleFile[] = [];
      if (formData.summaryFile) docs.push(formData.summaryFile);
      if (formData.paramsFile) docs.push(formData.paramsFile);
      onRequestSubmit({ employeeId, employeeInputName: formData.employeeInputName, eventName: formData.eventName, eventLocation: formData.eventLocation, eventDate: formData.eventDate, modality: formData.modality, eventParamsText: formData.eventParamsType === 'TEXT' ? formData.eventParamsText : undefined, documents: docs });
      setView('HISTORY');
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'summary' | 'params') => {
      if (e.target.files?.[0]) {
        const f = e.target.files[0];
        setFormData({ ...formData, [type === 'summary' ? 'summaryFile' : 'paramsFile']: { name: (type === 'summary' ? "Resumo: " : "Params: ") + f.name, size: '1MB', date: new Date().toISOString() } });
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4"><h2 className="text-2xl font-bold text-citi-900">Nova Solicitação</h2><button onClick={() => setView('HOME')} className="text-gray-500 hover:text-citi-600">Voltar</button></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
                <div className="grid grid-cols-2 gap-4">
                  {[Modality.I, Modality.II].map(m => (
                    <button key={m} type="button" onClick={() => setFormData({...formData, modality: m})} className={`p-4 border rounded-lg text-left transition-all ${formData.modality === m ? 'border-citi-600 bg-blue-50 ring-1 ring-citi-600' : 'border-gray-200'}`}>
                      <div className="font-bold text-citi-900">{m}</div>
                    </button>
                  ))}
                </div>
              </div>
              {isBlocked && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 text-sm">Limite anual atingido para esta modalidade.</div>}
              <input required disabled={isBlocked} type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Nome Completo" value={formData.employeeInputName} onChange={e => setFormData({...formData, employeeInputName: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                 <input required disabled={isBlocked} type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Nome do Evento" value={formData.eventName} onChange={e => setFormData({...formData, eventName: e.target.value})} />
                 <input required disabled={isBlocked} type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Local" value={formData.eventLocation} onChange={e => setFormData({...formData, eventLocation: e.target.value})} />
              </div>
              <div>
                <input required disabled={isBlocked} type="date" className={`w-full px-3 py-2 border rounded-lg ${dateError ? 'border-red-500' : ''}`} value={formData.eventDate} onChange={e => setFormData({...formData, eventDate: e.target.value})} />
                {dateError && <p className="text-red-600 text-xs mt-1">{dateError}</p>}
              </div>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                 <input required={!formData.summaryFile} type="file" className="hidden" id="sum-file" onChange={e => handleFile(e, 'summary')} disabled={isBlocked} />
                 <label htmlFor="sum-file" className="cursor-pointer text-sm text-citi-600">{formData.summaryFile ? formData.summaryFile.name : "Upload Resumo (PDF)"}</label>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                 <div className="flex gap-2 mb-2"><button type="button" onClick={() => setFormData({...formData, eventParamsType: 'TEXT'})} className="text-xs border px-2 py-1 rounded">Link/Texto</button><button type="button" onClick={() => setFormData({...formData, eventParamsType: 'FILE'})} className="text-xs border px-2 py-1 rounded">Arquivo</button></div>
                 {formData.eventParamsType === 'TEXT' ? <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Regras do evento..." value={formData.eventParamsText} onChange={e => setFormData({...formData, eventParamsText: e.target.value})} /> : <input type="file" onChange={e => handleFile(e, 'params')} className="text-sm" />}
              </div>
              <button type="submit" disabled={isBlocked || !!dateError || !formData.employeeInputName || !formData.summaryFile} className="w-full bg-citi-600 text-white py-3 rounded-lg font-bold hover:bg-citi-700 disabled:bg-gray-300">Enviar</button>
            </form>
          </div>
          <div className="bg-blue-50 p-6 rounded-xl h-fit text-sm text-gray-700 space-y-4">
             <h3 className="font-bold text-citi-900">Regras</h3>
             <p>{formData.modality === Modality.I ? RULES.MODALITY_I.description : RULES.MODALITY_II.description}</p>
             <p>Prazo: {formData.modality === Modality.I ? RULES.MODALITY_I.deadline : RULES.MODALITY_II.deadline}</p>
          </div>
        </div>
      </div>
    );
  };

  const AccountabilityView = () => {
    const pending = myRequests.filter(r => r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING_ACCOUNTABILITY);
    const [selectedId, setSelectedId] = useState("");
    const [files, setFiles] = useState<{part: SimpleFile|null, pres: SimpleFile|null, photo: SimpleFile|null, receipts: SimpleFile[]}>({part: null, pres: null, photo: null, receipts: []});

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(selectedId && files.part && files.pres && files.photo) {
        onAccountabilitySubmit(selectedId, [files.part, files.pres, files.photo, ...files.receipts]);
        setView('HISTORY');
      }
    };

    const handleSingle = (field: 'part'|'pres'|'photo', e: any, prefix: string) => {
       if (e.target.files?.[0]) setFiles(p => ({...p, [field]: { name: prefix + ": " + e.target.files[0].name, size: '1MB', date: new Date().toISOString() }}));
    };

    const handleReceipts = (e: any) => {
       if (e.target.files) {
         const newFiles = Array.from(e.target.files).map((f: any) => ({ name: "Recibo: " + f.name, size: '1MB', date: new Date().toISOString() }));
         setFiles(p => ({...p, receipts: [...p.receipts, ...newFiles]}));
       }
    };

    if (pending.length === 0) return <div className="text-center py-20 bg-white rounded-xl shadow-sm"><CheckCircle className="mx-auto h-16 w-16 text-gray-300 mb-4" /><p>Nenhuma pendência.</p><button onClick={() => setView('HOME')} className="mt-4 text-citi-600">Voltar</button></div>;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Prestação de Contas</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
           <select className="w-full px-3 py-3 border rounded-lg" value={selectedId} onChange={e => setSelectedId(e.target.value)} required>
             <option value="">Selecione o Auxílio...</option>
             {pending.map(r => <option key={r.id} value={r.id}>{r.eventName}</option>)}
           </select>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{id:'part', lbl:'Cert. Participação'}, {id:'pres', lbl:'Cert. Apresentação'}, {id:'photo', lbl:'Foto Evento'}].map((f: any) => (
                <div key={f.id} className="border p-4 rounded-lg text-center">
                  <label className="block text-sm font-bold mb-2">{f.lbl}</label>
                  <input type="file" onChange={e => handleSingle(f.id, e, f.lbl)} className="text-xs" />
                </div>
              ))}
              <div className="border p-4 rounded-lg text-center">
                <label className="block text-sm font-bold mb-2">Recibos/Notas</label>
                <input type="file" multiple onChange={handleReceipts} className="text-xs" />
                <div className="text-xs mt-1 text-gray-500">{files.receipts.length} arquivos</div>
              </div>
           </div>
           <button type="submit" disabled={!selectedId || !files.part || !files.pres || !files.photo} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 disabled:bg-gray-300">Enviar</button>
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
               <span className={`px-2 py-1 rounded text-xs font-bold ${req.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{req.status}</span>
               <h3 className="font-bold text-lg mt-1">{req.eventName}</h3>
               <p className="text-sm text-gray-600">{req.modality} - {new Date(req.eventDate).toLocaleDateString()}</p>
             </div>
           </div>
         ))}
      </div>
    </div>
  );

  return <div>{view === 'HOME' && <Home />}{view === 'REQUEST' && <RequestForm />}{view === 'ACCOUNTABILITY' && <AccountabilityView />}{view === 'HISTORY' && <HistoryView />}</div>;
};

// --- 4. ADMIN DASHBOARD COMPONENT ---
interface AdminDashboardProps {
  requests: AidRequest[];
  users: User[];
  onUpdateStatus: (id: string, status: RequestStatus, reason?: string) => void;
  onDelete: (id: string) => void;
  onApproveReset: (userId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ requests, users, onUpdateStatus, onDelete, onApproveReset }) => {
  const [selectedRequest, setSelectedRequest] = useState<AidRequest | null>(null);
  
  const StatusBadge = ({ status }: { status: RequestStatus }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${status === RequestStatus.APPROVED ? 'bg-green-100 text-green-800' : status === RequestStatus.REJECTED ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{status}</span>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-3 gap-6">
        {[{l: 'Pendentes', v: requests.filter(r => r.status === RequestStatus.PENDING_APPROVAL).length, c: 'border-l-yellow-400'}, {l: 'Em Análise', v: requests.filter(r => r.status === RequestStatus.ACCOUNTABILITY_REVIEW).length, c: 'border-l-blue-400'}, {l: 'Total', v: requests.length, c: 'border-l-green-400'}].map((s:any, i) => (
          <div key={i} className={`bg-white p-6 rounded-xl shadow-sm border ${s.c}`}><div className="text-gray-500 text-sm">{s.l}</div><div className="text-3xl font-bold">{s.v}</div></div>
        ))}
      </div>

      {users.some(u => u.resetRequested) && (
         <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
           <h2 className="font-bold text-orange-900 mb-2 flex items-center"><AlertTriangle size={16} className="mr-2"/> Resets de Senha Pendentes</h2>
           {users.filter(u => u.resetRequested).map(u => (
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
                <td className="px-6 py-4">{req.employeeInputName}</td>
                <td className="px-6 py-4">{req.eventName}</td>
                <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setSelectedRequest(req)} className="text-citi-600 hover:bg-blue-50 p-1 rounded mr-2"><Eye size={18} /></button>
                  <button onClick={() => onDelete(req.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Detalhes</h3><button onClick={() => setSelectedRequest(null)}><XCircle /></button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                <div><label className="text-xs text-gray-500">Solicitante</label><div className="font-bold">{selectedRequest.employeeInputName}</div></div>
                <div><label className="text-xs text-gray-500">Evento</label><div className="font-bold">{selectedRequest.eventName}</div></div>
                <div><label className="text-xs text-gray-500">Modalidade</label><div>{selectedRequest.modality}</div></div>
                <div><label className="text-xs text-gray-500">Data</label><div>{new Date(selectedRequest.eventDate).toLocaleDateString()}</div></div>
              </div>
              <div><h4 className="font-bold mb-2">Documentos</h4>
                {selectedRequest.documents.map((d,i) => <div key={i} className="text-sm bg-gray-100 p-2 rounded mb-1 flex justify-between">{d.name} <Download size={14}/></div>)}
              </div>
              {selectedRequest.accountabilityDocuments.length > 0 && (
                <div><h4 className="font-bold mb-2 text-emerald-700">Prestação de Contas</h4>
                  {selectedRequest.accountabilityDocuments.map((d,i) => <div key={i} className="text-sm bg-emerald-50 p-2 rounded mb-1 flex justify-between">{d.name} <Download size={14}/></div>)}
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t">
                {selectedRequest.status === RequestStatus.PENDING_APPROVAL && (
                  <><button onClick={() => { onUpdateStatus(selectedRequest.id, RequestStatus.APPROVED); setSelectedRequest(null); }} className="flex-1 bg-green-600 text-white py-2 rounded">Aprovar</button>
                  <button onClick={() => { onUpdateStatus(selectedRequest.id, RequestStatus.REJECTED); setSelectedRequest(null); }} className="flex-1 bg-red-600 text-white py-2 rounded">Recusar</button></>
                )}
                {(selectedRequest.status === RequestStatus.ACCOUNTABILITY_REVIEW) && (
                   <button onClick={() => { onUpdateStatus(selectedRequest.id, RequestStatus.COMPLETED); setSelectedRequest(null); }} className="flex-1 bg-citi-600 text-white py-2 rounded">Aprovar Contas & Finalizar</button>
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
// APLICAÇÃO PRINCIPAL
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
    const newUser: User = { id: `emp-${Date.now()}`, name, email, role: UserRole.EMPLOYEE, password: pass, department: 'Geral' };
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
    if (user) api.saveUser({ ...user, password: '', resetRequested: false }).then(() => { refreshData(); alert("Redefinição aprovada."); });
  };

  const handleNewRequest = (newReqData: any) => {
    api.saveRequest({ ...newReqData, id: `req-${Date.now()}`, status: RequestStatus.PENDING_APPROVAL, submissionDate: new Date().toISOString(), accountabilityDocuments: [], employeeName: currentUser?.name || 'Unknown' })
       .then(() => { refreshData(); alert("Enviado com sucesso!"); });
  };

  const handleAccountabilitySubmit = (reqId: string, docs: SimpleFile[]) => {
    const req = requests.find(r => r.id === reqId);
    if (req) api.saveRequest({ ...req, status: RequestStatus.ACCOUNTABILITY_REVIEW, accountabilityDocuments: docs }).then(() => { refreshData(); alert("Contas enviadas!"); });
  };

  const handleAdminStatusUpdate = (id: string, newStatus: RequestStatus) => {
    const req = requests.find(r => r.id === id);
    if (req) api.saveRequest({ ...req, status: newStatus }).then(refreshData);
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
