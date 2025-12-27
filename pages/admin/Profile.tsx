import React, { useEffect, useState } from 'react';
import { StorageService } from '../../services/storage';
import { FirmProfile } from '../../types';
import { 
  Building2, MapPin, Mail, Phone, Globe, Shield, Lock, Save, Briefcase, Key, CheckCircle2, AlertCircle
} from 'lucide-react';

const AdminProfile = () => {
  const [profile, setProfile] = useState<FirmProfile | null>(null);
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const data = StorageService.getFirmProfile();
    setProfile(data);
  }, []);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
       StorageService.saveFirmProfile(profile);
       showFeedback('Información de la firma actualizada correctamente.', 'success');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = StorageService.getAdminPassword();

    if (passData.current !== storedPass) {
       showFeedback('La contraseña actual es incorrecta.', 'error');
       return;
    }

    if (passData.new !== passData.confirm) {
       showFeedback('La nueva contraseña y la confirmación no coinciden.', 'error');
       return;
    }

    if (passData.new.length < 6) {
       showFeedback('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
       return;
    }

    StorageService.setAdminPassword(passData.new);
    showFeedback('Contraseña administrativa actualizada exitosamente.', 'success');
    setPassData({ current: '', new: '', confirm: '' });
  };

  const showFeedback = (text: string, type: 'success' | 'error') => {
      setMessage({ text, type });
      setTimeout(() => setMessage(null), 4000);
  };

  if (!profile) return null;

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-4xl font-serif font-bold text-corporate-dark">Perfil de la Firma</h2>
            <p className="text-gray-400 mt-2 text-sm">Configuración institucional y seguridad de la cuenta.</p>
         </div>
         
         {message && (
            <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border animate-fadeIn shadow-lg ${
                message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
            }`}>
               {message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
               <span className="text-sm font-bold">{message.text}</span>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Form */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-gray-100">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gold text-white flex items-center justify-center shadow-lg shadow-gold/30">
                   <Briefcase size={24} />
                </div>
                <div>
                   <h2 className="font-serif text-2xl font-bold text-gray-900">Datos Institucionales</h2>
                   <p className="text-sm text-gray-400">Esta información aparecerá en facturas y propuestas.</p>
                </div>
             </div>

             <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre de la Firma</label>
                      <input 
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm font-medium text-gray-700 bg-gray-50/50 focus:bg-white"
                         value={profile.name}
                         onChange={(e) => setProfile({...profile, name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">RFC / Tax ID</label>
                      <input 
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm font-medium text-gray-700 bg-gray-50/50 focus:bg-white"
                         value={profile.taxId}
                         onChange={(e) => setProfile({...profile, taxId: e.target.value})}
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                      <MapPin size={12} /> Dirección Corporativa
                   </label>
                   <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm font-medium text-gray-700 bg-gray-50/50 focus:bg-white"
                      value={profile.address}
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                         <Mail size={12} /> Email de Contacto
                      </label>
                      <input 
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm font-medium text-gray-700 bg-gray-50/50 focus:bg-white"
                         value={profile.email}
                         onChange={(e) => setProfile({...profile, email: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                         <Phone size={12} /> Teléfono
                      </label>
                      <input 
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm font-medium text-gray-700 bg-gray-50/50 focus:bg-white"
                         value={profile.phone}
                         onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      />
                   </div>
                </div>

                <div className="pt-4">
                   <button className="flex items-center gap-2 bg-gray-900 hover:bg-gold text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-xl">
                      <Save size={16} /> Guardar Datos
                   </button>
                </div>
             </form>
          </div>

          {/* Security & Settings */}
          <div className="space-y-6">
             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                      <Shield size={20} />
                   </div>
                   <div>
                      <h3 className="font-serif text-lg font-bold text-gray-900">Seguridad</h3>
                      <p className="text-xs text-gray-400">Acceso Administrativo</p>
                   </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                   <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Contraseña Actual</label>
                      <div className="relative">
                         <input 
                            type="password"
                            required
                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm bg-gray-50 focus:bg-white"
                            value={passData.current}
                            onChange={(e) => setPassData({...passData, current: e.target.value})}
                         />
                         <Lock size={14} className="absolute right-4 top-3.5 text-gray-300" />
                      </div>
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Nueva Contraseña</label>
                      <input 
                         type="password"
                         required
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm bg-gray-50 focus:bg-white"
                         value={passData.new}
                         onChange={(e) => setPassData({...passData, new: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Confirmar Nueva</label>
                      <input 
                         type="password"
                         required
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm bg-gray-50 focus:bg-white"
                         value={passData.confirm}
                         onChange={(e) => setPassData({...passData, confirm: e.target.value})}
                      />
                   </div>
                   <button className="w-full py-4 bg-gray-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gold transition-all flex items-center justify-center gap-2 shadow-lg">
                      <Key size={14} /> Actualizar Clave
                   </button>
                </form>
                
                <p className="mt-6 text-[9px] text-gray-400 uppercase text-center leading-relaxed">
                   Recuerde que este cambio afectará el acceso inmediato de cualquier otro administrador activo.
                </p>
             </div>
          </div>
      </div>
    </div>
  );
};

export default AdminProfile;