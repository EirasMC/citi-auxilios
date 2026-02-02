
import React, { useState, useEffect } from 'react';
import { FileText, Upload, History, AlertCircle, CheckCircle, Info, DollarSign, Loader2, Trash2 } from 'lucide-react';
import { AidRequest, Modality, RequestStatus, SimpleFile } from '../types';
import { RULES } from '../constants';
import { api } from '../services/api';

interface EmployeeDashboardProps {
  requests: AidRequest[];
  employeeId: string;
  onRequestSubmit: (req: any) => void;
  onAccountabilitySubmit: (reqId: string, docs: SimpleFile[]) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ requests, employeeId, onRequestSubmit, onAccountabilitySubmit }) => {
  const [view, setView] = useState<'HOME' | 'REQUEST' | 'ACCOUNTABILITY' | 'HISTORY'>('HOME');
  const myRequests = requests.filter(r => r.employeeId === employeeId);

  const RequestForm = () => {
    const [formData, setFormData] = useState({
      employeeInputName: '',
      jobRole: '',
      eventName: '',
      eventLocation: '',
      eventDate: '',
      registrationValue: '',
      modality: Modality.I,
      eventParamsText: '',
      paramsFile: null as SimpleFile | null,
      summaryFile: null as SimpleFile | null,
      ethicsProofFile: null as SimpleFile | null
    });
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (file: File) => {
      setUploading(true);
      try {
        const url = await api.uploadFile(file);
        return { name: file.name, size: (file.size/1024).toFixed(0)+'KB', date: new Date().toISOString(), url };
      } finally { setUploading(false); }
    };

    const isReady = formData.employeeInputName && formData.jobRole && formData.eventName && formData.eventDate && formData.registrationValue && 
                   formData.summaryFile && (formData.eventParamsText || formData.paramsFile) && 
                   (formData.modality === Modality.I || formData.ethicsProofFile);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const docs = [formData.summaryFile!];
      if (formData.paramsFile) docs.push(formData.paramsFile);
      
      const payload = {
        ...formData,
        employeeId,
        submissionDate: new Date().toISOString(),
        documents: docs,
        status: RequestStatus.PENDING_APPROVAL
      };
      
      onRequestSubmit(payload);
      await api.sendEmailNotification(payload.employeeInputName, "Nova Solicitação Enviada", `Sua solicitação para o evento ${payload.eventName} foi recebida.`);
      setView('HISTORY');
    };

    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border space-y-8 max-w-4xl mx-auto">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold">Nova Solicitação</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
             <div className={`p-4 border-2 rounded-lg cursor-pointer ${formData.modality === Modality.I ? 'border-citi-600 bg-blue-50' : ''}`} onClick={() => setFormData({...formData, modality: Modality.I})}>
               <h4 className="font-bold">Modalidade I</h4>
               <p className="text-xs text-gray-500">{RULES.MODALITY_I.description}</p>
             </div>
             <div className={`p-4 border-2 rounded-lg cursor-pointer ${formData.modality === Modality.II ? 'border-citi-600 bg-blue-50' : ''}`} onClick={() => setFormData({...formData, modality: Modality.II})}>
               <h4 className="font-bold">Modalidade II</h4>
               <p className="text-xs text-gray-500">{RULES.MODALITY_II.description}</p>
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input required value={formData.employeeInputName} onChange={e=>setFormData({...formData, employeeInputName:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Nome Completo" />
            <input required value={formData.jobRole} onChange={e=>setFormData({...formData, jobRole:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Cargo na Empresa" />
            <input required value={formData.eventName} onChange={e=>setFormData({...formData, eventName:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Nome do Evento" />
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400 font-bold">Data Evento:</span>
              <input required type="date" value={formData.eventDate} onChange={e=>setFormData({...formData, eventDate:e.target.value})} className="w-full p-3 pl-28 border rounded-lg" />
            </div>
            <input required value={formData.registrationValue} onChange={e=>setFormData({...formData, registrationValue:e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Valor de inscrição (R$)" />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <label className="font-bold block">Formato de submissão de trabalho exigido pelo evento</label>
            <p className="text-xs text-gray-500">Geralmente consta na pagina do evento e especifica a formatação do documento, número máximo de palavras, resumo, objetivo, etc. Você poderá colocar um PDF, o link da página do Congresso onde consta essa informação ou então um Print da página do Congresso com essas instruções.</p>
            <textarea value={formData.eventParamsText} onChange={e=>setFormData({...formData, eventParamsText:e.target.value})} className="w-full p-2 border rounded" placeholder="Link ou descrição..." />
            <input type="file" onChange={async e => { if(e.target.files?.[0]) setFormData({...formData, paramsFile: await handleUpload(e.target.files[0])}) }} />
          </div>

          <div>
            <label className="font-bold block mb-2">Resumo que deseja submeter, cumprindo os parâmetros exigidos pelo evento</label>
            <input required type="file" onChange={async e => { if(e.target.files?.[0]) setFormData({...formData, summaryFile: await handleUpload(e.target.files[0])}) }} />
          </div>

          {formData.modality === Modality.II && (
            <div className="bg-orange-50 p-4 border border-orange-200 rounded-lg">
              <label className="font-bold block mb-2">Comprovante de aprovação na Plataforma Brasil / Comitê de ética em pesquisa</label>
              <input required type="file" onChange={async e => { if(e.target.files?.[0]) setFormData({...formData, ethicsProofFile: await handleUpload(e.target.files[0])}) }} />
            </div>
          )}

          <button disabled={!isReady || uploading} type="submit" className="w-full bg-citi-600 text-white py-4 rounded-lg font-bold hover:bg-citi-700 disabled:bg-gray-300">
            {uploading ? 'Enviando arquivos...' : 'Submeter Solicitação'}
          </button>
        </form>
      </div>
    );
  };

  const Accountability = () => {
    const [selectedId, setSelectedId] = useState("");
    const [accFiles, setAccFiles] = useState<SimpleFile[]>([]);
    const [uploading, setUploading] = useState(false);

    const pending = myRequests.filter(r => r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING_ACCOUNTABILITY);

    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-4xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold">Prestação de Contas</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-bold text-blue-900 mb-2">Itens passíveis de reembolso:</h4>
          <ul className="text-xs text-blue-800 space-y-1 list-disc pl-4">
            {RULES.REIMBURSABLE_ITEMS.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>

        <select className="w-full p-3 border rounded-lg" value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
          <option value="">Selecione a solicitação aprovada...</option>
          {pending.map(r => <option key={r.id} value={r.id}>{r.eventName} ({new Date(r.eventDate).toLocaleDateString()})</option>)}
        </select>

        <div>
          <label className="font-bold block mb-2">Recibos / Notas (Selecione um ou mais arquivos)</label>
          {/* Fix: Explicitly cast Array.from(e.target.files) to File[] and add type for map param to fix unknown property errors */}
          <input type="file" multiple onChange={async e => { 
            if(e.target.files) {
              setUploading(true);
              const filesArray = Array.from(e.target.files) as File[];
              const newFiles = await Promise.all(filesArray.map((f: File) => 
                api.uploadFile(f).then(url => ({
                  name: f.name, 
                  size: (f.size/1024).toFixed(0)+'KB', 
                  date: new Date().toISOString(), 
                  url 
                }))
              ));
              setAccFiles([...accFiles, ...newFiles]);
              setUploading(false);
            }
          }} />
          <div className="mt-4 space-y-2">
            {accFiles.map((f, i) => <div key={i} className="text-sm bg-gray-50 p-2 border rounded flex justify-between">{f.name} <Trash2 className="text-red-500 w-4 h-4 cursor-pointer" onClick={()=>setAccFiles(accFiles.filter((_,idx)=>idx!==i))} /></div>)}
          </div>
        </div>

        <button disabled={!selectedId || accFiles.length === 0 || uploading} onClick={() => { onAccountabilitySubmit(selectedId, accFiles); setView('HISTORY'); }} className="w-full bg-emerald-600 text-white py-4 rounded-lg font-bold">
          {uploading ? 'Carregando...' : 'Enviar Prestação de Contas'}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-4">
        <button onClick={()=>setView('HOME')} className={`px-4 py-2 rounded-full font-medium ${view==='HOME'?'bg-citi-600 text-white':'bg-gray-200'}`}>Início</button>
        <button onClick={()=>setView('REQUEST')} className={`px-4 py-2 rounded-full font-medium ${view==='REQUEST'?'bg-citi-600 text-white':'bg-gray-200'}`}>Solicitar</button>
        <button onClick={()=>setView('ACCOUNTABILITY')} className={`px-4 py-2 rounded-full font-medium ${view==='ACCOUNTABILITY'?'bg-citi-600 text-white':'bg-gray-200'}`}>Prestação</button>
        <button onClick={()=>setView('HISTORY')} className={`px-4 py-2 rounded-full font-medium ${view==='HISTORY'?'bg-citi-600 text-white':'bg-gray-200'}`}>Histórico</button>
      </div>
      {view === 'HOME' && <div className="grid grid-cols-2 gap-6"><div className="bg-white p-6 rounded-xl border"><h3>Avisos Importantes</h3><p className="text-sm text-gray-500">O reembolso será realizado em até 60 dias após a aprovação das contas.</p></div></div>}
      {view === 'REQUEST' && <RequestForm />}
      {view === 'ACCOUNTABILITY' && <Accountability />}
      {view === 'HISTORY' && <div className="space-y-4">{myRequests.map(r => <div key={r.id} className="bg-white p-4 rounded border flex justify-between"><div><span className="text-xs font-bold uppercase">{r.status}</span><h4>{r.eventName}</h4></div><div className="text-right font-bold text-citi-600">R$ {r.registrationValue}</div></div>)}</div>}
    </div>
  );
};
