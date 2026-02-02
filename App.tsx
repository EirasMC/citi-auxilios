
import React, { useState, useEffect } from 'react';
import { 
  LogOut, Database, HardDrive, Loader2, Lock, Mail, ShieldCheck, 
  HelpCircle, CheckCircle, FileText, Upload, History, Info, 
  DollarSign, Trash2, XCircle, Eye, ChevronRight, Download, Award 
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { supabase, isSupabaseConnected } from './supabase';

// ==========================================
// CONFIGURAÇÕES DO EMAILJS (PREENCHA AQUI)
// ==========================================
// Instruções:
// 1. Crie conta em emailjs.com
// 2. Crie um Email Service (ex: Gmail) e pegue o SERVICE_ID
// 3. Crie um Email Template e pegue o TEMPLATE_ID
// 4. Pegue sua Public Key em Account > API Keys
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_xxxx',   // Substitua pelo seu Service ID
  TEMPLATE_ID: 'template_xxxx', // Substitua pelo seu Template ID
  PUBLIC_KEY: 'xxxx_xxxx_xxxx'  // Substitua pela sua Public Key
};

// ==========================================
// 1. TIPOS, ENUMS E REGRAS DE NEGÓCIO
// ==========================================

export enum UserRole { EMPLOYEE = 'EMPLOYEE', ADMIN = 'ADMIN' }
export enum Modality { I = 'Modalidade I', II = 'Modalidade II' }
export enum RequestStatus {
  PENDING_APPROVAL = 'Pendente Aprovação',
  APPROVED = 'Aprovado',
  REJECTED = 'Recusado',
  PENDING_ACCOUNTABILITY = 'Aguardando Prestação de Contas',
  ACCOUNTABILITY_REVIEW = 'Análise de Contas',
  WAITING_REIMBURSEMENT = 'Aguardando Reembolso',
  COMPLETED = 'Finalizado'
}

export interface User {
  id: string; name: string; email: string; role: UserRole; 
  password?: string;
}

export interface SimpleFile { name: string; size: string; url: string; }

export interface AidRequest {
  id: string; employeeId: string; employeeInputName: string;
  jobRole: string; eventName: string; eventDate: string; 
  registrationValue: string; modality: Modality;
  status: RequestStatus; submissionDate: string;
  scientificApproved?: boolean; adminApproved?: boolean;
  documents: SimpleFile[]; ethicsCommitteeProof?: SimpleFile;
  accountabilityDocuments: SimpleFile[];
}

const REIMBURSABLE_ITEMS = [
  "Passagens aéreas/ônibus (com CPF do beneficiário)",
  "Combustível (8Km/L) e Pedágios do percurso",
  "Hospedagem (Hotel/AirBnB) - limite 3 dias antes/depois",
  "Alimentação no período do evento (com CPF)",
  "Inscrição do evento e cursos vinculados"
];

// ==========================================
// 2. SERVIÇOS DE API (BANCO DE DADOS E E-MAIL)
// ==========================================

const api = {
  // --- BUSCAR PEDIDOS ---
  async getRequests(): Promise<AidRequest[]> {
    if (isSupabaseConnected && supabase) {
      const { data } = await supabase.from('requests').select('content');
      return data ? data.map((r: any) => r.content) : [];
    }
    const saved = localStorage.getItem('citi_reqs');
    return saved ? JSON.parse(saved) : [];
  },

  // --- SALVAR PEDIDO ---
  async saveRequest(req: AidRequest) {
    if (isSupabaseConnected && supabase) await supabase.from('requests').upsert({ id: req.id, content: req });
    const current = await api.getRequests();
    const updated = current.find(r => r.id === req.id) ? current.map(r => r.id === req.id ? req : r) : [req, ...current];
    localStorage.setItem('citi_reqs', JSON.stringify(updated));
  },

  // --- BUSCAR USUÁRIOS ---
  async getUsers(): Promise<User[]> {
    if (isSupabaseConnected && supabase) {
      const { data } = await supabase.from('users').select('content');
      return data ? data.map((u: any) => u.content) : [];
    }
    const saved = localStorage.getItem('citi_users');
    return saved ? JSON.parse(saved) : [];
  },

  // --- SALVAR USUÁRIO ---
  async saveUser(user: User) {
    if (isSupabaseConnected && supabase) await supabase.from('users').upsert({ id: user.id, content: user });
    const users = await api.getUsers();
    localStorage.setItem('citi_users', JSON.stringify([...users.filter(u => u.id !== user.id), user]));
  },

  // --- UPLOAD DE ARQUIVOS ---
  async uploadFile(file: File): Promise<string> {
    if (!isSupabaseConnected || !supabase) return URL.createObjectURL(file);
    // Remove caracteres especiais do nome do arquivo
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${Date.now()}_${cleanName}`;
    const { error } = await supabase.storage.from('documentos').upload(fileName, file);
    if (error) {
        console.error("Erro upload Supabase:", error);
        alert("Erro ao fazer upload. Verifique sua conexão.");
        return "";
    }
    return supabase.storage.from('documentos').getPublicUrl(fileName).data.publicUrl;
  },

  // --- ENVIAR E-MAIL ---
  async sendEmail(to: string, subject: string, body: string) {
    // Lista de e-mails administrativos que recebem cópia de tudo
    const admins = ["eirasmc@gmail.com", "edson.takitani@citimedicinareprodutiva.com.br"];
    
    const send = async (email: string) => {
      try {
        if(EMAILJS_CONFIG.SERVICE_ID === 'service_xxxx') {
            console.warn("EmailJS não configurado no código.");
            return;
        }
        await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, 
          { to_email: email, subject, message: body }, EMAILJS_CONFIG.PUBLIC_KEY);
      } catch (e) { console.error("Erro EmailJS:", e); }
    };
    // Envia para o interessado e para os gestores
    await Promise.all([to, ...admins].map(email => send(email)));
  }
};

// ==========================================
// 3. COMPONENTES VISUAIS
// ==========================================

const Layout: React.FC<{ children: React.ReactNode, user: User | null, onLogout: () => void }> = ({ children, user, onLogout }) => (
  <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
    <header className="bg-white border-b px-6 h-20 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-citi-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">C</div>
        <div>
          <h1 className="font-bold text-slate-900 leading-tight">CITI Medicina</h1>
          <p className="text-[10px] text-citi-600 font-bold uppercase tracking-wider">Programa de Auxílios</p>
        </div>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">{user.name}</p>
            <p className="text-[10px] text-slate-500 uppercase font-medium bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-0.5">{user.role === UserRole.ADMIN ? 'Gestor' : 'Colaborador'}</p>
          </div>
          <button onClick={onLogout} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><LogOut size={20}/></button>
        </div>
      )}
    </header>
    <main className="flex-grow p-4 sm:p-8 max-w-6xl w-full mx-auto animate-fade-in">{children}</main>
    <footer className="p-8 border-t bg-white flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-4">
      <span>© {new Date().getFullYear()} CITI Medicina Reprodutiva. Sistema Interno.</span>
      <div className="flex items-center gap-2">
        {isSupabaseConnected ? <><Database size={12} className="text-green-500"/> Banco de Dados Conectado</> : <><HardDrive size={12} className="text-amber-500"/> Modo Local (Demonstração)</>}
      </div>
    </footer>
  </div>
);

const EmployeeView: React.FC<{ user: User, requests: AidRequest[], onRefresh: () => void }> = ({ user, requests, onRefresh }) => {
  const [tab, setTab] = useState<'HOME'|'NEW'|'HIST'|'ACC'>('HOME');
  const [form, setForm] = useState({ 
    name: user.name, role: '', event: '', date: '', val: '', mod: Modality.I, 
    sumFile: null as File | null, ethicsFile: null as File | null 
  });
  const [loading, setLoading] = useState(false);
  
  // Estado para prestação de contas
  const [accRequest, setAccRequest] = useState('');
  const [accFiles, setAccFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sumFile) return alert("Erro: É obrigatório anexar o resumo do trabalho.");
    setLoading(true);
    try {
      const sumUrl = await api.uploadFile(form.sumFile);
      let ethicsUrl = "";
      if (form.ethicsFile) ethicsUrl = await api.uploadFile(form.ethicsFile);

      const req: AidRequest = {
        id: Date.now().toString(), employeeId: user.id, employeeInputName: form.name,
        jobRole: form.role, eventName: form.event, eventDate: form.date,
        registrationValue: form.val, modality: form.mod, status: RequestStatus.PENDING_APPROVAL,
        submissionDate: new Date().toISOString(), documents: [{ name: form.sumFile.name, size: 'PDF', url: sumUrl }],
        ethicsCommitteeProof: form.ethicsFile ? { name: form.ethicsFile.name, size: 'PDF', url: ethicsUrl } : undefined,
        accountabilityDocuments: []
      };

      await api.saveRequest(req);
      await api.sendEmail(user.email, "Solicitação Recebida - CITI", `Olá ${form.name},\n\nRecebemos sua solicitação para o evento "${form.event}".\nEla será analisada pelos comitês.\n\nAtenciosamente,\nEquipe CITI`);
      
      alert("Solicitação enviada com sucesso!");
      onRefresh(); setTab('HIST');
      // Reset form
      setForm({ name: user.name, role: '', event: '', date: '', val: '', mod: Modality.I, sumFile: null, ethicsFile: null });
    } catch (err) {
        alert("Ocorreu um erro ao enviar. Tente novamente.");
    } finally { setLoading(false); }
  };

  const handleAccountabilitySubmit = async () => {
     if(!accRequest || accFiles.length === 0) return alert("Selecione o evento e anexe os arquivos.");
     setLoading(true);
     try {
         const request = requests.find(r => r.id === accRequest);
         if(!request) return;

         const uploadedDocs = await Promise.all(accFiles.map(async (f) => ({
             name: f.name,
             size: 'FILE',
             url: await api.uploadFile(f)
         })));

         const updatedReq: AidRequest = {
             ...request,
             status: RequestStatus.ACCOUNTABILITY_REVIEW,
             accountabilityDocuments: [...(request.accountabilityDocuments || []), ...uploadedDocs]
         };

         await api.saveRequest(updatedReq);
         await api.sendEmail(user.email, "Prestação de Contas Enviada", `Recebemos os documentos de prestação de contas para o evento ${request.eventName}.`);
         alert("Prestação de contas enviada!");
         onRefresh();
         setTab('HIST');
         setAccRequest('');
         setAccFiles([]);
     } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center gap-2 flex-wrap">
        {[
            {id: 'HOME', label: 'Início'}, 
            {id: 'NEW', label: 'Nova Solicitação'}, 
            {id: 'ACC', label: 'Prestação de Contas'},
            {id: 'HIST', label: 'Meu Histórico'}
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all ${tab===t.id?'bg-citi-600 text-white shadow-lg shadow-citi-500/30 transform scale-105':'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'HOME' && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <h3 className="font-bold text-lg mb-4 flex items-center text-slate-900"><Info className="mr-2 text-citi-600"/> Regras Importantes</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">Solicitações devem ser enviadas com no mínimo 15 dias de antecedência do evento.</p>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800">
                <strong>Dica:</strong> Para a Modalidade II, tenha em mãos o comprovante do Comitê de Ética.
            </div>
          </div>
          <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center text-citi-500"><DollarSign className="mr-2"/> Itens Reembolsáveis</h3>
            <ul className="text-[11px] space-y-3 opacity-90">
              {REIMBURSABLE_ITEMS.map((item, i) => <li key={i} className="flex items-start gap-2"><CheckCircle size={14} className="mt-0.5 text-citi-500 shrink-0"/> {item}</li>)}
            </ul>
          </div>
        </div>
      )}

      {tab === 'NEW' && (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-2xl border shadow-xl space-y-8 animate-fade-in">
          <div className="pb-4 border-b">
              <h2 className="text-2xl font-bold text-slate-800">Formulário de Solicitação</h2>
              <p className="text-slate-500 text-sm">Preencha os dados do evento e anexe os documentos.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={()=>setForm({...form, mod: Modality.I})} className={`p-5 border-2 rounded-xl text-left transition-all ${form.mod===Modality.I?'border-citi-600 bg-blue-50 ring-1 ring-citi-600':'border-slate-100 hover:border-slate-300'}`}>
              <p className="font-bold text-sm text-citi-900">Modalidade I</p>
              <p className="text-[10px] text-slate-500 mt-1">Sem publicação imediata</p>
            </button>
            <button type="button" onClick={()=>setForm({...form, mod: Modality.II})} className={`p-5 border-2 rounded-xl text-left transition-all ${form.mod===Modality.II?'border-citi-600 bg-blue-50 ring-1 ring-citi-600':'border-slate-100 hover:border-slate-300'}`}>
              <p className="font-bold text-sm text-citi-900">Modalidade II</p>
              <p className="text-[10px] text-slate-500 mt-1">Com publicação em revista</p>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600 ml-1">Nome Completo</label><input required className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-citi-500 outline-none" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600 ml-1">Cargo</label><input required className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-citi-500 outline-none" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}/></div>
            <div className="space-y-1 sm:col-span-2"><label className="text-xs font-bold text-slate-600 ml-1">Nome do Evento</label><input required className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-citi-500 outline-none" value={form.event} onChange={e=>setForm({...form, event:e.target.value})}/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600 ml-1">Data do Evento</label><input required type="date" className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-citi-500 outline-none" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-600 ml-1">Valor Inscrição (R$)</label><input required className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-citi-500 outline-none" value={form.val} onChange={e=>setForm({...form, val:e.target.value})}/></div>
          </div>
          
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div>
              <label className="text-xs font-bold block mb-2 text-slate-700 uppercase tracking-wide">Resumo do Trabalho (PDF)</label>
              <input required type="file" accept=".pdf" className="text-xs w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-citi-50 file:text-citi-700 hover:file:bg-citi-100" onChange={e=>setForm({...form, sumFile: e.target.files?.[0] || null})}/>
            </div>
            {form.mod === Modality.II && (
              <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl mt-4">
                <label className="text-xs font-bold block mb-2 text-amber-900 uppercase tracking-wide">Comitê de Ética / Plataforma Brasil</label>
                <input required type="file" accept=".pdf" className="text-xs w-full text-amber-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200" onChange={e=>setForm({...form, ethicsFile: e.target.files?.[0] || null})}/>
              </div>
            )}
          </div>
          <button disabled={loading} className="w-full bg-citi-600 text-white py-4 rounded-xl font-bold hover:bg-citi-700 transition-all disabled:bg-slate-200 shadow-lg shadow-citi-500/20">
            {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin"/> Enviando...</span> : 'Enviar Solicitação'}
          </button>
        </form>
      )}

      {tab === 'ACC' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border shadow-lg space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-slate-800">Prestação de Contas</h2>
              <p className="text-xs text-slate-500">Envie os comprovantes apenas para solicitações já aprovadas.</p>
              
              <div className="space-y-2">
                  <label className="text-xs font-bold">Selecione a Solicitação</label>
                  <select className="w-full p-3 border rounded-xl text-sm" value={accRequest} onChange={e=>setAccRequest(e.target.value)}>
                      <option value="">Selecione...</option>
                      {requests.filter(r => r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING_ACCOUNTABILITY).map(r => (
                          <option key={r.id} value={r.id}>{r.eventName} - {new Date(r.eventDate).toLocaleDateString()}</option>
                      ))}
                  </select>
              </div>

              {accRequest && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold">Anexar Comprovantes (Notas Fiscais, Certificados)</label>
                    <input type="file" multiple className="w-full text-xs" onChange={e => e.target.files && setAccFiles(Array.from(e.target.files))}/>
                    <div className="mt-2 space-y-1">
                        {accFiles.map((f, i) => <div key={i} className="text-[10px] bg-slate-100 p-1 px-2 rounded">{f.name}</div>)}
                    </div>
                  </div>
              )}

              <button disabled={loading || !accRequest} onClick={handleAccountabilitySubmit} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:bg-slate-200">
                  {loading ? 'Enviando...' : 'Enviar Prestação de Contas'}
              </button>
          </div>
      )}

      {tab === 'HIST' && (
        <div className="space-y-4 animate-fade-in">
          {requests.map(r => (
            <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
              <div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    r.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' :
                    r.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-700' :
                    r.status === RequestStatus.COMPLETED ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-500'
                }`}>{r.status}</span>
                <h4 className="font-bold text-slate-800 mt-2 text-sm">{r.eventName}</h4>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(r.eventDate).toLocaleDateString()} • {r.modality}</p>
              </div>
              <div className="text-right">
                 <div className="font-bold text-citi-600">R$ {r.registrationValue}</div>
                 <div className="text-[10px] text-slate-300 mt-1">ID: {r.id.slice(-4)}</div>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p className="text-center py-12 text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">Nenhum pedido encontrado no histórico.</p>}
        </div>
      )}
    </div>
  );
};

const AdminView: React.FC<{ requests: AidRequest[], onUpdate: (id: string, s: RequestStatus, r?: AidRequest) => void }> = ({ requests, onUpdate }) => {
  const [sel, setSel] = useState<AidRequest | null>(null);

  const approve = async (r: AidRequest, comm: 'SCI' | 'ADM') => {
    const up = { ...r };
    if (comm === 'SCI') up.scientificApproved = true; else up.adminApproved = true;
    
    // Se ambos aprovarem, muda status para Aprovado
    if (up.scientificApproved && up.adminApproved) {
      onUpdate(r.id, RequestStatus.APPROVED, up);
      await api.sendEmail(r.employeeInputName, "Auxílio Aprovado - CITI", `Parabéns! Sua solicitação para ${r.eventName} foi aprovada pelos comitês Científico e Administrativo.\n\nPróximo passo: Participe do evento e envie a prestação de contas.`);
    } else {
      await api.saveRequest(up);
    }
    setSel(null);
  };

  const handleStatusChange = async (newStatus: RequestStatus) => {
      if(!sel) return;
      onUpdate(sel.id, newStatus);
      
      let msg = "";
      if(newStatus === RequestStatus.WAITING_REIMBURSEMENT) msg = "Sua prestação de contas foi aprovada. O reembolso entrou na fila de pagamento.";
      if(newStatus === RequestStatus.COMPLETED) msg = "O reembolso foi efetuado e o processo foi finalizado.";
      
      if(msg) await api.sendEmail(sel.employeeInputName, "Atualização do Pedido - CITI", msg);
      setSel(null);
  };

  return (
    <div className="space-y-8">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-l-4 border-l-amber-400 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendentes</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{requests.filter(r=>r.status===RequestStatus.PENDING_APPROVAL).length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-l-4 border-l-blue-400 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prestação Contas</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{requests.filter(r=>r.status===RequestStatus.ACCOUNTABILITY_REVIEW).length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-l-4 border-l-emerald-400 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Finalizados</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{requests.filter(r=>r.status===RequestStatus.COMPLETED).length}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr><th className="p-4 text-slate-500 font-bold uppercase">Colaborador</th><th className="p-4 text-slate-500 font-bold uppercase">Evento</th><th className="p-4 text-slate-500 font-bold uppercase">Status</th><th className="p-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-700">{r.employeeInputName}</td>
                <td className="p-4 text-slate-500">{r.eventName}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded font-bold uppercase text-[9px] tracking-wide ${
                    r.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' :
                    r.status === RequestStatus.PENDING_APPROVAL ? 'bg-amber-100 text-amber-700' : 
                    'bg-slate-100 text-slate-500'
                }`}>{r.status}</span></td>
                <td className="p-4 text-right"><button onClick={()=>setSel(r)} className="p-2 bg-white border rounded-lg text-citi-600 hover:bg-citi-50 hover:border-citi-200 transition-all shadow-sm"><Eye size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes */}
      {sel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-8 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={()=>setSel(null)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors"><XCircle size={24}/></button>
            <h3 className="text-xl font-bold mb-1 text-slate-900">{sel.eventName}</h3>
            <p className="text-xs text-slate-400 mb-6 font-medium uppercase tracking-wide">Detalhes da Solicitação</p>
            
            <div className="grid grid-cols-2 gap-4 text-[11px] bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100">
              <div><p className="text-slate-400 uppercase font-bold mb-1">Solicitante</p><p className="font-bold text-slate-800">{sel.employeeInputName}</p></div>
              <div><p className="text-slate-400 uppercase font-bold mb-1">Valor</p><p className="font-bold text-emerald-600 text-sm">R$ {sel.registrationValue}</p></div>
              <div><p className="text-slate-400 uppercase font-bold mb-1">Modalidade</p><p className="font-bold text-slate-800">{sel.modality}</p></div>
              <div><p className="text-slate-400 uppercase font-bold mb-1">Data</p><p className="font-bold text-slate-800">{new Date(sel.eventDate).toLocaleDateString()}</p></div>
            </div>

            {/* Ações de Aprovação Inicial */}
            {sel.status === RequestStatus.PENDING_APPROVAL && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button onClick={()=>approve(sel, 'SCI')} className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${sel.scientificApproved?'border-green-500 bg-green-50 text-green-700':'border-slate-100 hover:border-slate-300'}`}>
                   {sel.scientificApproved ? <CheckCircle size={20}/> : <Award size={20} className="text-slate-300"/>}
                   <span className="font-bold text-[10px] uppercase">Científico</span>
                </button>
                <button onClick={()=>approve(sel, 'ADM')} className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${sel.adminApproved?'border-green-500 bg-green-50 text-green-700':'border-slate-100 hover:border-slate-300'}`}>
                   {sel.adminApproved ? <CheckCircle size={20}/> : <ShieldCheck size={20} className="text-slate-300"/>}
                   <span className="font-bold text-[10px] uppercase">Administrativo</span>
                </button>
              </div>
            )}

            {/* Ações de Prestação de Contas */}
            {sel.status === RequestStatus.ACCOUNTABILITY_REVIEW && (
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 text-center">
                     <p className="text-xs text-blue-800 mb-3 font-medium">O colaborador enviou os documentos de prestação de contas. Se estiverem corretos, aprove para liberar o reembolso.</p>
                     <button onClick={()=>handleStatusChange(RequestStatus.WAITING_REIMBURSEMENT)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold w-full hover:bg-blue-700">Aprovar Contas e Liberar Pagamento</button>
                 </div>
            )}

             {/* Ações de Finalização */}
             {sel.status === RequestStatus.WAITING_REIMBURSEMENT && (
                 <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6 text-center">
                     <p className="text-xs text-purple-800 mb-3 font-medium">O financeiro deve realizar o pagamento. Após confirmado, finalize o processo.</p>
                     <button onClick={()=>handleStatusChange(RequestStatus.COMPLETED)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold w-full hover:bg-purple-700">Confirmar Pagamento e Finalizar</button>
                 </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Documentos Anexados</p>
              <div className="space-y-2">
                {[...sel.documents, ...(sel.ethicsCommitteeProof ? [sel.ethicsCommitteeProof] : []), ...(sel.accountabilityDocuments || [])].map((d,i)=>(
                    <a key={i} href={d.url} target="_blank" className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                    <div className="flex items-center gap-3">
                        <FileText size={14} className="text-citi-600"/>
                        <span className="font-bold text-xs text-slate-700 truncate max-w-[200px]">{d.name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-citi-600 uppercase bg-white px-2 py-1 rounded border border-slate-200">Abrir</span>
                    </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. APLICAÇÃO PRINCIPAL (ROTEAMENTO E AUTH)
// ==========================================

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [reqs, setReqs] = useState<AidRequest[]>([]);
  const [load, setLoad] = useState(true);

  // Carrega dados iniciais
  useEffect(() => {
    const init = async () => {
        const r = await api.getRequests();
        setReqs(r);
        setLoad(false);
    };
    init();
  }, []);

  // Login Simples
  const handleLogin = async (email: string, pass: string) => {
    const users = await api.getUsers();
    const u = users.find(x => x.email === email && x.password === pass);
    if (u) setUser(u); else alert("Erro: E-mail ou senha incorretos.");
  };

  // Cadastro Simples
  const handleReg = async (name: string, email: string, pass: string) => {
    const u: User = { id: Date.now().toString(), name, email, role: UserRole.EMPLOYEE, password: pass };
    await api.saveUser(u);
    setUser(u);
  };

  if (load) return <div className="h-screen flex items-center justify-center bg-slate-50 flex-col gap-4"><Loader2 className="animate-spin text-citi-600" size={48}/><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando Sistema...</span></div>;

  return (
    <Layout user={user} onLogout={()=>setUser(null)}>
      {!user ? (
        <div className="max-w-md mx-auto mt-20 bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-citi-600 to-citi-500"></div>
          <div className="mb-8 text-center">
             <div className="h-16 w-16 bg-citi-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg mx-auto mb-4">C</div>
             <h2 className="text-2xl font-bold text-slate-900">Portal de Auxílios</h2>
             <p className="text-slate-500 text-sm mt-1">Faça login para gerenciar suas solicitações</p>
          </div>
          
          <form onSubmit={e => { e.preventDefault(); const f=new FormData(e.currentTarget); handleLogin(f.get('e') as string, f.get('p') as string); }} className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 ml-1">E-mail Profissional</label>
                <input required name="e" type="email" className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-citi-500 bg-slate-50 focus:bg-white transition-all"/>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 ml-1">Senha</label>
                <input required name="p" type="password" className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-citi-500 bg-slate-50 focus:bg-white transition-all"/>
            </div>
            <button className="w-full bg-citi-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-citi-500/20 hover:bg-citi-700 transition-all transform hover:scale-[1.02]">Entrar no Sistema</button>
            
            <div className="flex justify-between pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => { 
                const n = prompt("Nome Completo:"); 
                const e = prompt("E-mail:"); 
                const p = prompt("Crie uma Senha:"); 
                if(n && e && p) handleReg(n,e,p);
                }} className="text-xs text-citi-600 font-bold hover:underline">Criar Nova Conta</button>
                
                <button type="button" onClick={() => {
                const p = prompt("Senha Administrativa:");
                if(p==='citiadminciti') setUser({id:'adm', name:'Gestão CITI', email:'adm@citi.com', role:UserRole.ADMIN});
                }} className="text-[10px] text-slate-400 uppercase font-bold hover:text-slate-600">Acesso Gestor</button>
            </div>
          </form>
        </div>
      ) : user.role === UserRole.EMPLOYEE ? (
        <EmployeeView user={user} requests={reqs.filter(r=>r.employeeId===user.id)} onRefresh={() => api.getRequests().then(setReqs)}/>
      ) : (
        <AdminView requests={reqs} onUpdate={async (id, s, r) => {
          if(r) await api.saveRequest(r);
          const current = reqs.find(x => x.id === id);
          if(current) await api.saveRequest({...current, status: s});
          api.getRequests().then(setReqs);
        }}/>
      )}
    </Layout>
  );
}
