import React, { useEffect, useState, useMemo } from 'react';
import { StorageService } from '../../services/storage';
import { Client, ClientType, Case, CaseStatus } from '../../types';
import { Search, Plus, Building2, User, Mail, Phone, Lock, Unlock, Trash2, Edit2, FileText, Calendar, Paperclip, Activity, Briefcase, FileCheck, StickyNote, Tag, X, Minus, CheckCircle2, LayoutGrid, List, ArrowRight, DollarSign, CreditCard, ShieldAlert, Save } from 'lucide-react';
import { Modal } from '../../components/Modal';

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Tag Management State
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Edit Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({
    type: ClientType.CORPORATE,
    name: '',
    email: '',
    phone: '',
    additionalEmails: [],
    additionalPhones: [],
    taxId: '',
    address: '',
    fiscalRegime: '',
    legalRepresentative: '',
    tags: []
  });

  // View Details State
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [clientCases, setClientCases] = useState<Case[]>([]);
  const [viewTab, setViewTab] = useState<'profile' | 'history' | 'payments' | 'notes'>('profile');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // Confirmation States (Modals instead of window.confirm)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [clientToToggle, setClientToToggle] = useState<Client | null>(null);

  // Derived state for payments
  const clientPayments = useMemo(() => {
    return clientCases
        .flatMap(c => c.payments.map(p => ({
            ...p,
            caseFolio: c.folio,
            serviceName: c.serviceName
        })))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [clientCases]);

  useEffect(() => {
    loadClients();
    loadTags();
  }, []);

  const loadClients = () => {
    setClients(StorageService.getClients());
  };

  const loadTags = () => {
    setAvailableTags(StorageService.getTags());
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) || 
      c.id.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.legalRepresentative?.toLowerCase().includes(term) ||
      c.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  });

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  };

  const handleEdit = (e: React.MouseEvent | null, client: Client) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    setEditingClient(client);
    setFormData({ 
      ...client, 
      tags: client.tags || [],
      additionalEmails: client.additionalEmails || [],
      additionalPhones: client.additionalPhones || [] 
    });
    setIsEditModalOpen(true);
    // If viewing, close view modal
    setViewingClient(null);
  };

  const handleView = (client: Client) => {
    setViewingClient(client);
    setClientCases(StorageService.getCasesByClientId(client.id));
    setViewTab('profile');
    setIsEditingNotes(false);
    setEditedNotes(client.notes || '');
  };

  // --- DELETE LOGIC ---
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setClientToDelete(id);
  };

  const confirmDeleteClient = () => {
    if (clientToDelete) {
      StorageService.deleteClient(clientToDelete);
      loadClients();
      if (viewingClient?.id === clientToDelete) setViewingClient(null);
      setClientToDelete(null);
    }
  };

  // --- ACCESS TOGGLE LOGIC ---
  const handleToggleAccessClick = (e: React.MouseEvent, client: Client) => {
      e.preventDefault();
      e.stopPropagation(); 
      setClientToToggle(client);
  };

  const confirmToggleAccess = () => {
      if (!clientToToggle) return;

      const newStatus = clientToToggle.accessEnabled === false ? true : false;
      
      // 1. Create Updated Object
      const updatedClient: Client = { ...clientToToggle, accessEnabled: newStatus };
      
      // 2. Persist to Storage
      StorageService.saveClient(updatedClient);
      
      // 3. Update Global List State
      setClients(prevClients => 
          prevClients.map(c => c.id === clientToToggle.id ? updatedClient : c)
      );

      // 4. Update Local Modal State if open
      if (viewingClient && viewingClient.id === clientToToggle.id) {
          setViewingClient(updatedClient);
      }

      setClientToToggle(null);
  };

  const handleOpenNew = () => {
    setEditingClient(null);
    setFormData({
      type: ClientType.CORPORATE,
      name: '',
      email: '',
      phone: '',
      additionalEmails: [],
      additionalPhones: [],
      taxId: '',
      address: '',
      fiscalRegime: '',
      legalRepresentative: '',
      tags: ['NUEVO']
    });
    setIsEditModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter empty additions
    const cleanAdditionalEmails = formData.additionalEmails?.filter(e => e.trim() !== '') || [];
    const cleanAdditionalPhones = formData.additionalPhones?.filter(p => p.trim() !== '') || [];

    const newClient: Client = {
      ...formData as Client,
      additionalEmails: cleanAdditionalEmails,
      additionalPhones: cleanAdditionalPhones,
      id: editingClient ? editingClient.id : `CLI-${Math.floor(100 + Math.random() * 900)}-${formData.name?.substring(0,3).toUpperCase()}-LGCO`,
      accessEnabled: editingClient ? editingClient.accessEnabled : true
    };

    StorageService.saveClient(newClient);
    setIsEditModalOpen(false);
    loadClients();
    if (viewingClient && viewingClient.id === newClient.id) {
        setViewingClient(newClient); // Update view if editing current
    }
  };

  const handleSaveNotes = () => {
    if (!viewingClient) return;
    const updatedClient = { ...viewingClient, notes: editedNotes };
    StorageService.saveClient(updatedClient);
    setViewingClient(updatedClient);
    setClients(prev => prev.map(c => c.id === viewingClient.id ? updatedClient : c));
    setIsEditingNotes(false);
  };

  // Multiple Contact Logic
  const addField = (type: 'email' | 'phone') => {
    if (type === 'email') {
      setFormData({ ...formData, additionalEmails: [...(formData.additionalEmails || []), ''] });
    } else {
      setFormData({ ...formData, additionalPhones: [...(formData.additionalPhones || []), ''] });
    }
  };

  const removeField = (type: 'email' | 'phone', index: number) => {
    if (type === 'email') {
      const updated = [...(formData.additionalEmails || [])];
      updated.splice(index, 1);
      setFormData({ ...formData, additionalEmails: updated });
    } else {
      const updated = [...(formData.additionalPhones || [])];
      updated.splice(index, 1);
      setFormData({ ...formData, additionalPhones: updated });
    }
  };

  const updateField = (type: 'email' | 'phone', index: number, value: string) => {
    if (type === 'email') {
      const updated = [...(formData.additionalEmails || [])];
      updated[index] = value;
      setFormData({ ...formData, additionalEmails: updated });
    } else {
      const updated = [...(formData.additionalPhones || [])];
      updated[index] = value;
      setFormData({ ...formData, additionalPhones: updated });
    }
  };

  // Tag Management Logic
  const handleAddMasterTag = () => {
    const tag = newTagInput.trim().toUpperCase();
    if (tag && !availableTags.includes(tag)) {
      const newTags = [...availableTags, tag];
      setAvailableTags(newTags);
      StorageService.saveTags(newTags);
      setNewTagInput('');
    }
  };

  const handleDeleteMasterTag = (tag: string) => {
    if (window.confirm(`¿Eliminar la etiqueta "${tag}" del sistema? Esta acción no se puede deshacer.`)) {
      const newTags = availableTags.filter(t => t !== tag);
      setAvailableTags(newTags);
      StorageService.saveTags(newTags);
    }
  };

  const toggleClientTag = (tag: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tag)) {
      setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...currentTags, tag] });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-corporate-dark">Cartera de Clientes</h2>
          <div className="flex items-center text-gray-400 mt-2 space-x-2">
            <ClockIcon />
            <span className="capitalize">{getCurrentDate()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
             onClick={() => setIsTagManagerOpen(true)}
             className="hidden md:flex px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 items-center gap-2 shadow-sm"
          >
             <Tag size={16} /> Gestionar Etiquetas
          </button>
          
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-3.5 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, rfc, etiqueta..." 
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all text-sm"
              value={searchTerm}
              onChange={handleSearch}
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

          <button 
            onClick={handleOpenNew}
            className="flex items-center space-x-2 bg-[#0f172a] text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 text-sm font-bold tracking-wide"
          >
            <Plus size={16} />
            <span className="hidden md:inline">NUEVO</span>
          </button>
        </div>
      </div>

      {/* Grid / List View */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
        {filteredClients.map((client) => {
          
          // --- LIST VIEW ---
          if (viewMode === 'list') {
             return (
               <div 
                  key={client.id}
                  className="group flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gold/30 transition-all cursor-pointer relative"
                  onClick={() => handleView(client)}
               >
                  {/* Identity */}
                  <div className="flex items-center gap-4 md:w-1/3 min-w-0">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${client.type === ClientType.CORPORATE ? 'bg-[#0f172a] text-white' : 'bg-gold text-white'}`}>
                        {client.type === ClientType.CORPORATE ? <Building2 size={18} strokeWidth={1.5} /> : <User size={18} strokeWidth={1.5} />}
                     </div>
                     <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate" title={client.name}>{client.name}</h3>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{client.id}</p>
                     </div>
                  </div>

                  {/* Contact Info */}
                  <div className="md:w-1/4 space-y-1">
                     <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                        <Mail size={12} className="text-gray-300" /> 
                        <span className="truncate">{client.email}</span>
                     </div>
                     <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                        <Phone size={12} className="text-gray-300" />
                        <span>{client.phone}</span>
                     </div>
                  </div>

                  {/* Tags */}
                  <div className="md:w-1/5 hidden md:flex flex-wrap gap-1">
                     {client.tags?.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[9px] font-bold text-gray-500 uppercase">{tag}</span>
                     ))}
                     {(client.tags?.length || 0) > 2 && <span className="text-[10px] text-gray-400">+{client.tags!.length - 2}</span>}
                  </div>

                  {/* Metrics & Status */}
                  <div className="md:w-1/6 flex items-center justify-between md:justify-start gap-4">
                     <div className={`flex items-center gap-1 text-xs font-bold ${
                        (client.sla || 100) >= 90 ? 'text-green-500' : 'text-yellow-500'
                     }`}>
                        <Activity size={12} /> {client.sla || 100}%
                     </div>
                     {client.accessEnabled === false && (
                        <div className="text-red-400" title="Acceso Bloqueado"><Lock size={14} /></div>
                     )}
                  </div>

                  {/* Actions (Isolated Container) */}
                  <div 
                    className="flex items-center gap-2 md:ml-auto relative z-50"
                    onClick={(e) => { e.stopPropagation(); }}
                    onMouseDown={(e) => { e.stopPropagation(); }}
                  >
                     <button 
                        type="button"
                        onClick={(e) => handleToggleAccessClick(e, client)}
                        className={`p-2 rounded-lg transition-colors ${
                            client.accessEnabled !== false 
                            ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' 
                            : 'text-red-500 bg-red-50 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={client.accessEnabled !== false ? "Bloquear" : "Habilitar"}
                     >
                        {client.accessEnabled !== false ? <Lock size={14} /> : <Unlock size={14} />}
                     </button>
                     <button 
                        type="button"
                        onClick={(e) => handleEdit(e, client)}
                        className="p-2 text-gray-400 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors"
                        title="Editar"
                     >
                        <Edit2 size={14} />
                     </button>
                     <button 
                        type="button"
                        onClick={(e) => handleDeleteClick(e, client.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                     >
                        <Trash2 size={14} />
                     </button>
                     <div 
                        className="ml-1 text-gray-300 group-hover:text-gold transition-colors cursor-pointer" 
                        onClick={() => handleView(client)}
                     >
                        <ArrowRight size={16} />
                     </div>
                  </div>
               </div>
             );
          }

          // --- GRID VIEW ---
          return (
            <div 
              key={client.id}
              className="group relative bg-white rounded-[1.5rem] shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
            >
              {/* Actions (Top Right) - ISOLATED CONTAINER - Siblings to clickable content */}
              <div 
                className="absolute top-6 right-6 flex space-x-2 z-50"
                onClick={(e) => { e.stopPropagation(); }}
                onMouseDown={(e) => { e.stopPropagation(); }}
              >
                 <button 
                  type="button"
                  onClick={(e) => handleToggleAccessClick(e, client)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm relative z-50 ${
                      client.accessEnabled !== false 
                      ? 'bg-white text-gray-400 hover:bg-red-500 hover:text-white' 
                      : 'bg-red-500 text-white hover:bg-green-500'
                  }`}
                  title={client.accessEnabled !== false ? "Bloquear Acceso" : "Habilitar Acceso"}
                >
                  {client.accessEnabled !== false ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                 <button 
                  type="button"
                  onClick={(e) => handleEdit(e, client)}
                  className="w-8 h-8 rounded-full bg-white text-gray-500 flex items-center justify-center hover:bg-gold hover:text-white transition-colors shadow-sm relative z-50"
                  title="Editar"
                >
                  <Edit2 size={14} />
                </button>
                 <button 
                  type="button"
                  onClick={(e) => handleDeleteClick(e, client.id)}
                  className="w-8 h-8 rounded-full bg-white text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm relative z-50"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Clickable Card Body */}
              <div 
                className="p-8 cursor-pointer h-full flex flex-col"
                onClick={() => handleView(client)}
              >
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${client.type === ClientType.CORPORATE ? 'bg-[#0f172a] text-white' : 'bg-gold text-white'}`}>
                      {client.type === ClientType.CORPORATE ? <Building2 size={24} strokeWidth={1.5} /> : <User size={24} strokeWidth={1.5} />}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-base font-bold text-gray-800 truncate pr-16" title={client.name}>
                        {client.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono mt-1">{client.id}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail size={16} className="mr-3 text-gray-300" />
                      <span className="truncate">{client.email}</span>
                      {client.additionalEmails && client.additionalEmails.length > 0 && (
                        <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded-full">+{client.additionalEmails.length}</span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone size={16} className="mr-3 text-gray-300" />
                      <span>{client.phone}</span>
                      {client.additionalPhones && client.additionalPhones.length > 0 && (
                        <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded-full">+{client.additionalPhones.length}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {client.tags?.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-lg border border-gray-100 uppercase tracking-wide">
                        {tag}
                      </span>
                    ))}
                    {(client.tags?.length || 0) > 3 && (
                      <span className="px-2 py-1 text-gray-400 text-[10px] self-center">+{client.tags!.length - 3}</span>
                    )}
                  </div>
                  
                  {/* SLA & Access Status */}
                  <div className="absolute bottom-6 right-6 flex items-center gap-3">
                    {client.accessEnabled === false && (
                        <div className="flex items-center space-x-1 text-xs font-bold text-red-400" title="Acceso Restringido">
                          <Lock size={14} />
                        </div>
                    )}
                    <div className={`flex items-center space-x-1 text-xs font-bold ${
                      (client.sla || 100) >= 90 ? 'text-green-500' : (client.sla || 100) >= 70 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                        <Activity size={14} />
                        <span>{client.sla || 100}% SLA</span>
                    </div>
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!clientToDelete} onClose={() => setClientToDelete(null)} title="Eliminar Cliente" width="max-w-md">
         <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
               <Trash2 size={28} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">Advertencia de Seguridad</h3>
               <p className="text-sm text-gray-500">
                  Esta acción es irreversible. Se eliminará el registro del cliente y se desvincularán los expedientes históricos asociados.
               </p>
            </div>
            <div className="flex gap-3 pt-2">
               <button onClick={() => setClientToDelete(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase hover:bg-gray-50 transition-colors">
                  Cancelar
               </button>
               <button onClick={confirmDeleteClient} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">
                  Eliminar Definitivamente
               </button>
            </div>
         </div>
      </Modal>

      {/* Access Toggle Confirmation Modal */}
      <Modal isOpen={!!clientToToggle} onClose={() => setClientToToggle(null)} title="Gestionar Acceso" width="max-w-md">
         <div className="text-center space-y-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${clientToToggle?.accessEnabled === false ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
               {clientToToggle?.accessEnabled === false ? <Unlock size={32} /> : <Lock size={32} />}
            </div>
            <div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {clientToToggle?.accessEnabled === false ? 'Habilitar Acceso al Portal' : 'Bloquear Acceso al Portal'}
               </h3>
               <p className="text-sm text-gray-500">
                  {clientToToggle?.accessEnabled === false 
                     ? 'El cliente podrá volver a iniciar sesión y visualizar sus expedientes.' 
                     : 'El cliente perderá acceso inmediato a su dashboard y no podrá visualizar avances.'}
               </p>
            </div>
            <div className="flex gap-3 pt-2">
               <button onClick={() => setClientToToggle(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase hover:bg-gray-50 transition-colors">
                  Cancelar
               </button>
               <button 
                  onClick={confirmToggleAccess} 
                  className={`flex-1 py-3 rounded-xl text-white font-bold text-xs uppercase shadow-lg transition-colors ${clientToToggle?.accessEnabled === false ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
               >
                  {clientToToggle?.accessEnabled === false ? 'Confirmar Acceso' : 'Bloquear Cuenta'}
               </button>
            </div>
         </div>
      </Modal>

      {/* Edit Form Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={editingClient ? "Editar Cliente" : "Nuevo Cliente"} width="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          {/* ... (Existing Form Content) ... */}
          <div className="flex bg-gray-100 p-1 rounded-lg w-full">
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${formData.type === ClientType.INDIVIDUAL ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setFormData({...formData, type: ClientType.INDIVIDUAL})}
            >
              Persona Física
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${formData.type === ClientType.CORPORATE ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setFormData({...formData, type: ClientType.CORPORATE})}
            >
              Persona Moral
            </button>
          </div>

          <div className="space-y-3">
            {/* Name */}
            <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{formData.type === ClientType.CORPORATE ? 'Razón Social' : 'Nombre Completo'}</label>
               <input 
                 required 
                 className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700"
                 value={formData.name}
                 onChange={(e) => setFormData({...formData, name: e.target.value})}
               />
            </div>

            {/* Emails & Phones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Emails */}
               <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Correos Electrónicos</label>
                  <div className="flex gap-2">
                     <div className="flex items-center justify-center w-8 text-gray-400"><Mail size={16}/></div>
                     <input 
                        type="email"
                        required
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm text-gray-700"
                        placeholder="Principal"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                     />
                  </div>
                  {formData.additionalEmails?.map((email, idx) => (
                     <div key={idx} className="flex gap-2">
                        <div className="w-8"></div>
                        <input 
                           type="email"
                           className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm text-gray-700 bg-gray-50"
                           placeholder={`Adicional ${idx + 1}`}
                           value={email}
                           onChange={(e) => updateField('email', idx, e.target.value)}
                        />
                        <button type="button" onClick={() => removeField('email', idx)} className="text-gray-300 hover:text-red-500"><X size={16}/></button>
                     </div>
                  ))}
                  <button type="button" onClick={() => addField('email')} className="text-[10px] font-bold text-gold hover:underline flex items-center gap-1 ml-10">
                     <Plus size={10} /> Agregar otro correo
                  </button>
               </div>

               {/* Phones */}
               <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Teléfonos</label>
                  <div className="flex gap-2">
                     <div className="flex items-center justify-center w-8 text-gray-400"><Phone size={16}/></div>
                     <input 
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm text-gray-700"
                        placeholder="Principal"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                     />
                  </div>
                  {formData.additionalPhones?.map((phone, idx) => (
                     <div key={idx} className="flex gap-2">
                        <div className="w-8"></div>
                        <input 
                           className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm text-gray-700 bg-gray-50"
                           placeholder={`Adicional ${idx + 1}`}
                           value={phone}
                           onChange={(e) => updateField('phone', idx, e.target.value)}
                        />
                        <button type="button" onClick={() => removeField('phone', idx)} className="text-gray-300 hover:text-red-500"><X size={16}/></button>
                     </div>
                  ))}
                  <button type="button" onClick={() => addField('phone')} className="text-[10px] font-bold text-gold hover:underline flex items-center gap-1 ml-10">
                     <Plus size={10} /> Agregar otro teléfono
                  </button>
               </div>
            </div>

            {/* RFC & Regime */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">RFC</label>
                  <input 
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm text-gray-700"
                    value={formData.taxId}
                    onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  />
               </div>
               <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Régimen Fiscal</label>
                  <input 
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm text-gray-700"
                    value={formData.fiscalRegime}
                    onChange={(e) => setFormData({...formData, fiscalRegime: e.target.value})}
                  />
               </div>
            </div>

            {/* Address */}
            <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dirección Fiscal</label>
               <input 
                 className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm text-gray-700"
                 value={formData.address}
                 onChange={(e) => setFormData({...formData, address: e.target.value})}
               />
            </div>

            {formData.type === ClientType.CORPORATE && (
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Representante Legal</label>
                  <input 
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-gold outline-none text-sm text-gray-700"
                    value={formData.legalRepresentative}
                    onChange={(e) => setFormData({...formData, legalRepresentative: e.target.value})}
                  />
               </div>
            )}

            {/* Tags Compact */}
            <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Etiquetas</label>
               <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100 max-h-24 overflow-y-auto custom-scrollbar">
                  {availableTags.map(tag => {
                     const isSelected = formData.tags?.includes(tag);
                     return (
                        <button
                           key={tag}
                           type="button"
                           onClick={() => toggleClientTag(tag)}
                           className={`px-2 py-1 rounded text-[10px] font-bold border transition-all uppercase ${
                              isSelected 
                                 ? 'bg-gold border-gold text-white' 
                                 : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                           }`}
                        >
                           {tag}
                        </button>
                     );
                  })}
                  {availableTags.length === 0 && <span className="text-xs text-gray-400 mx-auto">Sin etiquetas.</span>}
               </div>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-gold hover:bg-gold-dark text-white font-bold py-3 rounded-xl shadow-lg shadow-gold/20 transition-all uppercase tracking-widest text-xs">
              Guardar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* Tag Manager Modal */}
      <Modal isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} title="Gestionar Etiquetas" width="max-w-md">
         {/* ... (Existing Tag Manager Content) ... */}
         <div className="space-y-4">
            <div className="flex gap-2">
               <input 
                  type="text" 
                  placeholder="NUEVA ETIQUETA" 
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-xs uppercase font-bold"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMasterTag()}
               />
               <button 
                  onClick={handleAddMasterTag}
                  className="bg-gray-900 text-white p-2 rounded-xl hover:bg-gold transition-colors"
               >
                  <Plus size={18} />
               </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
               {availableTags.map(tag => (
                  <div key={tag} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                     <span className="text-xs font-bold text-gray-700">{tag}</span>
                     <button onClick={() => handleDeleteMasterTag(tag)} className="text-gray-400 hover:text-red-500">
                        <X size={14} />
                     </button>
                  </div>
               ))}
               {availableTags.length === 0 && <p className="text-center text-xs text-gray-400 py-4">No hay etiquetas registradas.</p>}
            </div>
         </div>
      </Modal>

      {/* Detailed View Modal - Compacted */}
      <Modal isOpen={!!viewingClient} onClose={() => setViewingClient(null)} title="Expediente del Cliente" width="max-w-4xl">
        {viewingClient && (
          <div className="flex flex-col h-full">
            {/* Header Section */}
            <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
               <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${viewingClient.type === ClientType.CORPORATE ? 'bg-[#0f172a] text-white' : 'bg-gold text-white'}`}>
                  {viewingClient.type === ClientType.CORPORATE ? <Building2 size={28} /> : <User size={28} />}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                     <div>
                        <h2 className="text-xl font-bold text-gray-900 truncate">{viewingClient.name}</h2>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 font-mono">
                           <span>{viewingClient.id}</span>
                           <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                           <span>{viewingClient.taxId || 'Sin RFC'}</span>
                           <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                           <span className={`flex items-center gap-1 font-bold ${viewingClient.accessEnabled !== false ? 'text-green-600' : 'text-red-500'}`}>
                              {viewingClient.accessEnabled !== false ? <CheckCircle2 size={10}/> : <Lock size={10}/>}
                              {viewingClient.accessEnabled !== false ? 'Acceso Activo' : 'Bloqueado'}
                           </span>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={(e) => handleToggleAccessClick(e, viewingClient)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border flex items-center gap-2 ${
                                viewingClient.accessEnabled !== false
                                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            }`}
                            title={viewingClient.accessEnabled !== false ? "Restringir acceso al portal" : "Permitir acceso al portal"}
                        >
                            {viewingClient.accessEnabled !== false ? (
                                <><Lock size={12}/> Bloquear</>
                            ) : (
                                <><Unlock size={12}/> Habilitar</>
                            )}
                        </button>
                        <button 
                            onClick={(e) => handleEdit(e, viewingClient)}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase transition-colors border border-gray-200 flex items-center gap-2"
                        >
                            <Edit2 size={12} /> Editar
                        </button>
                     </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-3">
                     {viewingClient.tags?.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[9px] font-bold text-gray-500 uppercase">{t}</span>
                     ))}
                  </div>
               </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-6 border-b border-gray-100 mt-4 shrink-0 overflow-x-auto">
               <TabButton active={viewTab === 'profile'} onClick={() => setViewTab('profile')} icon={<User size={14} />} label="Visión General" />
               <TabButton active={viewTab === 'history'} onClick={() => setViewTab('history')} icon={<Briefcase size={14} />} label="Historial" />
               <TabButton active={viewTab === 'payments'} onClick={() => setViewTab('payments')} icon={<DollarSign size={14} />} label="Pagos" />
               <TabButton active={viewTab === 'notes'} onClick={() => setViewTab('notes')} icon={<StickyNote size={14} />} label="Notas" />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pt-4 pr-1 custom-scrollbar">
               {viewTab === 'profile' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <SectionTitle title="Contacto" />
                        <div className="space-y-3">
                           <InfoRow 
                              icon={<Mail size={14} />} 
                              label="Emails" 
                              value={
                                 <div className="space-y-1">
                                    <div>{viewingClient.email} <span className="text-[9px] text-gray-400 ml-1">(Principal)</span></div>
                                    {viewingClient.additionalEmails?.map((em, i) => (
                                       <div key={i} className="text-gray-500">{em}</div>
                                    ))}
                                 </div>
                              } 
                           />
                           <InfoRow 
                              icon={<Phone size={14} />} 
                              label="Teléfonos" 
                              value={
                                 <div className="space-y-1">
                                    <div>{viewingClient.phone} <span className="text-[9px] text-gray-400 ml-1">(Principal)</span></div>
                                    {viewingClient.additionalPhones?.map((ph, i) => (
                                       <div key={i} className="text-gray-500">{ph}</div>
                                    ))}
                                 </div>
                              } 
                           />
                           <InfoRow icon={<Building2 size={14} />} label="Dirección" value={viewingClient.address || 'No registrada'} />
                           {viewingClient.type === ClientType.CORPORATE && (
                              <InfoRow icon={<User size={14} />} label="Rep. Legal" value={viewingClient.legalRepresentative || 'No registrado'} />
                           )}
                           <InfoRow icon={<FileText size={14} />} label="Régimen" value={viewingClient.fiscalRegime || 'No registrado'} />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <SectionTitle title="Métricas & SLA" />
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-gray-500">Nivel de Servicio</span>
                              <span className={`text-xl font-bold ${
                                 (viewingClient.sla || 100) >= 90 ? 'text-green-500' : 'text-yellow-500'
                              }`}>{viewingClient.sla || 100}%</span>
                           </div>
                           <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${
                                 (viewingClient.sla || 100) >= 90 ? 'bg-green-500' : 'bg-yellow-500'
                              }`} style={{ width: `${viewingClient.sla || 100}%` }}></div>
                           </div>
                        </div>

                        <SectionTitle title="Contactos" />
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                           {viewingClient.contacts?.map((contact, idx) => (
                              <div key={idx} className="flex items-center p-2 bg-white border border-gray-100 rounded-lg">
                                 <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-[10px] mr-2">
                                    {contact.name[0]}
                                 </div>
                                 <div className="min-w-0">
                                    <div className="text-xs font-bold text-gray-900 truncate">{contact.name}</div>
                                    <div className="text-[10px] text-gray-500 truncate">{contact.role}</div>
                                 </div>
                              </div>
                           ))}
                           {(!viewingClient.contacts || viewingClient.contacts.length === 0) && (
                              <div className="text-xs text-gray-400 italic">Sin contactos adicionales.</div>
                           )}
                        </div>
                     </div>
                  </div>
               )}

               {viewTab === 'history' && (
                  <div className="space-y-3">
                     {clientCases.map(c => (
                        <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-3 flex justify-between items-center hover:shadow-sm transition-shadow">
                           <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-10 rounded-full ${c.status === CaseStatus.ACTIVE ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <div>
                                 <h4 className="font-bold text-gray-900 text-sm">{c.serviceName}</h4>
                                 <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <span className="font-mono">{c.folio}</span>
                                    <span>•</span>
                                    <span>{new Date(c.startDate).toLocaleDateString()}</span>
                                 </div>
                              </div>
                           </div>
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.status === CaseStatus.ACTIVE ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {c.status}
                           </span>
                        </div>
                     ))}
                     {clientCases.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">Sin historial.</div>}
                  </div>
               )}

               {viewTab === 'payments' && (
                  <div className="space-y-3">
                     {clientPayments.map((p, idx) => (
                        <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 flex justify-between items-center hover:shadow-sm transition-shadow">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
                                 <CreditCard size={18} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-gray-900 text-sm">{p.concept}</h4>
                                 <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <span>{new Date(p.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{p.method}</span>
                                    <span>•</span>
                                    <span className="font-mono text-gray-400">{p.caseFolio}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="block font-bold text-gray-900 text-sm">${p.amount.toLocaleString()}</span>
                              <span className="text-[9px] font-bold uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded">{p.status}</span>
                           </div>
                        </div>
                     ))}
                     {clientPayments.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No hay pagos registrados.</div>}
                  </div>
               )}

               {viewTab === 'notes' && (
                  <div className="bg-yellow-50/50 rounded-xl border border-yellow-100 p-6 min-h-[250px] relative flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-yellow-800 flex items-center gap-2 uppercase tracking-widest">
                           <StickyNote size={14} /> Notas Importantes
                        </h4>
                        {!isEditingNotes ? (
                           <button 
                              onClick={() => setIsEditingNotes(true)}
                              className="text-[10px] font-bold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                           >
                              <Edit2 size={12} /> EDITAR NOTAS
                           </button>
                        ) : (
                           <div className="flex gap-2">
                              <button 
                                 onClick={() => { setIsEditingNotes(false); setEditedNotes(viewingClient.notes || ''); }}
                                 className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                 CANCELAR
                              </button>
                              <button 
                                 onClick={handleSaveNotes}
                                 className="text-[10px] font-bold text-white bg-[#0f172a] hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                              >
                                 <Save size={12} /> GUARDAR
                              </button>
                           </div>
                        )}
                     </div>
                     
                     <div className="flex-1">
                        {isEditingNotes ? (
                           <textarea 
                              className="w-full h-full min-h-[150px] p-4 rounded-xl border border-yellow-200 focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white text-sm text-gray-800 resize-none shadow-inner"
                              value={editedNotes}
                              onChange={(e) => setEditedNotes(e.target.value)}
                              placeholder="Escriba aquí notas relevantes sobre el cliente, preferencias de comunicación, fechas de facturación, etc."
                              autoFocus
                           />
                        ) : (
                           <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                              {viewingClient.notes || 'No hay notas registradas para este cliente. Use el botón "Editar" para agregar información estratégica.'}
                           </p>
                        )}
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const SectionTitle = ({ title }: { title: string }) => (
   <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-1">{title}</h3>
);

const InfoRow = ({ icon, label, value }: { icon: any, label: string, value: React.ReactNode }) => (
   <div className="flex items-start gap-3">
      <div className="text-gray-300 shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
         <div className="text-[10px] font-bold text-gray-400 uppercase">{label}</div>
         <div className="text-xs text-gray-800 font-medium mt-0.5">{value}</div>
      </div>
   </div>
);

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
   <button 
      onClick={onClick}
      className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
         active ? 'text-gold border-gold' : 'text-gray-400 border-transparent hover:text-gray-600'
      }`}
   >
      {icon}
      <span>{label}</span>
   </button>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

export default Clients;