import React, { useEffect, useState } from 'react';
import { StorageService } from '../../services/storage';
import { ServiceTemplate, ServiceStageTemplate, Priority, Client, FirmProfile } from '../../types';
import { generateServiceDetails, generateProposalContent, ProposalContent } from '../../services/geminiService';
import { generateProposalPDF } from '../../services/pdfService';
import { Plus, Edit2, Trash2, GripVertical, X, Sparkles, Copy, AlertTriangle, ShieldCheck, Clock, Search, LayoutGrid, List, Layers, DollarSign, FileText, Download, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/Modal';

const Services = () => {
  const [services, setServices] = useState<ServiceTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [firmProfile, setFirmProfile] = useState<FirmProfile | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceTemplate | null>(null);
  const [generating, setGenerating] = useState(false);

  // Proposal State
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalService, setProposalService] = useState<ServiceTemplate | null>(null);
  const [proposalContent, setProposalContent] = useState<ProposalContent | null>(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [proposalConfig, setProposalConfig] = useState({
      clientId: '',
      clientName: '',
      customScope: '',
      discount: 0,
      retainer: 50,
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 15 days default
  });

  // View & Filter State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Confirmation State
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ServiceTemplate>>({
    name: '',
    category: '',
    description: '',
    scope: '',
    risks: [],
    prevention: '',
    estimatedDuration: '',
    basePrice: 0,
    defaultStages: []
  });

  // Risk input state
  const [newRisk, setNewRisk] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setServices(StorageService.getServices());
    setClients(StorageService.getClients());
    setFirmProfile(StorageService.getFirmProfile());
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedServices = filteredServices.reduce((acc, service) => {
    const cat = service.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {} as Record<string, ServiceTemplate[]>);

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  };

  // --- Proposal Logic ---
  const handleOpenProposal = (e: React.MouseEvent, service: ServiceTemplate) => {
      e.stopPropagation();
      setProposalService(service);
      setProposalContent(null); // Reset AI content
      setProposalConfig({
          clientId: '',
          clientName: '', // Manual input possible
          customScope: service.scope || '',
          discount: 0,
          retainer: 50,
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setIsProposalModalOpen(true);
  };

  const handleGenerateProposalContent = async () => {
      if (!proposalService || !proposalConfig.clientName) {
          alert('Por favor selecciona un cliente para personalizar el contenido.');
          return;
      }
      setGeneratingContent(true);
      const content = await generateProposalContent(
          proposalService.name, 
          proposalConfig.clientName, 
          proposalConfig.customScope
      );
      setProposalContent(content);
      setGeneratingContent(false);
  };

  const handleGeneratePDF = () => {
      if (!proposalService || !firmProfile) return;
      
      generateProposalPDF(
          proposalService,
          {
              clientName: proposalConfig.clientName,
              customScope: proposalConfig.customScope,
              discount: proposalConfig.discount,
              retainer: proposalConfig.retainer,
              validUntil: proposalConfig.validUntil,
              price: proposalService.basePrice
          },
          firmProfile,
          proposalContent
      );
      setIsProposalModalOpen(false);
  };

  const handleClientSelect = (id: string) => {
      const client = clients.find(c => c.id === id);
      if (client) {
          setProposalConfig({
              ...proposalConfig,
              clientId: id,
              clientName: client.name
          });
      } else {
          setProposalConfig({ ...proposalConfig, clientId: '', clientName: '' });
      }
  };

  // --- Service CRUD Logic ---
  const handleOpenNew = () => {
    setEditingService(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      scope: '',
      risks: [],
      prevention: '',
      estimatedDuration: '',
      basePrice: 0,
      defaultStages: [
        { title: 'Recepción de Antecedentes', description: 'Recopilación de documentos.', defaultPriority: Priority.MEDIUM, estimatedDays: 2 },
        { title: 'Análisis Jurídico', description: 'Revisión normativa.', defaultPriority: Priority.HIGH, estimatedDays: 5 }
      ]
    });
    setIsModalOpen(true);
  };

  const handleEdit = (service: ServiceTemplate) => {
    setEditingService(service);
    setFormData({
      ...service,
      risks: [...(service.risks || [])],
      defaultStages: service.defaultStages.map(s => ({...s}))
    });
    setIsModalOpen(true);
  };

  const handleDuplicate = (e: React.MouseEvent, service: ServiceTemplate) => {
    e.stopPropagation();
    const duplicatedService: ServiceTemplate = {
      ...service,
      id: `SRV-${Date.now()}`,
      name: `${service.name} (Copia)`,
      defaultStages: service.defaultStages.map(s => ({...s}))
    };
    StorageService.saveService(duplicatedService);
    loadData();
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setServiceToDelete(id);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      StorageService.deleteService(serviceToDelete);
      setServiceToDelete(null);
      loadData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newService: ServiceTemplate = {
      ...formData as ServiceTemplate,
      id: editingService ? editingService.id : `SRV-${Date.now()}`
    };
    StorageService.saveService(newService);
    setIsModalOpen(false);
    loadData();
  };

  const handleGenerateAI = async () => {
    if (!formData.name) {
      alert("Por favor escribe el nombre del servicio primero.");
      return;
    }
    setGenerating(true);
    const generatedData = await generateServiceDetails(formData.name);
    setGenerating(false);

    if (generatedData) {
      setFormData({
        ...formData,
        ...generatedData,
        name: formData.name
      });
    } else {
      alert("No se pudo generar la plantilla. Verifica tu conexión o intenta de nuevo.");
    }
  };

  const updateStage = (index: number, field: keyof ServiceStageTemplate, value: any) => {
    const stages = [...(formData.defaultStages || [])];
    stages[index] = { ...stages[index], [field]: value };
    setFormData({ ...formData, defaultStages: stages });
  };

  const removeStage = (index: number) => {
    const stages = [...(formData.defaultStages || [])];
    stages.splice(index, 1);
    setFormData({ ...formData, defaultStages: stages });
  };

  const addStage = () => {
    setFormData({
      ...formData,
      defaultStages: [...(formData.defaultStages || []), { title: '', description: '', defaultPriority: Priority.MEDIUM, estimatedDays: 1 }]
    });
  };

  const addRisk = () => {
    if (newRisk.trim()) {
      setFormData({
        ...formData,
        risks: [...(formData.risks || []), newRisk.trim()]
      });
      setNewRisk('');
    }
  };

  const removeRisk = (index: number) => {
    const updatedRisks = [...(formData.risks || [])];
    updatedRisks.splice(index, 1);
    setFormData({ ...formData, risks: updatedRisks });
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-corporate-dark">Catálogo de Servicios</h2>
          <p className="text-gray-400 mt-2 text-sm capitalize">{getCurrentDate()}</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
           <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-3.5 text-gray-300" size={18} />
              <input 
                 type="text" 
                 placeholder="Buscar servicio..." 
                 className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all text-sm"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           <div className="flex gap-2 w-full md:w-auto">
              <div className="flex items-center bg-white border border-gray-100 rounded-xl p-1 shadow-sm shrink-0">
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

              <button 
                onClick={handleOpenNew}
                className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-[#0f172a] text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 text-xs font-bold tracking-widest uppercase whitespace-nowrap"
              >
                <Plus size={16} />
                <span>Nuevo Servicio</span>
              </button>
           </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
         // GRID VIEW
         <div className="space-y-12">
            {(Object.entries(groupedServices) as [string, ServiceTemplate[]][]).map(([category, items]) => (
               <div key={category} className="space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-gold"></div>
                     <h3 className="font-serif text-xl font-bold text-gray-800">{category}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {items.map(service => (
                        <div 
                           key={service.id}
                           onClick={() => handleEdit(service)}
                           className="group bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                        >
                           <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2 z-10">
                              <button 
                                 onClick={(e) => handleDuplicate(e, service)}
                                 className="bg-white p-2 rounded-full shadow-sm text-gray-400 hover:text-gold transition-colors"
                                 title="Duplicar"
                              >
                                 <Copy size={16} />
                              </button>
                              <button 
                                 onClick={(e) => handleDeleteClick(e, service.id)}
                                 className="bg-white p-2 rounded-full shadow-sm text-red-400 hover:text-red-600 transition-colors"
                                 title="Eliminar"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>

                           <h4 className="font-bold text-lg text-gray-900 mb-2 truncate pr-8">{service.name}</h4>
                           <p className="text-sm text-gray-500 leading-relaxed mb-6 h-10 line-clamp-2">{service.description}</p>
                           
                           <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                              <span className="font-serif font-bold text-lg text-gray-900">
                                 ${service.basePrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </span>
                              <div className="flex items-center gap-2">
                                 <button 
                                    onClick={(e) => handleOpenProposal(e, service)}
                                    className="p-2 bg-gray-50 hover:bg-gold hover:text-white rounded-lg transition-colors text-gray-400"
                                    title="Generar Propuesta"
                                 >
                                    <FileText size={16} />
                                 </button>
                                 <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-gray-100">
                                    {service.defaultStages.length} Etapas
                                 </span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      ) : (
         // LIST VIEW
         <div className="space-y-8">
            {(Object.entries(groupedServices) as [string, ServiceTemplate[]][]).map(([category, items]) => (
               <div key={category} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                     <h3 className="font-serif text-lg font-bold text-gray-800">{category}</h3>
                     <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>

                  <div className="space-y-3">
                     {items.map(service => (
                        <div 
                           key={service.id} 
                           onClick={() => handleEdit(service)}
                           className="group bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gold/30 transition-all cursor-pointer flex flex-col md:flex-row md:items-center gap-4"
                        >
                           <div className="flex items-center gap-4 min-w-[200px]">
                              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                                 <Layers size={18} className="text-gray-400 group-hover:text-gold transition-colors"/>
                              </div>
                              <div className="min-w-0">
                                 <h4 className="font-bold text-gray-900 text-sm truncate" title={service.name}>{service.name}</h4>
                                 <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{service.category}</span>
                              </div>
                           </div>

                           <div className="flex-1 hidden md:block">
                              <p className="text-xs text-gray-500 line-clamp-1">{service.description}</p>
                           </div>

                           <div className="flex items-center gap-6 text-xs text-gray-500 shrink-0">
                              <div className="flex items-center gap-1 min-w-[80px]">
                                 <Clock size={14} className="text-gray-300" />
                                 <span>{service.estimatedDuration || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1 min-w-[100px] justify-end">
                                 <DollarSign size={14} className="text-gray-300" />
                                 <span className="font-bold text-gray-900">${service.basePrice.toLocaleString()}</span>
                              </div>
                           </div>

                           <div className="flex items-center gap-2 pl-4 md:border-l border-gray-100 shrink-0 self-end md:self-auto">
                              <button 
                                 onClick={(e) => handleOpenProposal(e, service)}
                                 className="p-2 text-gray-300 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                 title="Generar Propuesta"
                              >
                                 <FileText size={16} />
                              </button>
                              <button 
                                 onClick={(e) => handleDuplicate(e, service)} 
                                 className="p-2 text-gray-300 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors"
                                 title="Duplicar"
                              >
                                 <Copy size={16} />
                              </button>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); handleEdit(service); }} 
                                 className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                 title="Editar"
                              >
                                 <Edit2 size={16} />
                              </button>
                              <button 
                                 onClick={(e) => handleDeleteClick(e, service.id)} 
                                 className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                 title="Eliminar"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      )}
      
      {/* Proposal Generator Modal */}
      <Modal isOpen={isProposalModalOpen} onClose={() => setIsProposalModalOpen(false)} title="Generador de Propuestas" width="max-w-6xl">
         <div className="flex flex-col lg:flex-row gap-8 h-[75vh]">
            
            {/* Left: Configuration */}
            <div className="lg:w-1/3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
               <div className="bg-gold/5 p-4 rounded-xl border border-gold/20">
                  <h4 className="font-bold text-gold-dark text-sm flex items-center gap-2 mb-1">
                     <FileText size={16} /> {proposalService?.name}
                  </h4>
                  <p className="text-xs text-gray-500">Configura las variables para generar la carta propuesta.</p>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Cliente</label>
                  <select 
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-sm bg-white"
                     value={proposalConfig.clientId}
                     onChange={(e) => handleClientSelect(e.target.value)}
                  >
                     <option value="">Seleccionar cliente existente...</option>
                     {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input 
                     placeholder="O escribe el nombre del prospecto..."
                     className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-sm"
                     value={proposalConfig.clientName}
                     onChange={(e) => setProposalConfig({...proposalConfig, clientName: e.target.value, clientId: ''})}
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Descuento (%)</label>
                     <input 
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-sm"
                        value={proposalConfig.discount}
                        onChange={(e) => setProposalConfig({...proposalConfig, discount: Number(e.target.value)})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Anticipo (%)</label>
                     <input 
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-sm"
                        value={proposalConfig.retainer}
                        onChange={(e) => setProposalConfig({...proposalConfig, retainer: Number(e.target.value)})}
                     />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Vigencia Propuesta</label>
                  <input 
                     type="date"
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-sm"
                     value={proposalConfig.validUntil}
                     onChange={(e) => setProposalConfig({...proposalConfig, validUntil: e.target.value})}
                  />
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Ajustar Alcance</label>
                  <textarea 
                     rows={4}
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-sm resize-none leading-relaxed"
                     value={proposalConfig.customScope}
                     onChange={(e) => setProposalConfig({...proposalConfig, customScope: e.target.value})}
                  />
               </div>

               {/* AI Generate Button */}
               <button 
                  onClick={handleGenerateProposalContent}
                  disabled={!proposalConfig.clientName || generatingContent}
                  className="w-full py-3 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold rounded-xl border border-purple-200 transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
               >
                  {generatingContent ? (
                      <div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                      <Sparkles size={16} />
                  )}
                  <span>Redactar con IA (2000+ palabras)</span>
               </button>

               <button 
                  onClick={handleGeneratePDF}
                  disabled={!proposalConfig.clientName}
                  className="w-full py-4 bg-[#0f172a] text-white font-bold rounded-xl shadow-lg hover:bg-gold transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  <Download size={16} /> Descargar PDF
               </button>
            </div>

            {/* Right: Live Preview */}
            <div className="lg:w-2/3 bg-gray-100 rounded-2xl p-8 overflow-y-auto flex justify-center shadow-inner border border-gray-200">
               <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-12 shadow-2xl relative text-xs text-gray-800 leading-relaxed font-serif scale-90 origin-top">
                  {/* Preview Content Mockup */}
                  <div className="text-right text-gold mb-1 font-bold text-lg uppercase">{firmProfile?.name || 'NOMBRE DE LA FIRMA'}</div>
                  <div className="text-right text-[10px] text-gray-400 mb-8 leading-tight">
                     {firmProfile?.address || 'Dirección Corporativa'}<br/>
                     {firmProfile?.email} | {firmProfile?.phone}
                  </div>

                  <div className="mb-6">
                     <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
                     <p><strong>Atención:</strong> {proposalConfig.clientName || '[Nombre del Cliente]'}</p>
                     <p><strong>Asunto:</strong> Propuesta de Servicios Profesionales - {proposalService?.name}</p>
                  </div>

                  {proposalContent ? (
                      <div className="space-y-6">
                          <div>
                              <h4 className="font-bold border-b border-gray-200 pb-1 mb-2">1. RESUMEN EJECUTIVO</h4>
                              <p className="text-justify whitespace-pre-wrap">{proposalContent.executiveSummary.substring(0, 300)}...</p>
                          </div>
                          <div>
                              <h4 className="font-bold border-b border-gray-200 pb-1 mb-2">2. DESCRIPCIÓN DEL SERVICIO</h4>
                              <p className="text-justify whitespace-pre-wrap">{proposalContent.serviceDescription.substring(0, 300)}...</p>
                          </div>
                          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-center font-bold">
                              ✓ Contenido Generado por IA listo para PDF completo
                          </div>
                      </div>
                  ) : (
                      <>
                        <p className="mb-4">Estimado cliente,</p>
                        <p className="mb-6 text-justify">
                            Agradecemos la oportunidad de presentar esta propuesta. Basado en sus requerimientos, hemos diseñado el siguiente plan de trabajo:
                        </p>

                        <h4 className="font-bold border-b border-gray-200 pb-1 mb-2">1. ALCANCE DEL SERVICIO</h4>
                        <p className="mb-6 text-justify whitespace-pre-wrap">{proposalConfig.customScope || proposalService?.scope || '...'}</p>
                      </>
                  )}

                  <h4 className="font-bold border-b border-gray-200 pb-1 mb-2 mt-6">PRESUPUESTO</h4>
                  <div className="mb-6">
                     <div className="flex justify-between py-1 border-b border-gray-100 font-bold">
                        <span>Concepto</span>
                        <span>Importe</span>
                     </div>
                     <div className="flex justify-between py-1">
                        <span>Honorarios Base</span>
                        {/* FIX: Use optional chaining and default value to prevent crash */}
                        <span>${(proposalService?.basePrice || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                     </div>
                     {proposalConfig.discount > 0 && (
                        <div className="flex justify-between py-1 text-gold">
                           <span>Descuento ({proposalConfig.discount}%)</span>
                           <span>-${((proposalService?.basePrice || 0) * (proposalConfig.discount/100)).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                        </div>
                     )}
                     <div className="flex justify-between py-2 font-bold text-sm mt-2 border-t border-gray-200">
                        <span>TOTAL</span>
                        <span>${((proposalService?.basePrice || 0) * (1 - proposalConfig.discount/100)).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                     </div>
                  </div>

                  <div className="flex justify-between mt-20 pt-4 px-10">
                     <div className="text-center border-t border-gray-300 w-40 pt-2">
                        <p className="font-bold">{firmProfile?.name}</p>
                        <p className="text-[10px] text-gray-400">Firma Autorizada</p>
                     </div>
                     <div className="text-center border-t border-gray-300 w-40 pt-2">
                        <p className="font-bold">{proposalConfig.clientName || 'Cliente'}</p>
                        <p className="text-[10px] text-gray-400">Aceptación</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!serviceToDelete} onClose={() => setServiceToDelete(null)} title="Eliminar Servicio" width="max-w-md">
         {/* ... (Existing Delete Modal) ... */}
         <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
               <Trash2 size={28} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar plantilla?</h3>
               <p className="text-sm text-gray-500">
                  Esta acción eliminará la plantilla del catálogo. Los expedientes activos que usen este servicio no se verán afectados.
               </p>
            </div>
            <div className="flex gap-3 pt-2">
               <button onClick={() => setServiceToDelete(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase hover:bg-gray-50 transition-colors">
                  Cancelar
               </button>
               <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">
                  Eliminar
               </button>
            </div>
         </div>
      </Modal>

      {/* Existing Service Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? "Editar Servicio" : "Nuevo Servicio"} width="max-w-5xl">
        <form onSubmit={handleSave} className="space-y-8">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: General Info */}
              <div className="lg:col-span-5 space-y-6">
                 
                 {/* AI Generator Box */}
                 {!editingService && (
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden mb-6">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                       <h4 className="text-white font-serif font-bold mb-2 flex items-center gap-2">
                          <Sparkles size={16} className="text-gold" /> Generador IA
                       </h4>
                       <p className="text-gray-400 text-xs mb-4">Escribe el nombre del servicio y deja que la IA complete el alcance, riesgos y actividades.</p>
                       <div className="flex gap-2">
                          <input 
                             placeholder="Ej. Fideicomiso Inmobiliario"
                             className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                             value={formData.name}
                             onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                          <button 
                             type="button"
                             onClick={handleGenerateAI}
                             disabled={generating}
                             className="bg-gold hover:bg-gold-dark text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center disabled:opacity-50"
                          >
                             {generating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={16} />}
                          </button>
                       </div>
                    </div>
                 )}

                 <p className="text-xs text-gray-400 uppercase tracking-widest -mt-2">Información General</p>
                 
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre del Servicio</label>
                    <input 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoría</label>
                       <input 
                         required
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700"
                         value={formData.category}
                         onChange={(e) => setFormData({...formData, category: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Costo Base</label>
                       <input 
                         type="number"
                         required
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700"
                         value={formData.basePrice}
                         onChange={(e) => setFormData({...formData, basePrice: Number(e.target.value)})}
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tiempo Estimado</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700"
                      value={formData.estimatedDuration || ''}
                      onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
                      placeholder="Ej. 3 semanas"
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción</label>
                    <textarea 
                      required
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700 resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Alcance</label>
                    <textarea 
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700 resize-none"
                      value={formData.scope || ''}
                      onChange={(e) => setFormData({...formData, scope: e.target.value})}
                      placeholder="Qué incluye el servicio..."
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Recomendación Preventiva</label>
                    <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-xl border border-blue-100">
                       <ShieldCheck size={16} className="text-blue-500 mt-0.5 shrink-0" />
                       <textarea 
                         rows={2}
                         className="w-full bg-transparent border-none p-0 text-sm text-blue-900 focus:ring-0 placeholder-blue-300 resize-none"
                         value={formData.prevention || ''}
                         onChange={(e) => setFormData({...formData, prevention: e.target.value})}
                         placeholder="Tip preventivo para el cliente..."
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Riesgos Cubiertos</label>
                    <div className="flex gap-2 mb-2">
                       <input 
                          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm"
                          placeholder="Agregar riesgo..."
                          value={newRisk}
                          onChange={(e) => setNewRisk(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRisk())}
                       />
                       <button type="button" onClick={addRisk} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-xl text-gray-600">
                          <Plus size={18} />
                       </button>
                    </div>
                    <div className="space-y-2">
                       {formData.risks?.map((risk, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                             <div className="flex items-center gap-2">
                                <AlertTriangle size={14} className="text-red-400" />
                                <span className="text-xs text-red-700">{risk}</span>
                             </div>
                             <button type="button" onClick={() => removeRisk(idx)} className="text-red-300 hover:text-red-500"><X size={14}/></button>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Right Column: Stages */}
              <div className="lg:col-span-7 bg-gray-50 rounded-2xl p-6 flex flex-col h-full max-h-[800px]">
                 <div className="flex justify-between items-center mb-4">
                    <div>
                       <h4 className="font-bold text-gray-900 text-sm">Actividades Detalladas</h4>
                       <p className="text-[10px] text-gray-400">{formData.defaultStages?.length || 0} pasos definidos</p>
                    </div>
                    <button 
                       type="button" 
                       onClick={addStage}
                       className="text-[10px] font-bold text-gold uppercase tracking-wider hover:text-gold-dark transition-colors flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100"
                    >
                       <Plus size={12} /> Agregar
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {formData.defaultStages?.map((stage, index) => (
                       <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3 group hover:border-gold/30 transition-colors">
                          <div className="flex flex-col items-center justify-center text-gray-300 w-6 pt-2">
                             <span className="text-xs font-bold mb-1">{index + 1}</span>
                             <GripVertical size={14} className="cursor-grab" />
                          </div>
                          
                          <div className="flex-1 space-y-2">
                             <input 
                               placeholder="Nombre de la actividad"
                               className="w-full text-sm font-bold text-gray-800 placeholder-gray-300 border-none p-0 focus:ring-0 bg-transparent"
                               value={stage.title}
                               onChange={(e) => updateStage(index, 'title', e.target.value)}
                             />
                             <textarea 
                               rows={1}
                               placeholder="Descripción detallada..."
                               className="w-full text-xs text-gray-500 placeholder-gray-300 border-b border-gray-100 pb-1 focus:border-gold focus:ring-0 bg-transparent transition-colors resize-none"
                               value={stage.description || ''}
                               onChange={(e) => updateStage(index, 'description', e.target.value)}
                             />
                             <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Días Estimados (desde inicio)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-gray-50 rounded px-2 py-1 text-xs border border-gray-200"
                                        value={stage.estimatedDays || 0}
                                        onChange={(e) => updateStage(index, 'estimatedDays', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Prioridad Default</label>
                                    <select 
                                        className="w-full bg-gray-50 rounded px-2 py-1 text-xs border border-gray-200"
                                        value={stage.defaultPriority || Priority.MEDIUM}
                                        onChange={(e) => updateStage(index, 'defaultPriority', e.target.value)}
                                    >
                                        <option value={Priority.LOW}>Baja</option>
                                        <option value={Priority.MEDIUM}>Media</option>
                                        <option value={Priority.HIGH}>Alta</option>
                                    </select>
                                </div>
                             </div>
                          </div>

                          <button 
                            type="button" 
                            onClick={() => removeStage(index)}
                            className="text-gray-300 hover:text-red-400 transition-colors self-start opacity-0 group-hover:opacity-100"
                          >
                            <X size={16} />
                          </button>
                       </div>
                    ))}
                    
                    {(!formData.defaultStages || formData.defaultStages.length === 0) && (
                       <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded-xl">
                          <Clock size={24} className="mb-2 opacity-20" />
                          Sin actividades definidas
                       </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="flex justify-end pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                className="bg-gold hover:bg-gold-dark text-white font-bold py-4 px-12 rounded-xl shadow-lg shadow-gold/30 transition-all uppercase tracking-widest text-sm"
              >
                Guardar Servicio
              </button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default Services;