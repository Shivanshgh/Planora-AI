import React, { useState } from 'react';
import {
  Wallet,
  TrendingDown,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Lightbulb,
  Info,
  DollarSign,
  PieChart,
  HelpCircle,
  Download,
} from 'lucide-react';
import { BudgetItem, EventPlan } from '../../types/event';
import { formatINR, formatNumberIndian } from '../../utils/formatters';
import { calculateBudgetTotals } from '../../utils/budget';

interface BudgetTabProps {
  plan: EventPlan;
  onUpdateBudget: (newBudget: BudgetItem[]) => void;
  onRegenerateBudget: () => Promise<void>;
  onOpenOptimize: () => void;
  isRegenerating: boolean;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({
  plan,
  onUpdateBudget,
  onRegenerateBudget,
  onOpenOptimize,
  isRegenerating,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');

  // Add new item state
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newAmount, setNewAmount] = useState<number>(25000);
  const [newExplanation, setNewExplanation] = useState<string>('');
  const [newSavingTip, setNewSavingTip] = useState<string>('');

  // Calculate real-time totals in app code
  const totalBudget = plan.input.totalBudget;
  const budgetTotals = calculateBudgetTotals(plan.budget || [], totalBudget);
  const currentAllocated = budgetTotals.allocated;
  const remainingBudget = budgetTotals.remaining;
  const isOverBudget = remainingBudget < 0;

  // Actual spent tracking
  const totalActualSpent = budgetTotals.spent;

  // Hovered item for interactive chart
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Export budget as CSV
  const handleExportCSV = () => {
    const headers = ['Category', 'Allocated Amount (INR)', 'Percentage (%)', 'Actual Spent (INR)', 'Explanation', 'Cost Saving Alternative', 'Notes'];
    const rows = (plan.budget || []).map(item => [
      `"${(item.category || '').replace(/"/g, '""')}"`,
      item.allocatedAmount,
      item.percentage,
      item.actualSpent || 0,
      `"${(item.explanation || '').replace(/"/g, '""')}"`,
      `"${(item.costSavingAlternative || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.input.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-budget.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Palette colors for budget distribution visualizer
  const categoryColors = [
    '#6366F1', // indigo
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#14B8A6', // teal
    '#F97316', // orange
    '#84CC16', // lime
    '#64748B', // slate
  ];

  const handleStartEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditAmount(item.allocatedAmount);
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    const updated = plan.budget.map(item => {
      if (item.id === id) {
        const newAllocated = Math.max(0, Number(editAmount) || 0);
        return {
          ...item,
          allocatedAmount: newAllocated,
          percentage: totalBudget > 0 ? Math.round((newAllocated / totalBudget) * 100) : 0,
          notes: editNotes.trim(),
        };
      }
      return item;
    });

    onUpdateBudget(updated);
    setEditingId(null);
  };

  const handleDeleteItem = (id: string) => {
    if (plan.budget.length <= 1) {
      alert('You must have at least one expense category.');
      return;
    }
    const updated = plan.budget.filter(b => b.id !== id);
    onUpdateBudget(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || newAmount <= 0) return;

    const newItem: BudgetItem = {
      id: `b-user-${Date.now().toString(36)}`,
      category: newCategory.trim(),
      allocatedAmount: Number(newAmount),
      percentage: totalBudget > 0 ? Math.round((Number(newAmount) / totalBudget) * 100) : 0,
      explanation: newExplanation.trim() || 'Custom user expense item',
      costSavingAlternative: newSavingTip.trim() || 'Compare multiple vendor quotes.',
      actualSpent: 0,
    };

    onUpdateBudget([...plan.budget, newItem]);
    setIsAdding(false);
    setNewCategory('');
    setNewAmount(25000);
    setNewExplanation('');
    setNewSavingTip('');
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Estimates Notice:</strong> All figures shown are AI budget benchmarks in Indian Rupees (INR) based on market norms, not signed vendor quotes.
          </span>
        </div>
        <button
          onClick={onOpenOptimize}
          className="shrink-0 text-amber-900 hover:text-amber-950 font-bold underline text-xs"
        >
          Propose Cost Reductions
        </button>
      </div>

      {/* Budget Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Planned Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Event Budget
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatINR(totalBudget)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Target cap set for {plan.input.guestCount} guests
          </p>
        </div>

        {/* Current Allocated */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Allocated Sum
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isOverBudget
                  ? 'bg-red-100 text-red-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {totalBudget > 0 ? Math.round((currentAllocated / totalBudget) * 100) : 0}%
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatINR(currentAllocated)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Distributed across {plan.budget.length} categories
          </p>
        </div>

        {/* Remaining / Variance */}
        <div
          className={`p-5 rounded-2xl border shadow-2xs ${
            isOverBudget
              ? 'bg-red-50/80 border-red-200 text-red-900'
              : remainingBudget === 0
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
            {isOverBudget ? 'Over Budget By' : remainingBudget === 0 ? 'Budget Balanced' : 'Unallocated Buffer'}
          </div>
          <div
            className={`text-2xl font-extrabold mt-2 ${
              isOverBudget ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {formatINR(Math.abs(remainingBudget))}
          </div>
          <p className="text-[11px] opacity-80 mt-0.5">
            {isOverBudget
              ? 'Allocations exceed target cap. Trim categories or optimize.'
              : remainingBudget === 0
              ? 'Every rupee accounted for with emergency contingency.'
              : 'Available for miscellaneous or unexpected costs.'}
          </p>
        </div>
      </div>

      {/* Visual Distribution Chart & Interactive Donut */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-violet-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Expense Allocation Distribution
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Per-guest spend: <strong className="text-slate-900">{formatINR(Math.round(currentAllocated / (plan.input.guestCount || 1)))}</strong> ({plan.input.guestCount} guests)
          </span>
        </div>

        {/* Donut Chart + Interactive Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* SVG Donut Chart */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-52 h-52 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="transparent"
                  stroke="#F1F5F9"
                  strokeWidth="22"
                />
                {(() => {
                  const radius = 60;
                  const circ = 2 * Math.PI * radius;
                  let currentOffset = 0;
                  return plan.budget.map((item, idx) => {
                    const pctOfAllocated = currentAllocated > 0 ? item.allocatedAmount / currentAllocated : 0;
                    const strokeDash = pctOfAllocated * circ;
                    const dashoffset = -currentOffset;
                    currentOffset += strokeDash;
                    const isHovered = hoveredId === item.id;
                    const isAnyHovered = hoveredId !== null;

                    return (
                      <circle
                        key={item.id}
                        cx="80"
                        cy="80"
                        r="60"
                        fill="transparent"
                        stroke={categoryColors[idx % categoryColors.length]}
                        strokeWidth={isHovered ? 26 : 22}
                        strokeDasharray={`${strokeDash} ${circ - strokeDash}`}
                        strokeDashoffset={dashoffset}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          opacity: isAnyHovered ? (isHovered ? 1 : 0.45) : 1,
                        }}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Center Metrics Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                {(() => {
                  const hoveredItem = plan.budget.find(b => b.id === hoveredId);
                  if (hoveredItem) {
                    return (
                      <>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate max-w-[120px]">
                          {hoveredItem.category}
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                          {formatINR(hoveredItem.allocatedAmount)}
                        </span>
                        <span className="text-[11px] font-semibold text-violet-600">
                          {hoveredItem.percentage}% of budget
                        </span>
                      </>
                    );
                  }
                  return (
                    <>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Total Allocated
                      </span>
                      <span className="text-lg font-black text-slate-900 mt-0.5">
                        {formatINR(currentAllocated)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {plan.budget.length} Categories
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Hover over donut slices or list items to isolate spend
            </p>
          </div>

          {/* Interactive Legend & Breakdown Grid */}
          <div className="md:col-span-7 space-y-2 max-h-64 overflow-y-auto pr-1">
            {plan.budget.map((item, idx) => {
              const pct = totalBudget > 0 ? Math.round((item.allocatedAmount / totalBudget) * 100) : 0;
              const isHovered = hoveredId === item.id;
              const color = categoryColors[idx % categoryColors.length];

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                    isHovered
                      ? 'bg-violet-50 border-violet-300 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: color }}
                    />
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate">{item.category}</div>
                      <div className="text-[10px] text-slate-500 truncate">{item.explanation}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-slate-900">{formatINR(item.allocatedAmount)}</div>
                    <div className="text-[10px] font-semibold text-slate-500">{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-segment visual bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden shadow-inner">
            {plan.budget.map((item, idx) => {
              const widthPct = totalBudget > 0 ? (item.allocatedAmount / totalBudget) * 100 : 0;
              if (widthPct <= 0) return null;
              return (
                <div
                  key={item.id}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: categoryColors[idx % categoryColors.length],
                  }}
                  className="h-full hover:opacity-85 transition-opacity relative group cursor-pointer"
                  title={`${item.category}: ${formatINR(item.allocatedAmount)} (${Math.round(widthPct)}%)`}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Itemized Categories Table & Editor */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Itemized Budget Allocations</h3>
            <p className="text-xs text-slate-500">
              Click any amount to adjust allocations. Calculations update immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              title="Download budget as a CSV file for Excel / Google Sheets"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 font-semibold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense Category</span>
            </button>

            <button
              onClick={onRegenerateBudget}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors disabled:opacity-50"
              title="Use Gemini AI to recalculate allocations"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>{isRegenerating ? 'Recalculating...' : 'AI Re-estimate'}</span>
            </button>
          </div>
        </div>

        {/* Modal / Inset for Adding Item */}
        {isAdding && (
          <form
            onSubmit={handleAddItem}
            className="p-4 bg-violet-50/50 border-b border-violet-100 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-900">Add New Expense Item</span>
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
                type="text"
                aria-label="New budget category"
                placeholder="Category Name (e.g., Security, Valet)"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                required
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
              />
              <input
                type="number"
                aria-label="New category amount in Indian rupees"
                placeholder="Amount in INR"
                value={newAmount}
                onChange={e => setNewAmount(Number(e.target.value))}
                required
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
              />
              <input
                type="text"
                aria-label="New category explanation"
                placeholder="Short explanation"
                value={newExplanation}
                onChange={e => setNewExplanation(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/50 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
              >
                Save Category
              </button>
            </div>
          </form>
        )}

        {/* List of categories */}
        <div className="divide-y divide-slate-100">
          {plan.budget.map((item, idx) => {
            const isEditing = editingId === item.id;
            const pct = totalBudget > 0 ? Math.round((item.allocatedAmount / totalBudget) * 100) : 0;
            const isContingency = item.category.toLowerCase().includes('contingency') || item.category.toLowerCase().includes('emergency');

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 transition-colors ${
                  isEditing ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Category Details */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: categoryColors[idx % categoryColors.length] }}
                      />
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        {item.category}
                        {isContingency && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Safety Buffer
                          </span>
                        )}
                      </h4>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {pct}% of budget
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pl-5">
                      {item.explanation}
                    </p>

                    {item.costSavingAlternative && (
                      <div className="pl-5 pt-1 flex items-start gap-1.5 text-xs text-violet-700">
                        <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-violet-600" />
                        <span>
                          <strong>Cost-Saving Alternative:</strong> {item.costSavingAlternative}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Allocation Numbers & Inline Edit Controls */}
                  <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          aria-label={`Allocated amount for ${item.category}`}
                          step="1000"
                          value={editAmount}
                          onChange={e => setEditAmount(Number(e.target.value))}
                          className="w-32 px-2.5 py-1 text-sm font-bold border border-violet-500 rounded-lg focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          title="Save change"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEdit(item)}
                        className="group flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                        title="Click to edit amount"
                      >
                        <div className="text-right">
                          <div className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-violet-600 transition-colors">
                            {formatINR(item.allocatedAmount)}
                          </div>
                          {item.actualSpent ? (
                            <div className="text-[11px] text-slate-500">
                              Spent: {formatINR(item.actualSpent)}
                            </div>
                          ) : null}
                        </div>
                        <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs">
                      {!isEditing && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                          title="Remove category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
