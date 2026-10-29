import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Clock,
  AlertCircle,
  Tag,
  CheckCircle2,
  X,
  Edit2,
  Check,
} from 'lucide-react';
import { VendorItem, EventPlan } from '../../types/event';
import { formatINR, formatDate } from '../../utils/formatters';

interface ChecklistTabProps {
  plan: EventPlan;
  onUpdateChecklist: (newChecklist: VendorItem[]) => void;
  onRegenerateChecklist: () => Promise<void>;
  isRegenerating: boolean;
}

export const ChecklistTab: React.FC<ChecklistTabProps> = ({
  plan,
  onUpdateChecklist,
  onRegenerateChecklist,
  isRegenerating,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New vendor item state
  const [newCategory, setNewCategory] = useState('Venue');
  const [newTask, setNewTask] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newDeadline, setNewDeadline] = useState(() => plan.input.date);
  const [newEstimatedCost, setNewEstimatedCost] = useState<number>(0);

  const categories = Array.from(new Set((plan.checklist || []).map(c => c.category)));

  const filteredItems = (plan.checklist || []).filter(item => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  const completedCount = (plan.checklist || []).filter(c => c.status === 'completed').length;
  const inProgressCount = (plan.checklist || []).filter(c => c.status === 'in_progress').length;
  const notStartedCount = (plan.checklist || []).filter(c => c.status === 'not_started').length;

  const handleStatusChange = (id: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    const updated = plan.checklist.map(item => {
      if (item.id === id) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    onUpdateChecklist(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = plan.checklist.filter(item => item.id !== id);
    onUpdateChecklist(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const newItem: VendorItem = {
      id: `c-user-${Date.now().toString(36)}`,
      category: newCategory.trim() || 'General',
      task: newTask.trim(),
      notes: newNotes.trim(),
      priority: newPriority,
      deadline: newDeadline,
      status: 'not_started',
      estimatedCost: Number(newEstimatedCost) || 0,
    };

    onUpdateChecklist([...plan.checklist, newItem]);
    setIsAdding(false);
    setNewTask('');
    setNewNotes('');
    setNewEstimatedCost(0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Vendor Coordination & Checklist
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Actionable tasks, vendor inquiries, and technical specifications for suppliers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 font-semibold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Checklist Item</span>
            </button>

            <button
              onClick={onRegenerateChecklist}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>{isRegenerating ? 'Refreshing...' : 'AI Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Stats and Category Chips */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-slate-500">
              Completed: <strong className="text-emerald-600">{completedCount}</strong>
            </span>
            <span className="text-slate-500">
              In Progress: <strong className="text-amber-600">{inProgressCount}</strong>
            </span>
            <span className="text-slate-500">
              Pending: <strong className="text-slate-700">{notStartedCount}</strong>
            </span>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filterCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filterCategory === cat
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form
          onSubmit={handleAddItem}
          className="bg-violet-50/60 border border-violet-200 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-violet-950">Add Vendor Checklist Task</h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              aria-label="Vendor category"
              type="text"
              placeholder="Vendor Category (e.g. Florist, Sound, Caterer)"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              required
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
            />
            <input
              aria-label="Vendor checklist task"
              type="text"
              placeholder="Action Task / Specification"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              required
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500 sm:col-span-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              aria-label="Vendor notes and requirements"
              type="text"
              placeholder="Notes, requirements, or terms"
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
            />
            <input
              aria-label="Vendor task deadline"
              type="date"
              value={newDeadline}
              onChange={e => setNewDeadline(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
            />
            <input
              aria-label="Estimated vendor cost in Indian rupees"
              type="number"
              placeholder="Estimated cost (INR)"
              value={newEstimatedCost || ''}
              onChange={e => setNewEstimatedCost(Number(e.target.value))}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
            />
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
              Save Checklist Task
            </button>
          </div>
        </form>
      )}

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const isDone = item.status === 'completed';
          const isInProgress = item.status === 'in_progress';

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isInProgress
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {item.category}
                  </span>

                  {/* Status Dropdown */}
                  <select
                    value={item.status}
                    aria-label={`Status for ${item.task}`}
                    onChange={e => handleStatusChange(item.id, e.target.value as VendorItem['status'])}
                    className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isInProgress
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <h4
                    className={`font-bold text-sm sm:text-base ${
                      isDone ? 'text-slate-500 line-through' : 'text-slate-900'
                    }`}
                  >
                    {item.task}
                  </h4>
                  {item.notes && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>Due: {formatDate(item.deadline)}</span>
                  {item.estimatedCost > 0 && (
                    <span className="font-semibold text-emerald-700">
                      ~{formatINR(item.estimatedCost)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
