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
  Download,
  ListOrdered,
  UserCheck,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { TimelineTask, RunOfShowItem, EventPlan } from '../../types/event';
import { formatDate, getDaysRemaining, isOverdue, getDefaultRunOfShow } from '../../utils/formatters';

interface TimelineTabProps {
  plan: EventPlan;
  onUpdateTimeline: (newTimeline: TimelineTask[]) => void;
  onUpdateRunOfShow?: (newRunOfShow: RunOfShowItem[]) => void;
  onRegenerateTimeline: () => Promise<void>;
  isRegenerating: boolean;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  plan,
  onUpdateTimeline,
  onUpdateRunOfShow,
  onRegenerateTimeline,
  isRegenerating,
}) => {
  const [activeMode, setActiveMode] = useState<'milestones' | 'run-of-show'>('milestones');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => plan.input.date);
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newCategory, setNewCategory] = useState('');

  // Run of Show state
  const currentRunOfShow: RunOfShowItem[] =
    plan.runOfShow && plan.runOfShow.length > 0
      ? plan.runOfShow
      : getDefaultRunOfShow(plan.input.eventType);

  const [isAddingRos, setIsAddingRos] = useState(false);
  const [newRosTime, setNewRosTime] = useState('11:00 AM');
  const [newRosTitle, setNewRosTitle] = useState('');
  const [newRosDesc, setNewRosDesc] = useState('');
  const [newRosAssigned, setNewRosAssigned] = useState('Lead Coordinator');

  const handleToggleRosStatus = (id: string) => {
    const nextStatus: Record<string, 'pending' | 'in_progress' | 'completed'> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    const updated = currentRunOfShow.map(item =>
      item.id === id ? { ...item, status: nextStatus[item.status || 'pending'] } : item
    );
    if (onUpdateRunOfShow) onUpdateRunOfShow(updated);
  };

  const handleDeleteRosItem = (id: string) => {
    const updated = currentRunOfShow.filter(item => item.id !== id);
    if (onUpdateRunOfShow) onUpdateRunOfShow(updated);
  };

  const handleAddRosItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRosTitle.trim()) return;
    const newItem: RunOfShowItem = {
      id: `ros-user-${Date.now().toString(36)}`,
      time: newRosTime.trim() || 'TBD',
      title: newRosTitle.trim(),
      description: newRosDesc.trim(),
      assignedTo: newRosAssigned.trim() || 'Coordinator',
      status: 'pending',
    };
    if (onUpdateRunOfShow) {
      onUpdateRunOfShow([...currentRunOfShow, newItem]);
    }
    setIsAddingRos(false);
    setNewRosTitle('');
    setNewRosDesc('');
  };

  const handleResetRos = () => {
    if (window.confirm('Reset the Day-of Run-of-Show to the default itinerary for this event type?')) {
      const defaults = getDefaultRunOfShow(plan.input.eventType);
      if (onUpdateRunOfShow) onUpdateRunOfShow(defaults);
    }
  };

  // Export Milestones to iCal (.ics)
  const handleExportICal = () => {
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Planora AI//Event Planning Assistant//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${plan.input.name} Milestones`,
    ];

    (plan.timeline || []).forEach((task, idx) => {
      const rawDate = task.dueDate || plan.input.date;
      const dateClean = rawDate.replace(/-/g, '');
      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`UID:planora-${plan.id}-${task.id || idx}@planora.ai`);
      icsLines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
      icsLines.push(`DTSTART;VALUE=DATE:${dateClean}`);
      icsLines.push(`DTEND;VALUE=DATE:${dateClean}`);
      icsLines.push(`SUMMARY:${(task.title || 'Event Milestone').replace(/[,;]/g, ' ')}`);
      icsLines.push(`DESCRIPTION:${(task.description || '').replace(/\n/g, ' ')}`);
      icsLines.push(`STATUS:${task.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`);
      icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');

    const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.input.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-milestones.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  const rosCompletedCount = currentRunOfShow.filter(r => r.status === 'completed').length;
  const rosProgressPct = currentRunOfShow.length > 0 ? Math.round((rosCompletedCount / currentRunOfShow.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* View Switcher: Milestones vs Day-of Run-of-Show */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
          <button
            onClick={() => setActiveMode('milestones')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'milestones'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-violet-600" />
            <span>Preparation Countdown Milestones</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
              {sortedTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMode('run-of-show')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'run-of-show'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-indigo-600" />
            <span>Day-of Run-of-Show</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-mono">
              Hourly
            </span>
          </button>
        </div>

        {activeMode === 'milestones' ? (
          <div className="flex items-center gap-2 pr-2">
            <button
              onClick={handleExportICal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              title="Export all milestones to an .ics file for Google Calendar, Apple Calendar or Outlook"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Calendar (.ics)</span>
            </button>

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
        ) : (
          <div className="flex items-center gap-2 pr-2">
            <button
              onClick={handleResetRos}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
              title="Reset itinerary to default template"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Itinerary</span>
            </button>

            <button
              onClick={() => setIsAddingRos(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Time Slot</span>
            </button>
          </div>
        )}
      </div>

      {/* MODE 1: MILESTONES VIEW */}
      {activeMode === 'milestones' && (
        <>
          {/* Top Header & Progress */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Preparation Timeline & Milestones
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological countdown leading up to event day on {formatDate(plan.input.date)}
                </p>
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

            {/* Progress bar */}
            <div className="pt-4">
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
        </>
      )}

      {/* MODE 2: DAY-OF RUN-OF-SHOW VIEW */}
      {activeMode === 'run-of-show' && (
        <div className="space-y-6">
          {/* Run of Show Header */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-1">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Event Day Itinerary</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Master Run-of-Show Schedule
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Hour-by-hour operational sequence for {formatDate(plan.input.date)} • Click status dot to update
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
                <div className="text-2xl font-black text-indigo-300">
                  {rosCompletedCount} / {currentRunOfShow.length}
                </div>
                <div className="text-[11px] text-slate-400">Events Executed ({rosProgressPct}%)</div>
              </div>
            </div>
          </div>

          {/* Add Slot Form */}
          {isAddingRos && (
            <form
              onSubmit={handleAddRosItem}
              className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-indigo-950">Add Itinerary Time Slot</h4>
                <button
                  type="button"
                  onClick={() => setIsAddingRos(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Time Slot (e.g. 04:30 PM)"
                  value={newRosTime}
                  onChange={e => setNewRosTime(e.target.value)}
                  required
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Itinerary Title (e.g. Sunset Varmala Exchange)"
                  value={newRosTitle}
                  onChange={e => setNewRosTitle(e.target.value)}
                  required
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Assigned Lead / Team (e.g. Emcee & Decorator)"
                  value={newRosAssigned}
                  onChange={e => setNewRosAssigned(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Logistical description, instructions or cue"
                  value={newRosDesc}
                  onChange={e => setNewRosDesc(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRos(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  Save Time Slot
                </button>
              </div>
            </form>
          )}

          {/* Run of Show List */}
          <div className="relative pl-6 sm:pl-8 space-y-3 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-100">
            {currentRunOfShow.map((slot, idx) => {
              const isDone = slot.status === 'completed';
              const isInProgress = slot.status === 'in_progress';

              return (
                <div
                  key={slot.id || idx}
                  className={`relative group bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all ${
                    isDone
                      ? 'border-slate-200 bg-slate-50/70 opacity-75'
                      : isInProgress
                      ? 'border-indigo-300 ring-2 ring-indigo-200 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Status toggle node button */}
                  <button
                    onClick={() => handleToggleRosStatus(slot.id)}
                    className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                      isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : isInProgress
                        ? 'border-indigo-600 bg-indigo-600 text-white animate-pulse'
                        : 'border-slate-400 text-slate-400'
                    }`}
                    title={`Status: ${slot.status || 'pending'}. Click to cycle status.`}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : isInProgress ? (
                      <Timer className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Time Badge */}
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                          {slot.time}
                        </span>

                        <h4
                          className={`font-bold text-sm sm:text-base ${
                            isDone ? 'line-through text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {slot.title}
                        </h4>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isInProgress
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isDone ? 'Done' : isInProgress ? 'In Progress' : 'Upcoming'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pt-1">
                        {slot.description}
                      </p>
                    </div>

                    {/* Assigned Coordinator */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      {slot.assignedTo && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span className="font-medium truncate max-w-[140px]">{slot.assignedTo}</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteRosItem(slot.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition-opacity"
                        title="Remove time slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
