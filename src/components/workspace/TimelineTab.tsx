import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Filter,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { TimelineTask, EventPlan } from '../../types/event';
import { formatDate, getDaysRemaining, isOverdue } from '../../utils/formatters';

interface TimelineTabProps {
  plan: EventPlan;
  onUpdateTimeline: (newTimeline: TimelineTask[]) => void;
  onRegenerateTimeline: () => Promise<void>;
  isRegenerating: boolean;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  plan,
  onUpdateTimeline,
  onRegenerateTimeline,
  isRegenerating,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => plan.input.date);
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newCategory, setNewCategory] = useState('');

  // Sort tasks chronologically by due date
  const sortedTasks = [...(plan.timeline || [])].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const filteredTasks = sortedTasks.filter(task => {
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'pending') return task.status !== 'completed';
    if (filter === 'overdue') return task.status !== 'completed' && isOverdue(task.dueDate);
    return true;
  });

  const completedCount = sortedTasks.filter(t => t.status === 'completed').length;
  const overdueCount = sortedTasks.filter(t => t.status !== 'completed' && isOverdue(t.dueDate)).length;
  const progressPct = sortedTasks.length > 0 ? Math.round((completedCount / sortedTasks.length) * 100) : 0;

  const handleToggleStatus = (id: string) => {
    const updated = plan.timeline.map(task => {
      if (task.id === id) {
        return {
          ...task,
          status: task.status === 'completed' ? ('pending' as const) : ('completed' as const),
        };
      }
      return task;
    });
    onUpdateTimeline(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = plan.timeline.filter(t => t.id !== id);
    onUpdateTimeline(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TimelineTask = {
      id: `t-user-${Date.now().toString(36)}`,
      title: newTitle.trim(),
      description: newDescription.trim() || 'Custom user milestone',
      suggestedDeadline: formatDate(newDueDate),
      dueDate: newDueDate,
      priority: newPriority,
      status: 'pending',
      category: newCategory.trim() || 'General',
    };

    onUpdateTimeline([...plan.timeline, newTask]);
    setIsAdding(false);
    setNewTitle('');
    setNewDescription('');
    setNewCategory('');
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Progress */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Preparation Timeline & Milestones
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological countdown to event day on {formatDate(plan.input.date)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 font-semibold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>

            <button
              onClick={onRegenerateTimeline}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>{isRegenerating ? 'Regenerating...' : 'AI Re-schedule'}</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">
                Milestone Progress ({completedCount} of {sortedTasks.length} tasks ready)
              </span>
              <span className="font-bold text-violet-600">{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-violet-600 h-full rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({sortedTasks.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pending ({sortedTasks.length - completedCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Done ({completedCount})
            </button>
            {overdueCount > 0 && (
              <button
                onClick={() => setFilter('overdue')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filter === 'overdue'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                Overdue ({overdueCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <form
          onSubmit={handleAddTask}
          className="bg-violet-50/60 border border-violet-200 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-violet-950">Add Milestone / Task</h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Task Title (e.g., Finalize Bridal Lehenga / Venue Advance)"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
            />
            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              required
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Description or notes"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
            />
            <div className="flex gap-2">
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <input
                type="text"
                placeholder="Category (e.g. Venue, Decor)"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/50 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-xs"
            >
              Add Milestone
            </button>
          </div>
        </form>
      )}

      {/* Chronological Milestone List */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {filteredTasks.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No tasks match this filter</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isDone = task.status === 'completed';
            const overdue = !isDone && isOverdue(task.dueDate);
            const daysRemaining = getDaysRemaining(task.dueDate);

            return (
              <div
                key={task.id}
                className={`relative group bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all ${
                  isDone
                    ? 'border-slate-200 bg-slate-50/50 opacity-80'
                    : overdue
                    ? 'border-red-200 ring-1 ring-red-200/50'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Timeline node icon */}
                <button
                  onClick={() => handleToggleStatus(task.id)}
                  className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : overdue
                      ? 'border-red-500 text-red-500'
                      : 'border-violet-500 text-violet-500'
                  }`}
                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        overdue ? 'bg-red-500' : 'bg-violet-500'
                      }`}
                    />
                  )}
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`font-bold text-sm sm:text-base ${
                          isDone ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h4>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>

                      {task.category && (
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {task.category}
                        </span>
                      )}

                      {overdue && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Deadline Overdue</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {task.description}
                    </p>

                    {task.suggestedDeadline && (
                      <div className="text-[11px] text-slate-400">
                        Suggested timing: {task.suggestedDeadline}
                      </div>
                    )}
                  </div>

                  {/* Due Date & Action */}
                  <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(task.dueDate)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        {isDone
                          ? 'Completed'
                          : daysRemaining > 0
                          ? `In ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                          : daysRemaining === 0
                          ? 'Due today!'
                          : 'Past due'}
                      </span>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition-opacity"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
