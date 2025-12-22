import React, { useEffect, useState } from 'react';
import { StorageService } from '../../services/storage';
import { Case, Priority, StageStatus, RiskAnalysis } from '../../types';
import { analyzeOperationalRisk } from '../../services/geminiService';
import { Activity, AlertTriangle, BrainCircuit, CheckCircle2, Clock, ShieldAlert, Zap, RefreshCw, BarChart2, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RiskCenter = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    setCases(StorageService.getCases());
  }, []);

  const runAnalysis = async () => {
    setLoadingAI(true);
    const result = await analyzeOperationalRisk(cases);
    setAnalysis(result);
    setLoadingAI(false);
  };

  // Helper to calculate case progress health
  const getCaseHealth = (c: Case) => {
    const totalStages = c.stages.length;
    const completed = c.stages.filter(s => s.status === StageStatus.COMPLETED).length;
    const overdue = c.stages.filter(s => s.status !== StageStatus.COMPLETED && s.dueDate && new Date(s.dueDate) < new Date()).length;
    
    // Simple health Score
    if (overdue > 0) return { status: 'Critical', color: 'bg-red-500', text: 'text-red-500', bgText: 'bg-red-50' };
    // Check if progress is slow? (Mock logic)
    if (completed / totalStages < 0.2 && new Date(c.startDate) < new Date(Date.now() - 86400000 * 10)) return { status: 'At Risk', color: 'bg-yellow-500', text: 'text-yellow-600', bgText: 'bg-yellow-50' };
    
    return { status: 'Healthy', color: 'bg-green-500', text: 'text-green-600', bgText: 'bg-green-50' };
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-4xl font-serif font-bold text-gray-900">Monitor de Riesgos</h2>
           <p className="text-gray-400 mt-2 text-sm">Sistema de prevención de crisis y análisis predictivo IA.</p>
        </div>
        <button 
           onClick={runAnalysis}
           disabled={loadingAI}
           className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-70 group hover:border-gold/50"
        >
           {loadingAI ? <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"></div> : <BrainCircuit size={18} className="text-gold group-hover:scale-110 transition-transform" />}
           <span className="font-bold text-xs uppercase tracking-wider">Ejecutar Análisis</span>
        </button>
      </div>

      {/* AI Insights Panel */}
      {analysis && (
        <div className="bg-gradient-to-br from-[#0f172a] to-gray-900 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl animate-fadeIn ring-1 ring-white/10">
           {/* Abstract Decoration */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none"></div>
           
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Overall Risk */}
              <div className="lg:col-span-4 border-r border-white/10 pr-6 flex flex-col justify-center">
                 <div className="flex items-center gap-2 mb-4">
                    <BrainCircuit className="text-gold" size={20} />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Diagnóstico IA</span>
                 </div>
                 
                 <div className="text-5xl font-serif font-bold mb-2 tracking-tight">
                    {analysis.overallRisk === 'LOW' ? 'Bajo Riesgo' : analysis.overallRisk === 'MEDIUM' ? 'Riesgo Medio' : 'Alto Riesgo'}
                 </div>
                 
                 <div className="flex items-center gap-3 mt-2">
                    <div className={`w-3 h-3 rounded-full ${analysis.overallRisk === 'HIGH' ? 'bg-red-500 shadow-[0_0_10px_red]' : analysis.overallRisk === 'MEDIUM' ? 'bg-yellow-500 shadow-[0_0_10px_yellow]' : 'bg-green-500 shadow-[0_0_10px_lime]'}`}></div>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                        {analysis.overallRisk === 'HIGH' ? 'Se requiere intervención inmediata en múltiples frentes para evitar colapsos de SLA.' : 'La operación es estable. Mantener vigilancia en expedientes antiguos.'}
                    </p>
                 </div>
              </div>

              {/* Predictions */}
              <div className="lg:col-span-8 space-y-4">
                 <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Predicciones Críticas</div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.predictions.map((pred, idx) => (
                       <div key={idx} className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm group">
                          <div className="flex justify-between items-start mb-3">
                             <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className={pred.riskLevel === 'HIGH' ? 'text-red-400' : 'text-yellow-400'} />
                                <span className="font-bold text-sm text-gray-200">Alerta Predictiva</span>
                             </div>
                             <button onClick={() => navigate(`/admin/cases/${pred.caseId}`)} className="text-[10px] text-gold underline opacity-60 hover:opacity-100 transition-opacity">Ver Caso</button>
                          </div>
                          <p className="text-xs text-gray-300 mb-4 leading-relaxed h-8 line-clamp-2">{pred.reason}</p>
                          <div className="flex items-start gap-2 text-[10px] text-green-300 bg-green-500/10 px-3 py-2 rounded-xl border border-green-500/20">
                             <Zap size={12} className="shrink-0 mt-0.5" /> 
                             <span>{pred.suggestion}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* SLA Monitor Grid */}
      <div className="w-full">
         {/* Active SLA Monitor */}
         <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 w-full">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Activity size={20} className="text-gold" /> Monitor SLA en Tiempo Real
               </h3>
               <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase"><div className="w-2 h-2 rounded-full bg-green-500"></div> Saludable</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Riesgo</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase"><div className="w-2 h-2 rounded-full bg-red-500"></div> Crítico</span>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                     <tr className="border-b border-gray-100 text-left">
                        <th className="pb-4 pl-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Expediente</th>
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-1/2">Salud del Proyecto</th>
                        <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Acción</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {cases.map(c => {
                        const health = getCaseHealth(c);
                        return (
                           <tr key={c.id} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="py-5 pl-4 pr-6">
                                 <div className="font-bold text-sm text-gray-900 mb-0.5">{c.serviceName}</div>
                                 <div className="text-[10px] text-gray-400 font-mono">{c.folio}</div>
                              </td>
                              <td className="py-5 pr-8">
                                 <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center">
                                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${health.bgText} ${health.text}`}>{health.status}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                       <div className={`h-full rounded-full ${health.color}`} style={{ width: '80%' }}></div>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-5 text-right pr-4">
                                 <button 
                                    onClick={() => navigate(`/admin/cases/${c.id}`)}
                                    className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gold transition-colors flex items-center justify-end gap-1 w-full"
                                 >
                                    Ver Detalle <ArrowUpRight size={12} />
                                 </button>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};

export default RiskCenter;