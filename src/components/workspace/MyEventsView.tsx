import React, { useState } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Copy,
  Trash2,
  MapPin,
  Users,
  Calendar,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { EventPlan, EventType } from '../../types/event';
import { formatINR, formatDate, getDaysRemaining } from '../../utils/formatters';

interface MyEventsViewProps {
  plans: EventPlan[];
  activePlan: EventPlan | null;
  onSelectPlan: (plan: EventPlan) => void;
  onPlanNew: () => void;
  onDuplicatePlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
}

export const MyEventsView: React.FC<MyEventsViewProps> = ({
  plans,
  activePlan,
  onSelectPlan,
  onPlanNew,
  onDuplicatePlan,
  onDeletePlan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'budget' | 'name'>('date');

  const filteredPlans = plans
    .filter(plan => {
      const matchesSearch =
        plan.input.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.input.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === 'all' || plan.input.eventType === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.input.date).getTime() - new Date(b.input.date).getTime();
      }
      if (sortBy === 'budget') {
        return b.input.totalBudget - a.input.totalBudget;
      }
      return a.input.name.localeCompare(b.input.name);
    });

  const getPlanProgress = (plan: EventPlan): number => {
    const tasks = plan.timeline || [];
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-violet-600" />
            <span>My Events Directory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, manage, duplicate, and filter all saved event master plans ({plans.length} total)
          </p>
        </div>

        <button
          onClick={onPlanNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Plan a New Event</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by event name or city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'wedding', label: 'Weddings' },
            { id: 'birthday', label: 'Birthdays' },
            { id: 'community', label: 'Community' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors ${
                selectedType === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 shrink-0">Sort by:</span>
          <select
            value={sortBy}
            aria-label="Sort saved events"
            onChange={e => setSortBy(e.target.value as 'date' | 'budget' | 'name')}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-violet-500"
          >
            <option value="date">Date (Earliest first)</option>
            <option value="budget">Budget (Highest first)</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No events found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No events match your current filter criteria. Try adjusting your search or create a new event.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map(plan => {
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
                  {/* Category badge & sample chip */}
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
                          Demo
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

                  {/* Metadata */}
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

                  {/* Progress bar */}
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

                {/* Footer Controls */}
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
                        if (window.confirm(`Delete plan "${plan.input.name}"?`)) {
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
  );
};
