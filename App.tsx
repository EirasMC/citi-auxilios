import React, { useState, useEffect } from 'react';
import { MainLayout } from './components/MainLayout';
import { Login } from './components/Login';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { User, UserRole, AidRequest, RequestStatus, SimpleFile } from './types';
import { api } from './services/api';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<AidRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Simple way to trigger re-fetches

  // Load Data on Mount and when Refresh is triggered
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [fetchedRequests, fetchedUsers] = await Promise.all([
          api.getRequests(),
          api.getUsers()
        ]);
        setRequests(fetchedRequests);
        setUsers(fetchedUsers);
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refreshTrigger]);

  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  // --- Auth Handlers ---

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleRegisterUser = (name: string, email: string, pass: string): { success: boolean, message: string } => {
    // Note: In a real async flow, we should check `users` state which is now async loaded
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      if (existingUser.password === '' || existingUser.password === undefined) {
         const updatedUser = { ...existingUser, password: pass, name: name, resetRequested: false };
         api.saveUser(updatedUser).then(refreshData);
         setCurrentUser(updatedUser);
         return { success: true, message: 'Senha redefinida com sucesso!' };
      }
      return { success: false, message: 'Este e-mail já está cadastrado.' };
    }

    const newUser: User = {
      id: `emp-${Date.now()}`,
      name: name,
      email: email,
      role: UserRole.EMPLOYEE,
      password: pass,
      department: 'Geral'
    };

    api.saveUser(newUser).then(refreshData);
    setCurrentUser(newUser);
    return { success: true, message: 'Cadastro realizado com sucesso!' };
  };

  const handleVerifyCredentials = (email: string, pass: string): { success: boolean, user?: User, message: string } => {
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      if (user.role === UserRole.EMPLOYEE && user.resetRequested) {
         return { success: false, message: 'Sua redefinição de senha está pendente de aprovação.' };
      }
      return { success: true, user, message: 'Login realizado com sucesso.' };
    }
    return { success: false, message: 'E-mail ou senha incorretos.' };
  };

  const handlePasswordResetRequest = (email: string): boolean => {
    const user = users.find(u => u.email === email);
    if (user) {
      const updatedUser = { ...user, resetRequested: true };
      api.saveUser(updatedUser).then(refreshData);
      return true;
    }
    return false;
  };

  const handleAdminResetApprove = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      const updatedUser = { ...user, password: '', resetRequested: false };
      api.saveUser(updatedUser).then(() => {
        refreshData();
        alert("Redefinição aprovada. O colaborador deve acessar 'Primeiro Acesso'.");
      });
    }
  };

  // --- Request Handlers ---

  const handleNewRequest = (newReqData: Omit<AidRequest, 'id' | 'status' | 'submissionDate' | 'accountabilityDocuments' | 'employeeName'>) => {
    const newRequest: AidRequest = {
      ...newReqData,
      id: `req-${Date.now()}`,
      status: RequestStatus.PENDING_APPROVAL,
      submissionDate: new Date().toISOString(),
      accountabilityDocuments: [],
      employeeName: currentUser?.name || 'Unknown'
    };
    
    api.saveRequest(newRequest).then(() => {
      refreshData();
      alert("Solicitação enviada com sucesso! Aguarde a análise do administrador.");
    });
  };

  const handleAccountabilitySubmit = (reqId: string, docs: SimpleFile[]) => {
    const req = requests.find(r => r.id === reqId);
    if (req) {
      const updatedReq = {
        ...req,
        status: RequestStatus.ACCOUNTABILITY_REVIEW,
        accountabilityDocuments: docs
      };
      api.saveRequest(updatedReq).then(() => {
        refreshData();
        alert("Prestação de contas enviada com sucesso!");
      });
    }
  };

  const handleAdminStatusUpdate = (id: string, newStatus: RequestStatus) => {
    const req = requests.find(r => r.id === id);
    if (req) {
      const updatedReq = { ...req, status: newStatus };
      api.saveRequest(updatedReq).then(refreshData);
    }
  };

  const handleDeleteRequest = (id: string) => {
    api.deleteRequest(id).then(refreshData);
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-citi-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout user={currentUser} onLogout={handleLogout}>
      {!currentUser ? (
        <Login 
          onLogin={handleLogin} 
          onRegister={handleRegisterUser} 
          onVerify={handleVerifyCredentials}
          onRequestReset={handlePasswordResetRequest}
        />
      ) : (
        <div className="w-full">
          {currentUser.role === UserRole.EMPLOYEE ? (
            <EmployeeDashboard 
              employeeId={currentUser.id}
              requests={requests}
              onRequestSubmit={handleNewRequest}
              onAccountabilitySubmit={handleAccountabilitySubmit}
            />
          ) : (
            <AdminDashboard 
              requests={requests}
              users={users} 
              onUpdateStatus={handleAdminStatusUpdate}
              onDelete={handleDeleteRequest}
              onApproveReset={handleAdminResetApprove}
            />
          )}
        </div>
      )}
    </MainLayout>
  );
};

export default App;