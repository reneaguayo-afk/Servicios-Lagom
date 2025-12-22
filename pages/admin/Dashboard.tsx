import React, { useEffect, useState } from 'react';
import { StorageService } from '../../services/storage';
import { Case, CaseStatus, Priority, StageStatus, TimelineEvent } from '../../types';
import { AlertCircle, CheckCircle2, TrendingUp, Clock, FileText, ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign, Zap, ArrowRight, Filter, RefreshCw, Mail, CheckSquare, AlertTriangle, MoreHorizontal } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useNavigate } from 'react-router-dom';

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  caseId: string;
  type: 'DEADLINE' | 'HEARING' | 'DELIVERABLE';
  status: 'pending' | 'completed' | 'overdue' | 'today';
  priority: Priority;
  clientName: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    risk: 0,
    revenue: 0,
    sla: 100
  });

  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Quick Action State
  const [quickActionCase, setQuickActionCase] = useState<Case | null>(null);
  const [updateText, setUpdateText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = StorageService.getCases();
    const clients = StorageService.getClients();
    setCases(data);

    // Stats Logic
    const active = data.filter(c => c.status === CaseStatus.ACTIVE).length;
    const riskCases = data.filter(c => 
        c.stages.some(s => s.status === StageStatus.IN_PROGRESS && s.priority === Priority.HIGH)
    ).length;
    const revenue = data.flatMap(c => c.payments).reduce((acc, p) => acc + p.amount, 0);
    const sla = 100; 

    setStats({ active, risk: riskCases, revenue, sla });

    // Calendar Events Logic
    const events: CalendarEvent[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    data.forEach(c => {
       if (c.status !== CaseStatus.COMPLETED) {
          const client = clients.find(cl => cl.id === c.clientId);
          c.stages.forEach(s => {
             if (s.dueDate && s.status !== StageStatus.COMPLETED) {
                const d = new Date(s.dueDate);
                d.setHours(0,0,0,0); // Normalize

                let status: CalendarEvent['status'] = 'pending';
                if (d.getTime() < today.getTime()) status = 'overdue';
                else if (d.getTime() === today.getTime()) status = 'today';

                events.push({
                   id: s.id,
                   title: s.title,
                   clientName: client?.name || 'Cliente',
                   date: d,
                   priority: s.priority,
                   caseId: c.id,
                   type: 'DEADLINE',
                   status: status
                });
             }
          });
       }
    });
    setCalendarEvents(events.sort((a, b) => a.date.getTime() - b.date.getTime()));
  };

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  };

  const urgentCases = cases.filter(c => c.stages.some(s => s.status === StageStatus.IN_PROGRESS && s.priority === Priority.HIGH));
  
  const handleQuickUpdate = () => {
     if (!quickActionCase || !updateText) return;

     const event: TimelineEvent = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        title: 'Actualización Rápida',
        description: updateText,
        type: 'UPDATE',
        author: 'Lawyer'
     };

     StorageService.saveTimelineEvent(quickActionCase.id, event);
     setQuickActionCase(null);
     setUpdateText('');
     loadData();
  };

  // --- Calendar Helpers ---
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + offset, 1);
    setCurrentMonthDate(newDate);
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonthDate);
    const firstDay = getFirstDayOfMonth(currentMonthDate);
    const days = [];
    
    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[5rem] bg-gray-50/20"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day);
      const dayEvents = calendarEvents.filter(e => e.date.getTime() === currentDayDate.getTime());
      const isSelected = selectedDate.getTime() === currentDayDate.getTime();
      const isToday = new Date().setHours(0,0,0,0) === currentDayDate.getTime();

      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(currentDayDate)}
          className={`min-h-[5rem] p-2 relative cursor-pointer transition-all border-t border-r border-gray-100/50 hover:bg-gray-50 group
            ${isSelected ? 'bg-gold/5' : 'bg-white'}
          `}
        >
          <div className={`text-[10px] font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
             isToday ? 'bg-gold text-white' : 
             isSelected ? 'text-gold' : 'text-gray-500 group-hover:text-gray-900'
          }`}>
            {day}
          </div>
          
          <div className="space-y-1">
            {dayEvents.map(ev => (
              <div key={ev.id} className={`text-[9px] truncate px-1.5 py-0.5 rounded-md font-medium border-l-2 flex items-center gap-1 ${
                ev.status === 'overdue' ? 'bg-red-50 border-red-400 text-red-600' :
                ev.status === 'today' ? 'bg-gold/10 border-gold text-gold-dark' :
                ev.priority === Priority.HIGH ? 'bg-orange-50 border-orange-300 text-orange-600' :
                'bg-blue-50 border-blue-300 text-blue-600'
              }`}>
                {ev.priority === Priority.HIGH && <div className="w-1 h-1 rounded-full bg-current shrink-0"></div>}
                <span className="truncate">{ev.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  const selectedDayEvents = calendarEvents.filter(e => e.date.getTime() === selectedDate.getTime());

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-gray-900">Tablero de Control</h2>
          <div className="flex items-center text-gray-400 mt-2 space-x-2 text-sm font-medium">
            <Clock size={16} />
            <span className="capitalize">{getCurrentDate()}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard 
           title="CUMPLIMIENTO SLA" 
           value={`${stats.sla}%`} 
           trend="+2.5%"
           trendColor="text-green-500"
           icon={<CheckCircle2 size={20} />} 
           iconBg="bg-green-100 text-green-600"
        />
        <KpiCard 
           title="EXPEDIENTES ACTIVOS" 
           value={stats.active} 
           trend="+5 Nuevos"
           trendColor="text-blue-500"
           icon={<FileText size={20} />} 
           iconBg="bg-blue-100 text-blue-600"
        />
        <KpiCard 
           title="INGRESOS MES" 
           value={`$${stats.revenue.toLocaleString()}`} 
           trend="En meta"
           trendColor="text-gold"
           icon={<DollarSign size={20} />} 
           iconBg="bg-yellow-100 text-gold-dark"
        />
        <KpiCard 
           title="ALTO RIESGO" 
           value={stats.risk} 
           trend="-2 vs semana pasada"
           trendColor="text-red-500"
           icon={<AlertCircle size={20} />} 
           iconBg="bg-red-100 text-red-600"
        />
      </div>

      {/* Main Grid: Agenda & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tasks & Day View (4 Cols) */}
        <div className="lg:col-span-4 space-y-8">
            {/* Atención Inmediata */}
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col h-[450px]">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
                     <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                     Atención Inmediata
                  </h3>
                  <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-red-100">{urgentCases.length}</span>
               </div>
               
               <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                  {urgentCases.map(c => (
                     <div key={c.id} className="group relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-red-100 transition-all">
                        <div className="flex justify-between items-start mb-2">
                           <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle size={10} /> Acción Requerida
                           </span>
                           <button className="text-gray-300 hover:text-gray-600"><MoreHorizontal size={16} /></button>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1 truncate pr-4">{c.clientId === 'CLI-001-IAS-LGCO' ? 'Inversiones Andina SpA' : 'Cliente Confidencial'}</h4>
                        <p className="text-xs text-gray-500 mb-4">{c.serviceName}</p>
                        
                        <button 
                           onClick={() => setQuickActionCase(c)}
                           className="w-full py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-900 hover:text-white transition-colors group-hover:shadow-lg"
                        >
                           <Zap size={14} className="text-gold group-hover:text-white" /> Actualizar
                        </button>
                     </div>
                  ))}
                  {urgentCases.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                           <CheckCircle2 size={32} className="text-green-200" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">Todo bajo control</span>
                     </div>
                  )}
               </div>
            </div>

            {/* Agenda del Día */}
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 min-h-[300px]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
                 <h3 className="font-bold text-gray-900 text-lg">Agenda del Día</h3>
                 <span className="text-[10px] font-bold bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full text-gray-500 uppercase tracking-wide">{selectedDate.toLocaleDateString()}</span>
              </div>
              
              <div className="space-y-3">
                 {selectedDayEvents.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                       <CalendarIcon size={32} className="mx-auto mb-3 opacity-20" />
                       <p className="text-xs">Sin eventos programados</p>
                    </div>
                 ) : (
                    selectedDayEvents.map(ev => (
                       <div 
                          key={ev.id} 
                          onClick={() => navigate(`/admin/cases/${ev.caseId}`)}
                          className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all cursor-pointer group"
                       >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                             ev.status === 'overdue' ? 'bg-red-50 text-red-500' : 
                             ev.status === 'today' ? 'bg-gold text-white' : 
                             'bg-white text-blue-500 border border-gray-100'
                          }`}>
                             <span className="text-xs font-bold">{ev.date.getDate()}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                             <h4 className="text-xs font-bold text-gray-800 group-hover:text-gold transition-colors truncate">{ev.title}</h4>
                             <p className="text-[10px] text-gray-500 mt-0.5 truncate">{ev.clientName}</p>
                          </div>
                          {ev.status === 'overdue' && <AlertTriangle size={14} className="text-red-500" />}
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>

        {/* Right Column: Full Calendar (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col h-full">
           {/* Calendar Header */}
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-serif text-2xl font-bold text-gray-900 capitalize">
                 {currentMonthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                 <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 transition-all"><ChevronLeft size={18} /></button>
                 <div className="w-px h-4 bg-gray-200 mx-1"></div>
                 <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 transition-all"><ChevronRight size={18} /></button>
              </div>
           </div>

           {/* Week Headers */}
           <div className="grid grid-cols-7 mb-4">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                 <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d}</div>
              ))}
           </div>

           {/* Grid */}
           <div className="grid grid-cols-7 rounded-2xl overflow-hidden border border-gray-100 flex-1 bg-gray-50">
              {renderCalendarGrid()}
           </div>
           
           <div className="mt-6 flex gap-6 text-[10px] font-bold text-gray-400 justify-end uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Vencido</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gold"></div> Hoy</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Alta Prioridad</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Pendiente</div>
           </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      <Modal isOpen={!!quickActionCase} onClose={() => setQuickActionCase(null)} title="Actualización Obligatoria">
         <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Actualizando expediente:</p>
                <p className="text-base font-bold text-gray-900">{quickActionCase?.folio}</p>
            </div>
            
            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Bitácora de Avance</label>
               <textarea 
                  className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold resize-none text-sm min-h-[120px]"
                  placeholder="Describa las acciones tomadas..."
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
               />
            </div>

            <div className="flex gap-4 pt-2">
               <button onClick={() => setQuickActionCase(null)} className="flex-1 border border-gray-200 rounded-xl py-3.5 text-xs font-bold text-gray-600 hover:bg-gray-50 uppercase tracking-wider transition-colors">Cancelar</button>
               <button 
                  onClick={handleQuickUpdate}
                  className="flex-1 bg-gold text-white rounded-xl py-3.5 text-xs font-bold hover:bg-gold-dark shadow-lg shadow-gold/30 uppercase tracking-wider transition-all"
               >
                  Registrar Avance
               </button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

const KpiCard = ({ title, value, trend, trendColor, icon, iconBg }: { title: string, value: string | number, trend: string, trendColor: string, icon: React.ReactNode, iconBg: string }) => (
  <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
          {icon}
       </div>
       {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-gray-50 ${trendColor}`}>
             {trend}
          </span>
       )}
    </div>
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-serif font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

export default Dashboard;