import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  CalendarDays,
  Wallet,
  CheckSquare,
  Clock,
  Settings,
  PlusCircle,
  X,
  Compass,
  ChevronRight,
} from 'lucide-react';
import { EventPlan } from '../../types/event';
import { formatINR } from '../../utils/formatters';

export type NavView =
  | 'dashboard'
  | 'plan-new'
  | 'my-events'
  | 'workspace'
  | 'budget'
  | 'timeline'
  | 'checklist'
  | 'ideas'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  activePlan: EventPlan | null;
  savedPlans: EventPlan[];
  onSelectPlan: (plan: EventPlan) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  activePlan,
  savedPlans,
  onSelectPlan,
  isOpenMobile,
  onCloseMobile,
}) => {
  // Core navigation items covering all Prompt Wars pillars:
  // 1. Dashboard, 2. Plan an Event, 3. My Events, 4. Budget Planner, 5. Timeline & Tasks, 6. Vendor Checklist
  const coreNavItems: { id: NavView; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'plan-new', label: 'Plan an Event', icon: PlusCircle },
    { id: 'my-events', label: 'My Events', icon: CalendarDays },
    { id: 'budget', label: 'Budget Planner', icon: Wallet },
    { id: 'timeline', label: 'Timeline & Tasks', icon: Clock },
    { id: 'checklist', label: 'Vendor Checklist', icon: CheckSquare },
  ];

  const handleNavClick = (view: NavView) => {
    onNavigate(view);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800">
      {/* Brand Logo & Name */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <button
          type="button"
          aria-label="Planora dashboard"
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-900/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-violet-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl text-white tracking-tight">Planora</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Your event. Your budget.</p>
          </div>
        </button>
        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main 6 Navigation items */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Navigation
          </div>
          <nav aria-label="Main navigation" className="space-y-1">
            {coreNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Current Active Event Workspace Shortcut Card */}
        {activePlan && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              <span>Active Plan</span>
              <span className="text-[10px] lowercase text-violet-400 font-mono">
                {activePlan.input.eventType}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleNavClick('my-events')}
              className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-violet-500/50 cursor-pointer transition-all mb-2 group"
            >
              <div className="font-semibold text-xs text-white truncate group-hover:text-violet-300" title={activePlan.input.name}>
                {activePlan.input.name}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>{activePlan.input.city}</span>
                <span className="text-emerald-400 font-medium">
                  {formatINR(activePlan.input.totalBudget)}
                </span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('ideas')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === 'ideas'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Compass className="w-4 h-4 text-violet-400" />
              <span>Creative Ideas</span>
            </button>
          </div>
        )}

        {/* Recent Events Switcher */}
        {savedPlans.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
              <span>Recent Plans</span>
              <span className="text-slate-500 font-mono text-[10px]">{savedPlans.length}</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {savedPlans.slice(0, 5).map(plan => {
                const isCurrent = activePlan?.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => {
                      onSelectPlan(plan);
                      handleNavClick('my-events');
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      isCurrent
                        ? 'bg-slate-800 text-violet-300 font-medium border border-violet-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="truncate pr-2">{plan.input.name}</span>
                    {plan.isSample && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-700 text-slate-300 shrink-0">
                        Demo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Item 6: Settings */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <button
          onClick={() => handleNavClick('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            currentView === 'settings'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Settings
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (persistent) */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
