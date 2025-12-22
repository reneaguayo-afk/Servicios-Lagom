import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../../services/storage';
import { Case, CaseStatus, Client, ServiceTemplate, StageStatus, Priority, Stage } from '../../types';
import { Search, Plus, Filter, Calendar as CalendarIcon, ArrowRight, User, FileText, Trash2, Edit2, CheckCircle2, Clock, LayoutGrid, List } from 'lucide-react';
import { Modal } from '../../components/Modal';

const Cases = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Creation/Edit Flow State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceTemplate[]>([]);
  
  // Form Data
  const [caseData, setCaseData] = useState({
    clientId: '',
    serviceTemplateId: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '', // Mandatory Deadline
    assignee: 'Sin asignar',
    specificGoal: '', // New Field
    stages: [] as Stage[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCases(StorageService.getCases());
    setClients(StorageService.getClients());
    setServices(StorageService.getServices());
  };

  const handleOpenCreate = () => {
      setEditingCase(null);
      setCaseData({
          clientId: '',
          serviceTemplateId: '',
          startDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          assignee: '',
          specificGoal: '',
          stages: []
      });
      setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, c: Case) => {
      e.stopPropagation();
      setEditingCase(c);
      // Find template ID by name matching (fallback) or ideally store templateId in Case
      const template = services.find(s => s.name === c.serviceName);
      
      setCaseData({
          clientId: c.clientId,
          serviceTemplateId: template?.id || '',
          startDate: c.startDate.split('T')[0],
          dueDate: c.stages[c.stages.length - 1]?.dueDate?.split('T')[0] || '',
          assignee: c.assignee || '',
          specificGoal: c.specificGoal || '',
          stages: c.stages
      });
      setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm('¿Está seguro de eliminar este expediente? Esta acción no se puede deshacer.')) {
          StorageService.deleteCase(id);
          loadData();
      }
  };

  // Helper to calculate stage dates based on start date and estimated days
  const recalculateStages = (templateId: string, startDate: string) => {
      const service = services.find(s => s.id === templateId);
      if (!service) return [];

      const start = new Date(startDate);

      return service.defaultStages.map((stageTemp, idx) => {
          const due = new Date(start);
          due.setDate(due.getDate() + (stageTemp.estimatedDays || (idx + 1) * 3)); // Default logic if no estimate
          
          return {
              id: `st-${Date.now()}-${idx}`,
              title: stageTemp.title,
              description: stageTemp.description,
              status: idx === 0 ? StageStatus.IN_PROGRESS : StageStatus.PENDING,
              priority: stageTemp.defaultPriority || Priority.MEDIUM,
              dueDate: due.toISOString(),
              completedDate: undefined
          };
      });
  };

  // Handle template selection change to regenerate stages
  const handleTemplateChange = (templateId: string) => {
      const generatedStages = recalculateStages(templateId, caseData.startDate);
      const finalDate = generatedStages.length > 0 
        ? generatedStages[generatedStages.length - 1].dueDate?.split('T')[0] 
        : '';
        
      setCaseData({
          ...caseData,
          serviceTemplateId: templateId,
          stages: generatedStages,
          dueDate: finalDate || caseData.dueDate
      });
  };

  const handleStartDateChange = (date: string) => {
      // If we have a template selected, shift dates
      if (caseData.serviceTemplateId) {
          const generatedStages = recalculateStages(caseData.serviceTemplateId, date);
          const finalDate = generatedStages.length > 0 
            ? generatedStages[generatedStages.length - 1].dueDate?.split('T')[0] 
            : '';
          
          setCaseData({
              ...caseData,
              startDate: date,
              stages: generatedStages,
              dueDate: finalDate || caseData.dueDate
          });
      } else {
          setCaseData({ ...caseData, startDate: date });
      }
  };

  const handleStageChange = (index: number, field: keyof Stage, value: any) => {
      const updatedStages = [...caseData.stages];
      updatedStages[index] = { ...updatedStages[index], [field]: value };
      setCaseData({ ...caseData, stages: updatedStages });
  };

  const handleSaveCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData.clientId || (!caseData.serviceTemplateId && !editingCase)) return;

    const client = clients.find(c => c.id === caseData.clientId);
    const service = services.find(s => s.id === caseData.serviceTemplateId) || { name: editingCase?.serviceName, basePrice: editingCase?.totalCost };

    if (!client || !service) return;

    if (editingCase) {
        // Update Logic
        const updatedCase: Case = {
            ...editingCase,
            clientId: caseData.clientId,
            serviceName: service.name || editingCase.serviceName,
            specificGoal: caseData.specificGoal,
            startDate: new Date(caseData.startDate).toISOString(),
            assignee: caseData.assignee,
            stages: caseData.stages.map(s => ({
                ...s,
                // Ensure date formatting
                dueDate: s.dueDate ? new Date(s.dueDate).toISOString() : undefined
            }))
        };
        StorageService.updateCase(updatedCase);
    } else {
        // Create Logic
        StorageService.createCase({
            folio: `${client.id.split('-')[1]}-${service.name?.substring(0,3).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
            clientId: client.id,
            serviceName: service.name || 'Servicio Personalizado',
            specificGoal: caseData.specificGoal,
            status: CaseStatus.ACTIVE,
            startDate: new Date(caseData.startDate).toISOString(),
            totalCost: service.basePrice || 0,
            assignee: caseData.assignee,
            stages: caseData.stages.map(s => ({
                ...s,
                dueDate: s.dueDate ? new Date(s.dueDate).toISOString() : undefined
            }))
        });
    }

    setIsModalOpen(false);
    loadData();
  };

  const filteredCases = cases.filter(c => 
    c.folio.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-4xl font-serif font-bold text-gray-900">Expedientes</h2>
           <p className="text-gray-400 mt-2 text-sm">Gestión centralizada de casos y servicios legales.</p>
        </div>
        <button 
           onClick={handleOpenCreate}
           className="flex items-center space-x-2 bg-[#0f172a] text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 text-sm font-bold tracking-wide"
        >
          <Plus size={18} />
          <span>Nuevo Expediente</span>
        </button>
      </div>

      {/* Search & Filter & View Toggle */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por folio, cliente o servicio..." 
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all text-sm shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
            <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Vista Cuadrícula"
            >
                <LayoutGrid size={18} />
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Vista Lista"
            >
                <List size={18} />
            </button>
        </div>

        <button className="px-4 py-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 shadow-sm transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* List / Grid Container */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {filteredCases.map((c) => {
           const progress = Math.round((c.stages.filter(s => s.status === 'Completed').length / c.stages.length) * 100);
           const clientName = clients.find(cl => cl.id === c.clientId)?.name || 'Cliente';

           if (viewMode === 'list') {
               return (
                   <div 
                       key={c.id}
                       onClick={() => navigate(`/admin/cases/${c.id}`)}
                       className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gold/30 transition-all cursor-pointer flex items-center gap-6"
                   >
                       {/* Status & Folio Column */}
                       <div className="w-40 shrink-0">
                           <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border mb-1.5 ${
                               c.status === CaseStatus.ACTIVE ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                           }`}>
                               {c.status === CaseStatus.ACTIVE ? 'Activo' : c.status}
                           </span>
                           <div className="text-[10px] text-gray-400 font-mono">{c.folio}</div>
                       </div>

                       {/* Main Info Column */}
                       <div className="flex-1 min-w-0">
                           <h3 className="text-sm font-serif font-bold text-gray-900 group-hover:text-gold transition-colors truncate">
                               {c.serviceName}
                           </h3>
                           <p className="text-xs font-bold text-gray-500 truncate">{clientName}</p>
                       </div>

                       {/* Progress Column */}
                       <div className="w-32 shrink-0 hidden md:block">
                           <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                               <span>Progreso</span>
                               <span className="text-gray-900">{progress}%</span>
                           </div>
                           <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                               <div className="bg-gray-900 h-full rounded-full group-hover:bg-gold transition-colors duration-500" style={{ width: `${progress}%` }}></div>
                           </div>
                       </div>

                       {/* Assignee Column */}
                       <div className="w-32 shrink-0 hidden lg:flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px]">
                               <User size={10}/>
                           </div>
                           <span className="text-xs text-gray-500 truncate">{c.assignee || 'Sin asignar'}</span>
                       </div>

                       {/* Actions Column */}
                       <div className="flex items-center gap-2">
                           <button 
                               onClick={(e) => handleOpenEdit(e, c)}
                               className="p-2 text-gray-400 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors"
                               title="Editar"
                           >
                               <Edit2 size={14} />
                           </button>
                           <button 
                               onClick={(e) => handleDelete(e, c.id)}
                               className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                               title="Eliminar"
                           >
                               <Trash2 size={14} />
                           </button>
                           <div className="ml-2 text-gray-300 group-hover:text-gold transition-colors">
                               <ArrowRight size={16} />
                           </div>
                       </div>
                   </div>
               );
           }

           // Grid View Card
           return (
            <div 
               key={c.id}
               onClick={() => navigate(`/admin/cases/${c.id}`)}
               className="group bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
               {/* Decorative Gradient Top */}
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-100 via-gold/30 to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>

               {/* Action Buttons */}
               <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                        onClick={(e) => handleOpenEdit(e, c)}
                        className="p-2 bg-gray-50 hover:bg-gold hover:text-white rounded-full transition-colors text-gray-400"
                        title="Editar"
                  >
                        <Edit2 size={14} />
                  </button>
                  <button 
                        onClick={(e) => handleDelete(e, c.id)}
                        className="p-2 bg-gray-50 hover:bg-red-500 hover:text-white rounded-full transition-colors text-gray-400"
                        title="Eliminar"
                  >
                        <Trash2 size={14} />
                  </button>
               </div>

               <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                     c.status === CaseStatus.ACTIVE ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                     {c.status === CaseStatus.ACTIVE ? 'Activo' : c.status}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">{c.folio}</span>
               </div>
               
               <h3 className="text-lg font-serif font-bold text-gray-900 mb-1 group-hover:text-gold transition-colors truncate pr-8">
                  {c.serviceName}
               </h3>
               <p className="text-xs font-bold text-gray-500 mb-4">{clientName}</p>
               
               {c.specificGoal && (
                  <div className="mb-6 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                     <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed italic">"{c.specificGoal}"</p>
                  </div>
               )}
               
               <div className="space-y-2 mt-auto">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                     <span>Progreso</span>
                     <span className="text-gray-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                     <div 
                        className="bg-gray-900 h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-gold" 
                        style={{ width: `${progress}%` }}
                     ></div>
                  </div>
               </div>

               <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <User size={12}/>
                     </div>
                     <span className="text-xs text-gray-500">{c.assignee || 'Sin asignar'}</span>
                  </div>
                  <div className="text-xs font-bold text-gray-300 group-hover:text-gold transition-colors flex items-center gap-1">
                     Detalles <ArrowRight size={12} />
                  </div>
               </div>
            </div>
           );
        })}
      </div>

      {/* Create/Edit Case Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCase ? "Editar Expediente" : "Nuevo Expediente"} width="max-w-4xl">
         <form onSubmit={handleSaveCase} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Col: Basic Info */}
                <div className="space-y-5">
                    <div className="bg-gold/5 p-4 rounded-xl border border-gold/20 mb-4">
                        <h4 className="text-sm font-bold text-gold-dark mb-1">Configuración General</h4>
                        <p className="text-xs text-gray-500">Defina los parámetros básicos del servicio.</p>
                    </div>

                    {/* Client Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cliente</label>
                        <div className="relative">
                           <select 
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none bg-white text-sm text-gray-700 appearance-none"
                              value={caseData.clientId}
                              onChange={(e) => setCaseData({...caseData, clientId: e.target.value})}
                              required
                           >
                              <option value="">Seleccione un cliente...</option>
                              {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                           </select>
                           <ArrowRight className="absolute right-4 top-3.5 text-gray-400 pointer-events-none rotate-90" size={16} />
                        </div>
                    </div>

                    {/* Service Template */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Servicio Base</label>
                        <div className="relative">
                           <select 
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none bg-white text-sm text-gray-700 appearance-none"
                              value={caseData.serviceTemplateId}
                              onChange={(e) => handleTemplateChange(e.target.value)}
                              required
                              disabled={!!editingCase} 
                           >
                              <option value="">Seleccione el tipo de servicio...</option>
                              {services.map(s => <option key={s.id} value={s.id}>{s.name} (${s.basePrice.toLocaleString()})</option>)}
                           </select>
                           <ArrowRight className="absolute right-4 top-3.5 text-gray-400 pointer-events-none rotate-90" size={16} />
                        </div>
                    </div>

                    {/* Differentiator */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Objetivo Específico</label>
                        <textarea 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none bg-white text-sm resize-none"
                            rows={3}
                            placeholder="Describa el objetivo particular de este expediente..."
                            value={caseData.specificGoal}
                            onChange={(e) => setCaseData({...caseData, specificGoal: e.target.value})}
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Inicio</label>
                            <input 
                                type="date"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none text-sm text-gray-700"
                                value={caseData.startDate}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Abogado</label>
                            <input 
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none text-sm text-gray-700"
                                value={caseData.assignee}
                                onChange={(e) => setCaseData({...caseData, assignee: e.target.value})}
                                placeholder="Ej. Lic. Ruiz"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Col: Stages Plan */}
                <div className="bg-gray-50/50 rounded-2xl p-6 flex flex-col h-full max-h-[600px] border border-gray-100">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Plan de Trabajo</h4>
                            <p className="text-[10px] text-gray-400">Ajuste fechas y prioridades</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                           <CalendarIcon size={16} className="text-gold" />
                        </div>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {caseData.stages.map((stage, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-gold/30 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h5 className="font-bold text-gray-800 text-xs truncate">{stage.title}</h5>
                                    </div>
                                    <select 
                                        className={`text-[10px] font-bold uppercase rounded px-2 py-1 border cursor-pointer outline-none ${
                                            stage.priority === Priority.HIGH ? 'bg-red-50 text-red-600 border-red-100' :
                                            stage.priority === Priority.MEDIUM ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                            'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}
                                        value={stage.priority}
                                        onChange={(e) => handleStageChange(idx, 'priority', e.target.value)}
                                    >
                                        <option value={Priority.LOW}>Baja</option>
                                        <option value={Priority.MEDIUM}>Media</option>
                                        <option value={Priority.HIGH}>Alta</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={12} className="text-gray-400" />
                                    <input 
                                        type="date"
                                        className="text-xs border-b border-gray-200 focus:border-gold outline-none bg-transparent text-gray-600 w-full pb-1"
                                        value={stage.dueDate ? stage.dueDate.split('T')[0] : ''}
                                        onChange={(e) => handleStageChange(idx, 'dueDate', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                        {caseData.stages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs py-10">
                                <FileText size={32} className="mb-3 opacity-20" />
                                Seleccione un servicio para generar actividades
                            </div>
                        )}
                     </div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
               <button type="submit" className="bg-[#0f172a] hover:bg-gray-800 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-gray-200 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  {editingCase ? 'Guardar Cambios' : 'Crear Expediente'} <ArrowRight size={14} />
               </button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default Cases;