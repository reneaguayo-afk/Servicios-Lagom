import React, { useEffect, useState, useMemo, useRef } from 'react';
import { StorageService } from '../../services/storage';
import { Case, Client, Payment } from '../../types';
import { 
  Wallet, AlertCircle, CreditCard, Download, Plus, MessageSquare, 
  UploadCloud, ChevronDown, TrendingUp, ArrowUpRight, CheckCircle2, 
  Filter, Mail, Send, Calendar, PieChart, BarChart3, User, FileText, Search, MoreHorizontal,
  Edit2, Trash2, X, File
} from 'lucide-react';
import { Modal } from '../../components/Modal';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';

interface Transaction {
  id: string;
  caseId: string; // Added to link back to case
  date: string;
  clientName: string;
  serviceName: string;
  concept: string;
  method: string;
  amount: number;
  status: 'Paid' | 'Pending';
  reference?: string; // Added for editing
}

interface OutstandingItem {
  caseId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceName: string;
  folio: string;
  pendingAmount: number;
  totalCost: number;
  paidAmount: number;
}

const Finances = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [outstandingItems, setOutstandingItems] = useState<OutstandingItem[]>([]);
  
  // KPI Stats
  const [totalFacturado, setTotalFacturado] = useState(0);
  const [porCobrar, setPorCobrar] = useState(0);
  const [ticketPromedio, setTicketPromedio] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [methodData, setMethodData] = useState<any[]>([]);

  // UI State
  const [transactionFilter, setTransactionFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [receivableFilter, setReceivableFilter] = useState('');
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<File | null>(null);

  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Transferencia',
    reference: '',
    concept: ''
  });

  // Derived state for the modal
  const selectedCase = useMemo(() => cases.find(c => c.id === selectedCaseId), [cases, selectedCaseId]);
  const selectedClient = useMemo(() => clients.find(c => c.id === selectedCase?.clientId), [clients, selectedCase]);
  const selectedCaseStats = useMemo(() => {
      if (!selectedCase) return { paid: 0, pending: 0, progress: 0 };
      const paid = selectedCase.payments.reduce((sum, p) => sum + p.amount, 0);
      const pending = selectedCase.totalCost - paid;
      return { 
          paid, 
          pending,
          progress: Math.min(100, Math.round((paid / selectedCase.totalCost) * 100))
      };
  }, [selectedCase]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedCases = StorageService.getCases();
    const loadedClients = StorageService.getClients();
    setCases(loadedCases);
    setClients(loadedClients);

    let calculatedTotal = 0;
    let calculatedPending = 0;
    const allTransactions: Transaction[] = [];
    const pendingList: OutstandingItem[] = [];
    const revenue: Record<string, number> = {};
    const methodCounts: Record<string, number> = {};

    // Initialize last 6 months for chart
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString('default', { month: 'short' });
        revenue[key] = 0;
    }

    loadedCases.forEach(c => {
      const client = loadedClients.find(cl => cl.id === c.clientId);
      const clientName = client ? client.name : 'Unknown';
      
      const paidAmount = c.payments.reduce((sum, p) => sum + p.amount, 0);
      calculatedTotal += paidAmount;
      
      const pending = c.totalCost - paidAmount;
      if (pending > 0 && c.status !== 'Completed' && c.status !== 'Archived') {
        calculatedPending += pending;
        pendingList.push({
          caseId: c.id,
          clientId: c.clientId,
          clientName: clientName,
          clientPhone: client?.phone || '',
          clientEmail: client?.email || '',
          serviceName: c.serviceName,
          folio: c.folio,
          pendingAmount: pending,
          totalCost: c.totalCost,
          paidAmount: paidAmount
        });
      }

      c.payments.forEach(p => {
        allTransactions.push({
          id: p.id,
          caseId: c.id,
          date: p.date,
          clientName: clientName,
          serviceName: c.serviceName,
          concept: p.concept,
          method: p.method || 'Transferencia',
          amount: p.amount,
          status: 'Paid',
          reference: p.reference
        });

        // Chart Data
        const monthKey = new Date(p.date).toLocaleString('default', { month: 'short' });
        if (revenue[monthKey] !== undefined) {
            revenue[monthKey] += p.amount;
        }

        // Method Data
        const method = p.method || 'Otros';
        methodCounts[method] = (methodCounts[method] || 0) + p.amount;
      });
    });

    // Transform Chart Data
    const chartDataArray = Object.keys(revenue).map(key => ({
        name: key,
        amount: revenue[key]
    }));

    const methodDataArray = Object.keys(methodCounts).map(key => ({
        name: key,
        value: methodCounts[key]
    }));

    setChartData(chartDataArray);
    setMethodData(methodDataArray);
    setTransactions(allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setOutstandingItems(pendingList);
    setTotalFacturado(calculatedTotal);
    setPorCobrar(calculatedPending);
    setTicketPromedio(allTransactions.length > 0 ? calculatedTotal / allTransactions.length : 0);
  };

  const handleOpenPaymentModal = (caseId?: string, defaultAmount?: number) => {
    setEditingTransaction(null); // Ensure creation mode
    setSelectedCaseId(caseId || ''); 
    setSelectedReceipt(null);
    setNewPayment({
      amount: defaultAmount ? defaultAmount.toString() : '',
      date: new Date().toISOString().split('T')[0],
      method: 'Transferencia',
      reference: '',
      concept: defaultAmount ? 'Liquidación de Saldo' : ''
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedReceipt(e.target.files[0]);
    }
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setSelectedCaseId(t.caseId);
    setSelectedReceipt(null);
    setNewPayment({
        amount: t.amount.toString(),
        date: new Date(t.date).toISOString().split('T')[0],
        method: t.method,
        reference: t.reference || '',
        concept: t.concept
    });
    setIsModalOpen(true);
  };

  const confirmDeleteTransaction = () => {
      if (!transactionToDelete) return;

      const caseToUpdate = cases.find(c => c.id === transactionToDelete.caseId);
      if (caseToUpdate) {
          const updatedPayments = caseToUpdate.payments.filter(p => p.id !== transactionToDelete.id);
          const updatedCase = { ...caseToUpdate, payments: updatedPayments };
          StorageService.updateCase(updatedCase);
          loadData();
      }
      setTransactionToDelete(null);
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;

    if (editingTransaction) {
        // Update Existing Transaction Logic
        const caseToUpdate = cases.find(c => c.id === selectedCaseId);
        if (caseToUpdate) {
            const updatedPayments = caseToUpdate.payments.map(p => {
                if (p.id === editingTransaction.id) {
                    return {
                        ...p,
                        amount: parseFloat(newPayment.amount),
                        date: new Date(newPayment.date).toISOString(),
                        concept: newPayment.concept,
                        method: newPayment.method as any,
                        reference: newPayment.reference
                    };
                }
                return p;
            });
            StorageService.updateCase({ ...caseToUpdate, payments: updatedPayments });
        }
    } else {
        // Create New Transaction Logic
        const payment: Payment = {
            id: `PAY-${Date.now()}`,
            amount: parseFloat(newPayment.amount),
            date: new Date(newPayment.date).toISOString(),
            concept: newPayment.concept,
            status: 'Paid',
            method: newPayment.method as any,
            reference: newPayment.reference
        };
        StorageService.addPayment(selectedCaseId, payment);
    }

    setIsModalOpen(false);
    setEditingTransaction(null);
    setSelectedReceipt(null);
    loadData();
  };

  const handleSendReminder = (item: OutstandingItem, type: 'whatsapp' | 'email') => {
      const message = `Estimado(a) ${item.clientName}, le recordamos amablemente que tiene un saldo pendiente de $${item.pendingAmount.toLocaleString('es-MX')} correspondiente al servicio "${item.serviceName}" (Folio: ${item.folio}). Agradecemos su pago a la brevedad.`;
      
      if (type === 'whatsapp') {
          const phone = item.clientPhone.replace(/[^0-9]/g, '');
          if(phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
          else alert('El cliente no tiene teléfono registrado.');
      } else {
          if(item.clientEmail) window.location.href = `mailto:${item.clientEmail}?subject=Recordatorio de Pago - Lagom Legal&body=${message}`;
          else alert('El cliente no tiene email registrado.');
      }
  };

  // Smart Filter Logic
  const filteredOutstanding = outstandingItems.filter(item => {
      if (!receivableFilter) return true;
      const term = receivableFilter.toLowerCase();
      return (
          item.clientName.toLowerCase().includes(term) ||
          item.serviceName.toLowerCase().includes(term) ||
          item.folio.toLowerCase().includes(term)
      );
  });

  const filteredTransactions = transactions.filter(t => {
      if (transactionFilter === 'ALL') return true;
      return transactionFilter === 'PAID' ? true : false;
  });

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  };

  const COLORS = ['#c2ac15', '#0f172a', '#94a3b8', '#e2e8f0'];

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-corporate-dark">Finanzas Corporativas</h2>
          <div className="flex items-center text-gray-400 mt-2 space-x-2 text-sm font-medium">
            <CreditCard size={16} />
            <span className="capitalize">{getCurrentDate()}</span>
          </div>
        </div>
        <button 
            onClick={() => handleOpenPaymentModal()}
            className="bg-[#0f172a] hover:bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-widest"
        >
            <Plus size={16} /> Registrar Ingreso
        </button>
      </div>

      {/* KPI Cards - Dark Theme for Primary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Facturado */}
        <div className="col-span-1 bg-[#0f172a] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between h-48 group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Wallet size={100} />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-widest mb-2">
                 <TrendingUp size={14} /> Ingresos Totales
              </div>
              <div className="text-4xl font-serif font-bold tracking-tight text-white">${totalFacturado.toLocaleString('es-MX')}</div>
           </div>
           <div className="relative z-10 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
               <div className="bg-gold h-full w-[70%]"></div>
           </div>
        </div>

        {/* Por Cobrar */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-red-100 flex flex-col justify-between h-48 relative overflow-hidden group">
           <div className="absolute -right-4 -bottom-4 text-red-50 opacity-50 group-hover:scale-110 transition-transform">
               <AlertCircle size={120} />
           </div>
           <div>
              <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest">
                    <ArrowUpRight size={14} /> Por Cobrar
                 </div>
              </div>
              <div className="text-4xl font-serif font-bold text-gray-900 tracking-tight">${porCobrar.toLocaleString('es-MX')}</div>
           </div>
           <div className="relative z-10">
               <div className="text-xs text-gray-500 font-medium mb-1">{outstandingItems.length} facturas pendientes</div>
               <div className="flex -space-x-2">
                   {outstandingItems.slice(0,4).map((_,i) => (
                       <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">?</div>
                   ))}
                   {outstandingItems.length > 4 && <div className="w-6 h-6 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-red-500">+{outstandingItems.length - 4}</div>}
               </div>
           </div>
        </div>

         {/* Ticket Promedio */}
         <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-between h-48">
           <div>
              <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                    <PieChart size={14} /> Ticket Promedio
                 </div>
              </div>
              <div className="text-4xl font-serif font-bold text-gray-900 tracking-tight">${ticketPromedio.toLocaleString('es-MX')}</div>
           </div>
           
           <div className="flex items-center gap-4">
               <div className="flex-1">
                   <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                       <span>Conversión</span>
                       <span>85%</span>
                   </div>
                   <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-green-500 h-full w-[85%]"></div>
                   </div>
               </div>
           </div>
        </div>
      </div>

      {/* Analytics Section - Chart */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-gold" /> Tendencia de Ingresos
            </h3>
            <select className="bg-gray-50 border-none text-xs font-bold text-gray-500 rounded-lg py-2 px-3 focus:ring-0 cursor-pointer">
                <option>Últimos 6 meses</option>
                <option>Año actual</option>
            </select>
        </div>
        
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c2ac15" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#c2ac15" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}} 
                        tickFormatter={(value) => `$${value/1000}k`}
                    />
                    <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ingresos']}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#c2ac15" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorGold)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* NEW: Horizontal Accounts Receivable List with Smart Filter */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
         <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h3 className="font-serif text-xl font-bold text-gray-900">Cuentas por Cobrar (Prioridad)</h3>
                    <p className="text-xs text-gray-400 mt-1">Gestión de saldos pendientes y recordatorios.</p>
                </div>
            </div>

            {/* Smart Filter Input */}
            <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Filtrar por cliente, servicio o folio..." 
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all text-sm"
                    value={receivableFilter}
                    onChange={(e) => setReceivableFilter(e.target.value)}
                />
            </div>
         </div>

         {/* Header Row */}
         <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 rounded-xl mb-4 border border-gray-100">
             <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</div>
             <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Servicio</div>
             <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Costo Total</div>
             <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado de Cuenta</div>
             <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acción</div>
         </div>

         {/* List Items */}
         <div className="space-y-3">
            {filteredOutstanding.map((item, idx) => {
                const percentage = Math.min(100, Math.round((item.paidAmount / item.totalCost) * 100));
                
                return (
                    <div key={idx} className="group bg-white border border-gray-100 rounded-2xl p-6 md:p-4 hover:shadow-lg hover:border-red-100 transition-all grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative overflow-hidden">
                        {/* Mobile Label */}
                        <div className="md:col-span-3">
                            <h4 className="font-bold text-gray-900 text-sm truncate" title={item.clientName}>{item.clientName}</h4>
                            <p className="text-[10px] text-gray-400 md:hidden mt-1">Cliente</p>
                        </div>

                        <div className="md:col-span-2">
                            <div className="text-xs text-gray-600 truncate" title={item.serviceName}>{item.serviceName}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.folio}</div>
                        </div>

                        <div className="md:col-span-2">
                            <div className="font-bold text-gray-900 text-sm">${item.totalCost.toLocaleString('es-MX')}</div>
                            <p className="text-[10px] text-gray-400 md:hidden mt-1">Costo Total</p>
                        </div>

                        {/* Financial Progress Bar & Remaining */}
                        <div className="md:col-span-3">
                            <div className="flex items-center justify-between mb-1.5">
                               <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider hidden md:block">Progreso</span>
                               <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Restante: ${item.pendingAmount.toLocaleString('es-MX')}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                                <span>Pagado: ${item.paidAmount.toLocaleString()}</span>
                                <span className="md:hidden">Total: ${item.totalCost.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-2 flex flex-col md:flex-row items-end md:items-center justify-end gap-2">
                            <button 
                                onClick={() => handleSendReminder(item, 'whatsapp')}
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                title="Enviar WhatsApp"
                            >
                                <MessageSquare size={16} />
                            </button>
                            <button 
                                onClick={() => handleOpenPaymentModal(item.caseId, item.pendingAmount)}
                                className="px-4 py-2 bg-[#0f172a] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gold transition-colors shadow-lg w-full md:w-auto"
                            >
                                Cobrar
                            </button>
                        </div>
                    </div>
                );
            })}
            
            {filteredOutstanding.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <CheckCircle2 size={32} className="mx-auto mb-3 text-green-500 opacity-50"/>
                    <p className="text-sm text-gray-500 font-medium">No se encontraron cobros pendientes.</p>
                </div>
            )}
         </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
         <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
            <div>
               <h3 className="font-serif text-xl font-bold text-gray-900">Movimientos Recientes</h3>
               <p className="text-xs text-gray-400 mt-1">Bitácora de operaciones financieras.</p>
            </div>
            
            <div className="flex gap-4">
                {/* Filters */}
                <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-100">
                    <button 
                        onClick={() => setTransactionFilter('ALL')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${transactionFilter === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Todos
                    </button>
                    <button 
                        onClick={() => setTransactionFilter('PAID')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${transactionFilter === 'PAID' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Ingresos
                    </button>
                </div>

                <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 flex items-center gap-2 transition-all uppercase tracking-wide">
                    <Download size={14} /> Exportar
                </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-gray-100">
                     <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-6 whitespace-nowrap">Fecha / ID</th>
                     <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[150px]">Cliente</th>
                     <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[150px]">Concepto</th>
                     <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Método</th>
                     <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Estado</th>
                     <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Monto</th>
                     <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center w-24">Acciones</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredTransactions.map((t) => (
                     <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 px-4 pl-6 whitespace-nowrap">
                           <div className="text-sm font-bold text-gray-900">{new Date(t.date).toLocaleDateString()}</div>
                           <div className="text-[10px] text-gray-400 font-mono">{t.id.split('-')[1]}</div>
                        </td>
                        <td className="py-4 px-4">
                           <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={t.clientName}>{t.clientName}</div>
                           <div className="text-[10px] text-gray-400 truncate max-w-[180px]">{t.serviceName}</div>
                        </td>
                        <td className="py-4 px-4 text-xs text-gray-600 truncate max-w-[180px]" title={t.concept}>{t.concept}</td>
                        <td className="py-4 px-4 whitespace-nowrap">
                           <span className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide">
                              {t.method}
                           </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-600">
                                <CheckCircle2 size={12} /> Pagado
                            </span>
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                           <span className="text-sm font-bold text-gray-900 group-hover:text-gold transition-colors">
                              ${t.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                           </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                           <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                 onClick={() => handleEditTransaction(t)}
                                 className="p-1.5 text-gray-400 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors"
                                 title="Editar Transacción"
                              >
                                 <Edit2 size={16} />
                              </button>
                              <button 
                                 onClick={() => setTransactionToDelete(t)}
                                 className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                 title="Eliminar Transacción"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                     <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                           No se encontraron transacciones.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Payment Modal (Create / Edit) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction ? "Editar Transacción" : "Registro de Ingreso"} width="max-w-lg">
         <form onSubmit={handleRegisterPayment} className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Seleccionar Expediente</label>
                <div className="relative">
                    <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700 bg-white appearance-none disabled:bg-gray-100 disabled:text-gray-500"
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    required
                    disabled={!!editingTransaction} // Lock case when editing
                    >
                    <option value="">Buscar cliente o servicio...</option>
                    {cases.map(c => {
                        const client = clients.find(cl => cl.id === c.clientId);
                        return <option key={c.id} value={c.id}>{client?.name} • {c.serviceName}</option>
                    })}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Case Summary Card */}
            {selectedCase && selectedClient && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-3 animate-fadeIn">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                <User size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{selectedClient.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <FileText size={10} />
                                    <span>{selectedCase.serviceName}</span>
                                    <span className="bg-gray-200 px-1.5 rounded text-[10px] font-mono">{selectedCase.folio}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Saldo Pendiente</span>
                            <span className={`font-bold ${selectedCaseStats.pending > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                ${selectedCaseStats.pending.toLocaleString('es-MX')}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-1">
                            <div 
                                className={`h-full rounded-full ${selectedCaseStats.progress >= 100 ? 'bg-green-500' : 'bg-gold'}`} 
                                style={{ width: `${selectedCaseStats.progress}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                            <span>Pagado: ${selectedCaseStats.paid.toLocaleString()}</span>
                            <span>Total: ${selectedCase.totalCost.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Monto (MXN)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400 font-bold">$</span>
                    <input 
                        type="number" 
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-lg font-bold text-gray-900 placeholder-gray-300"
                        placeholder="0.00"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                        required
                    />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Fecha de Pago</label>
                  <input 
                     type="date" 
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700"
                     value={newPayment.date}
                     onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                     required
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Método</label>
                  <div className="relative">
                     <select 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700 bg-white appearance-none"
                        value={newPayment.method}
                        onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                     >
                        <option value="Transferencia">Transferencia</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Cheque">Cheque</option>
                     </select>
                     <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Referencia / Folio</label>
                  <input 
                     type="text" 
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700"
                     value={newPayment.reference}
                     onChange={(e) => setNewPayment({...newPayment, reference: e.target.value})}
                     placeholder="# Operación"
                  />
               </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Concepto</label>
               <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none transition-all text-sm text-gray-700"
                  placeholder="Ej. Anticipo 50%, Liquidación, Asesoría Extra"
                  value={newPayment.concept}
                  onChange={(e) => setNewPayment({...newPayment, concept: e.target.value})}
                  required
               />
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Comprobante</label>
               {!selectedReceipt ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center gap-4 text-gray-400 hover:border-gold/50 hover:bg-gold/5 transition-all cursor-pointer bg-gray-50/30"
                  >
                     <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                     />
                     <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm text-gray-400">
                        <UploadCloud size={20} />
                     </div>
                     <div>
                        <span className="text-xs font-bold text-gray-600 block">Subir Archivo</span>
                        <span className="text-[10px]">PDF, JPG o PNG (Máx 5MB)</span>
                     </div>
                  </div>
               ) : (
                  <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between shadow-sm animate-fadeIn">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                           <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                           <p className="text-xs font-bold text-gray-800 truncate max-w-[200px]">{selectedReceipt.name}</p>
                           <p className="text-[10px] text-gray-500">{(selectedReceipt.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                     </div>
                     <button 
                        type="button" 
                        onClick={() => setSelectedReceipt(null)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                     >
                        <X size={16} />
                     </button>
                  </div>
               )}
            </div>

            <div className="pt-2">
               <button type="submit" className="w-full bg-[#0f172a] hover:bg-gold text-white font-bold py-4 rounded-xl shadow-lg transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> {editingTransaction ? 'Guardar Cambios' : 'Confirmar Pago'}
               </button>
            </div>
         </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!transactionToDelete} onClose={() => setTransactionToDelete(null)} title="Eliminar Transacción" width="max-w-md">
         <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
               <Trash2 size={28} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">¿Confirmar eliminación?</h3>
               <p className="text-sm text-gray-500">
                  El pago se eliminará del historial del expediente y el saldo pendiente se recalculará automáticamente.
               </p>
            </div>
            <div className="flex gap-3 pt-2">
               <button onClick={() => setTransactionToDelete(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase hover:bg-gray-50 transition-colors">
                  Cancelar
               </button>
               <button onClick={confirmDeleteTransaction} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">
                  Eliminar
               </button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default Finances;
