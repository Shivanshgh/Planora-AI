import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Sidebar, NavView } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import type { WorkspaceTab } from './components/workspace/EventWorkspace';
import type { EventPlan, EventInput } from './types/event';
import { storageService } from './services/storageService';
import { apiService } from './services/apiService';
import { SAMPLE_WEDDING_PLAN } from './utils/sampleData';

const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const EventForm = lazy(() => import('./components/planner/EventForm').then(module => ({ default: module.EventForm })));
const EventWorkspace = lazy(() => import('./components/workspace/EventWorkspace').then(module => ({ default: module.EventWorkspace })));
const MyEventsView = lazy(() => import('./components/workspace/MyEventsView').then(module => ({ default: module.MyEventsView })));
const SettingsView = lazy(() => import('./components/settings/SettingsView').then(module => ({ default: module.SettingsView })));
const AssistantModal = lazy(() => import('./components/workspace/AssistantModal').then(module => ({ default: module.AssistantModal })));
const PrintPlanView = lazy(() => import('./components/workspace/PrintPlanView').then(module => ({ default: module.PrintPlanView })));

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('overview');
  const [plans, setPlans] = useState<EventPlan[]>([]);
  const [activePlan, setActivePlan] = useState<EventPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // Mobile navigation drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Global modals triggered from header
  const [isHeaderAssistantOpen, setIsHeaderAssistantOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Load plans from local storage and verify server health
  useEffect(() => {
    const loadedPlans = storageService.getEvents();
    setPlans(loadedPlans);

    const activeId = storageService.getActiveEventId();
    if (activeId) {
      const match = loadedPlans.find(p => p.id === activeId);
      if (match) setActivePlan(match);
      else if (loadedPlans.length > 0) setActivePlan(loadedPlans[0]);
    } else if (loadedPlans.length > 0) {
      setActivePlan(loadedPlans[0]);
    }

    // Healthcheck
    apiService.checkHealth().then(status => {
      setHasApiKey(status.hasKey);
    });
  }, []);

  const handleSelectPlan = (plan: EventPlan) => {
    setActivePlan(plan);
    storageService.setActiveEventId(plan.id);
  };

  const handleCreatePlan = async (input: EventInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const newPlan = await apiService.generatePlan(input);
      const saved = storageService.saveEvent(newPlan);
      setPlans(storageService.getEvents());
      setActivePlan(saved);
      setCurrentView('dashboard');
      setWorkspaceTab('overview');

      // Celebration confetti
      try {
        const { default: confetti } = await import('canvas-confetti');
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#6366F1', '#EC4899', '#10B981'],
        });
      } catch {
        // ignore if not supported
      }
    } catch (err: unknown) {
      console.error('Plan creation error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to generate event plan using Gemini AI.';
      const status = typeof err === 'object' && err !== null && 'status' in err ? err.status : undefined;
      let displayMessage = errMsg;
      if (status === 503 || errMsg.includes('API key')) {
        displayMessage += ' (Note: You can explore or duplicate the pre-loaded sample plans while the API key is being configured).';
      }
      setError(displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlan = (updatedPlan: EventPlan) => {
    const saved = storageService.saveEvent(updatedPlan);
    setPlans(storageService.getEvents());
    setActivePlan(saved);
  };

  const handleDuplicatePlan = (id: string) => {
    const duplicated = storageService.duplicateEvent(id);
    if (duplicated) {
      setPlans(storageService.getEvents());
      setActivePlan(duplicated);
      setCurrentView('dashboard');
    }
  };

  const handleDeletePlan = (id: string) => {
    storageService.deleteEvent(id);
    const updated = storageService.getEvents();
    setPlans(updated);
    if (activePlan?.id === id) {
      setActivePlan(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleLoadSamples = () => {
    const loaded = storageService.resetToSamples();
    setPlans(loaded);
    if (loaded.length > 0) {
      setActivePlan(loaded[0]);
    }
  };

  const handleRefreshData = () => {
    const updated = storageService.getEvents();
    setPlans(updated);
    const activeId = storageService.getActiveEventId();
    if (activeId) {
      const match = updated.find(p => p.id === activeId);
      setActivePlan(match || (updated.length > 0 ? updated[0] : null));
    } else {
      setActivePlan(updated.length > 0 ? updated[0] : null);
    }
  };

  // Router logic to render correct view based on navigation selection
  const renderCurrentView = () => {
    if (currentView === 'plan-new') {
      return (
        <EventForm
          onSubmit={handleCreatePlan}
          isLoading={isLoading}
          onCancel={() => setCurrentView('dashboard')}
          error={error}
          onExploreSample={() => {
            handleLoadSamples();
            setCurrentView('workspace');
            setWorkspaceTab('overview');
          }}
        />
      );
    }

    if (currentView === 'settings') {
      return (
        <SettingsView
          plans={plans}
          onRefreshData={handleRefreshData}
          hasApiKey={hasApiKey}
        />
      );
    }

    if (currentView === 'my-events') {
      return (
        <MyEventsView
          plans={plans}
          activePlan={activePlan}
          onSelectPlan={plan => {
            handleSelectPlan(plan);
            setCurrentView('workspace');
            setWorkspaceTab('overview');
          }}
          onPlanNew={() => {
            setError(null);
            setCurrentView('plan-new');
          }}
          onDuplicatePlan={handleDuplicatePlan}
          onDeletePlan={handleDeletePlan}
        />
      );
    }

    // Direct tab shortcuts or active workspace view
    if (['workspace', 'budget', 'timeline', 'checklist', 'ideas'].includes(currentView)) {
      const targetPlan = activePlan || (plans.length > 0 ? plans[0] : null);
      if (targetPlan) {
        const tabToOpen = (['budget', 'timeline', 'checklist', 'ideas'].includes(currentView)
          ? currentView
          : workspaceTab) as WorkspaceTab;

        return (
          <EventWorkspace
            plan={targetPlan}
            onUpdatePlan={handleUpdatePlan}
            onDuplicatePlan={handleDuplicatePlan}
            onDeletePlan={handleDeletePlan}
            onBackToDashboard={() => setCurrentView('dashboard')}
            activeTab={tabToOpen}
            onTabChange={tab => {
              setWorkspaceTab(tab);
              if (['budget', 'timeline', 'checklist', 'ideas'].includes(tab)) {
                setCurrentView(tab as NavView);
              } else {
                setCurrentView('workspace');
              }
            }}
          />
        );
      } else {
        // No plans available yet, prompt to create
        return (
          <EventForm
            onSubmit={handleCreatePlan}
            isLoading={isLoading}
            onCancel={() => setCurrentView('dashboard')}
            error={error}
            onExploreSample={() => {
              handleLoadSamples();
              setCurrentView('workspace');
              setWorkspaceTab('overview');
            }}
          />
        );
      }
    }

    return (
      <Dashboard
        plans={plans}
        activePlan={activePlan}
        onSelectPlan={plan => {
          handleSelectPlan(plan);
          setCurrentView('workspace');
          setWorkspaceTab('overview');
        }}
        onPlanNew={() => {
          setError(null);
          setCurrentView('plan-new');
        }}
        onDuplicatePlan={handleDuplicatePlan}
        onDeletePlan={handleDeletePlan}
        onLoadSamples={handleLoadSamples}
      />
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-violet-100 selection:text-violet-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-slate-900 focus:shadow-lg">
        Skip to main content
      </a>
      {/* Persistent Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={view => {
          setError(null);
          setCurrentView(view);
          if (view === 'dashboard') setWorkspaceTab('overview');
        }}
        activePlan={activePlan}
        savedPlans={plans}
        onSelectPlan={plan => {
          handleSelectPlan(plan);
          setCurrentView('my-events');
        }}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentView={currentView}
          activePlan={activePlan}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAssistant={() => setIsHeaderAssistantOpen(true)}
          onPlanNew={() => {
            setError(null);
            setCurrentView('plan-new');
          }}
          onPrint={() => setIsPrintModalOpen(true)}
          hasApiKey={hasApiKey}
        />

        <main id="main-content" tabIndex={-1} className="flex-1 pb-16">
          <Suspense fallback={<div className="p-8 text-sm text-slate-600" role="status">Loading planner…</div>}>
            {renderCurrentView()}
          </Suspense>
        </main>
      </div>

      {/* Header-triggered Global Assistant */}
      <Suspense fallback={null}>
        {isHeaderAssistantOpen && (
          <AssistantModal
            isOpen={isHeaderAssistantOpen}
            onClose={() => setIsHeaderAssistantOpen(false)}
            plan={activePlan}
            onUpdatePlan={handleUpdatePlan}
          />
        )}
      </Suspense>

      {/* Global Print Modal */}
      <Suspense fallback={null}>
        {isPrintModalOpen && activePlan && (
          <PrintPlanView
            plan={activePlan}
            onClose={() => setIsPrintModalOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
}
