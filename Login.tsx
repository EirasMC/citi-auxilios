import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USER } from '../constants';
import { Lock, User as UserIcon, Mail, ArrowRight, UserPlus, HelpCircle, CheckCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (name: string, email: string, pass: string) => { success: boolean, message: string };
  onVerify: (email: string, pass: string) => { success: boolean, user?: User, message: string };
  onRequestReset: (email: string) => boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onVerify, onRequestReset }) => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'ADMIN' | 'RESET'>('LOGIN');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setAdminPassword('');
    setError('');
    setSuccessMsg('');
  };

  const switchTab = (tab: 'LOGIN' | 'REGISTER' | 'ADMIN' | 'RESET') => {
    setActiveTab(tab);
    clearForm();
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onVerify(email, password);
    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.message);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    const result = onRegister(name, email, password);
    if (result.success) {
       // Registration handles auto-login inside App.tsx logic usually
    } else {
      setError(result.message);
    }
  };

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const sent = onRequestReset(email);
    if (sent) {
      setSuccessMsg('Solicitação enviada! O administrador foi notificado.');
      setError('');
    } else {
      setError('E-mail não encontrado na base de dados.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'citiadminciti') {
      onLogin({
        id: 'admin-01',
        name: 'Gestão CITI',
        email: 'admin@citi.com',
        role: UserRole.ADMIN
      });
    } else {
      setError('Senha de administrador incorreta.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in min-h-[80vh]">
      <div className="mb-8">
        <img 
          src="/citi-logo.png" 
          alt="CITI Medicina Reprodutiva" 
          className="h-24 w-auto object-contain mx-auto"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-xl border border-gray-100 relative overflow-hidden">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-citi-900 via-citi-600 to-citi-accent"></div>

        <div className="text-center pt-2">
          <h2 className="text-3xl font-bold text-citi-900">
            {activeTab === 'REGISTER' ? 'Criar Conta' : 
             activeTab === 'RESET' ? 'Recuperar Senha' : 'Bem-vindo'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {activeTab === 'RESET' 
              ? 'Informe seu e-mail para solicitar a redefinição.' 
              : <span>Acesse o portal do <span className="font-semibold text-citi-600">Programa de Auxílios</span>.</span>}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => switchTab('LOGIN')}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
              activeTab === 'LOGIN' || activeTab === 'RESET' ? 'bg-white shadow text-citi-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Login
          </button>
           <button
            onClick={() => switchTab('REGISTER')}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
              activeTab === 'REGISTER' ? 'bg-white shadow text-citi-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Primeiro Acesso
          </button>
          <button
            onClick={() => switchTab('ADMIN')}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
              activeTab === 'ADMIN' ? 'bg-white shadow text-citi-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Admin
          </button>
        </div>

        {/* === LOGIN TAB === */}
        {(activeTab === 'LOGIN') && (
          <div className="space-y-4 pt-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900"
                    placeholder="seu.email@citi.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900"
                    placeholder="••••••"
                  />
                </div>
              </div>

              {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>}

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-citi-600 hover:bg-citi-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-citi-500 transition-colors"
              >
                Entrar
              </button>
            </form>

            <div className="text-center mt-2">
              <button 
                onClick={() => switchTab('RESET')}
                className="text-sm text-citi-600 hover:text-citi-800 hover:underline flex items-center justify-center mx-auto"
              >
                <HelpCircle size={14} className="mr-1" /> Esqueceu a senha?
              </button>
            </div>
          </div>
        )}

        {/* === REGISTER TAB === */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-4 pt-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900"
                    placeholder="Dr. Nome Sobrenome"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900"
                    placeholder="seu.email@citi.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Criar Senha</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>}

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Cadastrar e Acessar
              </button>
          </form>
        )}

        {/* === RESET PASSWORD TAB === */}
        {activeTab === 'RESET' && (
          <form onSubmit={handleResetRequest} className="space-y-6 pt-4">
             {!successMsg ? (
               <>
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-200">
                  Caso tenha perdido o acesso, o administrador precisará autorizar a criação de uma nova senha. Suas solicitações e histórico <strong>serão preservados</strong>.
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Cadastrado</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900"
                      placeholder="seu.email@citi.com"
                    />
                  </div>
                </div>

                {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}

                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-citi-600 hover:bg-citi-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-citi-500 transition-colors"
                >
                  Solicitar Redefinição
                </button>
               </>
             ) : (
               <div className="text-center py-6">
                 <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                 <h3 className="text-lg font-bold text-gray-900">Solicitação Enviada</h3>
                 <p className="text-gray-500 mt-2">{successMsg}</p>
                 <button 
                  type="button"
                  onClick={() => switchTab('LOGIN')}
                  className="mt-6 text-citi-600 hover:underline font-medium"
                 >
                   Voltar para Login
                 </button>
               </div>
             )}
          </form>
        )}

        {/* === ADMIN TAB === */}
        {activeTab === 'ADMIN' && (
          <form onSubmit={handleAdminLogin} className="space-y-6 pt-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha de Acesso
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="focus:ring-citi-500 focus:border-citi-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white text-gray-900"
                  placeholder="Digite a senha administrativa"
                />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-citi-900 hover:bg-citi-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-citi-500 transition-colors"
            >
              Acessar Painel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};