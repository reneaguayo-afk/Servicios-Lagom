import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, DollarSign, LogOut, Briefcase, FileText, Bell, Calendar, ShieldAlert, Settings, BookOpen } from 'lucide-react';
import { NotificationsPanel } from './NotificationsPanel';

interface LayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'client';
}

const AdminSidebar = ({ onOpenNotifications }: { onOpenNotifications: () => void }) => (
  <nav className="space-y-2 p-4">
    <div className="mb-8 px-4 flex justify-between items-center">
      <div>
         <h1 className="font-serif text-2xl font-bold text-gold">Lagom Legal</h1>
         <p className="text-xs text-corporate-gray tracking-widest uppercase mt-1">Admin Panel</p>
      </div>
    </div>
    
    <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
    <NavItem to="/admin/risk-center" icon={<ShieldAlert size={20} />} label="Monitor de Riesgos" />
    <NavItem to="/admin/cases" icon={<FolderKanban size={20} />} label="Expedientes" />
    <NavItem to="/admin/clients" icon={<Users size={20} />} label="Clientes" />
    <NavItem to="/admin/services" icon={<FileText size={20} />} label="Catálogo" />
    <NavItem to="/admin/library" icon={<BookOpen size={20} />} label="Biblioteca" />
    <NavItem to="/admin/finances" icon={<DollarSign size={20} />} label="Finanzas" />

    <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
       <button 
          onClick={onOpenNotifications}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-gray-500 hover:bg-gold/10 hover:text-gold group"
       >
          <div className="relative">
             <Bell size={20} />
             <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
          <span className="font-medium text-sm group-hover:font-bold">Notificaciones</span>
       </button>
       <NavItem to="/admin/profile" icon={<Settings size={20} />} label="Configuración" />
    </div>
  </nav>
);

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-gold text-white shadow-lg shadow-gold/30' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`
    }
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </NavLink>
);

export const Layout: React.FC<LayoutProps> = ({ children, role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleLogout = () => {
    navigate('/');
  };

  // CLIENT LAYOUT: Full width, no sidebar (Navigation is handled inside ClientDashboard)
  if (role === 'client') {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <main className="w-full h-full">
           {children}
        </main>
      </div>
    );
  }

  // ADMIN LAYOUT: Includes Sidebar and Top Bar for Mobile
  return (
    <div className="flex min-h-screen bg-[#F9F9F9]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white/80 backdrop-blur-md border-r border-gray-100 shadow-sm hidden md:flex flex-col justify-between z-50">
        <AdminSidebar onOpenNotifications={() => setIsNotificationsOpen(true)} />
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout} 
            className="flex items-center space-x-3 w-full px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header (Admin Only) */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-white z-40 flex items-center justify-between px-6 shadow-sm">
        <span className="font-serif text-lg font-bold text-gold">Lagom Admin</span>
        <div className="flex items-center gap-4">
           <button onClick={() => setIsNotificationsOpen(true)} className="relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
           </button>
           <button onClick={handleLogout}><LogOut size={20} /></button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 pt-20 md:pt-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto animate-fadeIn">
           {children}
        </div>
      </main>

      {/* Notification Panel */}
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </div>
  );
};