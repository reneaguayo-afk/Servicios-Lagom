import React, { useEffect, useState } from 'react';
import { StorageService } from '../../services/storage';
import { Case, StageStatus, Priority } from '../../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle2, RefreshCw, Mail, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  caseId: string;
  type: 'DEADLINE' | 'HEARING' | 'DELIVERABLE';
  status: 'pending' | 'completed' | 'overdue' | 'today';
  priority: Priority;
}

const Agenda = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    const cases = StorageService.getCases();
    const newEvents: CalendarEvent[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    cases.forEach(c => {
      c.stages.forEach(s => {
        if (s.dueDate && s.status !== StageStatus.COMPLETED) {
          const d = new Date(s.dueDate);
          d.setHours(0,0,0,0);
          
          let status: CalendarEvent['status'] = 'pending';
          if (d.getTime() < today.getTime()) status = 'overdue';
          else if (d.getTime() === today.getTime()) status = 'today';

          newEvents.push({
            id: s.id,
            date: d,
            title: `${s.title} - ${c.folio}`,
            caseId: c.id,
            type: 'DEADLINE',
            status: status,
            priority: s.priority
          });
        }
      });
    });
    setEvents(newEvents);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/30 border border-gray-100/50"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = events.filter(e => e.date.getTime() === currentDayDate.getTime());
      const isSelected = selectedDate.getTime() === currentDayDate.getTime();
      const isToday = new Date().setHours(0,0,0,0) === currentDayDate.getTime();

      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(currentDayDate)}
          className={`h-24 border border-gray-100 p-2 relative cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-gold/5 ring-1 ring-gold inset-0 z-10' : 'bg-white'}`}
        >
          <div className={`text-xs font-bold mb-1 ${isToday ? 'bg-gold text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-1 overflow-hidden max-h-16">
            {dayEvents.map(ev => (
              <div key={ev.id} className={`text-[9px] truncate px-1 py-0.5 rounded border-l-2 ${
                ev.status === 'overdue' ? 'bg-red-50 border-red-500 text-red-700' :
                ev.status === 'today' ? 'bg-gold/10 border-gold text-gold-dark' :
                ev.priority === Priority.HIGH ? 'bg-orange-50 border-orange-400 text-orange-700' :
                'bg-blue-50 border-blue-400 text-blue-700'
              }`}>
                {ev.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedDayEvents = events.filter(e => e.date.getTime() === selectedDate.getTime());

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-serif font-bold text-corporate-dark">Agenda Legal</h2>
          <p className="text-gray-400 mt-2 text-sm">Gestión de tiempos y vencimientos.</p>
        </div>
        
        {/* Sync Center */}
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm">
             <RefreshCw size={14} /> Sincronizar Google Calendar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-blue-800 hover:text-blue-800 transition-colors shadow-sm">
             <Mail size={14} /> Sincronizar Outlook
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Calendar View */}
        <div className="flex-1 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
           {/* Calendar Header */}
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-2xl font-bold text-gray-800 capitalize">
                 {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                 <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronLeft size={20} /></button>
                 <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronRight size={20} /></button>
              </div>
           </div>

           {/* Week Headers */}
           <div className="grid grid-cols-7 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                 <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase">{d}</div>
              ))}
           </div>

           {/* Grid */}
           <div className="grid grid-cols-7 rounded-xl overflow-hidden border border-gray-100">
              {renderCalendarGrid()}
           </div>
           
           <div className="mt-4 flex gap-4 text-xs text-gray-500 justify-end">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Vencido</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gold"></div> Hoy</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Alta Prioridad</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Pendiente</div>
           </div>
        </div>

        {/* Sidebar: Day Agenda & Alerts */}
        <div className="w-full lg:w-96 space-y-6">
           {/* Selected Day Agenda */}
           <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 min-h-[300px]">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                 <h3 className="font-bold text-gray-900">Agenda del Día</h3>
                 <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{selectedDate.toLocaleDateString()}</span>
              </div>
              
              <div className="space-y-3">
                 {selectedDayEvents.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                       <CheckSquare size={32} className="mx-auto mb-2 opacity-20" />
                       <p className="text-sm">Sin eventos programados</p>
                    </div>
                 ) : (
                    selectedDayEvents.map(ev => (
                       <div 
                          key={ev.id} 
                          onClick={() => navigate(`/admin/cases/${ev.caseId}`)}
                          className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:bg-gray-50 hover:border-gray-100 transition-all cursor-pointer group"
                       >
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                             ev.status === 'overdue' ? 'bg-red-500' : 
                             ev.status === 'today' ? 'bg-gold' : 
                             'bg-blue-400'
                          }`}></div>
                          <div>
                             <h4 className="text-sm font-bold text-gray-800 group-hover:text-gold transition-colors">{ev.title}</h4>
                             <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                {ev.status === 'overdue' && <AlertTriangle size={10} className="text-red-500" />}
                                {ev.status === 'overdue' ? 'Vencido' : ev.status === 'today' ? 'Vence Hoy' : 'Pendiente'}
                             </p>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* Upcoming Deadlines Summary */}
           <div className="bg-[#0f172a] rounded-[2rem] p-6 text-white shadow-lg">
              <h3 className="font-bold text-gold mb-4 flex items-center gap-2">
                 <Clock size={16} /> Próximos Vencimientos
              </h3>
              <div className="space-y-4">
                 {events
                    .filter(e => e.status !== 'completed' && e.status !== 'overdue' && e.date > new Date())
                    .sort((a,b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 3)
                    .map(ev => (
                       <div key={ev.id} className="border-l-2 border-gray-600 pl-3 py-1">
                          <div className="text-xs text-gray-400 mb-1">{ev.date.toLocaleDateString()}</div>
                          <div className="text-sm font-bold text-gray-200 truncate">{ev.title}</div>
                       </div>
                    ))
                 }
                 <button 
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full mt-4 text-xs font-bold text-center text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
                 >
                    Ver Tablero de Control
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;