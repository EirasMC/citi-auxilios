import React, { useState } from 'react';
import { Download, CheckCircle, XCircle, Trash2, Eye, FileText, AlertTriangle, MapPin, Link as LinkIcon, Lock } from 'lucide-react';
import { AidRequest, RequestStatus, User, UserRole } from '../types';

interface AdminDashboardProps {
  requests: AidRequest[];
  users: User[];
  onUpdateStatus: (id: string, status: RequestStatus, reason?: string) => void;
  onDelete: (id: string) => void;
  onApproveReset: (userId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ requests, users, onUpdateStatus, onDelete, onApproveReset }) => {
  const [selectedRequest, setSelectedRequest] = useState<AidRequest | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Stats
  const pendingCount = requests.filter(r => r.status === RequestStatus.PENDING_APPROVAL).length;
  const accReviewCount = requests.filter(r => r.status === RequestStatus.ACCOUNTABILITY_REVIEW).length;
  
  // Reset Requests
  const resetRequests = users.filter(u => u.resetRequested && u.role === UserRole.EMPLOYEE);

  const handleDownload = (fileName: string) => {
    // Simulation of download
    alert(`Iniciando download simulado de: ${fileName}`);
  };

  const StatusBadge = ({ status }: { status: RequestStatus }) => {
    let color = 'bg-gray-100 text-gray-800';
    if (status === RequestStatus.APPROVED) color = 'bg-green-100 text-green-800';
    if (status === RequestStatus.REJECTED) color = 'bg-red-100 text-red-800';
    if (status === RequestStatus.PENDING_APPROVAL) color = 'bg-yellow-100 text-yellow-800';
    if (status === RequestStatus.COMPLETED) color = 'bg-blue-100 text-blue-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-yellow-400">
          <div className="text-gray-500 text-sm font-medium">Pendentes Aprovação</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{pendingCount}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-400">
          <div className="text-gray-500 text-sm font-medium">Análise de Prest. Contas</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{accReviewCount}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-400">
          <div className="text-gray-500 text-sm font-medium">Total de Processos</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{requests.length}</div>
        </div>
      </div>

      {/* Password Reset Requests Section */}
      {resetRequests.length > 0 && (
         <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-orange-200 flex items-center bg-orange-100">
             <AlertTriangle className="text-orange-600 mr-2" />
             <h2 className="text-lg font-bold text-orange-900">Solicitações de Redefinição de Senha</h2>
           </div>
           <div className="p-4">
             <p className="text-sm text-gray-700 mb-4">Os usuários abaixo perderam o acesso e solicitaram uma nova senha. Ao aprovar, a senha atual será removida e eles poderão cadastrar uma nova através do "Primeiro Acesso" usando o mesmo e-mail.</p>
             <div className="grid gap-3">
               {resetRequests.map(user => (
                 <div key={user.id} className="flex justify-between items-center bg-white p-4 rounded border border-orange-200">
                    <div>
                      <span className="font-bold text-gray-900 block">{user.name}</span>
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </div>
                    <button 
                      onClick={() => onApproveReset(user.id)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors flex items-center"
                    >
                      <Lock className="w-4 h-4 mr-2" /> Aprovar Reset
                    </button>
                 </div>
               ))}
             </div>
           </div>
         </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-citi-900">Gestão de Solicitações</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Funcionário</th>
                <th className="px-6 py-3">Evento</th>
                <th className="px-6 py-3">Data Evento</th>
                <th className="px-6 py-3">Modalidade</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div>{req.employeeInputName}</div>
                    <div className="text-xs text-gray-400">{req.employeeName}</div>
                  </td>
                  <td className="px-6 py-4">{req.eventName}</td>
                  <td className="px-6 py-4">{new Date(req.eventDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{req.modality}</td>
                  <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="text-citi-600 hover:text-citi-800 p-1 bg-blue-50 rounded hover:bg-blue-100" title="Ver Detalhes"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(req.id)}
                      className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded hover:bg-red-100" title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Nenhum registro encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
             <div className="flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full mb-4">
                  <AlertTriangle className="text-red-600 w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Solicitação?</h3>
                <p className="text-gray-600 mb-6 text-sm">Esta ação não pode ser desfeita. Todos os dados e arquivos anexados serão perdidos.</p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => { onDelete(deleteConfirmId); setDeleteConfirmId(null); }}
                    className="flex-1 py-2 bg-red-600 rounded-lg text-white hover:bg-red-700 font-medium"
                  >
                    Excluir
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-citi-900">Detalhes do Processo</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Solicitante</label>
                  <div className="font-medium text-gray-900">{selectedRequest.employeeInputName}</div>
                  <div className="text-xs text-gray-400">ID: {selectedRequest.employeeName}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Data Submissão</label>
                  <div className="font-medium text-gray-900">{new Date(selectedRequest.submissionDate).toLocaleDateString()}</div>
                </div>
                <div>
                   <label className="text-xs text-gray-500 uppercase">Evento</label>
                   <div className="font-medium text-gray-900">{selectedRequest.eventName}</div>
                   <div className="text-sm text-gray-500 flex items-center mt-1">
                      <MapPin size={12} className="mr-1"/> {selectedRequest.eventLocation}
                   </div>
                </div>
                <div>
                   <label className="text-xs text-gray-500 uppercase">Modalidade</label>
                   <div className="font-medium text-citi-600">{selectedRequest.modality}</div>
                </div>
              </div>

              {/* Event Parameters Display */}
              {selectedRequest.eventParamsText && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                    <LinkIcon size={18} className="mr-2" /> 
                    Parâmetros do Evento
                  </h4>
                  <div className="bg-gray-50 p-3 rounded border border-gray-100 text-sm text-blue-600 break-words">
                    <a href={selectedRequest.eventParamsText} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {selectedRequest.eventParamsText}
                    </a>
                  </div>
                </div>
              )}

              {/* Request Documents */}
              <div>
                <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                  <FileText size={18} className="mr-2" />
                  Documentos da Solicitação
                </h4>
                {selectedRequest.documents.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedRequest.documents.map((doc, i) => (
                      <li key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded text-sm border border-gray-100">
                        <span className="text-gray-700 truncate mr-2">{doc.name}</span>
                        <button 
                          onClick={() => handleDownload(doc.name)}
                          className="text-citi-600 hover:text-citi-800 font-medium text-xs flex items-center whitespace-nowrap"
                        >
                          <Download size={14} className="mr-1" /> Baixar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-400 italic">Nenhum documento anexado.</p>}
              </div>

              {/* Accountability Documents */}
              {selectedRequest.accountabilityDocuments.length > 0 && (
                 <div>
                 <h4 className="font-bold text-gray-900 mb-2 flex items-center text-emerald-700">
                   <CheckCircle size={18} className="mr-2" />
                   Documentos da Prestação de Contas
                 </h4>
                 <ul className="space-y-2">
                   {selectedRequest.accountabilityDocuments.map((doc, i) => (
                     <li key={i} className="flex justify-between items-center bg-emerald-50 p-3 rounded text-sm border border-emerald-100">
                       <span className="text-gray-700 truncate mr-2">{doc.name}</span>
                       <button 
                         onClick={() => handleDownload(doc.name)}
                         className="text-emerald-600 hover:text-emerald-800 font-medium text-xs flex items-center whitespace-nowrap"
                       >
                         <Download size={14} className="mr-1" /> Baixar
                       </button>
                     </li>
                   ))}
                 </ul>
               </div>
              )}

              {/* Actions Area */}
              <div className="border-t pt-6 mt-6">
                <h4 className="font-bold text-gray-900 mb-4">Ações do Gestor</h4>
                <div className="flex gap-4">
                  {selectedRequest.status === RequestStatus.PENDING_APPROVAL && (
                    <>
                      <button 
                        onClick={() => {
                          onUpdateStatus(selectedRequest.id, RequestStatus.APPROVED);
                          setSelectedRequest(null);
                        }}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700"
                      >
                        Aprovar Solicitação
                      </button>
                      <button 
                        onClick={() => {
                          onUpdateStatus(selectedRequest.id, RequestStatus.REJECTED);
                          setSelectedRequest(null);
                        }}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700"
                      >
                        Recusar
                      </button>
                    </>
                  )}

                  {(selectedRequest.status === RequestStatus.ACCOUNTABILITY_REVIEW || selectedRequest.status === RequestStatus.PENDING_ACCOUNTABILITY) && (
                     <button 
                      onClick={() => {
                        onUpdateStatus(selectedRequest.id, RequestStatus.COMPLETED);
                        setSelectedRequest(null);
                      }}
                      className="flex-1 bg-citi-600 text-white py-2 rounded-lg font-bold hover:bg-citi-700"
                    >
                      Finalizar Processo (Aprovar Contas)
                    </button>
                  )}
                  
                  {selectedRequest.status === RequestStatus.COMPLETED && (
                    <div className="w-full text-center p-3 bg-gray-100 rounded text-gray-500 font-medium">
                      Processo Finalizado
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};