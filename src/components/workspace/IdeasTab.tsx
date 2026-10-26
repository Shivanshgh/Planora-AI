import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Utensils,
  PartyPopper,
  Mail,
  Copy,
  Check,
  Leaf,
  DollarSign,
  Heart,
  Wand2,
} from 'lucide-react';
import { PersonalizedIdeas, EventPlan } from '../../types/event';

interface IdeasTabProps {
  plan: EventPlan;
  onUpdateIdeas: (newIdeas: PersonalizedIdeas) => void;
  onRegenerateIdeas: () => Promise<void>;
  onOpenCreative: () => void;
  isRegenerating: boolean;
}

export const IdeasTab: React.FC<IdeasTabProps> = ({
  plan,
  onUpdateIdeas,
  onRegenerateIdeas,
  onOpenCreative,
  isRegenerating,
}) => {
  const [copiedInvite, setCopiedInvite] = useState(false);
  const ideas = plan.ideas;

  const handleCopyInvite = () => {
    if (!ideas?.invitationWording) return;
    const text = `${ideas.invitationWording.headline}\n\n${ideas.invitationWording.body}\n\n${ideas.invitationWording.rsvpNote}`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Personalized Themes & Creative Concepts
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bespoke inspiration curated for your {plan.input.guestCount} guests in {plan.input.city}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreative}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Viral Creative Twists</span>
          </button>

          <button
            onClick={onRegenerateIdeas}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>{isRegenerating ? 'Generating...' : 'AI Re-imagine'}</span>
          </button>
        </div>
      </div>

      {/* Themes and Color Palettes */}
      {ideas?.themesAndColors && ideas.themesAndColors.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-violet-600" />
            <h3 className="text-base font-bold text-slate-900">Recommended Color Palettes</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.themesAndColors.map((theme, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{theme.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{theme.description}</p>
                </div>

                {/* Color swatches */}
                <div className="flex items-center gap-2">
                  {(theme.palette || []).map((color, cIdx) => (
                    <div key={cIdx} className="flex-1 space-y-1">
                      <div
                        className="h-10 rounded-lg shadow-xs border border-black/10 transition-transform hover:scale-105"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.name} (${color.hex})`}
                      />
                      <div className="text-[10px] text-center font-mono text-slate-500 truncate">
                        {color.hex}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column: Decor & Catering */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decor & Aesthetics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>Decorations & Atmosphere</span>
          </h3>
          <ul className="space-y-2.5">
            {(ideas?.decorations || []).map((dec, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                <span>{dec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Food & Refreshments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <span>Food, Catering & Refreshments</span>
          </h3>
          <ul className="space-y-2.5">
            {(ideas?.foodAndRefreshments || []).map((food, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <span>{food}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 2-Column: Activities & Guest Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activities & Entertainment */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-amber-600" />
            <span>Activities & Entertainment</span>
          </h3>
          <ul className="space-y-2.5">
            {(ideas?.activitiesAndEntertainment || []).map((act, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Guest Experiences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-600" />
            <span>Memorable Guest Touchpoints</span>
          </h3>
          <ul className="space-y-2.5">
            {(ideas?.guestExperiences || []).map((exp, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0 mt-1.5" />
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Invitation Wording Card */}
      {ideas?.invitationWording && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-violet-700" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Curated Invitation Copy (Ready for WhatsApp / Card)
              </h3>
            </div>
            <button
              onClick={handleCopyInvite}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-violet-200 text-violet-700 hover:bg-violet-100/80 font-semibold text-xs transition-colors shadow-2xs"
            >
              {copiedInvite ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-violet-100 space-y-2">
            <div className="font-bold text-sm text-slate-900">
              {ideas.invitationWording.headline}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {ideas.invitationWording.body}
            </p>
            <div className="text-[11px] text-violet-800 font-medium italic pt-1 border-t border-violet-100">
              {ideas.invitationWording.rsvpNote}
            </div>
          </div>
        </div>
      )}

      {/* 2-Column: Low-Cost Alternatives & Eco-Friendly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low-Cost Alternatives */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Clever Cost-Saving Hacks</span>
          </h3>
          <ul className="space-y-2.5">
            {(ideas?.lowCostAlternatives || []).map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Eco-Friendly */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-teal-600" />
            <span>Sustainable & Zero-Waste Ideas</span>
          </h3>
          <ul className="space-y-2.5">
            {(ideas?.ecoFriendlyOptions || []).map((eco, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                <span>{eco}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
