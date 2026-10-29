import React, { lazy, useState } from 'react';
import {
  LayoutDashboard,
  Wallet,
  Clock,
  CheckSquare,
  Sparkles,
  ShieldAlert,
  Printer,
  Copy,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Edit3,
  Bot,
  TrendingDown,
  Wand2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  EventPlan,
  BudgetItem,
  TimelineTask,
  VendorItem,
  PersonalizedIdeas,
} from '../../types/event';
import { formatINR, formatDate, getDaysRemaining } from '../../utils/formatters';
import { OverviewTab } from './OverviewTab';
import { BudgetTab } from './BudgetTab';
import { TimelineTab } from './TimelineTab';
import { ChecklistTab } from './ChecklistTab';
import { IdeasTab } from './IdeasTab';
import { RisksTab } from './RisksTab';
import { apiService } from '../../services/apiService';

const AssistantModal = lazy(() => import('./AssistantModal').then(module => ({ default: module.AssistantModal })));
const OptimizeBudgetModal = lazy(() => import('./OptimizeBudgetModal').then(module => ({ default: module.OptimizeBudgetModal })));
const MakeCreativeModal = lazy(() => import('./MakeCreativeModal').then(module => ({ default: module.MakeCreativeModal })));
const PrintPlanView = lazy(() => import('./PrintPlanView').then(module => ({ default: module.PrintPlanView })));

export type WorkspaceTab = 'overview' | 'budget' | 'timeline' | 'checklist' | 'ideas' | 'risks';

interface EventWorkspaceProps {
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
  onDuplicatePlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onBackToDashboard: () => void;
  activeTab?: WorkspaceTab;
  onTabChange?: (tab: WorkspaceTab) => void;
}

export const EventWorkspace: React.FC<EventWorkspaceProps> = ({
  plan,
  onUpdatePlan,
  onDuplicatePlan,
  onDeletePlan,
  onBackToDashboard,
  activeTab: externalTab,
  onTabChange: externalTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<WorkspaceTab>('overview');
  const activeTab = externalTab || internalTab;

  const setTab = (tab: WorkspaceTab) => {
    if (externalTabChange) {
      externalTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // Modals state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isOptimizeOpen, setIsOptimizeOpen] = useState(false);
  const [isCreativeOpen, setIsCreativeOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Regeneration loading state for individual sections
  const [isRegeneratingSection, setIsRegeneratingSection] = useState<string | null>(null);
  const [regenerationError, setRegenerationError] = useState<string | null>(null);

  // Quick edit event title/location state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(plan.input.name);

  const daysLeft = getDaysRemaining(plan.input.date);
  const completedTasks = (plan.timeline || []).filter(t => t.status === 'completed').length;
  const totalTasks = (plan.timeline || []).length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Handler for regenerating individual section with Gemini
  const handleRegenerateSection = async (section: 'budget' | 'timeline' | 'checklist' | 'ideas' | 'risks') => {
    if (isRegeneratingSection) return;
    setRegenerationError(null);
    setIsRegeneratingSection(section);
    try {
      const refreshedData = await apiService.regenerateSection(plan.input, section);

      if (section === 'budget' && Array.isArray(refreshedData)) {
        onUpdatePlan({ ...plan, budget: refreshedData });
      } else if (section === 'timeline' && Array.isArray(refreshedData)) {
        onUpdatePlan({ ...plan, timeline: refreshedData });
      } else if (section === 'checklist' && Array.isArray(refreshedData)) {
        onUpdatePlan({ ...plan, checklist: refreshedData });
      } else if (section === 'ideas' && refreshedData) {
        onUpdatePlan({ ...plan, ideas: refreshedData as PersonalizedIdeas });
      } else if (section === 'risks' && Array.isArray(refreshedData)) {
        onUpdatePlan({ ...plan, risks: refreshedData });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please check Gemini API key configuration.';
      setRegenerationError(`Section regeneration failed: ${message}`);
    } finally {
      setIsRegeneratingSection(null);
    }
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdatePlan({
        ...plan,
        input: { ...plan.input, name: titleInput.trim() },
      });
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                {plan.input.eventType} Workspace
              </span>
              {plan.isSample && (
                <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                  Demo Template
                </span>
              )}
              <span className="text-xs font-medium text-slate-500">
                {daysLeft > 0 ? `${daysLeft} days to go` : daysLeft === 0 ? 'Today!' : 'Completed'}
              </span>
            </div>

            {/* Editable Event Name */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  className="px-3 py-1.5 text-lg font-bold border border-violet-500 rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {plan.input.name}
                </h1>
                <button
                  onClick={() => {
                    setTitleInput(plan.input.name);
                    setIsEditingTitle(true);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Rename event"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {plan.input.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(plan.input.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {plan.input.guestCount} Guests
              </span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <Wallet className="w-3.5 h-3.5" />
                {formatINR(plan.input.totalBudget)}
              </span>
            </div>
          </div>

          {/* Quick Action Tools Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold border border-violet-200 transition-colors shadow-2xs"
            >
              <Bot className="w-4 h-4 text-violet-600" />
              <span>Event AI Concierge</span>
            </button>

            <button
              onClick={() => setIsOptimizeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors shadow-2xs"
            >
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              <span>Optimize Budget</span>
            </button>

            <button
              onClick={() => setIsCreativeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors shadow-2xs"
            >
              <Wand2 className="w-4 h-4 text-indigo-600" />
              <span>Make Creative</span>
            </button>

            <button
              onClick={() => setIsPrintOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Print / Save PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDuplicatePlan(plan.id)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Duplicate Plan"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Delete plan "${plan.input.name}"?`)) {
                  onDeletePlan(plan.id);
                  onBackToDashboard();
                }
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete Plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'budget', label: 'Budget Planner', icon: Wallet },
            { id: 'timeline', label: 'Timeline & Tasks', icon: Clock },
            { id: 'checklist', label: 'Vendor Checklist', icon: CheckSquare },
            { id: 'ideas', label: 'Creative Ideas', icon: Sparkles },
            { id: 'risks', label: 'Risks & Safeguards', icon: ShieldAlert },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id as WorkspaceTab)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-xs shadow-violet-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {regenerationError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{regenerationError}</p>}

      {/* Main Tab Content View */}
      {activeTab === 'overview' && (
        <OverviewTab
          plan={plan}
          onOpenOptimize={() => setIsOptimizeOpen(true)}
          onOpenCreative={() => setIsCreativeOpen(true)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          onSwitchTab={tab => setTab(tab as WorkspaceTab)}
        />
      )}

      {activeTab === 'budget' && (
        <BudgetTab
          plan={plan}
          onUpdateBudget={newBudget => onUpdatePlan({ ...plan, budget: newBudget })}
          onRegenerateBudget={() => handleRegenerateSection('budget')}
          onOpenOptimize={() => setIsOptimizeOpen(true)}
          isRegenerating={isRegeneratingSection === 'budget'}
        />
      )}

      {activeTab === 'timeline' && (
        <TimelineTab
          plan={plan}
          onUpdateTimeline={newTimeline => onUpdatePlan({ ...plan, timeline: newTimeline })}
          onUpdateRunOfShow={newRunOfShow => onUpdatePlan({ ...plan, runOfShow: newRunOfShow })}
          onRegenerateTimeline={() => handleRegenerateSection('timeline')}
          isRegenerating={isRegeneratingSection === 'timeline'}
        />
      )}

      {activeTab === 'checklist' && (
        <ChecklistTab
          plan={plan}
          onUpdateChecklist={newChecklist => onUpdatePlan({ ...plan, checklist: newChecklist })}
          onRegenerateChecklist={() => handleRegenerateSection('checklist')}
          isRegenerating={isRegeneratingSection === 'checklist'}
        />
      )}

      {activeTab === 'ideas' && (
        <IdeasTab
          plan={plan}
          onUpdateIdeas={newIdeas => onUpdatePlan({ ...plan, ideas: newIdeas })}
          onRegenerateIdeas={() => handleRegenerateSection('ideas')}
          onOpenCreative={() => setIsCreativeOpen(true)}
          isRegenerating={isRegeneratingSection === 'ideas'}
        />
      )}

      {activeTab === 'risks' && (
        <RisksTab
          plan={plan}
          onRegenerateRisks={() => handleRegenerateSection('risks')}
          isRegenerating={isRegeneratingSection === 'risks'}
        />
      )}

      {/* Slide-out / Pop-up Modals */}
      <AssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        plan={plan}
        onUpdatePlan={onUpdatePlan}
      />

      <OptimizeBudgetModal
        isOpen={isOptimizeOpen}
        onClose={() => setIsOptimizeOpen(false)}
        plan={plan}
        onApplyOptimization={updatedBudget => {
          onUpdatePlan({ ...plan, budget: updatedBudget });
        }}
      />

      <MakeCreativeModal
        isOpen={isCreativeOpen}
        onClose={() => setIsCreativeOpen(false)}
        plan={plan}
        onAppendIdeas={updatedIdeas => {
          onUpdatePlan({ ...plan, ideas: updatedIdeas });
        }}
      />

      {isPrintOpen && (
        <PrintPlanView
          plan={plan}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
};
