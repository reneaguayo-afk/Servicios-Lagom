import React, { useEffect, useState, useMemo } from 'react';
import { StorageService } from '../../services/storage';
import { Case, Client, CaseStatus, ClientType, FirmProfile, ServiceTemplate, LibraryDocument, StageStatus, TimelineEvent } from '../../types';
import { 
  User, Briefcase, Calendar, Plus, Book, DollarSign, 
  Clock, ArrowRight, Activity, FileText, Building2, 
  Shield, Key, Save, MapPin, Mail, Phone, Lock,
  MessageCircle, MessageSquare, ArrowUpRight, CheckCircle2, AlertTriangle, Layers, File, Image, Download, BookOpen, LogOut, ArrowLeft, CreditCard, Wallet, TrendingUp, Bell, X, Send, Sparkles, Info,
  Search, Eye, RefreshCcw, Upload, Users, Scale, CheckSquare, ClipboardList, Hourglass, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/Modal';

// Mapeo de iconos para actividades rutinarias (Consistente con Admin)
const ACTIVITY_ICONS: Record<string, any> = {
  call: Phone,
  comms: MessageSquare,
  followup: RefreshCcw,
  doc_rx: Download,
  doc_tx: Upload,
  review: Eye,
  meeting: Users,
  analysis: Scale,
  research: BookOpen,
  done: CheckSquare,
  minute: ClipboardList,
  pending: Hourglass,
  reminder: Bell,
};

const ClientDashboard = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [services, setServices] = useState<ServiceTemplate[]>([]);
  const [libraryDocs, setLibraryDocs] = useState<LibraryDocument[]>([]);
  const [firmProfile, setFirmProfile] = useState<FirmProfile | null>(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  
  // Modal for consultation confirmation
  const [inquiryModal, setInquiryModal] = useState<{ isOpen: boolean; service: ServiceTemplate | null }>({ isOpen: false, service: null });
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Category Filter State
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('Todos');
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState('Todos');

  useEffect(() => {
    const clientId = localStorage.getItem('lagom_current_client');
    if (!clientId) {
      navigate('/client/login');
      return;
    }

    const clients = StorageService.getClients();
    const currentClient = clients.find(c => c.id === clientId);
    
    if (!currentClient || currentClient.accessEnabled === false) {
        localStorage.removeItem('lagom_current_client');
        navigate('/client/login');
        return;
    }

    setClient(currentClient);
    setCases(StorageService.getCasesByClientId(clientId));
    setServices(StorageService.getServices());
    setFirmProfile(StorageService.getFirmProfile());

    const allDocs = StorageService.getLibraryDocuments();
    const myDocs = allDocs.filter(doc => 
       doc.targetAudience === 'ALL' || (doc.allowedClientIds && doc.allowedClientIds.includes(clientId))
    );
    setLibraryDocs(myDocs);

  }, [navigate]);

  // Financial Calculations
  const financialData = useMemo(() => {
    let totalInvested = 0;
    let pendingBalance = 0;
    const allTransactions: any[] = [];
    const pendingCases: any[] = [];

    cases.forEach(c => {
        const paid = c.payments.reduce((sum, p) => sum + p.amount, 0);
        totalInvested += paid;
        const remaining = c.totalCost - paid;
        
        if (remaining > 0 && c.status !== CaseStatus.ARCHIVED) {
            pendingBalance += remaining;
            pendingCases.push({ ...c, paid, remaining });
        }

        c.payments.forEach(p => {
            allTransactions.push({
                ...p,
                caseName: c.serviceName,
                folio: c.folio
            });
        });
    });

    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { totalInvested, pendingBalance, allTransactions, pendingCases };
  }, [cases]);

  // Predictive Logic Helper
  const getPrediction = (c: Case) => {
    const service = services.find(s => s.name === c.serviceName);
    const durationStr = service?.estimatedDuration || '4 weeks';
    const weeks = parseInt(durationStr) || 4;
    const startDate = new Date(c.startDate);
    const estimatedEndDate = new Date(startDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
    
    const varianceDays = Math.ceil(weeks * 7 * 0.15);
    const minDate = new Date(estimatedEndDate.getTime() - varianceDays * 24 * 60 * 60 * 1000);
    const maxDate = new Date(estimatedEndDate.getTime() + varianceDays * 24 * 60 * 60 * 1000);

    return { estimatedEndDate, minDate, maxDate, weeks };
  };

  if (!client) return null;

  const activeCasesCount = cases.filter(c => c.status === CaseStatus.ACTIVE).length;
  const historyCount = cases.filter(c => c.status !== CaseStatus.ACTIVE).length;

  // Filters
  const serviceCategories = ['Todos', ...Array.from(new Set(services.map(s => s.category || 'Otros')))];
  const filteredServices = selectedServiceCategory === 'Todos' ? services : services.filter(s => (s.category || 'Otros') === selectedServiceCategory);

  const libraryCategories = ['Todos', ...Array.from(new Set(libraryDocs.map(d => d.category || 'General')))];
  const filteredLibraryDocs = selectedLibraryCategory === 'Todos' ? libraryDocs : libraryDocs.filter(d => (d.category || 'General') === selectedLibraryCategory);

  const handleServiceInquiry = (service: ServiceTemplate, channel: 'whatsapp' | 'email') => {
    const phoneStr = firmProfile?.phone || '';
    const firmPhone = phoneStr.replace(/[^0-9]/g, '') || '525512345678'; 
    const firmEmail = firmProfile?.email || 'contacto@lagom-legal.mx';
    const message = `Hola, soy ${client.name} (ID: ${client.id}). Estoy interesado en contratar el servicio: ${service.name}. ¿Podrían brindarme más información?`;

    if (channel === 'whatsapp') {
        window.open(`https://wa.me/${firmPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
        window.location.href = `mailto:${firmEmail}?subject=Interés en servicio: ${service.name}&body=${message}`;
    }
    
    setInquiryModal({ isOpen: false, service: null });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleAdminContact = (reason: string) => {
    const phoneStr = firmProfile?.phone || '';
    const firmPhone = phoneStr.replace(/[^0-9]/g, '') || '525512345678';
    const message = `Hola, soy ${client.name} (ID: ${client.id}). Me comunico para: ${reason}.`;
    window.open(`https://wa.me/${firmPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getFileIcon = (type: string) => {
    switch(type) {
        case 'PDF': return <FileText size={20} className="text-red-500" />;
        case 'IMG': return <Image size={20} className="text-blue-500" />;
        case 'DOC': return <FileText size={20} className="text-blue-700" />;
        default: return <File size={20} className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] font-sans text-gray-600 pb-20">
      
      {/* Success Notification Toast */}
      {showSuccess && (
        <div className="fixed top-24 right-10 z-[9999] animate-fadeIn">
            <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                    <CheckCircle2 size={16} />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Solicitud Enviada</p>
                    <p className="text-[10px] text-gray-400">Un abogado se pondrá en contacto pronto.</p>
                </div>
            </div>
        </div>
      )}

      {/* Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
         <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
             <div className="flex items-center gap-12">
                 <h1 className="font-serif text-2xl font-bold text-gray-900 tracking-tight cursor-default">Lagom Co.</h1>
                 
                 <div className="hidden md:flex items-center gap-8">
                    <NavTab icon={<Briefcase size={16}/>} label="Mis Servicios" active={activeTab === 'services'} onClick={() => { setActiveTab('services'); setSelectedCase(null); }} />
                    <NavTab icon={<DollarSign size={16}/>} label="Finanzas" active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} />
                    <NavTab icon={<Plus size={16}/>} label="Catálogo" active={activeTab === 'new'} onClick={() => setActiveTab('new')} />
                    <NavTab icon={<Book size={16}/>} label="Biblioteca" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
                    <NavTab icon={<Calendar size={16}/>} label="Agenda" active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} />
                 </div>
             </div>

             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${activeTab === 'profile' ? 'bg-gold/10 text-gold-dark' : 'hover:bg-gray-50 text-gray-500'}`}
                >
                    <User size={18} />
                    <span className="text-xs font-bold uppercase tracking-wide">Perfil</span>
                </button>
                <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                <button onClick={() => { localStorage.removeItem('lagom_current_client'); navigate('/'); }} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full" title="Cerrar Sesión">
                    <LogOut size={18} />
                </button>
             </div>
         </div>

         <div className="md:hidden overflow-x-auto no-scrollbar border-t border-gray-50 bg-white">
            <div className="flex px-6 py-0 min-w-max">
              <NavTabMobile label="Servicios" icon={<Briefcase size={16}/>} active={activeTab === 'services'} onClick={() => { setActiveTab('services'); setSelectedCase(null); }} />
              <NavTabMobile label="Finanzas" icon={<DollarSign size={16}/>} active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} />
              <NavTabMobile label="Catálogo" icon={<Plus size={16}/>} active={activeTab === 'new'} onClick={() => setActiveTab('new')} />
              <NavTabMobile label="Biblioteca" icon={<Book size={16}/>} active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
              <NavTabMobile label="Agenda" icon={<Calendar size={16}/>} active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} />
              <NavTabMobile label="Perfil" icon={<User size={16}/>} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            </div>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-12 animate-fadeIn">
      
      {activeTab === 'services' && (
        <>
          {selectedCase ? (
            <div className="animate-fadeIn pb-12">
               <button 
                 onClick={() => setSelectedCase(null)}
                 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-gold uppercase tracking-widest mb-8 transition-colors"
               >
                  <ArrowLeft size={12} /> Volver a mis servicios
               </button>

               {/* Case Header Card */}
               <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.05)] border border-gray-100 mb-8 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                       <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider">
                          {selectedCase.folio}
                       </span>
                       <span className="ml-auto px-3 py-1 bg-green-50/50 border border-green-100 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-wider flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          Expediente {selectedCase.status === 'Active' ? 'Activo' : selectedCase.status}
                       </span>
                    </div>

                    <h1 className="font-serif text-4xl md:text-5xl font-medium text-gray-900 mb-4 tracking-tight">
                       {selectedCase.serviceName}
                    </h1>
                    
                    <div className="flex items-center gap-6 mb-12">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                         <User size={16} />
                         <span>{client.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                         <Calendar size={16} />
                         <span>Inició el {new Date(selectedCase.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Overall Progress & Prediction */}
                    {(() => {
                      const prediction = getPrediction(selectedCase);
                      const realProgress = Math.round((selectedCase.stages.filter(s => s.status === 'Completed').length / selectedCase.stages.length) * 100);
                      
                      return (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 relative">
                           <div className="lg:col-span-2">
                              <div className="flex justify-between items-end mb-4">
                                 <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avance del Proceso</span>
                                    <div className="group relative">
                                       <Info size={12} className="text-gray-300 cursor-help" />
                                       <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 text-white text-[10px] p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                          Representa los hitos legales completados y validados por su abogado.
                                       </div>
                                    </div>
                                 </div>
                                 <span className="font-serif text-3xl font-bold text-gold">{realProgress}%</span>
                              </div>
                              
                              <div className="relative h-3">
                                 <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
                                 <div className="absolute left-0 top-0 h-full bg-gold rounded-full transition-all duration-1000 ease-out z-10" style={{ width: `${realProgress}%` }}>
                                    <div className="absolute top-0 right-0 h-full w-2 bg-white/30 animate-pulse"></div>
                                 </div>
                                 <div className="absolute h-full rounded-full bg-gradient-to-r from-gold/40 to-transparent animate-pulse z-0" style={{ left: `${realProgress}%`, width: `${Math.min(100 - realProgress, 25)}%`, borderTopRightRadius: '9999px', borderBottomRightRadius: '9999px' }}></div>
                              </div>
                              
                              <div className="mt-4 flex items-center gap-2">
                                 <Sparkles size={14} className="text-gold" />
                                 <span className="text-[10px] font-bold text-gold-dark uppercase tracking-widest">Zona de progreso proyectado según tiempos históricos</span>
                              </div>
                           </div>

                           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                 <Clock size={12} /> Conclusión Estimada
                              </div>
                              <div className="font-serif text-xl font-bold text-gray-900">
                                 {prediction.minDate.toLocaleDateString('es-ES', { month: 'short' })} - {prediction.maxDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                              </div>
                           </div>
                        </div>
                      );
                    })()}
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* LEFT: Timeline of Stages */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                          <h3 className="font-serif text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Clock size={24} className="text-gold" /> Seguimiento del Proceso
                          </h3>
                        </div>

                        <div className="space-y-0 relative">
                            <div className="absolute left-[19px] top-4 bottom-10 w-0.5 bg-gray-100"></div>

                            {selectedCase.stages.map((stage, idx) => {
                              const isCompleted = stage.status === 'Completed';
                              const isInProgress = stage.status === 'In Progress';
                              const isFuture = stage.status === 'Pending';
                              
                              return (
                                  <div key={idx} className="relative pl-16 pb-14 last:pb-0 group">
                                    <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-colors duration-300 ${
                                        isCompleted ? 'bg-gold text-white' : 
                                        isInProgress ? 'bg-white border-gold text-gold ring-4 ring-gold/10' : 
                                        'bg-gray-50 border-gray-200 text-gray-300'
                                    }`}>
                                        {isCompleted ? <CheckCircle2 size={18} strokeWidth={3} /> : 
                                        isInProgress ? <div className="w-2.5 h-2.5 bg-gold rounded-full animate-pulse"></div> : 
                                        <div className="w-2.5 h-2.5 bg-gray-200 rounded-full"></div>}
                                    </div>

                                    <div className="flex flex-col">
                                        <h4 className={`text-lg font-serif font-bold mb-2 transition-colors ${isCompleted || isInProgress ? 'text-gray-900' : 'text-gray-400'}`}>
                                            <span className="text-sm text-gray-300 mr-2 font-sans font-normal">{idx + 1}.</span> {stage.title}
                                        </h4>
                                        <p className={`text-sm leading-relaxed mb-4 transition-colors ${isCompleted || isInProgress ? 'text-gray-500' : 'text-gray-400 italic font-light'}`}>
                                            {isFuture ? 'Etapa proyectada para la continuidad del trámite.' : (stage.description || 'Descripción no disponible.')}
                                        </p>
                                        
                                        {isCompleted && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-wider bg-green-50 w-fit px-3 py-1.5 rounded-lg">
                                              <CheckCircle2 size={12} /> Finalizado: {stage.completedDate ? new Date(stage.completedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha no registrada'}
                                            </div>
                                        )}
                                        
                                        {isInProgress && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gold-dark uppercase tracking-wider bg-gold/10 w-fit px-3 py-1.5 rounded-lg">
                                              <Calendar size={12} /> Entrega Estimada: {stage.dueDate ? new Date(stage.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Próximamente'}
                                            </div>
                                        )}
                                    </div>
                                  </div>
                              );
                            })}
                        </div>
                    </div>
                  </div>

                  {/* RIGHT: Routine Activity Log */}
                  <div className="lg:col-span-5 space-y-6">
                     <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                           <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-3">
                              <Activity size={20} className="text-gold" /> Bitácora de Trabajo
                           </h3>
                        </div>

                        <div className="space-y-6 relative flex-1">
                           {/* Vertical Line */}
                           <div className="absolute left-[15px] top-2 bottom-8 w-px bg-gray-100"></div>

                           {selectedCase.timeline.length > 0 ? (
                              selectedCase.timeline.filter(e => e.type !== 'CREATION').slice(0, 8).map((event, idx) => {
                                 // Determine Icon based on type or routine icon metadata
                                 const IconComp = (event.type === 'ROUTINE' && event.metadata?.routineIcon) 
                                    ? ACTIVITY_ICONS[event.metadata.routineIcon] || Zap 
                                    : (event.type === 'MEETING' ? Users : event.type === 'EMAIL' ? Mail : event.type === 'CALL' ? Phone : Activity);
                                 
                                 return (
                                    <div key={idx} className="relative pl-10 group">
                                       <div className="absolute left-0 top-0 w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-gold group-hover:border-gold/30 group-hover:bg-gold/5 transition-all z-10 shadow-sm">
                                          <IconComp size={14} />
                                       </div>
                                       
                                       <div className="bg-gray-50/30 rounded-2xl p-4 border border-gray-50 group-hover:border-gray-100 group-hover:bg-white transition-all">
                                          <div className="flex justify-between items-start mb-1">
                                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{event.title}</span>
                                             <span className="text-[9px] font-mono text-gray-300">{new Date(event.date).toLocaleDateString()}</span>
                                          </div>
                                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{event.description}</p>
                                          
                                          {event.attachments && event.attachments.length > 0 && (
                                             <div className="mt-2 flex items-center gap-2 text-[10px] text-blue-500 font-bold">
                                                <FileText size={10} /> {event.attachments.length} Documento(s) adjunto(s)
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                 );
                              })
                           ) : (
                              <div className="text-center py-20">
                                 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
                                    <Clock size={24} />
                                 </div>
                                 <p className="text-xs text-gray-400 italic">No hay actualizaciones granulares registradas aún.</p>
                              </div>
                           )}
                        </div>

                        {selectedCase.timeline.length > 8 && (
                           <div className="mt-8 pt-4 border-t border-gray-50 text-center">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mostrando últimas 8 actividades</p>
                           </div>
                        )}
                     </div>
                  </div>

               </div>
            </div>
          ) : (
            // GRID VIEW DASHBOARD
            <div className="space-y-10">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
                 <div className="w-full md:w-auto text-center md:text-left relative z-10">
                   <span className="inline-block px-3 py-1 rounded-full bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 border border-gray-100">Portal de Cliente</span>
                   <h1 className="font-serif text-4xl md:text-5xl font-medium text-gray-900 mb-3 tracking-tight">Hola, {client.name.split(' ')[0]}</h1>
                   <p className="text-gray-500 font-light max-w-md text-sm">Bienvenido de nuevo. Aquí tiene el resumen de su actividad legal y el estado de sus expedientes.</p>
                 </div>
                 <div className="flex gap-12 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-12 relative z-10">
                    <div className="text-center group cursor-default">
                       <div className="text-4xl font-serif font-bold text-gray-900 mb-1 group-hover:text-gold transition-colors">{activeCasesCount}</div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Activos</div>
                    </div>
                    <div className="text-center group cursor-default">
                       <div className="text-4xl font-serif font-bold text-gray-900 mb-1 group-hover:text-gold transition-colors">{historyCount}</div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Histórico</div>
                    </div>
                 </div>
              </div>

              <div>
                 <h2 className="font-serif text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold"><Briefcase size={16} /></div>
                    Expedientes en Curso
                 </h2>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cases.filter(c => c.status === CaseStatus.ACTIVE).map((c) => {
                       const progress = Math.round((c.stages.filter(s => s.status === 'Completed').length / c.stages.length) * 100);
                       const lastActivity = c.timeline.length > 0 ? c.timeline[0] : null;

                       return (
                          <div 
                              key={c.id} 
                              onClick={() => setSelectedCase(c)}
                              className="group bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
                          >
                                <div className="flex justify-between items-start mb-6">
                                   <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-100 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> En Proceso
                                   </span>
                                   <span className="text-[10px] text-gray-300 font-mono">{c.folio}</span>
                                </div>

                                <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2 group-hover:text-gold transition-colors">{c.serviceName}</h3>
                                
                                <div className="flex items-center gap-4 mb-8">
                                   <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-gray-900 rounded-full group-hover:bg-gold transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                   </div>
                                   <span className="text-xs font-bold text-gray-900">{progress}%</span>
                                </div>

                                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 space-y-3 group-hover:bg-gray-50 transition-colors">
                                   <div className="flex items-start gap-3">
                                      <Activity size={16} className="text-gold mt-0.5" />
                                      <div>
                                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Último Avance</div>
                                         <div className="text-sm font-bold text-gray-800 line-clamp-1">{lastActivity?.title || 'Expediente Iniciado'}</div>
                                      </div>
                                   </div>
                                </div>
                                
                                <div className="mt-6 flex justify-end">
                                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-gold transition-colors flex items-center gap-2 uppercase tracking-wider">
                                        Ver Detalles <ArrowRight size={14} />
                                    </span>
                                </div>
                          </div>
                       );
                    })}
                 </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW: FINANCES */}
      {activeTab === 'finances' && (
         <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500"><Wallet size={80} className="text-gray-200" strokeWidth={1} /></div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4"><TrendingUp size={14} /> Total Invertido</div>
                      <div className="font-serif text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">${financialData.totalInvested.toLocaleString('es-MX')}</div>
                   </div>
                </div>

                <div className="bg-[#0f172a] rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500"><AlertTriangle size={80} strokeWidth={1} /></div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4"><CreditCard size={14} /> Saldo Pendiente</div>
                      <div className="font-serif text-3xl md:text-4xl font-bold text-white tracking-tight">${financialData.pendingBalance.toLocaleString('es-MX')}</div>
                   </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                   <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center text-gold mb-3"><FileText size={20} /></div>
                   <h3 className="font-bold text-gray-900 text-sm mb-1">Solicitar Recibo</h3>
                   <button onClick={() => handleAdminContact('solicitar recibo de pago reciente')} className="mt-4 text-[10px] font-bold text-gold uppercase tracking-widest hover:underline">Contactar Administración</button>
                </div>
            </div>

            {financialData.pendingCases.length > 0 && (
               <div>
                  <h3 className="font-serif text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3"><AlertTriangle size={20} className="text-red-500" /> Pagos Pendientes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {financialData.pendingCases.map((c: any) => {
                         const percentPaid = Math.round((c.paid / c.totalCost) * 100);
                         return (
                            <div key={c.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-red-100">
                               <div className="flex justify-between items-start mb-4">
                                  <div><h4 className="font-bold text-gray-900">{c.serviceName}</h4><p className="text-xs text-gray-500 font-mono">{c.folio}</p></div>
                                  <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase">Restante</p><p className="font-serif text-xl font-bold text-red-500">${c.remaining.toLocaleString()}</p></div>
                               </div>
                               <div className="space-y-2 mb-6">
                                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider"><span>Pagado: ${c.paid.toLocaleString()}</span><span>Total: ${c.totalCost.toLocaleString()}</span></div>
                                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-gray-900 h-full rounded-full" style={{ width: `${percentPaid}%` }}></div></div>
                                </div>
                               <button onClick={() => { const message = `Hola, deseo regularizar el pago pendiente de $${c.remaining.toLocaleString()} para el expediente ${c.folio}.`; window.open(`https://wa.me/${firmProfile?.phone.replace(/[^0-9]/g, '') || '525512345678'}?text=${encodeURIComponent(message)}`, '_blank'); }} className="w-full py-3 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-gold transition-all shadow-lg flex items-center justify-center gap-2"><MessageCircle size={16} /> Notificar Pago vía WhatsApp</button>
                            </div>
                         );
                     })}
                  </div>
               </div>
            )}
         </div>
      )}

      {/* VIEW: CATALOG */}
      {activeTab === 'new' && (
         <div className="space-y-10">
            <div className="text-center max-w-2xl mx-auto py-8">
               <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">Catálogo de Servicios</h2>
               <p className="text-gray-400 text-sm leading-relaxed">Soluciones legales integrales diseñadas para proteger sus intereses y potenciar su patrimonio empresarial.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
               {serviceCategories.map(cat => (<button key={cat} onClick={() => setSelectedServiceCategory(cat)} className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${selectedServiceCategory === cat ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>{cat}</button>))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {filteredServices.map(service => (
                  <div key={service.id} className="group bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                     <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-gray-100 w-fit mb-6">{service.category}</span>
                     <h3 className="font-serif text-2xl font-bold text-gray-900 mb-4 group-hover:text-gold transition-colors">{service.name}</h3>
                     <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-3 flex-1">{service.description}</p>
                     <div className="pt-8 border-t border-gray-50 mt-auto">
                        <div className="flex justify-between items-end mb-6">
                           <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Inversión Estimada</p><p className="font-serif text-2xl font-bold text-gray-900">${service.basePrice.toLocaleString()}</p></div>
                           <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tiempo</p><p className="text-sm font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{service.estimatedDuration}</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <button onClick={() => handleServiceInquiry(service, 'whatsapp')} className="py-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-600 hover:text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"><MessageCircle size={16} /> WhatsApp</button>
                           <button onClick={() => setInquiryModal({ isOpen: true, service })} className="py-3 rounded-xl bg-[#0f172a] text-white hover:bg-gold transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"><Mail size={16} /> Consultar</button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* VIEW: LIBRARY */}
      {activeTab === 'library' && (
         <div className="space-y-8">
             <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold"><BookOpen size={20} /></div><h2 className="font-serif text-3xl font-bold text-gray-900">Biblioteca Digital</h2></div>
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-gray-100 mb-8">{libraryCategories.map(cat => (<button key={cat} onClick={() => setSelectedLibraryCategory(cat)} className={`px-5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all border-b-2 ${selectedLibraryCategory === cat ? 'border-gold text-gold-dark bg-gold/5' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{cat}</button>))}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLibraryDocs.map(doc => (
                    <div key={doc.id} className="group bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gold/20 transition-all duration-300 cursor-pointer flex flex-col h-full relative">
                        <div className="mb-6"><div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-gold/10 transition-colors border border-gray-100">{getFileIcon(doc.fileType)}</div></div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold text-gold uppercase tracking-wider">{doc.category}</span><span className="w-1 h-1 rounded-full bg-gray-300"></span><span className="text-[10px] text-gray-400 font-mono">{new Date(doc.uploadDate).toLocaleDateString()}</span></div>
                            <h3 className="font-serif font-bold text-gray-900 text-xl mb-3 group-hover:text-gold transition-colors leading-tight">{doc.title}</h3>
                            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{doc.description}</p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center"><span className="text-[10px] font-bold text-gray-400 uppercase">{doc.fileType} Document</span><button className="flex items-center gap-2 text-xs font-bold text-gray-900 hover:text-gold transition-colors uppercase"><Download size={14} /> Descargar</button></div>
                    </div>
                ))}
            </div>
         </div>
      )}

      {/* VIEW: AGENDA */}
      {activeTab === 'agenda' && (
         <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center"><h2 className="font-serif text-3xl font-bold text-gray-900">Agenda Corporativa</h2><p className="text-gray-400 text-sm mt-2">Reserve citas y coordine reuniones con su equipo legal.</p></div>
            {firmProfile?.calendarUrl ? (
               <div className="bg-white rounded-[2.5rem] p-4 shadow-xl border border-gray-100 h-[700px] relative flex flex-col">
                  <div className="flex justify-end mb-4 px-2"><button onClick={() => window.open(firmProfile.calendarUrl, '_blank')} className="flex items-center gap-2 text-xs font-bold text-gold hover:text-gold-dark uppercase tracking-wider transition-colors"><ArrowUpRight size={14} /> Abrir en nueva ventana</button></div>
                  <div className="flex-1 relative rounded-2xl overflow-hidden bg-gray-50"><iframe src={firmProfile.calendarUrl} className="w-full h-full border-0 relative z-10 bg-white" title="Agenda" allow="camera; microphone; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"/></div>
               </div>
            ) : (
               <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm"><div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6"><Calendar size={40} className="text-gray-300" /></div><h3 className="font-bold text-xl text-gray-900 mb-2">Agenda no configurada</h3><p className="text-sm text-gray-400 mb-6">Por favor contacte directamente a la firma para agendar una cita.</p></div>
            )}
         </div>
      )}

      {/* VIEW: PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex items-center gap-6 mb-10 relative z-10">
                    <div className="w-20 h-20 bg-[#0f172a] rounded-[1.5rem] flex items-center justify-center text-white shadow-xl"><User size={32} strokeWidth={1.5} /></div>
                    <div><h2 className="font-serif text-3xl font-bold text-gray-900 mb-1">{client.name}</h2><div className="flex items-center gap-3 text-sm text-gray-500 font-mono"><span>{client.id}</span><span className="w-1 h-1 rounded-full bg-gray-300"></span><span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Cuenta Verificada</span></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10"><ProfileField label="Teléfono" value={client.phone} icon={<Phone size={14}/>} /><ProfileField label="RFC / Tax ID" value={client.taxId || 'No registrado'} icon={<FileText size={14}/>} /><ProfileField label="Dirección Fiscal" value={client.address || 'No registrada'} fullWidth icon={<MapPin size={14}/>} /><ProfileField label="Correo Electrónico" value={client.email} fullWidth icon={<Mail size={14}/>} /></div>
            </div>
        </div>
      )}

      </div>

      {/* Consultation Inquiry Modal */}
      <Modal isOpen={inquiryModal.isOpen} onClose={() => setInquiryModal({ isOpen: false, service: null })} title="Consultar Servicio" width="max-w-md">
        <div className="space-y-6">
            <div className="bg-gold/5 p-6 rounded-2xl border border-gold/10"><p className="text-[10px] font-bold text-gold-dark uppercase tracking-[0.2em] mb-2">Servicio de interés</p><h3 className="font-serif text-2xl font-bold text-gray-900">{inquiryModal.service?.name}</h3><p className="text-xs text-gray-500 mt-2 line-clamp-2">{inquiryModal.service?.description}</p></div>
            <div className="space-y-3"><p className="text-xs text-gray-500 text-center font-medium">¿Cómo desea ser contactado por nuestro equipo legal?</p><div className="grid grid-cols-1 gap-3"><button onClick={() => inquiryModal.service && handleServiceInquiry(inquiryModal.service, 'whatsapp')} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-green-50 text-green-700 font-bold text-xs uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all border border-green-100"><MessageCircle size={18} /> Vía WhatsApp</button><button onClick={() => inquiryModal.service && handleServiceInquiry(inquiryModal.service, 'email')} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gray-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-gold transition-all shadow-lg"><Mail size={18} /> Vía Correo Electrónico</button></div></div>
            <button onClick={() => setInquiryModal({ isOpen: false, service: null })} className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest py-2">Cerrar</button>
        </div>
      </Modal>
    </div>
  );
};

// UI Components
const NavTab = ({ icon, label, active, onClick }: any) => (
   <button onClick={onClick} className={`relative flex items-center gap-2 px-4 h-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><span className={active ? 'text-gold' : ''}>{icon}</span>{label}<span className={`absolute bottom-0 left-0 w-full h-[2px] bg-gold transform transition-transform duration-300 ${active ? 'scale-x-100' : 'scale-x-0'}`}></span></button>
);

const NavTabMobile = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex-1 min-w-[100px] py-4 border-b-2 flex flex-col items-center gap-1.5 transition-all ${active ? 'border-gold text-gray-900' : 'border-transparent text-gray-400'}`}><div className={active ? 'text-gold' : ''}>{icon}</div><span className="text-[10px] font-bold uppercase tracking-wide">{label}</span></button>
);

const ProfileField = ({ label, value, fullWidth, icon }: any) => (
    <div className={`${fullWidth ? 'col-span-full' : ''}`}><label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{icon} {label}</label><div className="text-sm font-medium text-gray-800 bg-gray-50/50 px-5 py-4 rounded-xl border border-gray-100 flex items-center">{value}</div></div>
);

export default ClientDashboard;