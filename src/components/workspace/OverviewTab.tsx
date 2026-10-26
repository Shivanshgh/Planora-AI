import React from 'react';
import {
  Sparkles,
  Target,
  Smile,
  Compass,
  CheckCircle2,
  Calendar,
  Wallet,
  Users,
  MapPin,
  TrendingDown,
  Wand2,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { EventPlan } from '../../types/event';
import { formatINR, formatDate, getDaysRemaining, calculatePerGuestBudget } from '../../utils/formatters';

interface OverviewTabProps {
  plan: EventPlan;
  onOpenOptimize: () => void;
  onOpenCreative: () => void;
  onOpenAssistant: () => void;
  onSwitchTab: (tab: 'overview' | 'budget' | 'timeline' | 'checklist' | 'ideas' | 'risks') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  plan,
  onOpenOptimize,
  onOpenCreative,
  onOpenAssistant,
  onSwitchTab,
}) => {
  const perGuest = calculatePerGuestBudget(plan.input.totalBudget, plan.input.guestCount);
  const daysLeft = getDaysRemaining(plan.input.date);
  const completedTasks = (plan.timeline || []).filter(t => t.status === 'completed').length;
  const totalTasks = (plan.timeline || []).length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden border border-slate-800 shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Master Plan Concept</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
            "{plan.overview.tagline || plan.input.name}"
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {plan.overview.concept}
          </p>

          {/* Quick AI tool accelerators */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenOptimize}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Optimize My Budget</span>
            </button>

            <button
              onClick={onOpenCreative}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold border border-indigo-400/30 shadow-md transition-all"
            >
              <Wand2 className="w-4 h-4 text-violet-200" />
              <span>Make It More Creative</span>
            </button>

            <button
              onClick={onOpenAssistant}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
            >
              <Bot className="w-4 h-4 text-violet-400" />
              <span>Chat with Event Assistant</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Snapshot Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onSwitchTab('budget')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-violet-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Total Budget</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            {formatINR(plan.input.totalBudget)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {formatINR(perGuest)} per guest
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Target Date</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {formatDate(plan.input.date)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {daysLeft > 0 ? `${daysLeft} days to go` : daysLeft === 0 ? 'Today!' : 'Event completed'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Guest Count</span>
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            {plan.input.guestCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
            {plan.input.setting || 'hybrid'} setting
          </p>
        </div>

        <div
          onClick={() => onSwitchTab('timeline')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-violet-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Milestones</span>
            <CheckCircle2 className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            {completedTasks}/{totalTasks}
          </div>
          <p className="text-[11px] text-violet-600 font-medium mt-0.5">
            {taskProgress}% completed
          </p>
        </div>
      </div>

      {/* Main Breakdown 2-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Priorities & Theme */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Priorities */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-violet-600" />
              <span>Core Strategic Priorities</span>
            </h3>
            <div className="space-y-3">
              {plan.overview.keyPriorities.map((priority, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                    {priority}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Tailoring Rationale */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Why This Plan Fits Your Parameters</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {plan.overview.explanation}
            </p>
          </div>
        </div>

        {/* Right: Atmosphere & Quick Links */}
        <div className="space-y-6">
          {/* Theme & Atmosphere Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Recommended Theme
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-1">
                {plan.overview.recommendedTheme}
              </h4>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Suggested Atmosphere
              </span>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {plan.overview.suggestedAtmosphere}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => onSwitchTab('ideas')}
                className="w-full py-2 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Explore Color Palettes & Menus</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Risks quick peek */}
          {plan.risks && plan.risks.length > 0 && (
            <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Identified Safeguards ({plan.risks.length})</span>
                </div>
                <button
                  onClick={() => onSwitchTab('risks')}
                  className="text-xs text-amber-800 font-semibold underline hover:text-amber-950"
                >
                  View
                </button>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {plan.risks[0].risk}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
