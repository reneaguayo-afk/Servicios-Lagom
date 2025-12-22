import React, { useEffect, useState } from 'react';
import { X, Bell, Clock, AlertTriangle, Activity, UserPlus, CheckCircle2, ShieldAlert, Sparkles, ChevronRight, Check } from 'lucide-react';
import { AppNotification, Priority } from '../types';
import { StorageService } from '../services/storage';
import { useNavigate } from 'react-router-dom';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ALERTS' | 'TASKS'>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setNotifications(StorageService.getNotifications());
    }
  }, [isOpen]);

  const handleMarkAllRead = () => {
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      // In a real app, save to storage here
  };

  const handleNotificationClick = (n: AppNotification) => {
    // Mark as read logic would go here in a real implementation
    if (n.relatedId) {
        if (n.type === 'DEADLINE' || n.type === 'RISK' || n.type === 'SLA') navigate(`/admin/cases/${n.relatedId}`);
    }
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'DEADLINE': return <Clock size={16} className="text-red-500" />;
      case 'SLA': return <Activity size={16} className="text-orange-500" />;
      case 'DELEGATION': return <UserPlus size={16} className="text-blue-500" />;
      case 'RISK': return <ShieldAlert size={16} className="text-red-600" />;
      case 'AI_PREDICTION': return <Sparkles size={16} className="text-purple-500" />;
      default: return <Bell size={16} className="text-gold" />;
    }
  };

  const getBgColor = (type: string) => {
      switch (type) {
        case 'DEADLINE': return 'bg-red-50';
        case 'SLA': return 'bg-orange-50';
        case 'DELEGATION': return 'bg-blue-50';
        case 'RISK': return 'bg-red-50';
        case 'AI_PREDICTION': return 'bg-purple-50';
        default: return 'bg-gold/10';
      }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'ALERTS') return ['DEADLINE', 'SLA', 'RISK', 'AI_PREDICTION'].includes(n.type);
    if (filter === 'TASKS') return ['DELEGATION', 'REMINDER'].includes(n.type);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-[100] transition-opacity" onClick={onClose} />
      
      {/* Centered Modal Container */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white w-full max-w-md flex flex-col rounded-[2.5rem] shadow-2xl max-h-[85vh] animate-fadeIn border border-white/50 relative overflow-hidden">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
            <div>
                <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
                    Centro de Alertas
                    {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-red-200">{unreadCount}</span>}
                </h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                <X size={20} />
            </button>
            </div>

            {/* Filters */}
            <div className="px-8 py-4 bg-white shrink-0">
                <div className="flex p-1.5 bg-gray-50 rounded-xl border border-gray-100">
                    <FilterButton label="Todas" count={notifications.length} active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
                    <FilterButton label="Alertas" active={filter === 'ALERTS'} onClick={() => setFilter('ALERTS')} />
                    <FilterButton label="Tareas" active={filter === 'TASKS'} onClick={() => setFilter('TASKS')} />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-[#FAFAFA]">
            {filteredNotifications.map((n) => (
                <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`group relative p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                        !n.read ? 'bg-white border-gold/30 shadow-sm' : 'bg-white border-gray-100 opacity-70 hover:opacity-100'
                    }`}
                >
                    {!n.read && <div className="absolute top-5 right-5 w-2 h-2 bg-gold rounded-full ring-4 ring-gold/10"></div>}
                    
                    <div className="flex gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getBgColor(n.type)}`}>
                            {getIcon(n.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1 pr-6">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${n.priority === Priority.HIGH ? 'text-red-500' : 'text-gray-400'}`}>
                                    {n.type.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] text-gray-300 font-mono">
                                    {new Date(n.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            
                            <h4 className="text-sm font-bold text-gray-900 mb-1 leading-snug group-hover:text-gold transition-colors">{n.title}</h4>
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
                            
                            {n.relatedId && (
                                <div className="mt-3 flex items-center text-[10px] font-bold text-gray-400 group-hover:text-gold transition-colors">
                                    Ver detalles <ChevronRight size={12} className="ml-1" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {filteredNotifications.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Bell size={32} className="opacity-20" />
                    </div>
                    <p className="text-sm font-medium">Todo está tranquilo por aquí.</p>
                </div>
            )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-50 bg-white shrink-0">
            <button 
                onClick={handleMarkAllRead}
                className="w-full py-3.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
            >
                <Check size={16} /> Marcar todo como leído
            </button>
            </div>
        </div>
      </div>
    </>
  );
};

const FilterButton = ({ label, count, active, onClick }: { label: string, count?: number, active: boolean, onClick: () => void }) => (
   <button 
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
         active ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'
      }`}
   >
      {label}
      {count !== undefined && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md leading-none">{count}</span>}
   </button>
);
