import React, { useState, useEffect } from 'react';
import { FileText, Upload, History, AlertCircle, CheckCircle, Plus, ChevronRight, Download, Link as LinkIcon, Image as ImageIcon, Award, DollarSign, Trash2, Loader2 } from 'lucide-react';
import { AidRequest, Modality, RequestStatus, SimpleFile } from '../types';
import { RULES } from '../constants';
import { api } from '../services/api';

interface EmployeeDashboardProps {
  requests: AidRequest[];
  employeeId: string;
  onRequestSubmit: (req: Omit<AidRequest, 'id' | 'status' | 'submissionDate' | 'accountabilityDocuments' | 'employeeName'>) => void;
  onAccountabilitySubmit: (reqId: string, docs: SimpleFile[]) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ 
  requests, 
  employeeId,
  onRequestSubmit,
  onAccountabilitySubmit
}) => {
  const [view, setView] = useState<'HOME' | 'REQUEST' | 'ACCOUNTABILITY' | 'HISTORY'>('HOME');
  
  // Filter requests for current employee
  const myRequests = requests.filter(r => r.employeeId === employeeId);
  
  // Logic: Can only request one of each modality per year if approved
  const currentYear = new Date().getFullYear();
  
  const hasApprovedModalityI = myRequests.some(r => 
    r.modality === Modality.I && 
    new Date(r.submissionDate).getFullYear() === currentYear &&
    (r.status === RequestStatus.APPROVED || r.status === RequestStatus.COMPLETED || r.status === RequestStatus.ACCOUNTABILITY_REVIEW || r.status === RequestStatus.PENDING_ACCOUNTABILITY)
  );

  const hasApprovedModalityII = myRequests.some(r => 
    r.modality === Modality.II && 
    new Date(r.submissionDate).getFullYear() === currentYear &&
    (r.status === RequestStatus.APPROVED || r.status === RequestStatus.COMPLETED || r.status === RequestStatus.ACCOUNTABILITY_REVIEW || r.status === RequestStatus.PENDING_ACCOUNTABILITY)
  );

  // Helper to handle upload
  const handleFileUpload = async (file: File): Promise<SimpleFile> => {
    // 1. Upload to Supabase Bucket
    const url = await api.uploadFile(file);
    
    // 2. Return the file object with the URL
    return {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      date: new Date().toISOString(),
      url: url
    };
  };

  // Sub-components for cleaner file
  const Home = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <button 
        onClick={() => setView('REQUEST')}
        className="group bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:border-citi-600 hover:shadow-lg transition-all duration-300 text-left flex flex-col justify-between h-64"
      >
        <div className="p-4 bg-blue-50 rounded-full w-fit group-hover:bg-citi-600 transition-colors">
          <FileText className="w-8 h-8 text-citi-600 group-hover:text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Solicitar Auxílio</h3>
          <p className="text-gray-500 text-sm">Inicie um novo processo para participação em eventos científicos.</p>
        </div>
      </button>

      <button 
        onClick={() => setView('ACCOUNTABILITY')}
        className="group bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 text-left flex flex-col justify-between h-64"
      >
        <div className="p-4 bg-emerald-50 rounded-full w-fit group-hover:bg-emerald-500 transition-colors">
          <Upload className="w-8 h-8 text-emerald-600 group-hover:text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Prestação de Contas</h3>
          <p className="text-gray-500 text-sm">Envie comprovantes e recibos para auxílios já aprovados.</p>
        </div>
      </button>

      <button 
        onClick={() => setView('HISTORY')}
        className="group bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all duration-300 text-left flex flex-col justify-between h-64"
      >
        <div className="p-4 bg-purple-50 rounded-full w-fit group-hover:bg-purple-500 transition-colors">
          <History className="w-8 h-8 text-purple-600 group-hover:text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Histórico</h3>
          <p className="text-gray-500 text-sm">Acompanhe o andamento das suas solicitações.</p>
        </div>
      </button>
    </div>
  );

  const RequestForm = () => {
    const [formData, setFormData] = useState({
      employeeInputName: '',
      eventName: '',
      eventLocation: '',
      eventDate: '',
      modality: Modality.I,
      eventParamsType: 'TEXT' as 'TEXT' | 'FILE', // Toggle for params
      eventParamsText: '',
      summaryFile: null as SimpleFile | null,
      paramsFile: null as SimpleFile | null
    });

    const [dateError, setDateError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Validate date whenever it changes
    useEffect(() => {
      if (formData.eventDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const eventDate = new Date(formData.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 15) {
          setDateError("A solicitação deve ser feita com no mínimo 15 dias de antecedência do evento.");
        } else {
          setDateError(null);
        }
      } else {
        setDateError(null);
      }
    }, [formData.eventDate]);

    const isBlocked = (formData.modality === Modality.I && hasApprovedModalityI) || 
                      (formData.modality === Modality.II && hasApprovedModalityII);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (dateError) {
        alert("Não é possível enviar a solicitação devido ao prazo.");
        return;
      }

      const finalDocuments: SimpleFile[] = [];
      if (formData.summaryFile) finalDocuments.push(formData.summaryFile);
      if (formData.paramsFile) finalDocuments.push(formData.paramsFile);

      onRequestSubmit({
        employeeId,
        employeeInputName: formData.employeeInputName,
        eventName: formData.eventName,
        eventLocation: formData.eventLocation,
        eventDate: formData.eventDate,
        modality: formData.modality,
        eventParamsText: formData.eventParamsType === 'TEXT' ? formData.eventParamsText : undefined,
        documents: finalDocuments
      });
      setView('HISTORY');
    };

    const handleSummaryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setUploading(true);
        try {
          const uploadedFile = await handleFileUpload(e.target.files[0]);
          // Override name to be semantic
          uploadedFile.name = "Resumo: " + e.target.files[0].name;
          setFormData({ ...formData, summaryFile: uploadedFile });
        } catch (err) {
          alert("Erro ao enviar arquivo: " + err);
        } finally {
          setUploading(false);
        }
      }
    };

    const handleParamsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setUploading(true);
        try {
          const uploadedFile = await handleFileUpload(e.target.files[0]);
          uploadedFile.name = "Params: " + e.target.files[0].name;
          setFormData({ ...formData, paramsFile: uploadedFile });
        } catch (err) {
          alert("Erro ao enviar arquivo: " + err);
        } finally {
          setUploading(false);
        }
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-citi-900">Nova Solicitação de Auxílio</h2>
          <button onClick={() => setView('HOME')} className="text-gray-500 hover:text-citi-600">Voltar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Modality Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, modality: Modality.I})}
                    className={`p-4 border rounded-lg text-left transition-all ${formData.modality === Modality.I ? 'border-citi-600 bg-blue-50 ring-1 ring-citi-600' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-bold text-citi-900">{Modality.I}</div>
                    <div className="text-xs text-gray-500 mt-1">Sem publicação em revista</div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, modality: Modality.II})}
                    className={`p-4 border rounded-lg text-left transition-all ${formData.modality === Modality.II ? 'border-citi-600 bg-blue-50 ring-1 ring-citi-600' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-bold text-citi-900">{Modality.II}</div>
                    <div className="text-xs text-gray-500 mt-1">Com publicação em revista</div>
                  </button>
                </div>
              </div>

              {isBlocked && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-center">
                    <AlertCircle className="text-red-500 mr-2" />
                    <p className="text-red-700 font-medium">Limite Anual Atingido</p>
                  </div>
                  <p className="text-red-600 text-sm mt-1">
                    Você já possui um auxílio aprovado nesta modalidade para este ano. 
                    Novas solicitações permitidas apenas no próximo ano.
                  </p>
                </div>
              )}

              {/* Personal Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo do Colaborador</label>
                <input 
                  required 
                  disabled={isBlocked}
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citi-500 focus:border-citi-500 disabled:bg-gray-100 bg-white text-gray-900"
                  placeholder="Digite seu nome completo"
                  value={formData.employeeInputName}
                  onChange={(e) => setFormData({...formData, employeeInputName: e.target.value})}
                />
              </div>

              {/* Event Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Evento</label>
                  <input 
                    required 
                    disabled={isBlocked}
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citi-500 focus:border-citi-500 disabled:bg-gray-100 bg-white text-gray-900"
                    placeholder="Ex: Congresso Brasileiro de..."
                    value={formData.eventName}
                    onChange={(e) => setFormData({...formData, eventName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local do Evento</label>
                  <input 
                    required 
                    disabled={isBlocked}
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citi-500 focus:border-citi-500 disabled:bg-gray-100 bg-white text-gray-900"
                    placeholder="Cidade, Estado"
                    value={formData.eventLocation}
                    onChange={(e) => setFormData({...formData, eventLocation: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início do Evento</label>
                  <input 
                    required 
                    disabled={isBlocked}
                    type="date" 
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-citi-500 focus:border-citi-500 disabled:bg-gray-100 bg-white text-gray-900 ${dateError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    value={formData.eventDate}
                    onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                  />
                  {dateError && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{dateError}</p>
                  )}
                </div>
              </div>

              {/* Summary Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resumo do Trabalho (PDF)</label>
                <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${formData.summaryFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                  <input 
                    required={!formData.summaryFile}
                    accept=".pdf"
                    type="file" 
                    id="summary-upload" 
                    className="hidden" 
                    onChange={handleSummaryFileChange}
                    disabled={isBlocked || uploading}
                  />
                  <label htmlFor="summary-upload" className={`cursor-pointer flex flex-col items-center justify-center ${isBlocked || uploading ? 'cursor-not-allowed opacity-50' : ''}`}>
                    {uploading ? (
                      <div className="flex flex-col items-center text-citi-600">
                        <Loader2 className="animate-spin w-8 h-8 mb-1" />
                        <span className="text-xs">Enviando...</span>
                      </div>
                    ) : formData.summaryFile ? (
                      <div className="flex items-center text-green-700">
                         <CheckCircle className="mr-2 w-5 h-5"/>
                         <span className="text-sm font-medium">{formData.summaryFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mb-1" />
                        <span className="text-sm text-gray-600">Clique para enviar o resumo (PDF)</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Event Parameters */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Parâmetros Exigidos pelo Evento</label>
                 <p className="text-xs text-gray-500 mb-3">Forneça as regras, cronograma ou carta de aceite onde constam as exigências.</p>
                 
                 <div className="flex gap-4 mb-3">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, eventParamsType: 'TEXT'})}
                      className={`flex-1 py-1.5 text-sm rounded border ${formData.eventParamsType === 'TEXT' ? 'bg-white border-citi-500 text-citi-700 shadow-sm' : 'bg-transparent border-transparent text-gray-500'}`}
                    >
                      <LinkIcon className="inline w-3 h-3 mr-1"/> Link / Texto
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, eventParamsType: 'FILE'})}
                      className={`flex-1 py-1.5 text-sm rounded border ${formData.eventParamsType === 'FILE' ? 'bg-white border-citi-500 text-citi-700 shadow-sm' : 'bg-transparent border-transparent text-gray-500'}`}
                    >
                      <ImageIcon className="inline w-3 h-3 mr-1"/> Upload (Print/Arquivo)
                    </button>
                 </div>

                 {formData.eventParamsType === 'TEXT' ? (
                   <input 
                    type="text"
                    required
                    disabled={isBlocked}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                    placeholder="Cole o link ou descreva as regras aqui..."
                    value={formData.eventParamsText}
                    onChange={(e) => setFormData({...formData, eventParamsText: e.target.value})}
                   />
                 ) : (
                   <div className="border border-gray-300 bg-white rounded-lg p-2">
                      <input 
                        type="file"
                        required={!formData.paramsFile}
                        disabled={isBlocked || uploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-citi-50 file:text-citi-700 hover:file:bg-citi-100"
                        onChange={handleParamsFileChange}
                      />
                      {uploading ? (
                         <span className="text-xs text-citi-600 pl-2">Enviando...</span>
                      ) : formData.paramsFile && <div className="text-xs text-green-600 mt-1 pl-2">{formData.paramsFile.name} selecionado</div>}
                   </div>
                 )}
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isBlocked || !!dateError || !formData.employeeInputName || !formData.summaryFile || uploading}
                  className="w-full bg-citi-600 text-white py-3 rounded-lg font-bold hover:bg-citi-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
                >
                  {uploading ? "Aguarde o envio dos arquivos..." : "Enviar Solicitação"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl h-fit">
            <h3 className="text-citi-900 font-bold mb-4 flex items-center">
              <AlertCircle size={20} className="mr-2 text-citi-600" />
              Regras Importantes
            </h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <strong className="block text-citi-800">Sobre a {formData.modality}:</strong>
                <p>{formData.modality === Modality.I ? RULES.MODALITY_I.description : RULES.MODALITY_II.description}</p>
              </div>
              <div>
                <strong className="block text-citi-800">Prazo de Envio:</strong>
                <p className="mb-1">{formData.modality === Modality.I ? RULES.MODALITY_I.deadline : RULES.MODALITY_II.deadline}</p>
                <div className="text-xs bg-white p-2 rounded border border-blue-100 text-blue-800">
                   O sistema valida automaticamente a data do evento para garantir os 15 dias de antecedência.
                </div>
              </div>
              <div>
                <strong className="block text-citi-800">Documentos Exigidos:</strong>
                <ul className="list-disc pl-4 space-y-1 mt-1">
                  <li>Informações completas do evento</li>
                  <li>Resumo do trabalho (PDF)</li>
                  <li>Parâmetros/Regras do evento</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AccountabilityView = () => {
    const pendingAccountability = myRequests.filter(r => r.status === RequestStatus.APPROVED || r.status === RequestStatus.PENDING_ACCOUNTABILITY);
    const [selectedId, setSelectedId] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    
    // Separate states for required documents
    const [accFiles, setAccFiles] = useState<{
      participation: SimpleFile | null;
      presentation: SimpleFile | null;
      photo: SimpleFile | null;
      receipts: SimpleFile[];
    }>({
      participation: null,
      presentation: null,
      photo: null,
      receipts: []
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(selectedId) {
        const allFiles: SimpleFile[] = [];
        if (accFiles.participation) allFiles.push(accFiles.participation);
        if (accFiles.presentation) allFiles.push(accFiles.presentation);
        if (accFiles.photo) allFiles.push(accFiles.photo);
        allFiles.push(...accFiles.receipts);

        onAccountabilitySubmit(selectedId, allFiles);
        setView('HISTORY');
      }
    };

    const handleSingleFileChange = async (field: 'participation' | 'presentation' | 'photo', e: React.ChangeEvent<HTMLInputElement>, prefix: string) => {
      if (e.target.files && e.target.files.length > 0) {
        setUploading(true);
        try {
          const uploadedFile = await handleFileUpload(e.target.files[0]);
          // Override name
          uploadedFile.name = `${prefix}: ` + e.target.files![0].name;
          
          setAccFiles(prev => ({
            ...prev,
            [field]: uploadedFile
          }));
        } catch (err) {
          alert("Erro no upload: " + err);
        } finally {
          setUploading(false);
        }
      }
    };

    const handleReceiptsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
       if (e.target.files && e.target.files.length > 0) {
         setUploading(true);
         try {
           const newFiles = await Promise.all(Array.from(e.target.files).map(async (f) => {
             const uploaded = await handleFileUpload(f);
             uploaded.name = "Recibo: " + f.name;
             return uploaded;
           }));

           setAccFiles(prev => ({
             ...prev,
             receipts: [...prev.receipts, ...newFiles]
           }));
         } catch(err) {
            alert("Erro no upload dos recibos: " + err);
         } finally {
            setUploading(false);
         }
       }
    };

    const removeReceipt = (index: number) => {
      setAccFiles(prev => ({
        ...prev,
        receipts: prev.receipts.filter((_, i) => i !== index)
      }));
    };

    // Check if mandatory files are present
    const isFormValid = selectedId && accFiles.participation && accFiles.presentation && accFiles.photo && accFiles.receipts.length > 0;

    if (pendingAccountability.length === 0) {
      return (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border">
          <CheckCircle className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Nenhuma pendência</h3>
          <p className="text-gray-500 mt-2">Você não possui auxílios aguardando prestação de contas.</p>
          <button onClick={() => setView('HOME')} className="mt-6 text-citi-600 font-medium hover:underline">Voltar ao início</button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
         <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-citi-900">Prestação de Contas</h2>
          <button onClick={() => setView('HOME')} className="text-gray-500 hover:text-citi-600">Voltar</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header & Rules Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-emerald-800">
             <div className="flex items-start">
               <AlertCircle className="w-6 h-6 mr-3 text-emerald-600 flex-shrink-0 mt-0.5" />
               <div>
                 <h4 className="font-bold text-lg mb-2">Documentos Obrigatórios</h4>
                 <p className="text-sm mb-4">Para aprovação das contas, é necessário anexar todos os comprovantes listados abaixo. O prazo máximo para envio é de 30 dias após o término do evento.</p>
                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                   {RULES.ACCOUNTABILITY.documents.map((d, i) => (
                     <li key={i} className="flex items-center">
                       <CheckCircle size={14} className="mr-2 text-emerald-600" />
                       {d}
                     </li>
                   ))}
                 </ul>
               </div>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o Auxílio</label>
            <select 
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-citi-500 bg-white text-gray-900"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {pendingAccountability.map(r => (
                <option key={r.id} value={r.id}>{r.eventName} - {r.modality} ({new Date(r.eventDate).toLocaleDateString()})</option>
              ))}
            </select>
          </div>

          {/* Upload Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Certificate of Participation */}
            <div className="border rounded-xl p-4 hover:border-citi-400 transition-colors bg-gray-50">
              <div className="flex items-center mb-3">
                 <div className="p-2 bg-blue-100 rounded-lg mr-3 text-blue-600">
                   <Award size={20} />
                 </div>
                 <label className="font-bold text-gray-800 text-sm">Certificado de Participação</label>
              </div>
              <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4 text-center">
                 <input 
                   type="file" 
                   id="upload-participation" 
                   className="hidden" 
                   disabled={uploading}
                   onChange={(e) => handleSingleFileChange('participation', e, 'Cert. Part')}
                 />
                 <label htmlFor="upload-participation" className="cursor-pointer flex flex-col items-center">
                    {uploading ? <Loader2 className="animate-spin text-citi-600" /> : accFiles.participation ? (
                      <div className="text-green-600 flex items-center text-sm font-medium">
                        <CheckCircle size={16} className="mr-2" />
                        {accFiles.participation.name.split(': ')[1]}
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Clique para anexar (PDF/Img)</span>
                      </>
                    )}
                 </label>
              </div>
            </div>

            {/* 2. Presentation Certificate */}
            <div className="border rounded-xl p-4 hover:border-citi-400 transition-colors bg-gray-50">
              <div className="flex items-center mb-3">
                 <div className="p-2 bg-purple-100 rounded-lg mr-3 text-purple-600">
                   <FileText size={20} />
                 </div>
                 <label className="font-bold text-gray-800 text-sm">Certificado de Apresentação</label>
              </div>
              <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4 text-center">
                 <input 
                   type="file" 
                   id="upload-presentation" 
                   className="hidden" 
                   disabled={uploading}
                   onChange={(e) => handleSingleFileChange('presentation', e, 'Cert. Apres')}
                 />
                 <label htmlFor="upload-presentation" className="cursor-pointer flex flex-col items-center">
                    {uploading ? <Loader2 className="animate-spin text-citi-600" /> : accFiles.presentation ? (
                      <div className="text-green-600 flex items-center text-sm font-medium">
                        <CheckCircle size={16} className="mr-2" />
                        {accFiles.presentation.name.split(': ')[1]}
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Clique para anexar (PDF/Img)</span>
                      </>
                    )}
                 </label>
              </div>
            </div>

            {/* 3. Event Photo */}
            <div className="border rounded-xl p-4 hover:border-citi-400 transition-colors bg-gray-50">
              <div className="flex items-center mb-3">
                 <div className="p-2 bg-orange-100 rounded-lg mr-3 text-orange-600">
                   <ImageIcon size={20} />
                 </div>
                 <label className="font-bold text-gray-800 text-sm">Foto no Evento</label>
              </div>
              <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4 text-center">
                 <input 
                   type="file" 
                   id="upload-photo" 
                   accept="image/*"
                   className="hidden" 
                   disabled={uploading}
                   onChange={(e) => handleSingleFileChange('photo', e, 'Foto')}
                 />
                 <label htmlFor="upload-photo" className="cursor-pointer flex flex-col items-center">
                    {uploading ? <Loader2 className="animate-spin text-citi-600" /> : accFiles.photo ? (
                      <div className="text-green-600 flex items-center text-sm font-medium">
                        <CheckCircle size={16} className="mr-2" />
                        {accFiles.photo.name.split(': ')[1]}
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Clique para anexar (JPG/PNG)</span>
                      </>
                    )}
                 </label>
              </div>
            </div>

            {/* 4. Receipts (Multiple) */}
            <div className="border rounded-xl p-4 hover:border-citi-400 transition-colors bg-gray-50">
              <div className="flex items-center mb-3">
                 <div className="p-2 bg-green-100 rounded-lg mr-3 text-green-600">
                   <DollarSign size={20} />
                 </div>
                 <label className="font-bold text-gray-800 text-sm">Notas Fiscais e Recibos</label>
              </div>
              <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4 text-center min-h-[80px]">
                 <input 
                   type="file" 
                   id="upload-receipts" 
                   multiple
                   className="hidden" 
                   disabled={uploading}
                   onChange={handleReceiptsChange}
                 />
                 <label htmlFor="upload-receipts" className="cursor-pointer flex flex-col items-center mb-2">
                    <div className="flex items-center text-citi-600 hover:text-citi-800">
                       {uploading ? <Loader2 className="animate-spin mr-1" /> : <Plus size={16} className="mr-1" />}
                       <span className="text-xs font-bold">{uploading ? "Enviando..." : "Adicionar Arquivos"}</span>
                    </div>
                 </label>
                 
                 {accFiles.receipts.length > 0 && (
                   <div className="text-left mt-2 space-y-1">
                      {accFiles.receipts.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 p-1.5 rounded border">
                           <span className="truncate max-w-[150px]">{file.name.replace('Recibo: ', '')}</span>
                           <button type="button" onClick={() => removeReceipt(idx)} className="text-red-400 hover:text-red-600">
                             <Trash2 size={12} />
                           </button>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={!isFormValid || uploading}
            className="w-full bg-emerald-600 text-white py-4 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md text-lg mt-6"
          >
            {uploading ? "Enviando arquivos..." : "Enviar Prestação de Contas"}
          </button>
        </form>
      </div>
    );
  };

  const HistoryView = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-citi-900">Meu Histórico</h2>
          <button onClick={() => setView('HOME')} className="text-sm text-citi-600 hover:underline">Voltar</button>
        </div>

        {myRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">Nenhuma solicitação encontrada.</p>
          </div>
        ) : (
          <div className="grid gap-4">
             {myRequests.map(req => (
               <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow">
                 <div>
                   <div className="flex items-center gap-2 mb-2">
                     <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                       req.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-800' :
                       req.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-800' :
                       req.status === RequestStatus.COMPLETED ? 'bg-citi-100 text-citi-800' :
                       'bg-yellow-100 text-yellow-800'
                     }`}>
                       {req.status}
                     </span>
                     <span className="text-xs text-gray-400">Solicitado em: {new Date(req.submissionDate).toLocaleDateString()}</span>
                   </div>
                   <h3 className="font-bold text-lg text-gray-900">{req.eventName}</h3>
                   <p className="text-sm text-gray-600">{req.modality} - {new Date(req.eventDate).toLocaleDateString()}</p>
                 </div>
                 
                 <div className="mt-4 md:mt-0 flex gap-2">
                    {req.documents.length > 0 && (
                      <button className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded text-gray-700 cursor-default">
                        <CheckCircle size={14} className="mr-1 text-green-600"/> Arquivos Enviados
                      </button>
                    )}
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {view === 'HOME' && <Home />}
      {view === 'REQUEST' && <RequestForm />}
      {view === 'ACCOUNTABILITY' && <AccountabilityView />}
      {view === 'HISTORY' && <HistoryView />}
    </div>
  );
};