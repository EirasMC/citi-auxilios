import React, { useState, useEffect } from 'react';
import { LogOut, User as UserIcon, Database, HardDrive, Loader2 } from 'lucide-react';
import { Login } from './components/Login';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { User, UserRole, AidRequest, RequestStatus, SimpleFile } from './types';
import { api } from './services/api';
import { APP_NAME, PROGRAM_NAME } from './constants';
import { isSupabaseConnected } from './lib/supabase';

// --- MAIN LAYOUT COMPONENT ---
// (Inlined here to prevent 'File Not Found' errors on Netlify builds)

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
            {/* CITI Logo */}
            <img 
              src="/citi-logo.png" 
              alt="CITI Medicina Reprodutiva" 
              className="h-12 w-auto object-contain"
              onError={(e) => {
                // Fallback if image is missing
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* Fallback Text Logo */}
            <div className="hidden flex items-center gap-4">
               <div className="h-10 w-10 bg-citi-900 rounded-full flex items-center justify-center text-white font-bold text-xl">
                C
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-wide text-citi-900">{APP_NAME}</span>
                <span className="text-xs text-citi-600 uppercase tracking-wider">{PROGRAM_NAME}</span>
              </div>
            </div>
            
            {/* Vertical Divider */}
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
              <button
                onClick={onLogout}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-citi-600"
                title="Sair"
              >
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
          <div>
             &copy; {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.
          </div>
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

// --- APP COMPONENT ---

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<AidRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

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
