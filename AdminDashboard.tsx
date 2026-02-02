
import React, { useState } from 'react';
import { AidRequest, RequestStatus, User as UserType, Modality } from '../types';
import { api } from '../services/api';
import { Eye, CheckCircle, DollarSign, XCircle, Download } from 'lucide-react';

interface AdminDashboardProps {
  requests: AidRequest[];
  users: UserType[];
  onUpdateStatus: (id: string, status: RequestStatus) => void;
  onDelete: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ requests, onUpdateStatus }) => {
  const [selected, setSelected] = useState<AidRequest | null>(null);

  const handleApproval = async (req: AidRequest, committee: 'SCIENTIFIC' | 'ADMIN') => {
    const updated = { ...req };
    if (committee === 'SCIENTIFIC') updated.scientificApproved = true;
    if (committee === 'ADMIN') updated.adminApproved = true;

    if (updated.scientificApproved && updated.adminApproved) {
      onUpdateStatus(req.id, RequestStatus.APPROVED);
      await api.sendEmailNotification("usuario@citi.com", "Solicitação Aprovada", `Sua solicitação para ${req.eventName} foi aprovada pelos comitês Científico e Administrativo.`);
    } else {
      await api.saveRequest(updated);
    }
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 font-bold">
            <tr><th className="px-6 py-3">Funcionário</th><th className="px-6 py-3">Evento</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Ações</th></tr>
          </thead>
          <tbody className="divide-y">
            {requests.map(req => (
              <tr key={req.id}>
                <td className="px-6 py-4">{req.employeeInputName}</td>
                <td className="px-6 py-4">{req.eventName}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${req.status === RequestStatus.WAITING_REIMBURSEMENT ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => setSelected(req)} className="p-1 bg-blue-50 rounded"><Eye size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{selected.eventName}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded mb-6">
              <div><label className="text-gray-400">Cargo:</label><div className="font-bold">{selected.jobRole}</div></div>
              <div><label className="text-gray-400">Valor Inscrição:</label><div className="font-bold text-green-700">R$ {selected.registrationValue}</div></div>
            </div>

            <div className="space-y-4">
              {selected.status === RequestStatus.PENDING_APPROVAL && (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleApproval(selected, 'SCIENTIFIC')} className={`p-4 border-2 rounded-lg font-bold ${selected.scientificApproved ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200'}`}>
                    {selected.scientificApproved ? 'Comitê Científico OK' : 'Aprovar Científico'}
                  </button>
                  <button onClick={() => handleApproval(selected, 'ADMIN')} className={`p-4 border-2 rounded-lg font-bold ${selected.adminApproved ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200'}`}>
                    {selected.adminApproved ? 'Comitê Administrativo OK' : 'Aprovar Administrativo'}
                  </button>
                </div>
              )}

              {selected.status === RequestStatus.ACCOUNTABILITY_REVIEW && (
                <button onClick={async () => { 
                  onUpdateStatus(selected.id, RequestStatus.WAITING_REIMBURSEMENT); 
                  setSelected(null); 
                  await api.sendEmailNotification("usuario@citi.com", "Prestação de Contas Aprovada", "Sua prestação de contas foi aprovada. O reembolso será feito em até 60 dias.");
                }} className="w-full bg-emerald-600 text-white py-4 rounded-lg font-bold">
                  Aprovar Contas e Iniciar Ciclo de Reembolso
                </button>
              )}

              {selected.status === RequestStatus.WAITING_REIMBURSEMENT && (
                <button onClick={async () => { 
                  onUpdateStatus(selected.id, RequestStatus.COMPLETED); 
                  setSelected(null);
                  await api.sendEmailNotification("usuario@citi.com", "Reembolso Finalizado", "O pagamento do seu reembolso foi realizado. O processo está concluído.");
                }} className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold">
                  Confirmar Pagamento de Reembolso (Finalizar Processo)
                </button>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="mt-6 w-full py-2 text-gray-400">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};
