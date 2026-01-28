import React from 'react';
import { LogOut, Database, HardDrive } from 'lucide-react';
import { User, UserRole } from '../types';
import { APP_NAME, PROGRAM_NAME } from '../constants';
import { isSupabaseConnected } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export const MainLayout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
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