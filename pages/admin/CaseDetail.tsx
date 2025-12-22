import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../../services/storage';
import { Case, StageStatus, Priority, TimelineEvent, CaseStatus } from '../../types';
import { generateClientUpdate } from '../../services/geminiService';
import { 
  ArrowLeft, CheckCircle, Clock, Send, Sparkles, MessageSquare, Plus, Mail, Paperclip, 
  AlertTriangle, UserPlus, Flag, FileText, ChevronDown, RefreshCcw, X, Archive, CheckCircle2,
  Zap, Phone, Download, Upload, Users, Scale, BookOpen, CheckSquare, ClipboardList, Hourglass, Bell, Eye, FolderOpen
} from 'lucide-react';
import { Modal } from '../../components/Modal';

// Define the 13 Routine Activities
const ROUTINE_ACTIVITIES = [
  { id: 'call', label: 'Llamada con cliente', icon: Phone, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'comms', label: 'Comunicación', icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'followup', label: 'Seguimiento', icon: RefreshCcw, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'doc_rx', label: 'Recepción Docs', icon: Download, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'doc_tx', label: 'Envío Docs', icon: Upload, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'review', label: 'Revisión Documento', icon: Eye, color: 'text-teal-500', bg: 'bg-teal-50' },
  { id: 'meeting', label: 'Reunión / Video', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'analysis', label: 'Análisis Legal', icon: Scale, color: 'text-slate-700', bg: 'bg-slate-100' },
  { id: 'research', label: 'Investigación', icon: BookOpen, color: 'text-sky-500', bg: 'bg-sky-50' },
  { id: 'done', label: 'Tarea Completada', icon: CheckSquare, color: 'text-green-600', bg: 'bg-green-100' },
  { id: 'minute', label: 'Generación Minuta', icon: ClipboardList, color: 'text-gray-500', bg: 'bg-gray-100' },
  { id: 'pending', label: 'Pendiente Externo', icon: Hourglass, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'reminder', label: 'Recordatorio Enviado', icon: Bell, color: 'text-pink-500', bg: 'bg-pink-50' },
];

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | undefined>(undefined);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');

  // Modals
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closureData, setClosureData] = useState({
      notes: '',
      slaRating: 100
  });

  // Routine Activity State
  const [isRoutineMenuOpen, setIsRoutineMenuOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<typeof ROUTINE_ACTIVITIES[0] | null>(null);
  const [routineNote, setRoutineNote] = useState('');

  // Timeline Input State
  const [newEventText, setNewEventText] = useState('');
  const [eventType, setEventType] = useState<'UPDATE' | 'MEETING' | 'EMAIL' | 'CALL'>('UPDATE');
  const [attachment, setAttachment] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const data = StorageService.getCaseById(id);
      setCaseData(data);
    }
  }, [id]);

  if (!caseData) return <div className="p-10 text-center">Cargando expediente...</div>;

  const progress = Math.round((caseData.stages.filter(s => s.status === StageStatus.COMPLETED).length / caseData.stages.length) * 100);

  const handleStageToggle = (stageId: string) => {
    const updatedStages = caseData.stages.map(s => {
      if (s.id === stageId) {
        return { 
          ...s, 
          status: s.status === StageStatus.COMPLETED ? StageStatus.IN_PROGRESS : StageStatus.COMPLETED,
          completedDate: s.status !== StageStatus.COMPLETED ? new Date().toISOString() : undefined
        };
      }
      return s;
    });

    const updatedCase = { ...caseData, stages: updatedStages };
    
    // Add timeline event automatically for status change
    const stage = updatedStages.find(s => s.id === stageId);
    if (stage) {
       const isComplete = stage.status === StageStatus.COMPLETED;
       StorageService.saveTimelineEvent(caseData.id, {
         id: Date.now().toString(),
         date: new Date().toISOString(),
         title: isComplete ? 'Hito Completado' : 'Hito Reactivado',
         description: `Se actualizó el estado de la etapa: "${stage.title}" a ${isComplete ? 'Completado' : 'En Progreso'}.`,
         type: 'STATUS_CHANGE',
         author: 'System',
         metadata: { previousStatus: isComplete ? 'En Progreso' : 'Completado', newStatus: stage.status }
       });
       updatedCase.timeline = StorageService.getCaseById(caseData.id)?.timeline || [];
    }

    StorageService.updateCase(updatedCase);
    setCaseData(updatedCase);
  };

  const handleGenerateUpdate = async () => {
    setLoadingAI(true);
    const text = await generateClientUpdate(caseData);
    setGeneratedText(text);
    setLoadingAI(false);
    setAiModalOpen(true);
  };

  const handleAddTimelineEvent = () => {
    if (!newEventText.trim()) return;

    const newEvent: TimelineEvent = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        title: eventType === 'UPDATE' ? 'Avance Manual' : eventType === 'MEETING' ? 'Nota de Reunión' : 'Registro de Comunicación',
        description: newEventText,
        type: eventType,
        author: 'Lawyer',
        attachments: attachment ? [attachment] : []
    };

    StorageService.saveTimelineEvent(caseData.id, newEvent);
    setCaseData({
        ...caseData,
        timeline: [newEvent, ...caseData.timeline]
    });
    setNewEventText('');
    setAttachment(null);
  };

  const handleAttachFile = () => {
      const fileName = `Documento_Adjunto_${Math.floor(Math.random() * 100)}.pdf`;
      setAttachment(fileName);
  };

  // Routine Activity Logic
  const handleRoutineClick = (routine: typeof ROUTINE_ACTIVITIES[0]) => {
    setSelectedRoutine(routine);
    setRoutineNote(''); // Reset note
    setRoutineModalOpen(true);
    setIsRoutineMenuOpen(false);
  };

  const saveRoutineEvent = () => {
    if (!selectedRoutine) return;

    const newEvent: TimelineEvent = {
       id: `RTN-${Date.now()}`,
       date: new Date().toISOString(),
       title: selectedRoutine.label,
       description: routineNote || 'Actividad registrada sin notas adicionales.',
       type: 'ROUTINE',
       author: 'Lawyer',
       attachments: attachment ? [attachment] : [],
       metadata: { routineIcon: selectedRoutine.id }
    };

    StorageService.saveTimelineEvent(caseData.id, newEvent);
    setCaseData({
       ...caseData,
       timeline: [newEvent, ...caseData.timeline]
    });
    setRoutineModalOpen(false);
    setAttachment(null);
  };

  const handleCloseService = () => {
     // Workflow 3: Closure
     const closureEvent: TimelineEvent = {
        id: `CLOSE-${Date.now()}`,
        date: new Date().toISOString(),
        title: 'Servicio Finalizado',
        description: `Cierre formal del expediente. Notas finales: ${closureData.notes}`,
        type: 'CLOSURE',
        author: 'Lawyer',
        metadata: { slaLimit: `${closureData.slaRating}%` }
     };

     const updatedCase = {
        ...caseData,
        status: CaseStatus.COMPLETED,
        timeline: [closureEvent, ...caseData.timeline],
        stages: caseData.stages.map(s => ({...s, status: StageStatus.COMPLETED})) // Mark all as done
     };

     StorageService.updateCase(updatedCase);
     setCaseData(updatedCase);
     setCloseModalOpen(false);
  };

  const calculateDuration = () => {
      const start = new Date(caseData.startDate);
      const end = new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
         <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gold transition-colors">
            <ArrowLeft size={18} className="mr-2" /> Volver
         </button>
         {caseData.status === CaseStatus.ACTIVE && (
            <button 
               onClick={() => setCloseModalOpen(true)}
               className="text-xs font-bold text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors border border-gray-200 px-3 py-1.5 rounded-lg hover:border-red-200"
            >
               <Archive size={14} /> Finalizar Servicio
            </button>
         )}
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
           <div className="h-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif font-bold text-gray-900">{caseData.serviceName}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${caseData.status === CaseStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-gold/10 text-gold-dark'}`}>
                 {caseData.status}
              </span>
            </div>
            <p className="text-gray-500 mt-2 font-mono text-sm">{caseData.folio} • {progress}% Completado</p>
            {caseData.specificGoal && (
               <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm text-gray-600 max-w-2xl">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Objetivo Específico</span>
                  {caseData.specificGoal}
               </div>
            )}
          </div>
          
          <button 
            onClick={handleGenerateUpdate}
            disabled={loadingAI}
            className="mt-4 md:mt-0 flex items-center space-x-2 bg-gradient-to-r from-gold to-gold-dark text-white px-6 py-3 rounded-full shadow-lg shadow-gold/30 hover:shadow-xl transition-all disabled:opacity-70"
          >
            {loadingAI ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <Sparkles size={18} />
            )}
            <span>Generar Reporte IA</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-gray-200 px-4">
        <button 
          onClick={() => setActiveTab('details')}
          className={`pb-4 font-medium transition-colors ${activeTab === 'details' ? 'text-gold border-b-2 border-gold' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Detalles y Etapas
        </button>
        <button 
          onClick={() => setActiveTab('timeline')}
          className={`pb-4 font-medium transition-colors ${activeTab === 'timeline' ? 'text-gold border-b-2 border-gold' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Línea de Tiempo
        </button>
      </div>

      {/* Content */}
      <div className="animate-fadeIn">
        {activeTab === 'details' ? (
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-serif font-bold mb-6">Plan de Trabajo</h3>
            <div className="space-y-4">
              {caseData.stages.map((stage) => (
                <div key={stage.id} className={`flex items-start p-4 rounded-xl border transition-all ${stage.status === StageStatus.COMPLETED ? 'bg-green-50/50 border-green-100' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                  <button 
                    onClick={() => handleStageToggle(stage.id)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${stage.status === StageStatus.COMPLETED ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent hover:border-gold'}`}
                  >
                    <CheckCircle size={14} />
                  </button>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className={`font-medium text-lg ${stage.status === StageStatus.COMPLETED ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{stage.title}</h4>
                      {stage.dueDate && (
                        <span className={`text-xs flex items-center ${new Date(stage.dueDate) < new Date() && stage.status !== StageStatus.COMPLETED ? 'text-red-500' : 'text-gray-400'}`}>
                          <Clock size={12} className="mr-1" />
                          {new Date(stage.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                       <span className={`text-xs px-2 py-0.5 rounded border ${
                         stage.priority === Priority.HIGH ? 'bg-red-50 border-red-100 text-red-600' : 
                         stage.priority === Priority.MEDIUM ? 'bg-yellow-50 border-yellow-100 text-yellow-600' : 
                         'bg-gray-50 border-gray-200 text-gray-500'
                       }`}>{stage.priority}</span>
                       <span className="text-xs text-gray-400">{stage.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
             {/* One-Click Action & Manual Entry */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                
                {/* Routine Activities Toggle */}
                <div>
                   <button 
                     onClick={() => setIsRoutineMenuOpen(!isRoutineMenuOpen)}
                     className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gold transition-colors mb-4"
                   >
                      <Zap size={16} className={isRoutineMenuOpen ? 'text-gold fill-gold' : 'text-gray-400'} />
                      Actividades Rutinarias (One-Click)
                      <ChevronDown size={14} className={`transition-transform ${isRoutineMenuOpen ? 'rotate-180' : ''}`} />
                   </button>
                   
                   {isRoutineMenuOpen && (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6 animate-fadeIn">
                         {ROUTINE_ACTIVITIES.map(action => (
                            <button
                              key={action.id}
                              onClick={() => handleRoutineClick(action)}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border border-transparent transition-all hover:shadow-md hover:border-gray-100 ${action.bg} hover:bg-white`}
                            >
                               <action.icon size={20} className={`mb-2 ${action.color}`} />
                               <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{action.label}</span>
                            </button>
                         ))}
                      </div>
                   )}
                </div>

                {/* Manual Entry */}
                <div className="relative border-t border-gray-50 pt-4">
                    <div className="flex gap-2 mb-3">
                      <EventTypeButton active={eventType === 'UPDATE'} onClick={() => setEventType('UPDATE')} label="Avance" icon={<RefreshCcw size={14}/>} />
                      <EventTypeButton active={eventType === 'MEETING'} onClick={() => setEventType('MEETING')} label="Nota Interna" icon={<MessageSquare size={14}/>} />
                      <EventTypeButton active={eventType === 'EMAIL'} onClick={() => setEventType('EMAIL')} label="Comunicación" icon={<Mail size={14}/>} />
                    </div>
                   <textarea 
                     className="w-full p-4 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-sm resize-none"
                     placeholder="Escriba un comentario manual..."
                     rows={2}
                     value={newEventText}
                     onChange={(e) => setNewEventText(e.target.value)}
                   />
                   <div className="absolute bottom-3 right-3 flex gap-2">
                      <button 
                        onClick={handleAttachFile}
                        title="Adjuntar Archivo"
                        className={`p-2 rounded-lg transition-colors ${attachment ? 'bg-blue-50 text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                         <Paperclip size={18} />
                      </button>
                      <button 
                        onClick={handleAddTimelineEvent}
                        disabled={!newEventText.trim()}
                        className="bg-gold hover:bg-gold-dark text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                         <Send size={18} />
                      </button>
                   </div>
                </div>
                {attachment && (
                   <div className="mt-2 flex items-center text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-lg w-fit">
                      <Paperclip size={12} className="mr-2" /> {attachment}
                      <button onClick={() => setAttachment(null)} className="ml-2 hover:text-red-500"><X size={12}/></button>
                   </div>
                )}
             </div>

             {/* Timeline Stream */}
             <div className="relative pl-8 space-y-8">
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-4 bottom-0 w-0.5 bg-gray-200"></div>

                {caseData.timeline.map((event, index) => (
                  <TimelineItem key={event.id} event={event} isLast={index === caseData.timeline.length - 1} />
                ))}
                
                {caseData.timeline.length === 0 && (
                   <div className="text-center py-10 text-gray-400 text-sm">No hay eventos registrados aún.</div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Routine Activity Modal (Pre-Save) */}
      <Modal isOpen={routineModalOpen} onClose={() => setRoutineModalOpen(false)} title="Registrar Actividad" width="max-w-md">
         {selectedRoutine && (
            <div className="space-y-4">
               <div className={`flex items-center gap-3 p-4 rounded-xl ${selectedRoutine.bg}`}>
                  <selectedRoutine.icon size={24} className={selectedRoutine.color} />
                  <div>
                     <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Actividad</p>
                     <h3 className="text-lg font-bold text-gray-900">{selectedRoutine.label}</h3>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nota Opcional / Evidencia</label>
                  <textarea 
                     autoFocus
                     className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-sm resize-none"
                     rows={3}
                     placeholder="Agregar detalles adicionales..."
                     value={routineNote}
                     onChange={(e) => setRoutineNote(e.target.value)}
                  />
               </div>

               <div className="flex justify-between items-center">
                  <button 
                     onClick={handleAttachFile}
                     className={`flex items-center gap-2 text-xs font-bold ${attachment ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                     <Paperclip size={14} /> {attachment ? 'Archivo adjunto' : 'Adjuntar archivo'}
                  </button>
                  {attachment && <button onClick={() => setAttachment(null)} className="text-red-400 hover:text-red-600"><X size={14}/></button>}
               </div>

               <button 
                  onClick={saveRoutineEvent}
                  className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gold transition-colors shadow-lg"
               >
                  Confirmar Registro
               </button>
            </div>
         )}
      </Modal>

      {/* AI Update Modal */}
      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title="Redacción Automática">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800">
            Gemini ha analizado el progreso del caso y sugiere el siguiente mensaje.
          </div>
          <textarea 
            className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold focus:border-transparent font-sans text-gray-700 leading-relaxed resize-none bg-gray-50"
            value={generatedText}
            onChange={(e) => setGeneratedText(e.target.value)}
          />
          <div className="flex gap-4 pt-2">
            <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl flex items-center justify-center space-x-2 font-medium transition-colors">
              <Send size={18} />
              <span>Enviar por WhatsApp</span>
            </button>
            <button className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl flex items-center justify-center space-x-2 font-medium transition-colors">
              <Mail size={18} />
              <span>Copiar a Correo</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Close Case Modal - Workflow 3 */}
      <Modal isOpen={closeModalOpen} onClose={() => setCloseModalOpen(false)} title="Cierre de Servicio" width="max-w-xl">
         <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-4">
               <div>
                  <div className="text-xs text-gray-400 uppercase font-bold">Tiempo Total</div>
                  <div className="text-lg font-bold text-gray-800">{calculateDuration()} Días</div>
               </div>
               <div>
                  <div className="text-xs text-gray-400 uppercase font-bold">Estatus Final</div>
                  <div className="text-lg font-bold text-green-600">Completado</div>
               </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Notas Finales / Evidencia</label>
               <textarea 
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-sm h-32 resize-none"
                  placeholder="Resumen del cierre y ubicación de archivos finales..."
                  value={closureData.notes}
                  onChange={(e) => setClosureData({...closureData, notes: e.target.value})}
               />
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Evaluación de Cumplimiento (SLA)</label>
               <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={closureData.slaRating} 
                  onChange={(e) => setClosureData({...closureData, slaRating: parseInt(e.target.value)})}
                  className="w-full accent-gold"
               />
               <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Bajo (0%)</span>
                  <span className="font-bold text-gold">{closureData.slaRating}%</span>
                  <span>Excelente (100%)</span>
               </div>
            </div>

            <button 
               onClick={handleCloseService}
               className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-gray-800 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
            >
               <CheckCircle2 size={18} /> Confirmar Cierre
            </button>
         </div>
      </Modal>
    </div>
  );
};

// Timeline Components
const EventTypeButton = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: any }) => (
   <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
         active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
      }`}
   >
      {icon} {label}
   </button>
);

const TimelineItem: React.FC<{ event: TimelineEvent; isLast: boolean }> = ({ event, isLast }) => {
   const [expanded, setExpanded] = useState(false);

   const getEventStyle = (type: string, metadata?: any) => {
      // Handle Routine Icons dynamically
      if (type === 'ROUTINE' && metadata?.routineIcon) {
         const routine = ROUTINE_ACTIVITIES.find(r => r.id === metadata.routineIcon);
         if (routine) {
            return { 
               icon: <routine.icon size={14} />, 
               bg: routine.bg.replace('bg-', 'bg-').replace('50', '500'), // Quick hack to map 50 to 500 for dot bg
               border: `border-${routine.color.split('-')[1]}-500`,
               text: routine.color
            };
         }
      }

      switch(type) {
         case 'CREATION': return { icon: <Flag size={14} />, bg: 'bg-gold', border: 'border-gold', text: 'text-gold-dark' };
         case 'SLA_WARNING': return { icon: <AlertTriangle size={14} />, bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-600' };
         case 'STATUS_CHANGE': return { icon: <CheckCircle size={14} />, bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-600' };
         case 'DELEGATION': return { icon: <UserPlus size={14} />, bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600' };
         case 'CLOSURE': return { icon: <Archive size={14} />, bg: 'bg-gray-800', border: 'border-gray-800', text: 'text-gray-800' };
         case 'DOCUMENT': return { icon: <Paperclip size={14} />, bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-600' };
         case 'ROUTINE': return { icon: <Zap size={14} />, bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-600' };
         default: return { icon: <FileText size={14} />, bg: 'bg-gray-900', border: 'border-gray-900', text: 'text-gray-900' };
      }
   };

   const style = getEventStyle(event.type, event.metadata);

   // Fix for the bg color hack if it fails or produces invalid class
   const safeBg = style.bg.startsWith('bg-') ? style.bg : 'bg-gray-900';

   return (
      <div className="relative group">
         {/* Dot on Line */}
         <div className={`absolute -left-[29px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 flex items-center justify-center ${safeBg} text-white`}>
            {style.icon}
         </div>

         {/* Card */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
               <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${style.text}`}>{event.type.replace('_', ' ')}</div>
                  <h4 className="font-bold text-gray-900 text-sm">{event.title}</h4>
               </div>
               <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(event.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>

            <p className={`text-sm text-gray-600 leading-relaxed ${!expanded && 'line-clamp-2'}`}>
               {event.description}
            </p>
            
            {/* Metadata Chips */}
            {event.metadata && (
               <div className="flex flex-wrap gap-2 mt-3">
                  {event.metadata.slaLimit && (
                     <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100 flex items-center gap-1">
                        <AlertTriangle size={10} /> SLA: {event.metadata.slaLimit}
                     </span>
                  )}
                  {event.metadata.delegatedTo && (
                     <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 flex items-center gap-1">
                        <UserPlus size={10} /> Asignado: {event.metadata.delegatedTo}
                     </span>
                  )}
               </div>
            )}

            {/* Attachments */}
            {event.attachments && event.attachments.length > 0 && (
               <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
                  {event.attachments.map((file, idx) => (
                     <div key={idx} className="flex items-center gap-2 text-xs text-blue-600 hover:underline cursor-pointer">
                        <Paperclip size={12} /> {file}
                     </div>
                  ))}
               </div>
            )}

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
               <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[8px] text-gray-600">{event.author[0]}</div>
                  {event.author === 'Lawyer' ? 'Abogado' : event.author === 'System' ? 'Sistema' : 'Cliente'}
               </div>
               
               {event.description.length > 100 && (
                  <button onClick={() => setExpanded(!expanded)} className="hover:text-gold transition-colors flex items-center gap-1">
                     {expanded ? 'Ver menos' : 'Ver más'} <ChevronDown size={12} className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
               )}
            </div>
         </div>
      </div>
   );
};

export default CaseDetail;
