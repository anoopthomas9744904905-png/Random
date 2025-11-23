import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, RefreshCw, CheckCircle2, ClipboardList, AlertCircle, Car, Compass, Globe2, ScanFace, Hammer, ZoomIn, ZoomOut, Move, Maximize2, RotateCcw, ArrowUpRight, Activity, TrendingUp, ShieldCheck, AlertTriangle, Layers } from 'lucide-react';
import { AnalysisResult } from '../types';

interface ReportViewProps {
  result: AnalysisResult;
  onReset: () => void;
  reportImages: File[] | null;
}

// Internal Interactive Viewer Component
const InteractiveBlueprintViewer: React.FC<{ src: string }> = ({ src }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 4)); // Min 0.5x, Max 4x
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border border-slate-300 shadow-inner group relative">
       {/* Toolbar */}
       <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 no-print">
         <div className="bg-white/90 backdrop-blur border border-slate-200 p-1 rounded-lg shadow-xl flex flex-col items-center gap-1 text-slate-600">
            <button onClick={() => handleZoom(0.5)} className="p-2 hover:bg-slate-100 rounded transition-colors" title="Zoom In">
               <ZoomIn className="w-5 h-5" />
            </button>
            <button onClick={() => handleZoom(-0.5)} className="p-2 hover:bg-slate-100 rounded transition-colors" title="Zoom Out">
               <ZoomOut className="w-5 h-5" />
            </button>
            <div className="w-full h-px bg-slate-200 my-0.5" />
            <button onClick={resetView} className="p-2 hover:bg-slate-100 rounded transition-colors" title="Reset View">
               <RotateCcw className="w-5 h-5" />
            </button>
         </div>
       </div>

       {/* Viewport */}
       <div 
         ref={containerRef}
         className={`relative w-full h-96 sm:h-[500px] overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseLeave}
         onWheel={(e) => {
           // Basic wheel zoom
           if(e.ctrlKey || e.metaKey) {
             e.preventDefault();
             handleZoom(e.deltaY > 0 ? -0.2 : 0.2);
           }
         }}
       >
         <div 
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)' 
            }}
            className="w-full h-full origin-center flex items-center justify-center"
         >
            <img 
              src={src} 
              alt="Interactive Blueprint" 
              className="max-w-none pointer-events-none select-none shadow-sm" 
              style={{ width: '100%', height: 'auto', minWidth: '800px' }} // Ensure it has substance to zoom
            />
         </div>

         {/* Overlay Grid/UI - Subtle Graph Paper */}
         <div className="absolute inset-0 pointer-events-none opacity-10" 
              style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
         </div>
         
         {/* Status Badge */}
         <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded font-mono shadow-lg">
                FORENSIC SKETCH
              </div>
              <div className="bg-white/90 text-slate-600 text-[10px] font-mono px-2 py-1 rounded border border-slate-200 shadow-sm">
                 SCALE: {(scale * 100).toFixed(0)}%
              </div>
            </div>
         </div>
       </div>
    </div>
  );
};

const KPICard: React.FC<{ title: string, value: string | number, subtext: string, icon: React.ReactNode, type?: 'danger' | 'warning' | 'success' | 'neutral' }> = ({ title, value, subtext, icon, type = 'neutral' }) => {
  const getColors = () => {
    switch(type) {
      case 'danger': return 'bg-red-500/10 border-red-500/20 text-red-500';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'success': return 'bg-green-500/10 border-green-500/20 text-green-500';
      default: return 'bg-slate-800/50 border-slate-700 text-blue-400';
    }
  };

  return (
    <div className={`flex flex-col p-5 rounded-xl border ${getColors()} backdrop-blur-sm print:border-slate-200 print:bg-slate-50`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider opacity-70 print:text-slate-600">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white print:text-slate-900">{value}</div>
      <div className="text-xs mt-1 opacity-70 print:text-slate-600 font-medium">{subtext}</div>
    </div>
  );
};


export const ReportView: React.FC<ReportViewProps> = ({ result, onReset, reportImages }) => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const { metrics } = result;

  useEffect(() => {
    if (reportImages && reportImages.length > 0) {
      const urls = reportImages.map(img => URL.createObjectURL(img));
      setImagePreviews(urls);
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url));
      };
    } else {
        setImagePreviews([]);
    }
  }, [reportImages]);

  // Determine Fraud Color
  const getFraudType = () => {
    if (metrics.fraudRisk === 'HIGH') return 'danger';
    if (metrics.fraudRisk === 'MEDIUM') return 'warning';
    return 'success';
  };

  // Determine Severity Type
  const getSeverityType = () => {
    if (metrics.severityScore >= 8) return 'danger';
    if (metrics.severityScore >= 5) return 'warning';
    return 'neutral';
  };

  return (
    <div className="max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Report Header - Screen Only */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 no-print">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            Executive Assessment
          </h2>
          <p className="text-slate-400 text-sm mt-1">Generated: {result.timestamp.toLocaleString()}</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm font-medium"
            >
                <RefreshCw className="w-4 h-4" />
                New Analysis
            </button>
            <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all text-sm font-medium transform hover:translate-y-[-1px]"
            >
                <Download className="w-4 h-4" />
                Export Executive Brief
            </button>
        </div>
      </div>

      {/* Main Report Container - Print Friendly */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Decorative Grid - Hide on print */}
        <div className="absolute inset-0 opacity-5 pointer-events-none no-print" 
             style={{ backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

        {/* Print Header */}
        <div className="hidden print-only mb-8 border-b-2 border-slate-800 pb-4">
             <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Executive Forensic Audit</h1>
                    <p className="text-slate-600 text-sm mt-1">Automated Damage Intelligence • Risk Assessment</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-mono text-slate-500">REF: {result.timestamp.getTime().toString().slice(-8)}</p>
                    <p className="text-sm text-slate-500">{result.timestamp.toLocaleDateString()}</p>
                </div>
             </div>
        </div>

        <div className="p-6 sm:p-8 relative z-10">
            
            {/* EXECUTIVE DASHBOARD (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
               <KPICard 
                  title="Damage Severity" 
                  value={`${metrics.severityScore}/10`} 
                  subtext={metrics.severityScore > 7 ? "Structural Compromise" : "Cosmetic / Bolt-On"} 
                  icon={<TrendingUp className="w-5 h-5" />}
                  type={getSeverityType()}
               />
               <KPICard 
                  title="Fraud Risk" 
                  value={metrics.fraudRisk} 
                  subtext={metrics.fraudRisk === 'HIGH' ? "Requires Manual Review" : "Pattern Consistent"}
                  icon={<ShieldCheck className="w-5 h-5" />}
                  type={getFraudType()}
               />
               <KPICard 
                  title="Primary Impact" 
                  value={metrics.primaryImpact.length > 20 ? metrics.primaryImpact.substring(0,18)+'...' : metrics.primaryImpact || "Undetermined"} 
                  subtext="Confirmed Vector"
                  icon={<AlertTriangle className="w-5 h-5" />}
                  type="neutral"
               />
               <KPICard 
                  title="Repair Strategy" 
                  value={`${metrics.replaceCount} Replace / ${metrics.repairCount} Repair`} 
                  subtext="Parts Optimization"
                  icon={<Layers className="w-5 h-5" />}
                  type="neutral"
               />
            </div>

            {/* Visual Evidence Section */}
            {(imagePreviews.length > 0 || result.diagram) && (
                <div className="mb-8 flex flex-col lg:flex-row gap-8 border-b border-slate-800/50 pb-8 print:border-slate-200">
                    {imagePreviews.length > 0 && (
                        <div className="w-full lg:w-1/3 flex-shrink-0">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 print:text-slate-600 flex items-center gap-2">
                                <Car className="w-4 h-4" />
                                Submitted Evidence ({imagePreviews.length})
                            </h3>
                            <div className={`grid gap-2 ${imagePreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {imagePreviews.map((src, idx) => (
                                    <div key={idx} className="rounded-lg overflow-hidden border border-slate-700 print:border-slate-300 bg-slate-950 aspect-square relative shadow-lg">
                                        <img src={src} alt={`Evidence ${idx+1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {result.diagram && (
                         <div className="w-full lg:w-2/3 flex-shrink-0 flex flex-col">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 print:text-slate-600 flex items-center gap-2">
                                <Compass className="w-4 h-4" />
                                Impact Dynamics Schematic
                            </h3>
                            {/* Interactive Viewer Component */}
                            <InteractiveBlueprintViewer src={result.diagram} />

                            {/* Schematic Key / Legend */}
                             <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-red-500 rounded-[1px] border border-red-600"></div>
                                  <span className="text-slate-300 font-medium">Critical Damage</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                                  <span className="text-slate-300 font-medium">Force Vector</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-white border border-black rounded-[1px]"></div>
                                  <span className="text-slate-300 font-medium">Structure</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-slate-200 border border-slate-400 rounded-[1px]"></div>
                                  <span className="text-slate-400">Reference Area</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Markdown Content */}
            <div className="prose prose-invert max-w-none print:prose-neutral 
                prose-headings:text-blue-100 print:prose-headings:text-slate-900 
                prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-slate-800 print:prose-h1:border-slate-300 prose-h1:pb-4 prose-h1:mb-6 
                prose-table:w-full prose-table:border-collapse
                prose-th:text-blue-400 print:prose-th:text-slate-700 prose-th:uppercase prose-th:text-xs prose-th:tracking-wider prose-th:p-3 prose-th:text-left
                prose-td:text-slate-300 print:prose-td:text-slate-800 prose-td:p-3 prose-td:align-top
                prose-strong:text-white print:prose-strong:text-black">
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                table: ({node, ...props}) => (
                    <div className="overflow-x-auto mb-8 rounded-lg border border-slate-800 print:border-slate-300 shadow-sm">
                        <table className="w-full text-left bg-slate-900/50 print:bg-white" {...props} />
                    </div>
                ),
                thead: ({node, ...props}) => (
                    <thead className="bg-slate-800/80 print:bg-slate-100" {...props} />
                ),
                td: ({node, ...props}) => {
                    const content = String(props.children);
                    
                    // STATUS BADGES
                    if (content.includes("[REPLACE]")) {
                        return (
                            <td className="border-b border-slate-800/50 print:border-slate-200" {...props}>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 print:bg-red-100 text-red-400 print:text-red-800 text-xs font-bold border border-red-500/20 print:border-red-200 whitespace-nowrap">
                                    <AlertCircle className="w-3 h-3" /> REPLACE
                                </span>
                            </td>
                        );
                    }
                    if (content.includes("[INSPECT]") || content.includes("[REPAIR]")) {
                        return (
                            <td className="border-b border-slate-800/50 print:border-slate-200" {...props}>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 print:bg-blue-100 text-blue-400 print:text-blue-800 text-xs font-bold border border-blue-500/20 print:border-blue-200 whitespace-nowrap">
                                    <CheckCircle2 className="w-3 h-3" /> {content.replace(/[\[\]]/g, '')}
                                </span>
                            </td>
                        );
                    }
                    // FRAUD / CONSISTENCY BADGES
                    if (content.includes("[CONSISTENT]") || content.includes("[PASS]") || content.includes("[CLEAR]")) {
                        return (
                            <td className="border-b border-slate-800/50 print:border-slate-200" {...props}>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 print:bg-green-100 text-green-400 print:text-green-800 text-xs font-bold border border-green-500/20 print:border-green-200 whitespace-nowrap">
                                    <ShieldCheck className="w-3 h-3" /> {content.replace(/[\[\]]/g, '')}
                                </span>
                            </td>
                        );
                    }
                    if (content.includes("[INCONSISTENT]") || content.includes("[FAIL]") || content.includes("[SUSPICIOUS]") || content.includes("[DETECTED]")) {
                         return (
                            <td className="border-b border-slate-800/50 print:border-slate-200" {...props}>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 print:bg-red-100 text-red-400 print:text-red-800 text-xs font-bold border border-red-500/20 print:border-red-200 whitespace-nowrap">
                                    <AlertTriangle className="w-3 h-3" /> {content.replace(/[\[\]]/g, '')}
                                </span>
                            </td>
                        );
                    }

                    return <td className="border-b border-slate-800/50 print:border-slate-200 text-sm" {...props} />;
                },
                h1: ({node, ...props}) => (
                    <h1 className="text-xl font-bold text-white print:text-black mt-8 mb-4 flex items-center gap-2 border-l-4 border-blue-500 pl-4" {...props} />
                )
                }}
            >
                {result.markdown}
            </ReactMarkdown>
            </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print-only mt-12 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600 font-mono">
            SECURE CADA SYSTEM v2.5.0 • GEMINI POWERED
        </p>
        </div>
      </div>
    </div>
  );
};