import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, User, ArrowRight, Sparkles } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFCFC] p-6 relative">
      
      {/* Header Section */}
      <div className="text-center mb-12 animate-fadeIn">
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-gold mb-4 tracking-tight">
          Lagom Co.<sup className="text-2xl ml-1">®</sup>
        </h1>
        <p className="text-[10px] md:text-xs tracking-[0.4em] font-bold text-gray-400 uppercase mb-8">
          Servicios Legales Corporativos
        </p>
        
        <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base font-light leading-relaxed">
          Bienvenido al ecosistema digital de Lagom Co. Seleccione su perfil para acceder a la gestión de sus trámites o al panel administrativo.
        </p>
      </div>

      {/* Access Portals Container */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl z-10 mb-12">
        
        {/* Client Portal Card */}
        <button 
          onClick={() => navigate('/client/login')}
          className="group flex-1 bg-white rounded-[1.5rem] p-10 md:p-12 text-left border border-gold/30 shadow-sm hover:shadow-xl hover:border-gold transition-all duration-300 relative overflow-hidden"
        >
          <div className="mb-8 w-14 h-14 rounded-full bg-[#FCFCFC] border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
             <User size={24} className="text-gold" strokeWidth={1.5} />
          </div>

          <h2 className="text-3xl font-serif text-gold mb-3">Soy Cliente</h2>
          
          <p className="text-gray-400 mb-12 text-sm leading-relaxed max-w-xs">
            Acceda a sus expedientes, consulte el estatus en tiempo real y gestione sus pagos.
          </p>

          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-gold uppercase group-hover:gap-3 transition-all">
            <span>Ingresar al Portal</span>
            <ArrowRight size={12} />
          </div>
        </button>

        {/* Lawyer/Admin Portal Card */}
        <button 
          onClick={() => navigate('/admin/dashboard')}
          className="group flex-1 bg-[#1c1c1c] rounded-[1.5rem] p-10 md:p-12 text-left shadow-2xl hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] transition-all duration-300 relative overflow-hidden"
        >
          {/* Subtle background icon */}
          <Briefcase className="absolute -right-6 -bottom-6 text-white/5 w-48 h-48 -rotate-12 pointer-events-none" strokeWidth={0.5} />

          <div className="mb-8 w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
             <Briefcase size={24} className="text-gray-300" strokeWidth={1.5} />
          </div>

          <h2 className="text-3xl font-serif text-white mb-3">Soy Abogado</h2>
          
          <p className="text-gray-400 mb-12 text-sm leading-relaxed max-w-xs relative z-10">
            Panel administrativo para gestión de casos, clientes, agenda y finanzas.
          </p>

          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-gray-500 group-hover:text-white uppercase group-hover:gap-3 transition-all relative z-10">
            <span>Acceso Corporativo</span>
            <ArrowRight size={12} />
          </div>
        </button>

      </div>

      {/* New Client Onboarding CTA */}
      <div className="animate-fadeIn delay-100">
         <button 
            onClick={() => navigate('/onboarding')}
            className="flex items-center gap-3 px-8 py-4 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gold/30 rounded-full shadow-sm hover:shadow-lg transition-all group"
         >
            <Sparkles size={16} className="text-gold" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">¿Nuevo Cliente? Inicie su registro aquí</span>
            <ArrowRight size={14} className="text-gray-400 group-hover:text-gold group-hover:translate-x-1 transition-all" />
         </button>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-100 w-full max-w-xs text-center">
         <p className="text-[9px] text-gray-300 tracking-wider uppercase">
            © {new Date().getFullYear()} Lagom Co. Servicios Legales Corporativos
         </p>
      </div>
    </div>
  );
};

export default Landing;