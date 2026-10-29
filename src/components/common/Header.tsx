import React from 'react';
import {
  Menu,
  Sparkles,
  Printer,
  Plus,
  Bot,
  Circle,
} from 'lucide-react';
import { EventPlan } from '../../types/event';
import { NavView } from './Sidebar';

interface HeaderProps {
  currentView: NavView;
  activePlan: EventPlan | null;
  onOpenMobileMenu: () => void;
  onOpenAssistant: () => void;
  onPlanNew: () => void;
  onPrint: () => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  activePlan,
  onOpenMobileMenu,
  onOpenAssistant,
  onPlanNew,
  onPrint,
  hasApiKey,
}) => {
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Event Command Center';
      case 'plan-new':
        return 'AI Event Architect';
      case 'my-events':
        return 'My Events Directory';
      case 'workspace':
        return activePlan ? `${activePlan.input.name} — Workspace` : 'Event Workspace';
      case 'budget':
        return activePlan ? `${activePlan.input.name} — Budget` : 'Budget Planner';
      case 'timeline':
        return activePlan ? `${activePlan.input.name} — Timeline` : 'Timeline & Tasks';
      case 'checklist':
        return activePlan ? `${activePlan.input.name} — Vendor Checklist` : 'Vendor Checklist';
      case 'ideas':
        return activePlan ? `${activePlan.input.name} — Creative Ideas` : 'Creative Concepts';
      case 'settings':
        return 'Settings & Data Storage';
      default:
        return 'Planora AI';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {getViewTitle()}
            {activePlan?.isSample && (
              <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Sample Demo
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            {activePlan ? `${activePlan.input.city} • ${activePlan.input.date}` : 'Planora AI Event Assistant'}
          </p>
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Gemini status pill */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
          title={hasApiKey ? 'A Gemini key is configured on the server; live access is confirmed when a request succeeds.' : 'Gemini key needed for live AI requests'}
        >
          <Circle
            className={`w-2 h-2 fill-current ${
              hasApiKey ? 'text-emerald-500' : 'text-amber-500'
            }`}
          />
          <span>{hasApiKey ? 'Gemini configured' : 'Sample mode'}</span>
        </div>

        {/* AI Assistant button */}
        <button
          onClick={onOpenAssistant}
          className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors shadow-2xs cursor-pointer"
        >
          <Bot className="w-4 h-4 text-violet-600" />
          <span className="hidden sm:inline">Ask AI Assistant</span>
          <span className="sm:hidden">AI</span>
        </button>

        {/* Print / Export button (when plan is active) */}
        {activePlan && (
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-2xs"
            title="Print or Export to PDF"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Print / PDF</span>
          </button>
        )}

        {/* Plan a New Event button */}
        <button
          onClick={onPlanNew}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Event</span>
        </button>
      </div>
    </header>
  );
};
