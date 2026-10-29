import React, { useRef, useState } from 'react';
import {
  X,
  TrendingDown,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { EventPlan, BudgetItem } from '../../types/event';
import { apiService } from '../../services/apiService';
import type { BudgetOptimizationResult } from '../../services/apiService';
import { formatINR } from '../../utils/formatters';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';

interface OptimizeBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: EventPlan;
  onApplyOptimization: (updatedBudget: BudgetItem[]) => void;
}

export const OptimizeBudgetModal: React.FC<OptimizeBudgetModalProps> = ({
  isOpen,
  onClose,
  plan,
  onApplyOptimization,
}) => {
  const [savingsTarget, setSavingsTarget] = useState<number>(15);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BudgetOptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  useDialogAccessibility(isOpen, dialogRef, onClose);

  if (!isOpen) return null;

  const handleRunOptimization = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.optimizeBudget(plan, savingsTarget);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to optimize budget');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!result?.recommendedBudget) return;

    // Map recommended amounts to existing budget items
    let updated = plan.budget.map(item => {
      const match = result.recommendedBudget.find(
        recommendation => recommendation.category.toLowerCase() === item.category.toLowerCase()
      );
      if (match && typeof match.proposedAmount === 'number') {
        return {
          ...item,
          allocatedAmount: match.proposedAmount,
          percentage: plan.input.totalBudget > 0
            ? Math.round((match.proposedAmount / plan.input.totalBudget) * 100)
            : item.percentage,
          notes: match.rational ? `${item.notes ? item.notes + ' • ' : ''}AI Optimized: ${match.rational}` : item.notes,
        };
      }
      return item;
    });

    const totalBudget = plan.input.totalBudget;
    const allocated = updated.reduce((sum, item) => sum + item.allocatedAmount, 0);
    if (allocated > totalBudget) {
      updated = updated.map(item => ({
        ...item,
        allocatedAmount: Math.round((item.allocatedAmount / allocated) * totalBudget),
      }));
    }

    const remainder = totalBudget - updated.reduce((sum, item) => sum + item.allocatedAmount, 0);
    if (remainder > 0) {
      const contingencyIndex = updated.findIndex(item =>
        /contingency|emergency|reserve/i.test(item.category)
      );
      if (contingencyIndex >= 0) {
        updated[contingencyIndex] = {
          ...updated[contingencyIndex],
          allocatedAmount: updated[contingencyIndex].allocatedAmount + remainder,
        };
      } else {
        updated.push({
          id: `reserve-${Date.now()}`,
          category: 'Unallocated Savings Reserve',
          allocatedAmount: remainder,
          percentage: 0,
          explanation: 'Savings remain within the approved event budget.',
          costSavingAlternative: 'Keep this amount uncommitted until final costs are known.',
          actualSpent: 0,
        });
      }
    } else if (remainder < 0) {
      const largestIndex = updated.reduce((largest, item, index, items) =>
        item.allocatedAmount > items[largest].allocatedAmount ? index : largest, 0
      );
      updated[largestIndex].allocatedAmount += remainder;
    }

    updated = updated.map(item => ({
      ...item,
      percentage: Math.round((item.allocatedAmount / totalBudget) * 100),
    }));

    onApplyOptimization(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="budget-dialog-title" className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <TrendingDown className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 id="budget-dialog-title" className="font-bold text-base text-white">Optimize My Event Budget</h3>
              <p className="text-xs text-slate-300">
                AI financial auditor to trim unnecessary costs while protecting core guest experience
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close budget optimizer"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Controls */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Desired Savings Target: {savingsTarget}% (~{formatINR(Math.round((plan.input.totalBudget * savingsTarget) / 100))})
              </label>

              <button
                onClick={handleRunOptimization}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Expenses...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Optimization Audit</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="range"
              min="5"
              max="35"
              step="5"
              value={savingsTarget}
              onChange={e => setSavingsTarget(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>5% (Gentle Trim)</span>
              <span>15% (Balanced)</span>
              <span>25% (Aggressive)</span>
              <span>35% (Maximum Lean)</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Result view */}
          {result && (
            <div className="space-y-5">
              {/* Strategic Advice */}
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-1">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                  Auditor Strategy Summary
                </span>
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
                  {result.strategicAdvice}
                </p>
              </div>

              {/* Quick Wins */}
              {result.quickWins && result.quickWins.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Immediate Quick Wins</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.quickWins.map((win: string, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{win}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Category Changes */}
              {result.recommendedBudget && result.recommendedBudget.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recommended Reallocations
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {result.recommendedBudget.map((rec, idx) => (
                      <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">{rec.category}</div>
                          <div className="text-[11px] text-slate-500">{rec.rational}</div>
                        </div>

                        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                          <div className="font-extrabold text-emerald-700">
                            {formatINR(rec.proposedAmount)}
                          </div>
                          {rec.savingsAmount > 0 && (
                            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                              Save {formatINR(rec.savingsAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          {result?.recommendedBudget && (
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Recommended Allocations to Plan</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
