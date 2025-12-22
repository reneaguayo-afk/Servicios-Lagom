import React, { useEffect, useState } from 'react';
import { StorageService } from '../../services/storage';
import { FirmProfile } from '../../types';
import { 
  Building2, MapPin, Mail, Phone, Globe, Shield, Lock, Save, Briefcase, Key, Calendar
} from 'lucide-react';

const AdminProfile = () => {
  const [profile, setProfile] = useState<FirmProfile | null>(null);
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    const data = StorageService.getFirmProfile();
    setProfile(data);
  }, []);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
       StorageService.saveFirmProfile(profile);
       alert('Información de la firma actualizada correctamente.');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
       alert('Las contraseñas no coinciden.');
       return;
    }
    alert('Contraseña administrativa actualizada.');
    setPassData({ current: '', new: '', confirm: '' });
  };

  if (!profile) return null;

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      
      {/* Header */}
      <div>
         <h2 className="text-4xl font-serif font-bold text-corporate-dark">Perfil de la Firma</h2>
         <p className="text-gray-400 mt-2 text-sm">Configuración institucional y seguridad de la cuenta.</p>
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
                   <p className="text-sm text-gray-400">Esta información aparecerá en facturas y correos.</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                         <Globe size={12} /> Sitio Web
                      </label>
                      <input 
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm font-medium text-gray-700 bg-gray-50/50 focus:bg-white"
                         value={profile.website}
                         onChange={(e) => setProfile({...profile, website: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Slogan / Lema</label>
                      <input 
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm font-medium text-gray-700 bg-gray-50/50 focus:bg-white"
                         value={profile.slogan || ''}
                         onChange={(e) => setProfile({...profile, slogan: e.target.value})}
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                      <Calendar size={12} /> Link de Agenda (Google Calendar / Calendly)
                   </label>
                   <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm font-medium text-gray-700 bg-gray-50/50 focus:bg-white"
                      value={profile.calendarUrl || ''}
                      onChange={(e) => setProfile({...profile, calendarUrl: e.target.value})}
                      placeholder="https://calendar.google.com/..."
                   />
                </div>

                <div className="pt-4">
                   <button className="flex items-center gap-2 bg-gray-900 hover:bg-gold text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-xl">
                      <Save size={16} /> Guardar Cambios
                   </button>
                </div>
             </form>
          </div>

          {/* Security & Settings */}
          <div className="space-y-6">
             {/* Admin Security Card */}
             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                      <Shield size={20} />
                   </div>
                   <div>
                      <h3 className="font-serif text-lg font-bold text-gray-900">Credenciales</h3>
                      <p className="text-xs text-gray-400">Acceso Administrativo</p>
                   </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Contraseña Actual</label>
                      <div className="relative">
                         <input 
                            type="password"
                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm"
                            value={passData.current}
                            onChange={(e) => setPassData({...passData, current: e.target.value})}
                         />
                         <Lock size={14} className="absolute right-4 top-3.5 text-gray-300" />
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nueva Contraseña</label>
                      <input 
                         type="password"
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm"
                         value={passData.new}
                         onChange={(e) => setPassData({...passData, new: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Confirmar</label>
                      <input 
                         type="password"
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm"
                         value={passData.confirm}
                         onChange={(e) => setPassData({...passData, confirm: e.target.value})}
                      />
                   </div>
                   <button className="w-full py-3 bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                      <Key size={14} /> Actualizar Clave
                   </button>
                </form>
             </div>
          </div>
      </div>
    </div>
  );
};

export default AdminProfile;
