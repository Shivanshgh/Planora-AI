import React from 'react';
import {
  Sparkles,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Copy,
  Trash2,
  Users,
  MapPin,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { EventPlan } from '../../types/event';
import { formatINR, formatDate, getDaysRemaining } from '../../utils/formatters';

interface DashboardProps {
  plans: EventPlan[];
  activePlan: EventPlan | null;
  onSelectPlan: (plan: EventPlan) => void;
  onPlanNew: () => void;
  onDuplicatePlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onLoadSamples: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  plans,
  activePlan,
  onSelectPlan,
  onPlanNew,
  onDuplicatePlan,
  onDeletePlan,
  onLoadSamples,
}) => {
  // Compute true dynamic metrics from state
  const totalBudget = plans.reduce((sum, p) => sum + p.input.totalBudget, 0);
  const totalEvents = plans.length;

  let totalTasks = 0;
  let completedTasks = 0;
  let upcomingDeadlinesCount = 0;

  plans.forEach(plan => {
    (plan.timeline || []).forEach(task => {
      totalTasks++;
      if (task.status === 'completed') {
        completedTasks++;
      } else {
        const days = getDaysRemaining(task.dueDate);
        if (days >= 0 && days <= 30) {
          upcomingDeadlinesCount++;
        }
      }
    });
  });

  const pendingTasks = totalTasks - completedTasks;
  const overallTaskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'wedding':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'birthday':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'community':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPlanProgress = (plan: EventPlan): number => {
    const tasks = plan.timeline || [];
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <span>Planora AI • Intelligent Event Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Your event. Your budget. <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
              Your perfect plan.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Harness Generative AI to orchestrate budgets, preparation timelines, vendor checklists,
            and creative concepts for weddings, birthdays, and community gatherings.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={onPlanNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-900/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Plan a New Event
            </button>

            {plans.length === 0 && (
              <button
                onClick={onLoadSamples}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all"
              >
                <FolderOpen className="w-4 h-4 text-violet-400" />
                Load Sample Plans
              </button>
            )}
          </div>
        </div>

        {/* Ambient subtle glow background elements */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 -mb-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Planned Budget */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Budget Managed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatINR(totalBudget)}
            </span>
            <p className="text-xs text-slate-500 mt-1">Across {totalEvents} planned event{totalEvents !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Total Events */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Events
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">{totalEvents}</span>
            <p className="text-xs text-slate-500 mt-1">
              {plans.filter(p => !p.isSample).length} user-created, {plans.filter(p => p.isSample).length} demo
            </p>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Tasks
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{pendingTasks}</span>
              <span className="text-xs text-slate-500">/ {totalTasks} total</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-violet-600 h-full rounded-full transition-all"
                style={{ width: `${overallTaskProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Due Within 30 Days
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">
              {upcomingDeadlinesCount}
            </span>
            <p className="text-xs text-slate-500 mt-1">Milestones needing attention</p>
          </div>
        </div>
      </div>

      {/* Saved Events Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Event Plans</h2>
            <p className="text-xs text-slate-500">
              Select an event to open its workspace, budget, and checklists
            </p>
          </div>

          {plans.length > 0 && (
            <button
              onClick={onPlanNew}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New</span>
            </button>
          )}
        </div>

        {plans.length === 0 ? (
          /* Empty State */
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto my-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto shadow-inner">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No events planned yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Ready to organize your next wedding, birthday, or community festival? Start by generating a tailored plan or load demo templates.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={onPlanNew}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Plan a New Event
              </button>
              <button
                onClick={onLoadSamples}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Load Demo Events
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map(plan => {
              const progress = getPlanProgress(plan);
              const daysLeft = getDaysRemaining(plan.input.date);
              const isSelected = activePlan?.id === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getEventTypeBadge(
                          plan.input.eventType
                        )}`}
                      >
                        {plan.input.eventType}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {plan.isSample && (
                          <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                            Demo Sample
                          </span>
                        )}
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                            daysLeft > 0
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {daysLeft > 0 ? `${daysLeft}d to go` : daysLeft === 0 ? 'Today!' : 'Passed'}
                        </span>
                      </div>
                    </div>

                    {/* Title & Tagline */}
                    <div>
                      <h3
                        className="font-bold text-slate-900 text-base line-clamp-1 hover:text-violet-600 cursor-pointer transition-colors"
                        onClick={() => onSelectPlan(plan)}
                        title={plan.input.name}
                      >
                        {plan.input.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {plan.overview?.concept || plan.overview?.tagline || 'Customized AI plan'}
                      </p>
                    </div>

                    {/* Meta info chips */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{plan.input.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{plan.input.guestCount} guests</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(plan.input.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-emerald-700">
                          {formatINR(plan.input.totalBudget)}
                        </span>
                      </div>
                    </div>

                    {/* Preparation Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Preparation Progress</span>
                        <span className="font-bold text-slate-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            progress === 100
                              ? 'bg-emerald-500'
                              : progress > 50
                              ? 'bg-violet-600'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDuplicatePlan(plan.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                        title="Duplicate this plan"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${plan.input.name}"?`)) {
                            onDeletePlan(plan.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => onSelectPlan(plan)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 hover:underline"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
