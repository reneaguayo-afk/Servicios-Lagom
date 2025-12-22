import React, { useEffect, useState, useRef } from 'react';
import { StorageService } from '../../services/storage';
import { LibraryDocument, Client } from '../../types';
import { BookOpen, Search, Plus, FileText, Image, File, Trash2, Download, Users, Lock, Unlock, Eye, Filter, CheckCircle2, Edit2, Share2, Tag, ChevronRight, Globe, LayoutGrid, List, UploadCloud, X } from 'lucide-react';
import { Modal } from '../../components/Modal';

const Library = () => {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [newDoc, setNewDoc] = useState<Partial<LibraryDocument>>({
    title: '',
    category: 'General',
    description: '',
    targetAudience: 'ALL',
    fileType: 'PDF',
    allowedClientIds: []
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Share/Distribution Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingDoc, setSharingDoc] = useState<LibraryDocument | null>(null);
  const [shareMode, setShareMode] = useState<'ALL' | 'TAG' | 'MANUAL'>('MANUAL');
  const [selectedTag, setSelectedTag] = useState('');
  const [distributionList, setDistributionList] = useState<string[]>([]); // Array of Client IDs

  // Delete Confirmation State
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDocuments(StorageService.getLibraryDocuments());
    setClients(StorageService.getClients());
    setAvailableTags(StorageService.getTags());
  };

  const handleOpenNew = () => {
    setEditingDocId(null);
    setNewDoc({
      title: '',
      category: 'General',
      description: '',
      targetAudience: 'ALL',
      fileType: 'PDF',
      allowedClientIds: []
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (doc: LibraryDocument) => {
    setEditingDocId(doc.id);
    setNewDoc({
      title: doc.title,
      category: doc.category,
      description: doc.description,
      targetAudience: doc.targetAudience,
      fileType: doc.fileType,
      allowedClientIds: doc.allowedClientIds
    });
    setSelectedFile(null); // Reset file selection on edit unless user uploads new
    setIsModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedFile(file);
        
        // Auto-detect type
        let type: 'PDF' | 'IMG' | 'DOC' | 'OTHER' = 'OTHER';
        if (file.type.includes('pdf')) type = 'PDF';
        else if (file.type.includes('image')) type = 'IMG';
        else if (file.type.includes('word') || file.type.includes('document')) type = 'DOC';
        
        setNewDoc(prev => ({
            ...prev,
            title: prev.title || file.name.split('.')[0], // Auto-fill title if empty
            fileType: type
        }));
    }
  };

  // --- SHARE LOGIC START ---
  const handleShareClick = (doc: LibraryDocument) => {
    setSharingDoc(doc);
    // Initialize state based on current doc permissions
    if (doc.targetAudience === 'ALL') {
        setShareMode('ALL');
        setDistributionList([]);
    } else {
        setShareMode('MANUAL');
        setDistributionList(doc.allowedClientIds || []);
    }
    setSelectedTag('');
    setIsShareModalOpen(true);
  };

  const applyTagFilter = (tag: string) => {
      setSelectedTag(tag);
      if (!tag) return;
      
      const clientsWithTag = clients.filter(c => c.tags?.includes(tag)).map(c => c.id);
      setDistributionList(clientsWithTag);
  };

  const toggleClientInDistribution = (clientId: string) => {
      if (distributionList.includes(clientId)) {
          setDistributionList(distributionList.filter(id => id !== clientId));
      } else {
          setDistributionList([...distributionList, clientId]);
      }
  };

  const saveDistribution = () => {
      if (!sharingDoc) return;

      const updatedDoc: LibraryDocument = {
          ...sharingDoc,
          targetAudience: shareMode === 'ALL' ? 'ALL' : 'SPECIFIC',
          allowedClientIds: shareMode === 'ALL' ? [] : distributionList
      };

      StorageService.saveLibraryDocument(updatedDoc);
      setIsShareModalOpen(false);
      loadData();
  };
  // --- SHARE LOGIC END ---

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.category) return;

    // Preserve original date if editing, else new date
    const originalDoc = editingDocId ? documents.find(d => d.id === editingDocId) : null;
    
    // Mock URL generation from file name
    const mockFileUrl = selectedFile ? `#uploaded-${selectedFile.name}` : (originalDoc?.fileUrl || '#');

    const doc: LibraryDocument = {
      id: editingDocId || `LIB-${Date.now()}`,
      title: newDoc.title,
      category: newDoc.category,
      description: newDoc.description || '',
      fileUrl: mockFileUrl, 
      uploadDate: originalDoc?.uploadDate || new Date().toISOString(),
      fileType: newDoc.fileType || 'PDF',
      targetAudience: newDoc.targetAudience || 'ALL',
      allowedClientIds: newDoc.allowedClientIds || []
    };

    StorageService.saveLibraryDocument(doc);
    setIsModalOpen(false);
    loadData();
    
    // Reset
    setEditingDocId(null);
    setSelectedFile(null);
    setNewDoc({
      title: '',
      category: 'General',
      description: '',
      targetAudience: 'ALL',
      fileType: 'PDF',
      allowedClientIds: []
    });
  };

  const handleDeleteClick = (id: string) => {
    setDocToDelete(id);
  };

  const confirmDelete = () => {
    if (docToDelete) {
      StorageService.deleteLibraryDocument(docToDelete);
      setDocToDelete(null);
      loadData();
    }
  };

  // Filter Logic
  const categories = ['Todos', ...Array.from(new Set(documents.map(d => d.category)))];

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    switch(type) {
        case 'PDF': return <FileText size={24} className="text-red-500" />;
        case 'IMG': return <Image size={24} className="text-blue-500" />;
        case 'DOC': return <FileText size={24} className="text-blue-700" />;
        default: return <File size={24} className="text-gray-400" />;
    }
  };

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-corporate-dark">Biblioteca Digital</h2>
          <div className="flex items-center text-gray-400 mt-2 space-x-2 text-sm">
            <BookOpen size={14} />
            <span className="capitalize">{getCurrentDate()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-3.5 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar documento..." 
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all text-sm"
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

          <button 
            onClick={handleOpenNew}
            className="flex items-center space-x-2 bg-[#0f172a] text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 text-sm font-bold tracking-wide uppercase"
          >
            <Plus size={16} />
            <span className="hidden md:inline">Subir Doc</span>
          </button>
        </div>
      </div>

      {/* Categories / Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
         {categories.map(cat => (
             <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full border text-xs font-bold transition-colors whitespace-nowrap ${
                    selectedCategory === cat 
                    ? 'bg-gold border-gold text-white' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gold hover:text-gold'
                }`}
             >
                 {cat}
             </button>
         ))}
      </div>

      {/* Documents Render */}
      {viewMode === 'grid' ? (
        // GRID VIEW
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
                <div key={doc.id} className="group bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-gold/10 transition-colors">
                            {getFileIcon(doc.fileType)}
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 ${doc.targetAudience === 'ALL' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                                {doc.targetAudience === 'ALL' ? <Unlock size={10} /> : <Lock size={10} />}
                                {doc.targetAudience === 'ALL' ? 'Público' : 'Privado'}
                            </span>
                            <div className="flex gap-1 pl-2 border-l border-gray-100">
                                <button onClick={() => handleShareClick(doc)} className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Share2 size={16} /></button>
                                <button onClick={() => handleEditClick(doc)} className="p-1.5 text-gray-300 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteClick(doc.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 flex-1">
                        <div className="text-[10px] font-bold text-gold uppercase tracking-wider mb-1">{doc.category}</div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight">{doc.title}</h3>
                        <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed">{doc.description}</p>
                    </div>

                    <div className="border-t border-gray-50 pt-4 flex justify-between items-center text-xs text-gray-400">
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        <button className="flex items-center gap-1 hover:text-gold transition-colors font-bold uppercase">
                            <Download size={14} /> Descargar
                        </button>
                    </div>
                </div>
            ))}
        </div>
      ) : (
        // LIST VIEW
        <div className="space-y-3">
            {filteredDocs.map((doc) => (
                <div key={doc.id} className="group bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gold/30 transition-all flex items-center gap-4">
                    
                    {/* Icon */}
                    <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-gold/10 transition-colors shrink-0">
                        {getFileIcon(doc.fileType)}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-wider">{doc.category}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 ${doc.targetAudience === 'ALL' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                                {doc.targetAudience === 'ALL' ? 'Público' : 'Privado'}
                            </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm truncate">{doc.title}</h3>
                        <p className="text-gray-400 text-xs truncate">{doc.description}</p>
                    </div>

                    {/* Metadata */}
                    <div className="hidden md:block text-right shrink-0">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fecha de Carga</div>
                        <div className="text-xs text-gray-600">{new Date(doc.uploadDate).toLocaleDateString()}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
                         <button onClick={() => handleShareClick(doc)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Compartir"><Share2 size={16} /></button>
                         <button onClick={() => handleEditClick(doc)} className="p-2 text-gray-400 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors" title="Editar"><Edit2 size={16} /></button>
                         <button className="p-2 text-gray-400 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors" title="Descargar"><Download size={16} /></button>
                         <button onClick={() => handleDeleteClick(doc.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
        </div>
      )}
      
      {filteredDocs.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-white rounded-[2rem] border border-dashed border-gray-200">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p>No se encontraron documentos en esta categoría.</p>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!docToDelete} onClose={() => setDocToDelete(null)} title="Eliminar Documento" width="max-w-md">
         <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
               <Trash2 size={28} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">¿Confirmar eliminación?</h3>
               <p className="text-sm text-gray-500">
                  El documento será eliminado permanentemente de la biblioteca y dejará de estar visible para los clientes asignados.
               </p>
            </div>
            <div className="flex gap-3 pt-2">
               <button onClick={() => setDocToDelete(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase hover:bg-gray-50 transition-colors">
                  Cancelar
               </button>
               <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">
                  Eliminar
               </button>
            </div>
         </div>
      </Modal>

      {/* Distribution/Share Modal */}
      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Distribuir Documento" width="max-w-3xl">
         <div className="space-y-8">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-4">
               <div className="p-3 bg-white rounded-lg shadow-sm">
                  <FileText size={24} className="text-gray-400" />
               </div>
               <div>
                  <h4 className="font-bold text-gray-900">{sharingDoc?.title}</h4>
                  <p className="text-xs text-gray-500">{sharingDoc?.category} • {sharingDoc?.fileType}</p>
               </div>
            </div>

            {/* Selection Strategy Tabs */}
            <div className="grid grid-cols-3 gap-4">
               <button 
                  onClick={() => setShareMode('ALL')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                     shareMode === 'ALL' 
                     ? 'border-gold bg-gold/5 text-gold-dark' 
                     : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                  }`}
               >
                  <Globe size={24} />
                  <span className="text-xs font-bold uppercase tracking-wider">Todos los Clientes</span>
               </button>
               
               <button 
                  onClick={() => setShareMode('TAG')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                     shareMode === 'TAG' 
                     ? 'border-gold bg-gold/5 text-gold-dark' 
                     : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                  }`}
               >
                  <Tag size={24} />
                  <span className="text-xs font-bold uppercase tracking-wider">Por Etiqueta</span>
               </button>

               <button 
                  onClick={() => setShareMode('MANUAL')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                     shareMode === 'MANUAL' 
                     ? 'border-gold bg-gold/5 text-gold-dark' 
                     : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                  }`}
               >
                  <Users size={24} />
                  <span className="text-xs font-bold uppercase tracking-wider">Selección Manual</span>
               </button>
            </div>

            {/* Dynamic Content Area */}
            <div className="min-h-[250px] border-t border-gray-100 pt-6">
               
               {shareMode === 'ALL' && (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-4">
                     <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                        <Globe size={32} />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-gray-900">Acceso Público</h4>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">
                           Este documento será visible para <strong>todos</strong> los clientes registrados en la plataforma ({clients.length} usuarios).
                        </p>
                     </div>
                  </div>
               )}

               {shareMode === 'TAG' && (
                  <div className="space-y-6">
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Seleccionar Etiqueta</label>
                        <select 
                           className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-sm"
                           value={selectedTag}
                           onChange={(e) => applyTagFilter(e.target.value)}
                        >
                           <option value="">Seleccione...</option>
                           {availableTags.map(tag => (
                              <option key={tag} value={tag}>{tag}</option>
                           ))}
                        </select>
                     </div>
                     
                     {selectedTag && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <Users size={20} className="text-blue-500" />
                              <span className="text-sm font-bold text-blue-700">Clientes encontrados con etiqueta "{selectedTag}"</span>
                           </div>
                           <span className="bg-white px-3 py-1 rounded-lg text-blue-600 font-bold text-sm shadow-sm">
                              {distributionList.length}
                           </span>
                        </div>
                     )}

                     <div className="max-h-40 overflow-y-auto custom-scrollbar border rounded-xl p-2 bg-gray-50">
                        {distributionList.length > 0 ? (
                            clients.filter(c => distributionList.includes(c.id)).map(c => (
                                <div key={c.id} className="flex items-center gap-2 p-2 border-b border-gray-100 last:border-0 text-sm text-gray-600">
                                   <CheckCircle2 size={14} className="text-green-500" /> {c.name}
                                </div>
                            ))
                        ) : (
                           <div className="text-center py-4 text-xs text-gray-400">Ningún cliente seleccionado</div>
                        )}
                     </div>
                  </div>
               )}

               {shareMode === 'MANUAL' && (
                  <div className="space-y-4">
                     <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Selección de Destinatarios</label>
                        <span className="text-xs font-bold text-gold">{distributionList.length} Seleccionados</span>
                     </div>
                     <div className="max-h-60 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-2">
                        {clients.map(client => (
                           <label 
                              key={client.id} 
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                 distributionList.includes(client.id) 
                                 ? 'bg-gold/5 border-gold shadow-sm' 
                                 : 'bg-white border-gray-100 hover:bg-gray-50'
                              }`}
                           >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                 distributionList.includes(client.id) ? 'bg-gold border-gold text-white' : 'bg-white border-gray-300'
                              }`}>
                                 {distributionList.includes(client.id) && <CheckCircle2 size={14} />}
                              </div>
                              <input 
                                 type="checkbox" 
                                 className="hidden"
                                 checked={distributionList.includes(client.id)}
                                 onChange={() => toggleClientInDistribution(client.id)}
                              />
                              <div className="min-w-0">
                                 <div className="text-xs font-bold text-gray-800 truncate">{client.name}</div>
                                 <div className="text-[10px] text-gray-400 truncate">{client.id}</div>
                              </div>
                           </label>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
               <button 
                  onClick={saveDistribution}
                  className="bg-gray-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-gold transition-all shadow-lg text-xs uppercase tracking-widest flex items-center gap-2"
               >
                  <Share2 size={14} /> Confirmar Envío
               </button>
            </div>
         </div>
      </Modal>

      {/* Upload/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDocId ? "Editar Documento" : "Subir Documento"} width="max-w-2xl">
          <form onSubmit={handleSave} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título</label>
                      <input 
                        required 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm"
                        value={newDoc.title}
                        onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoría</label>
                      <input 
                        required 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm"
                        placeholder="Ej. Fiscal, Laboral..."
                        value={newDoc.category}
                        onChange={(e) => setNewDoc({...newDoc, category: e.target.value})}
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción</label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm resize-none"
                    rows={3}
                    value={newDoc.description}
                    onChange={(e) => setNewDoc({...newDoc, description: e.target.value})}
                  />
              </div>

              {/* File Upload Field */}
              <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Archivo</label>
                  {!selectedFile ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gold/50 hover:bg-gold/5 transition-all cursor-pointer bg-gray-50/50"
                      >
                          <input 
                             type="file" 
                             ref={fileInputRef}
                             className="hidden"
                             onChange={handleFileSelect}
                          />
                          <UploadCloud size={24} className="mb-2 text-gray-300" />
                          <span className="text-xs font-medium">Arrastre archivo o clic para seleccionar</span>
                      </div>
                  ) : (
                      <div className="flex items-center justify-between p-3 bg-white border border-green-100 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                                  <FileText size={20} />
                              </div>
                              <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-800 truncate max-w-[200px]">{selectedFile.name}</p>
                                  <p className="text-[10px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                          </div>
                          <button 
                             type="button" 
                             onClick={() => setSelectedFile(null)}
                             className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                              <X size={16} />
                          </button>
                      </div>
                  )}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 flex items-center gap-2">
                 <Lock size={14} /> El documento se subirá como privado. Utilice el botón "Compartir" para distribuirlo a clientes o etiquetas específicas.
              </div>
            
              <div className="pt-2">
                 <button className="w-full bg-gold hover:bg-gold-dark text-white font-bold py-4 rounded-xl shadow-lg transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    {editingDocId ? <Edit2 size={16} /> : <Plus size={16} />}
                    {editingDocId ? "Guardar Cambios" : "Guardar en Biblioteca"}
                 </button>
              </div>

          </form>
      </Modal>

    </div>
  );
};

export default Library;