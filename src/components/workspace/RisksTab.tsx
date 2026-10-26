import React from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { RiskAndRecommendation, EventPlan } from '../../types/event';

interface RisksTabProps {
  plan: EventPlan;
  onRegenerateRisks: () => Promise<void>;
  isRegenerating: boolean;
}

export const RisksTab: React.FC<RisksTabProps> = ({
  plan,
  onRegenerateRisks,
  isRegenerating,
}) => {
  const risks = plan.risks || [];

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Risks, Feasibility & Safeguards</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Proactive analysis of logistical, seasonal, and budgetary bottlenecks with mitigation plans
          </p>
        </div>

        <button
          onClick={onRegenerateRisks}
          disabled={isRegenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          <span>{isRegenerating ? 'Analyzing...' : 'AI Re-assess'}</span>
        </button>
      </div>

      {/* Risks List */}
      <div className="space-y-4">
        {risks.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">No critical risks identified</h4>
            <p className="text-xs text-slate-500 mt-1">
              Your budget and timeline appear well-calibrated for this event type.
            </p>
          </div>
        ) : (
          risks.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      item.severity === 'high'
                        ? 'text-red-500'
                        : item.severity === 'medium'
                        ? 'text-amber-500'
                        : 'text-blue-500'
                    }`}
                  />
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {item.risk}
                  </h4>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getSeverityBadge(
                    item.severity
                  )}`}
                >
                  {item.severity} Risk
                </span>
              </div>

              <div className="pl-6 space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Recommendation:</strong> {item.recommendation}
                </p>

                {item.actionItem && (
                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Action Item:</strong> {item.actionItem}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
