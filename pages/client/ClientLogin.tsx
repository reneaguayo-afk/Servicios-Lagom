import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { StorageService } from '../../services/storage';

const ClientLogin = () => {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clients = StorageService.getClients();
    const client = clients.find(c => c.id === accessCode || c.email === accessCode);
    
    if (client) {
      if (client.accessEnabled === false) {
        setError('El acceso al portal ha sido restringido. Por favor contacte a su abogado.');
        return;
      }

      localStorage.setItem('lagom_current_client', client.id);
      navigate('/client/dashboard');
    } else {
      setError('Credenciales inválidas. Verifique su ID de Cliente o Email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 max-w-md w-full relative animate-fadeIn">
        <button 
           onClick={() => navigate('/')} 
           className="absolute top-8 left-8 text-gray-300 hover:text-gold transition-colors"
        >
           <ArrowLeft size={20} />
        </button>

        <div className="text-center mb-10 mt-2">
          <h1 className="font-serif text-4xl font-bold text-gold mb-2">Lagom Co.</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Portal Cliente</p>
          
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
             <Lock size={24} />
          </div>
          <p className="text-gray-500 text-sm font-light leading-relaxed">
             Ingrese sus credenciales para acceder a su expediente.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-2">ID o Email</label>
            <input 
              type="text" 
              className="w-full px-6 py-4 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all text-gray-800 placeholder-gray-300 text-sm"
              placeholder="Ej. cliente@email.com"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value);
                setError('');
              }}
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl text-red-600 text-xs animate-fadeIn border border-red-100 font-medium">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-[#0f172a] text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-200 hover:shadow-xl hover:bg-gray-800 transition-all duration-300 uppercase tracking-widest text-xs"
          >
            Ingresar
          </button>
        </form>

        <div className="mt-10 text-center border-t border-gray-50 pt-6">
          <p className="text-[10px] text-gray-300 uppercase tracking-wider">
             Servicios Legales Corporativos
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;