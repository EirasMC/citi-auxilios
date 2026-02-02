
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Lock, User as UserIcon, Mail, ShieldCheck, HelpCircle, CheckCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (name: string, email: string, pass: string) => { success: boolean, message: string };
  onVerify: (email: string, pass: string) => { success: boolean, user?: User, message: string };
  onRequestReset: (email: string) => boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onVerify, onRequestReset }) => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'ADMIN' | 'RESET'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.');
    const result = onRegister(name, email, password);
    if (!result.success) setError(result.message);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in min-h-[80vh]">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-xl border border-gray-100 relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-citi-900 to-citi-600"></div>
        
        <div className="text-center pt-2">
          <h2 className="text-3xl font-bold text-citi-900">
            {activeTab === 'REGISTER' ? 'Criar Conta' : 'Bem-vindo'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">Programa de Auxílios CITI</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('LOGIN')} className={`flex-1 py-2 text-sm font-medium rounded-md ${activeTab === 'LOGIN' ? 'bg-white shadow text-citi-900' : 'text-gray-500'}`}>Login</button>
          <button onClick={() => setActiveTab('REGISTER')} className={`flex-1 py-2 text-sm font-medium rounded-md ${activeTab === 'REGISTER' ? 'bg-white shadow text-citi-900' : 'text-gray-500'}`}>Cadastro</button>
          <button onClick={() => setActiveTab('ADMIN')} className={`flex-1 py-2 text-sm font-medium rounded-md ${activeTab === 'ADMIN' ? 'bg-white shadow text-citi-900' : 'text-gray-500'}`}>Admin</button>
        </div>

        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-4 pt-4">
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-3 border rounded-lg" placeholder="Nome Completo" />
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-3 border rounded-lg" placeholder="E-mail profissional" />
            <div>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-3 border rounded-lg" placeholder="Criar Senha" />
              <p className="mt-2 text-xs text-gray-500 flex items-start">
                <ShieldCheck size={14} className="mr-1 mt-0.5 text-citi-600" />
                Crie uma senha diferente das que você utiliza em serviços importantes, proteja os seus dados contra vazamentos.
              </p>
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Cadastrar e Acessar</button>
          </form>
        )}

        {activeTab === 'LOGIN' && (
          <form onSubmit={e => { e.preventDefault(); const res = onVerify(email, password); if(res.success && res.user) onLogin(res.user); else setError(res.message); }} className="space-y-4 pt-4">
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-3 border rounded-lg" placeholder="E-mail" />
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-3 border rounded-lg" placeholder="Senha" />
            <button type="submit" className="w-full bg-citi-600 text-white py-3 rounded-lg font-bold">Acessar</button>
          </form>
        )}

        {activeTab === 'ADMIN' && (
          <form onSubmit={e => { e.preventDefault(); if(adminPassword === 'citiadminciti') onLogin({id:'admin', name:'Admin', email:'admin@citi.com', role:UserRole.ADMIN}); else setError('Senha incorreta'); }} className="space-y-4 pt-4">
            <input required type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full px-3 py-3 border rounded-lg" placeholder="Senha Administrativa" />
            <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold">Acessar Painel</button>
          </form>
        )}
      </div>
    </div>
  );
};
