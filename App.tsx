import React, { useState } from 'react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { ReportView } from './components/ReportView';
import { AppState, AccidentInput, AnalysisResult, AnalysisMetrics } from './types';
import { analyzeAccident, generateImpactDiagram } from './services/geminiService';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzedImages, setAnalyzedImages] = useState<File[] | null>(null);

  const parseAnalysisMetrics = (markdown: string): AnalysisMetrics => {
    // Default safe values
    const metrics: AnalysisMetrics = {
      severityScore: 0,
      fraudRisk: 'LOW',
      replaceCount: 0,
      repairCount: 0,
      primaryImpact: 'Unknown'
    };

    try {
      // 1. Extract Severity (e.g., "| Impact Severity (1-10) | 8/10")
      const severityMatch = markdown.match(/Severity.*?(\d+)\/10/);
      if (severityMatch) {
        metrics.severityScore = parseInt(severityMatch[1], 10);
      }

      // 2. Extract Fraud Risk
      // Look for Status column occurrences of SUSPICIOUS or INCONSISTENT or DETECTED
      const suspiciousCount = (markdown.match(/\[SUSPICIOUS\]|\[INCONSISTENT\]|\[DETECTED\]|\[FAIL\]/g) || []).length;
      if (suspiciousCount >= 2) metrics.fraudRisk = 'HIGH';
      else if (suspiciousCount === 1) metrics.fraudRisk = 'MEDIUM';
      else metrics.fraudRisk = 'LOW';

      // 3. Count Operations
      metrics.replaceCount = (markdown.match(/\[REPLACE\]/g) || []).length;
      metrics.repairCount = (markdown.match(/\[REPAIR\]/g) || []).length;

      // 4. Extract Primary Impact
      const impactMatch = markdown.match(/\| Primary Impact Zone \| (.*?) \|/);
      if (impactMatch) {
        metrics.primaryImpact = impactMatch[1].trim();
      }

    } catch (e) {
      console.warn("Failed to parse metrics", e);
    }

    return metrics;
  };

  const handleAnalysis = async (input: AccidentInput) => {
    setAppState(AppState.ANALYZING);
    setError(null);
    setAnalyzedImages(input.images || null);
    
    try {
      // Run text analysis and diagram generation in parallel
      const [markdown, diagram] = await Promise.all([
        analyzeAccident(input),
        generateImpactDiagram(input)
      ]);

      const metrics = parseAnalysisMetrics(markdown);

      setResult({
        markdown,
        diagram,
        timestamp: new Date(),
        metrics
      });
      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setError("Failed to analyze the accident data. Please verify your network connection.");
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    setError(null);
    setAnalyzedImages(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <Header />
      
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {appState === AppState.IDLE && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-3">Collision Analysis Protocol</h2>
              <p className="text-slate-400">
                Enter vehicle details and accident description below. 
                Our AI model will generate a comprehensive structural damage assessment, forensic audit, and risk summary.
              </p>
            </div>
            <InputForm onSubmit={handleAnalysis} isAnalyzing={false} />
          </div>
        )}

        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
             <div className="relative">
                <div className="w-24 h-24 border-4 border-slate-800 rounded-full"></div>
                <div className="absolute top-0 left-0 w-24 h-24 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-mono text-blue-500 animate-pulse">AI</span>
                </div>
             </div>
             <h3 className="text-xl font-medium text-white mt-8">Processing Claims Intelligence...</h3>
             <p className="text-slate-500 mt-2 text-sm animate-pulse">Computing vectors, cross-referencing fraud patterns, and drafting technical schematics</p>
          </div>
        )}

        {appState === AppState.COMPLETE && result && (
          <ReportView 
            result={result} 
            onReset={resetApp} 
            reportImages={analyzedImages}
          />
        )}

        {appState === AppState.ERROR && (
           <div className="max-w-md mx-auto text-center mt-20 p-8 bg-red-950/20 border border-red-900/50 rounded-2xl">
              <div className="bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
              <p className="text-red-300 mb-6">{error}</p>
              <button 
                onClick={resetApp}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                Try Again
              </button>
           </div>
        )}
      </main>

      <footer className="border-t border-slate-900 py-6 text-center no-print">
        <p className="text-xs text-slate-600 font-mono">
            ENTERPRISE CADA SYSTEM v3.0 • POWERED BY GEMINI VISION
        </p>
      </footer>
    </div>
  );
}