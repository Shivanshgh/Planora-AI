import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Clock,
  Palette,
  Utensils,
  Globe,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Info,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Wand2,
} from 'lucide-react';
import { EventInput, EventType, SettingType, BudgetFlexibility } from '../../types/event';
import { formatINR, assessBudgetHealth } from '../../utils/formatters';

interface EventFormProps {
  onSubmit: (input: EventInput) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
  error?: string | null;
  onExploreSample?: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  onSubmit,
  isLoading,
  onCancel,
  error,
  onExploreSample,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form state
  const [name, setName] = useState('');
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [date, setDate] = useState(() => {
    // Default to ~60 days in the future
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().split('T')[0];
  });
  const [city, setCity] = useState('New Delhi');
  const [guestCount, setGuestCount] = useState<number>(200);
  const [totalBudget, setTotalBudget] = useState<number>(1000000); // Default ₹10,00,000

  // Optional fields
  const [durationHours, setDurationHours] = useState<number>(6);
  const [setting, setSetting] = useState<SettingType>('hybrid');
  const [theme, setTheme] = useState('');
  const [dietary, setDietary] = useState('');
  const [cultural, setCultural] = useState('');
  const [language, setLanguage] = useState('English & Hindi');
  const [mustHaveActivities, setMustHaveActivities] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [budgetFlexibility, setBudgetFlexibility] = useState<BudgetFlexibility>('moderate');

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Dynamic budget health check
  const budgetHealth = assessBudgetHealth(eventType, totalBudget, guestCount, city);

  const applyPreset = (presetType: 'wedding' | 'birthday' | 'community') => {
    if (presetType === 'wedding') {
      setName('Aarav & Siya’s Heritage Wedding');
      setEventType('wedding');
      setCity('Udaipur, Rajasthan');
      setGuestCount(250);
      setTotalBudget(1800000);
      setDurationHours(8);
      setSetting('hybrid');
      setTheme('Regal Rajputana with Lotus Florals');
      setDietary('North Indian Royal Feast + Rajasthani Sweets + Live Chaat');
      setCultural('Traditional Hindu Wedding & Sangeet');
      setMustHaveActivities('Grand Baraat with Dhol, Sunset Varmala, Live Flute & Sufi artist');
      setSpecialRequirements('Eco-friendly seed paper invites, golf cart shuttle for senior elders');
      setBudgetFlexibility('moderate');
    } else if (presetType === 'birthday') {
      setName('Rohan’s 30th Rooftop Retro Bash');
      setEventType('birthday');
      setCity('Bengaluru, Karnataka');
      setGuestCount(50);
      setTotalBudget(150000);
      setDurationHours(5);
      setSetting('indoor');
      setTheme('Neon 90s Retro Synthwave');
      setDietary('Gourmet Sliders, Wood-fired Pizza, Artisanal Mocktails & Tiramisu Cake');
      setCultural('Contemporary Friends & Family Party');
      setMustHaveActivities('Retro arcade contest, DJ dance floor, Polaroid memory board');
      setSpecialRequirements('Dedicated vegan snack options, noise restriction after 10 PM');
      setBudgetFlexibility('strict');
    } else {
      setName('Sunrise Enclave Spring Cultural Mela');
      setEventType('community');
      setCity('Pune, Maharashtra');
      setGuestCount(350);
      setTotalBudget(400000);
      setDurationHours(6);
      setSetting('outdoor');
      setTheme('Eco-Carnival: Traditions & Craft');
      setDietary('Street Food Bazaar (Pav Bhaji, Dosa, Jalebi, Chaat, Chai kulhad)');
      setCultural('Multi-community residential festival');
      setMustHaveActivities('Inter-building talent show, artisan pottery stalls, diya lighting');
      setSpecialRequirements('Wheelchair ramp for stage, 100% biodegradable palm plates');
      setBudgetFlexibility('moderate');
    }
    setValidationErrors({});
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Event name is required';
    if (!date) errors.date = 'Event date is required';
    if (!city.trim()) errors.city = 'City or location is required';
    if (!guestCount || guestCount < 1) errors.guestCount = 'Guest count must be at least 1';
    if (!totalBudget || totalBudget < 5000) errors.totalBudget = 'Minimum budget is ₹5,000';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    const inputData: EventInput = {
      id: 'plan-' + Date.now().toString(36),
      name: name.trim(),
      eventType,
      date,
      city: city.trim(),
      guestCount: Number(guestCount),
      totalBudget: Number(totalBudget),
      durationHours: Number(durationHours) || undefined,
      setting,
      theme: theme.trim() || undefined,
      dietary: dietary.trim() || undefined,
      cultural: cultural.trim() || undefined,
      language: language.trim() || undefined,
      mustHaveActivities: mustHaveActivities.trim() || undefined,
      specialRequirements: specialRequirements.trim() || undefined,
      budgetFlexibility,
    };

    await onSubmit(inputData);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header & Presets */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-2">
              <Wand2 className="w-3.5 h-3.5 text-violet-600" />
              <span>AI Plan Generator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Plan a New Event with Planora AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Input your requirements to receive a complete, budget-balanced event plan in seconds.
            </p>
          </div>

          {/* Quick preset templates */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Quick Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('wedding')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors"
            >
              Wedding
            </button>
            <button
              type="button"
              onClick={() => applyPreset('birthday')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              Birthday
            </button>
            <button
              type="button"
              onClick={() => applyPreset('community')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              Community
            </button>
          </div>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center justify-between pt-5 px-2">
          {[
            { num: 1, title: 'Event Essentials', desc: 'Type, Date & Budget' },
            { num: 2, title: 'Style & Logistics', desc: 'Theme, Venue & Food' },
            { num: 3, title: 'Priorities & Run', desc: 'Activities & Polish' },
          ].map(s => {
            const isCurrent = step === s.num;
            const isPast = step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num === 1 || validateStep1()) {
                    setStep(s.num as any);
                  }
                }}
                className={`flex items-center gap-3 text-left transition-all ${
                  isCurrent ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                      : isPast
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isPast ? <CheckCircle className="w-4 h-4" /> : s.num}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-900">{s.title}</div>
                  <div className="text-[11px] text-slate-400">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Error notification if any */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-950">AI Plan Generation Encountered an Issue</p>
                <p className="mt-0.5 text-red-800 leading-relaxed">{error}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-red-200 flex flex-wrap items-center gap-2.5">
              <button
                type="submit"
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Retry Generation</span>
              </button>

              {onExploreSample && (
                <button
                  type="button"
                  onClick={onExploreSample}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-50 text-red-800 font-semibold text-xs transition-colors"
                >
                  Explore Sample Plan for UI Testing (Offline)
                </button>
              )}
            </div>

            <p className="text-[11px] text-red-700 italic">
              Notice: Sample plans are clearly designated as demo data and never presented as live AI-generated output.
            </p>
          </div>
        )}

        {/* STEP 1: ESSENTIALS */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Event Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Aarav & Siya's Royal Wedding"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.name
                    ? 'border-red-300 focus:ring-red-200 bg-red-50/30'
                    : 'border-slate-300 focus:border-violet-500 focus:ring-violet-200'
                }`}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
              )}
            </div>

            {/* Event Type Grid Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Event Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'wedding',
                    title: 'Wedding',
                    desc: 'Ceremonies, Mandap, Sangeet & Hospitality',
                    icon: '💍',
                  },
                  {
                    id: 'birthday',
                    title: 'Birthday Party',
                    desc: 'Milestones, Kids quests & Themed parties',
                    icon: '🎂',
                  },
                  {
                    id: 'community',
                    title: 'Community Gathering',
                    desc: 'Diwali melas, Society festivals & Fundraisers',
                    icon: '🎪',
                  },
                ].map(item => {
                  const isSelected = eventType === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setEventType(item.id as EventType)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="font-bold text-sm text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date, City, Guest Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Target Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                  />
                </div>
                {validationErrors.date && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  City / Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Jaipur, Bengaluru, Mumbai"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                  />
                </div>
                {validationErrors.city && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Estimated Guests <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="10000"
                  value={guestCount}
                  onChange={e => setGuestCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
                {validationErrors.guestCount && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.guestCount}</p>
                )}
              </div>
            </div>

            {/* Total Budget in INR with Indian formatting indicator */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Total Budget (in Indian Rupees ₹) <span className="text-red-500">*</span>
                </label>
                <div className="text-base font-extrabold text-violet-700 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  {formatINR(totalBudget)}
                </div>
              </div>

              <input
                type="number"
                min="5000"
                step="5000"
                value={totalBudget}
                onChange={e => setTotalBudget(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
              />

              {/* Quick budget chip selector */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500 font-medium">Quick values:</span>
                {[50000, 150000, 500000, 1000000, 2500000, 5000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTotalBudget(val)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-violet-400 hover:text-violet-600 transition-colors"
                  >
                    {formatINR(val)}
                  </button>
                ))}
              </div>

              {/* Real-time Budget Health Validator */}
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  budgetHealth.status === 'unrealistic'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : budgetHealth.status === 'tight'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">
                    Budget Health: {formatINR(budgetHealth.perGuest)} per guest ({budgetHealth.status.toUpperCase()})
                  </div>
                  <p className="mt-0.5 opacity-90">{budgetHealth.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREFERENCES & STYLE */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Event Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={durationHours}
                  onChange={e => setDurationHours(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Venue Setting
                </label>
                <select
                  value={setting}
                  onChange={e => setSetting(e.target.value as SettingType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                >
                  <option value="indoor">Indoor (Banquet, Hotel Hall, Clubhouse)</option>
                  <option value="outdoor">Outdoor (Lawn, Courtyard, Beachside)</option>
                  <option value="hybrid">Hybrid (Indoor Hall + Outdoor Lawn)</option>
                  <option value="any">Flexible / Open to suggestions</option>
                </select>
              </div>
            </div>

            {/* Theme / Style */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Preferred Theme / Visual Mood
              </label>
              <input
                type="text"
                value={theme}
                onChange={e => setTheme(e.target.value)}
                placeholder="e.g. Royal Marigold & Ivory, Bohemian Chic, Galactic Neon, Traditional Temple"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Leave blank if you’d like Gemini to recommend tailored themes and palettes.
              </p>
            </div>

            {/* Dietary & Catering Preferences */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Dietary & Catering Preferences
              </label>
              <textarea
                rows={2}
                value={dietary}
                onChange={e => setDietary(e.target.value)}
                placeholder="e.g. Pure Vegetarian with Jain options, live street chaat counters, regional Awadhi delicacies, gluten-free desserts"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
              />
            </div>

            {/* Cultural or Regional Background */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Cultural or Regional Preferences
                </label>
                <input
                  type="text"
                  value={cultural}
                  onChange={e => setCultural(e.target.value)}
                  placeholder="e.g. North Indian Hindu, South Indian Brahmin, Contemporary Western, Inter-cultural"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Communication Language & Tone
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  placeholder="e.g. English, Hindi, Hinglish, Marathi"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PRIORITIES & SPECIAL REQUIREMENTS */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Must-Have Activities & Highlights
              </label>
              <textarea
                rows={2}
                value={mustHaveActivities}
                onChange={e => setMustHaveActivities(e.target.value)}
                placeholder="e.g. Grand Baraat procession, sunset Varmala on stage, live acoustic Sufi music, flash mob by cousins, photo booth"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Special Requirements & Inclusivity
              </label>
              <textarea
                rows={2}
                value={specialRequirements}
                onChange={e => setSpecialRequirements(e.target.value)}
                placeholder="e.g. Wheelchair access and golf cart shuttles for senior elders, plantable seed paper invites, zero-plastic waste protocol"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
              />
            </div>

            {/* Budget Flexibility */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Budget Flexibility Policy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'strict',
                    title: 'Strict Cap',
                    desc: 'Never exceed ₹' + totalBudget.toLocaleString('en-IN') + ', emphasize low-cost alternatives.',
                  },
                  {
                    id: 'moderate',
                    title: 'Moderate (+/- 5%)',
                    desc: 'Balanced allocations with dedicated emergency contingency buffer.',
                  },
                  {
                    id: 'flexible',
                    title: 'Flexible (+10-15%)',
                    desc: 'Prioritize premium guest experiences and cinematic aesthetics.',
                  },
                ].map(opt => {
                  const isSelected = budgetFlexibility === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setBudgetFlexibility(opt.id as BudgetFlexibility)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">{opt.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{opt.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Snapshot */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800">Plan Summary Checklist:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
                <div>Event: <strong className="text-slate-900">{name || 'Unnamed'}</strong></div>
                <div>City: <strong className="text-slate-900">{city}</strong></div>
                <div>Guests: <strong className="text-slate-900">{guestCount}</strong></div>
                <div>Budget: <strong className="text-emerald-700">{formatINR(totalBudget)}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setStep((step + 1) as any);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-xs transition-colors"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-600/30 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Orchestrating Plan with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Complete Event Plan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
