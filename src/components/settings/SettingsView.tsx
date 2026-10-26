import React, { useState, useRef } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Sparkles,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { EventPlan } from '../../types/event';
import { storageService } from '../../services/storageService';

interface SettingsViewProps {
  plans: EventPlan[];
  onRefreshData: () => void;
  hasApiKey: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  plans,
  onRefreshData,
  hasApiKey,
}) => {
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const dataStr = storageService.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planora-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage({ text: 'Successfully exported event data JSON.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: `Export failed: ${err.message}`, type: 'error' });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = storageService.importData(content);
      if (res.success) {
        onRefreshData();
        setStatusMessage({ text: `Successfully imported ${res.count} events!`, type: 'success' });
      } else {
        setStatusMessage({ text: `Import failed: ${res.error}`, type: 'error' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetSamples = () => {
    if (window.confirm('Reset all saved events to default realistic samples? This will replace current plans.')) {
      storageService.resetToSamples();
      onRefreshData();
      setStatusMessage({ text: 'Reset to sample event plans completed.', type: 'success' });
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete ALL event plans and storage? This cannot be undone.')) {
      storageService.clearAll();
      onRefreshData();
      setStatusMessage({ text: 'All local event data has been cleared.', type: 'success' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Application Settings & Data</h2>
            <p className="text-xs text-slate-500">
              Manage persistence, export plans, and view AI architecture status
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* AI & Server Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-600" />
          <span>Server-Side Gemini Integration Status</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-400 font-medium">Model Architecture</span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Google Gemini 3.8 Flash</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Server-side via @google/genai TypeScript SDK
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-400 font-medium">API Key Status</span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{hasApiKey ? 'Connected & Active' : 'Fallback / Awaiting Key'}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Managed securely in server environment (.env)
            </p>
          </div>
        </div>
      </div>

      {/* Persistence & Data Backup */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-violet-600" />
          <span>Storage & Persistence ({plans.length} Events Stored)</span>
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          Planora AI uses client-side localStorage persistence with a modular repository pattern, making it ready to connect to a cloud database such as Supabase or PostgreSQL when multi-user syncing is required.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Export JSON */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-violet-600" />
            <span>Export All Plans (JSON)</span>
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Import Plans (JSON)</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json,application/json"
            className="hidden"
          />

          {/* Reset Samples */}
          <button
            onClick={handleResetSamples}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <span>Reset to Demo Samples</span>
          </button>

          {/* Clear All */}
          <button
            onClick={handleClearAll}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 hover:bg-red-50 font-semibold text-xs text-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Clear All Local Data</span>
          </button>
        </div>
      </div>

      {/* Product & Hackathon Architecture Notes */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-2 text-xs text-slate-600">
        <h4 className="font-bold text-slate-800">Planora AI • Architecture & Deliverables</h4>
        <p>
          • <strong>Full-stack React SPA:</strong> Powered by React 19, TypeScript, and Tailwind CSS.
        </p>
        <p>
          • <strong>Secure Backend:</strong> Express server-side routing with `@google/genai` TypeScript SDK preventing client key leaks.
        </p>
        <p>
          • <strong>Indian Rupee Formatting:</strong> Native `en-IN` number and currency formatting across all calculations.
        </p>
        <p>
          • <strong>Deterministic Budget Calculation:</strong> Application arithmetic recalculates category sums to ensure zero variance.
        </p>
      </div>
    </div>
  );
};
