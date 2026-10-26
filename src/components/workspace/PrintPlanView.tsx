import React from 'react';
import {
  Printer,
  X,
  Sparkles,
  Calendar,
  Wallet,
  Users,
  MapPin,
} from 'lucide-react';
import { EventPlan } from '../../types/event';
import { formatINR, formatDate } from '../../utils/formatters';

interface PrintPlanViewProps {
  plan: EventPlan;
  onClose: () => void;
}

export const PrintPlanView: React.FC<PrintPlanViewProps> = ({
  plan,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 p-2 sm:p-6 backdrop-blur-xs flex justify-center">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl p-6 sm:p-10 my-4 text-slate-900 print:m-0 print:p-6 print:shadow-none print:w-full">
        {/* Print Bar (hidden when printing) */}
        <div className="no-print flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Printable Master Plan Document
            </h3>
            <p className="text-xs text-slate-500">
              Export to PDF or print via your browser dialog
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                P
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Planora AI
              </span>
            </div>
            <div className="text-right text-xs text-slate-500">
              Generated on {new Date().toLocaleDateString('en-IN')}
            </div>
          </div>

          <div className="mt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md">
              {plan.input.eventType} Master Plan
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {plan.input.name}
            </h1>
            <p className="text-sm text-slate-600 italic mt-1">
              "{plan.overview.tagline || plan.overview.concept}"
            </p>
          </div>

          {/* Quick specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Date</span>
              <strong className="text-slate-900">{formatDate(plan.input.date)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Location</span>
              <strong className="text-slate-900">{plan.input.city}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Guest Count</span>
              <strong className="text-slate-900">{plan.input.guestCount} Attendees</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Total Budget</span>
              <strong className="text-slate-900 font-mono">{formatINR(plan.input.totalBudget)}</strong>
            </div>
          </div>
        </div>

        {/* Section 1: Concept & Atmosphere */}
        <div className="space-y-4 mb-8">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            1. Event Concept & Creative Direction
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {plan.overview.concept}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
            <div>
              <strong className="text-slate-900">Theme:</strong> {plan.overview.recommendedTheme}
            </div>
            <div>
              <strong className="text-slate-900">Atmosphere:</strong> {plan.overview.suggestedAtmosphere}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Key Priorities
            </h3>
            <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
              {plan.overview.keyPriorities.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 2: Itemized Budget Breakdown */}
        <div className="space-y-4 mb-8">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            2. Itemized Budget Allocation (Total: {formatINR(plan.input.totalBudget)})
          </h2>

          <table className="w-full text-xs text-left border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="p-2.5 border-b border-slate-200">Category</th>
                <th className="p-2.5 border-b border-slate-200 text-right">Allocated (INR)</th>
                <th className="p-2.5 border-b border-slate-200 text-right">%</th>
                <th className="p-2.5 border-b border-slate-200">Explanation & Alternative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plan.budget.map(item => (
                <tr key={item.id}>
                  <td className="p-2.5 font-bold text-slate-900">{item.category}</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                    {formatINR(item.allocatedAmount)}
                  </td>
                  <td className="p-2.5 text-right text-slate-600">{item.percentage}%</td>
                  <td className="p-2.5 text-slate-600 leading-normal">
                    {item.explanation}
                    {item.costSavingAlternative && (
                      <span className="block text-violet-700 font-medium text-[11px] mt-0.5">
                        Opt: {item.costSavingAlternative}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Preparation Timeline */}
        <div className="space-y-4 mb-8 print-page-break">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            3. Preparation Timeline & Milestones
          </h2>

          <div className="space-y-2.5 text-xs">
            {plan.timeline.map((task, idx) => (
              <div key={idx} className="p-3 border border-slate-200 rounded-lg flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900">
                    {idx + 1}. {task.title}
                  </div>
                  <p className="text-slate-600 mt-0.5">{task.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-semibold text-slate-800">{formatDate(task.dueDate)}</span>
                  <span className="block text-[10px] text-slate-500 uppercase">{task.priority} priority</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Vendor Checklist */}
        <div className="space-y-4 mb-8">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            4. Vendor Coordination Checklist
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {plan.checklist.map((v, idx) => (
              <div key={idx} className="p-3 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                  {v.category}
                </span>
                <div className="font-bold text-slate-900 mt-1">{v.task}</div>
                {v.notes && <p className="text-slate-600 mt-0.5">{v.notes}</p>}
                <div className="text-[11px] text-slate-500 mt-2">
                  Deadline: {formatDate(v.deadline)} {v.estimatedCost > 0 && `• Est: ${formatINR(v.estimatedCost)}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Invitation Copy */}
        {plan.ideas?.invitationWording && (
          <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              5. Draft Invitation Text
            </h3>
            <div className="text-xs text-slate-700 whitespace-pre-line">
              <strong className="block text-slate-900 text-sm mb-1">{plan.ideas.invitationWording.headline}</strong>
              {plan.ideas.invitationWording.body}
              <div className="italic text-slate-500 mt-2">{plan.ideas.invitationWording.rsvpNote}</div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400">
          Planora AI Event Assistant • Your event. Your budget. Your perfect plan.
        </div>
      </div>
    </div>
  );
};
