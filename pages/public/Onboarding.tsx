import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, ArrowRight, Loader2, ShieldCheck, User, Building2, Mail, Phone, MapPin, ArrowLeft, FileBadge, ScrollText, ScanFace, AlertTriangle, Trash2, X } from 'lucide-react';
import { analyzeTaxDocument } from '../../services/ocrService';
import { StorageService } from '../../services/storage';
import { Client, ClientType } from '../../types';
import { Modal } from '../../components/Modal';

// Document Requirements Configuration
const DOC_REQUIREMENTS = {
  [ClientType.INDIVIDUAL]: [
    { id: 'tax_id', label: 'Constancia de Situación Fiscal', icon: FileBadge, required: true, description: 'Documento PDF reciente (máx 3 meses).' },
    { id: 'id_card', label: 'Identificación Oficial (INE/Pasaporte)', icon: ScanFace, required: true, description: 'Imagen o PDF legible por ambos lados.' }
  ],
  [ClientType.CORPORATE]: [
    { id: 'tax_id', label: 'Constancia de Situación Fiscal', icon: FileBadge, required: true, description: 'Del mes en curso.' },
    { id: 'articles', label: 'Acta Constitutiva', icon: ScrollText, required: true, description: 'Primeras 5 hojas y hoja de registro público.' },
    { id: 'rep_id', label: 'ID Representante Legal', icon: User, required: true, description: 'INE o Pasaporte del firmante.' }
  ]
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // 0: Type Selection, 1: Uploads, 2: Verify, 3: Success
  const [clientType, setClientType] = useState<ClientType>(ClientType.CORPORATE);
  
  // File State
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    fiscalRegime: '',
  });

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleTypeSelect = (type: ClientType) => {
    setClientType(type);
    setStep(1);
  };

  const handleFileSelect = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      setFiles(prev => ({ ...prev, [docId]: selectedFile }));

      // Only analyze the Tax ID document for data extraction to keep it fast
      if (docId === 'tax_id') {
        setAnalyzingDocId(docId);
        const data = await analyzeTaxDocument(selectedFile);
        if (data) {
          setFormData(prev => ({
            ...prev,
            name: data.name || prev.name,
            taxId: data.taxId || prev.taxId,
            address: data.address || prev.address,
            fiscalRegime: data.fiscalRegime || prev.fiscalRegime,
          }));
        }
        setAnalyzingDocId(null);
      }
    }
  };

  const confirmDeleteFile = () => {
    if (docToDelete) {
       const newFiles = {...files};
       delete newFiles[docToDelete];
       setFiles(newFiles);
       // Clear input value to allow re-uploading same file
       if(fileInputRefs.current[docToDelete]) fileInputRefs.current[docToDelete]!.value = "";
       setDocToDelete(null);
    }
  };

  const handleContinueToForm = () => {
     // Validate required docs
     const requirements = DOC_REQUIREMENTS[clientType];
     const missing = requirements.filter(req => req.required && !files[req.id]);
     
     if (missing.length > 0) {
        alert(`Por favor suba los documentos obligatorios: ${missing.map(m => m.label).join(', ')}`);
        return;
     }
     setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new client object
    const newClient: Client = {
      id: `CLI-${Math.floor(1000 + Math.random() * 9000)}-${formData.name.substring(0,3).toUpperCase()}-NEW`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      taxId: formData.taxId,
      address: formData.address,
      fiscalRegime: formData.fiscalRegime,
      type: clientType,
      accessEnabled: true,
      tags: ['NUEVO', 'PENDIENTE_REVISION', 'DIGITAL_ONBOARDING'],
      sla: 100,
      notes: `Cliente registrado digitalmente. Documentos cargados: ${Object.keys(files).join(', ')}.`,
      contacts: [],
      contracts: []
    };

    StorageService.saveClient(newClient);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center relative overflow-hidden font-sans text-gray-600">
      
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-200 via-gold to-gray-200"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[100px] -mt-32 -mr-32 pointer-events-none"></div>

      {/* Header */}
      <div className="w-full max-w-4xl px-6 py-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
           <button onClick={() => step > 0 ? setStep(step - 1 as any) : navigate('/')} className="text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowLeft size={20} />
           </button>
           <h1 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">Lagom Co.</h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
           <ShieldCheck size={14} className="text-gold" /> Onboarding Seguro
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-3xl px-6 py-8 flex flex-col relative z-10">
        
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
           <div className="flex items-center gap-4">
              <StepIndicator number={1} active={step >= 0} completed={step > 0} label="Perfil" />
              <div className={`w-12 h-px transition-colors ${step > 0 ? 'bg-gold' : 'bg-gray-200'}`}></div>
              <StepIndicator number={2} active={step >= 1} completed={step > 1} label="Documentación" />
              <div className={`w-12 h-px transition-colors ${step > 1 ? 'bg-gold' : 'bg-gray-200'}`}></div>
              <StepIndicator number={3} active={step >= 2} completed={step > 2} label="Validación" />
           </div>
        </div>

        {/* STEP 0: TYPE SELECTION */}
        {step === 0 && (
           <div className="animate-fadeIn text-center max-w-2xl mx-auto">
              <h2 className="font-serif text-4xl font-medium text-gray-900 mb-4">Bienvenido a Lagom Co.</h2>
              <p className="text-gray-500 font-light text-lg mb-10">Para personalizar su experiencia de alta, por favor indíquenos su perfil fiscal.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <button 
                    onClick={() => handleTypeSelect(ClientType.INDIVIDUAL)}
                    className="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-gold/30 transition-all text-left relative overflow-hidden"
                 >
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 text-gray-400 group-hover:bg-gold group-hover:text-white transition-colors">
                       <User size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Persona Física</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">Soy un individuo, profesionista o empresario independiente.</p>
                    <div className="mt-6 flex items-center text-xs font-bold text-gold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                       Seleccionar <ArrowRight size={12} className="ml-2" />
                    </div>
                 </button>

                 <button 
                    onClick={() => handleTypeSelect(ClientType.CORPORATE)}
                    className="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-gold/30 transition-all text-left relative overflow-hidden"
                 >
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 text-gray-400 group-hover:bg-[#0f172a] group-hover:text-white transition-colors">
                       <Building2 size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Persona Moral</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">Represento a una empresa, sociedad anónima o asociación.</p>
                    <div className="mt-6 flex items-center text-xs font-bold text-[#0f172a] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                       Seleccionar <ArrowRight size={12} className="ml-2" />
                    </div>
                 </button>
              </div>
           </div>
        )}

        {/* STEP 1: DOCUMENT LIST */}
        {step === 1 && (
          <div className="animate-fadeIn max-w-2xl mx-auto w-full">
             <div className="text-center mb-10">
                <h2 className="font-serif text-3xl font-medium text-gray-900 mb-2">Expediente Digital</h2>
                <p className="text-sm text-gray-500">Por favor cargue los documentos solicitados para conformar su expediente legal.</p>
             </div>

             <div className="space-y-4 mb-8">
                {DOC_REQUIREMENTS[clientType].map((req) => (
                   <div 
                      key={req.id}
                      onClick={() => !files[req.id] && fileInputRefs.current[req.id]?.click()}
                      className={`relative p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                         files[req.id] 
                           ? 'bg-white border-green-100 shadow-sm' 
                           : 'bg-white border-dashed border-gray-200 hover:border-gold/30 hover:bg-gray-50 cursor-pointer'
                      }`}
                   >
                      <input 
                         type="file" 
                         ref={(el) => { fileInputRefs.current[req.id] = el; }}
                         className="hidden" 
                         accept=".pdf,.jpg,.png"
                         onChange={(e) => handleFileSelect(req.id, e)}
                      />

                      {/* Icon Status */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                         files[req.id] ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gold/10 group-hover:text-gold'
                      }`}>
                         {analyzingDocId === req.id ? (
                            <Loader2 size={20} className="animate-spin" />
                         ) : files[req.id] ? (
                            <CheckCircle2 size={20} />
                         ) : (
                            <req.icon size={20} />
                         )}
                      </div>

                      {/* Text Info */}
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-0.5">
                            <h4 className={`font-bold text-sm ${files[req.id] ? 'text-gray-900' : 'text-gray-600'}`}>{req.label}</h4>
                            {req.required && <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Requerido</span>}
                         </div>
                         <p className="text-xs text-gray-400 truncate">
                            {analyzingDocId === req.id 
                               ? 'Analizando documento con IA...' 
                               : files[req.id] 
                                  ? files[req.id]?.name 
                                  : req.description}
                         </p>
                      </div>

                      {/* Action Icon */}
                      {!files[req.id] && (
                         <div className="bg-white border border-gray-200 text-gray-400 p-2 rounded-lg group-hover:text-gold group-hover:border-gold/30 transition-all">
                            <UploadCloud size={16} />
                         </div>
                      )}
                      
                      {/* Delete Button (if uploaded) - FIX: Use Type Button and relative class */}
                      {files[req.id] && !analyzingDocId && (
                         <button 
                           type="button"
                           onClick={(e) => {
                              e.stopPropagation();
                              setDocToDelete(req.id);
                           }}
                           className="relative z-20 text-gray-300 hover:text-red-500 p-2 transition-colors hover:bg-red-50 rounded-lg"
                           title="Eliminar documento"
                         >
                            <span className="sr-only">Eliminar</span>
                            <div className="rotate-45"><ArrowLeft size={16} /></div> {/* X icon via rotation */}
                         </button>
                      )}
                   </div>
                ))}
             </div>

             <div className="flex justify-end gap-4">
               <button onClick={() => setStep(0)} className="px-6 py-3 rounded-xl text-gray-500 font-bold text-xs uppercase hover:bg-gray-100 transition-colors">
                  Atrás
               </button>
               <button 
                  onClick={handleContinueToForm}
                  className="px-8 py-3 rounded-xl bg-gold text-white font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-gold-dark transition-all flex items-center gap-2"
               >
                  Continuar <ArrowRight size={14} />
               </button>
             </div>
          </div>
        )}

        {/* STEP 2: REVIEW FORM */}
        {step === 2 && (
          <div className="animate-fadeIn max-w-3xl mx-auto w-full">
             <div className="mb-8 text-center">
                <h2 className="font-serif text-3xl font-medium text-gray-900 mb-2">Validación de Datos</h2>
                <p className="text-sm text-gray-500">Hemos extraído la siguiente información de su Constancia de Situación Fiscal. Por favor verifique.</p>
             </div>

             <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 space-y-6 relative">
                
                {/* AI Badge */}
                <div className="absolute top-8 right-10 flex items-center gap-2 text-[10px] font-bold text-gold bg-gold/5 px-3 py-1 rounded-full border border-gold/10">
                   <ShieldCheck size={12} /> Datos Pre-llenados por IA
                </div>

                <div className="grid grid-cols-2 gap-5 pt-4">
                   <div className="col-span-2">
                      <InputLabel icon={<Building2 size={14}/>} label={clientType === ClientType.CORPORATE ? 'Razón Social' : 'Nombre Completo'} />
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input" />
                   </div>

                   <div>
                      <InputLabel icon={<FileText size={14}/>} label="RFC / Tax ID" />
                      <input required value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} className="form-input" />
                   </div>
                   
                   <div>
                      <InputLabel icon={<FileText size={14}/>} label="Régimen Fiscal" />
                      <input value={formData.fiscalRegime} onChange={e => setFormData({...formData, fiscalRegime: e.target.value})} className="form-input" />
                   </div>

                   <div className="col-span-2">
                      <InputLabel icon={<MapPin size={14}/>} label="Dirección Fiscal" />
                      <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="form-input" />
                   </div>

                   <div className="col-span-2 my-2 border-t border-gray-100"></div>

                   <div>
                      <InputLabel icon={<Mail size={14}/>} label="Correo Electrónico" />
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="form-input" placeholder="contacto@empresa.com" />
                   </div>

                   <div>
                      <InputLabel icon={<Phone size={14}/>} label="Teléfono Móvil" />
                      <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="form-input" placeholder="+52..." />
                   </div>
                </div>

                <div className="pt-6 flex gap-4">
                   <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-500 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors">
                      Corregir Documentos
                   </button>
                   <button type="submit" className="flex-[2] bg-[#0f172a] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-gray-800 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                      Confirmar y Registrar <ArrowRight size={14} />
                   </button>
                </div>
             </form>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
           <div className="animate-fadeIn text-center py-10">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <h2 className="font-serif text-4xl font-medium text-gray-900 mb-4">¡Registro Exitoso!</h2>
              <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                 Su expediente ha sido creado. Hemos recibido sus {Object.keys(files).length} documentos correctamente y serán validados por nuestro equipo de compliance.
              </p>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-sm mx-auto mb-10">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Su Folio de Cliente</p>
                 <p className="font-mono text-xl font-bold text-gold">{`CLI-${formData.name.substring(0,3).toUpperCase()}-NEW`}</p>
              </div>

              <div className="flex gap-4 justify-center">
                 <button onClick={() => navigate('/')} className="px-8 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors">
                    Volver al Inicio
                 </button>
                 <button onClick={() => navigate('/client/login')} className="px-8 py-3 rounded-xl bg-gold text-white font-bold text-xs uppercase tracking-widest hover:bg-gold-dark shadow-lg transition-colors">
                    Acceder al Portal
                 </button>
              </div>
           </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!docToDelete} onClose={() => setDocToDelete(null)} title="Eliminar Documento" width="max-w-md">
         <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
               <Trash2 size={28} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">¿Está seguro?</h3>
               <p className="text-sm text-gray-500">Se eliminará el archivo seleccionado. Deberá cargarlo nuevamente para completar el registro.</p>
            </div>
            <div className="flex gap-3 pt-2">
               <button onClick={() => setDocToDelete(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase hover:bg-gray-50 transition-colors">
                  Cancelar
               </button>
               <button onClick={confirmDeleteFile} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">
                  Sí, Eliminar
               </button>
            </div>
         </div>
      </Modal>
      
      <style>{`
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background-color: #F9FAFB;
          border: 1px solid #E5E7EB;
          font-size: 0.875rem;
          color: #1F2937;
          outline: none;
          transition: all 0.2s;
        }
        .form-input:focus {
          background-color: #FFFFFF;
          border-color: #c2ac15;
          box-shadow: 0 0 0 3px rgba(194, 172, 21, 0.1);
        }
      `}</style>
    </div>
  );
};

const StepIndicator = ({ number, active, completed, label }: any) => (
   <div className="flex flex-col items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
         completed ? 'bg-gold text-white' : 
         active ? 'bg-white border-2 border-gold text-gold' : 
         'bg-gray-100 text-gray-400'
      }`}>
         {completed ? <CheckCircle2 size={16} /> : number}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-gold' : 'text-gray-300'}`}>{label}</span>
   </div>
);

const InputLabel = ({ icon, label }: any) => (
   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
      {icon} {label}
   </label>
);

export default Onboarding;