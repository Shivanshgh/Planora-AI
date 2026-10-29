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
  Share2,
  MessageCircle,
  Eye,
  FileText,
  Calendar,
  MapPin,
} from 'lucide-react';
import { PersonalizedIdeas, EventPlan } from '../../types/event';
import { formatDate } from '../../utils/formatters';

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
  const [invitePreviewMode, setInvitePreviewMode] = useState<'card' | 'whatsapp'>('card');
  const ideas = plan.ideas;

  const formattedWhatsAppText = ideas?.invitationWording
    ? `✨ *${plan.input.name}* ✨\n\n_${ideas.invitationWording.headline}_\n\n${ideas.invitationWording.body}\n\n📅 *Date:* ${formatDate(plan.input.date)}\n📍 *Location:* ${plan.input.city}\n👥 *Guest Count:* ${plan.input.guestCount} Attendees\n\n💬 *RSVP Note:* ${ideas.invitationWording.rsvpNote}\n\n— _Crafted with Planora AI_`
    : '';

  const handleCopyInvite = () => {
    if (!formattedWhatsAppText) return;
    navigator.clipboard.writeText(formattedWhatsAppText);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!formattedWhatsAppText) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedWhatsAppText)}`;
    window.open(url, '_blank');
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

      {/* Invitation Wording & Social Card Studio */}
      {ideas?.invitationWording && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-violet-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Bespoke Invitation & WhatsApp Dispatch Studio
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Formatted with bespoke headline, body text, location notes, and RSVP instructions
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Preview Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setInvitePreviewMode('card')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    invitePreviewMode === 'card'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvitePreviewMode('whatsapp')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    invitePreviewMode === 'whatsapp'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                title="Open WhatsApp with pre-filled event invitation"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via WhatsApp</span>
              </button>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopyInvite}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
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
          </div>

          {/* MODE 1: VISUAL CARD PREVIEW */}
          {invitePreviewMode === 'card' && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-md max-w-2xl mx-auto">
              <div className="relative z-10 text-center space-y-4">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold tracking-widest uppercase border border-amber-400/30">
                  <Sparkles className="w-3 h-3" />
                  <span>{plan.input.eventType} Invitation</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl sm:text-2xl font-black text-amber-200 tracking-tight">
                    {ideas.invitationWording.headline}
                  </h4>
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                    {plan.input.name}
                  </p>
                </div>

                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto" />

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-lg mx-auto whitespace-pre-line font-light italic">
                  "{ideas.invitationWording.body}"
                </p>

                {/* Event Coordinates */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-amber-200/90 font-medium">
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(plan.input.date)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{plan.input.city}</span>
                  </span>
                </div>

                {/* RSVP Note */}
                <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 font-medium">
                  {ideas.invitationWording.rsvpNote}
                </div>
              </div>

              {/* Decorative radial glows */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />
            </div>
          )}

          {/* MODE 2: WHATSAPP CHAT BUBBLE PREVIEW */}
          {invitePreviewMode === 'whatsapp' && (
            <div className="max-w-xl mx-auto bg-[#E5DDD5] p-4 sm:p-6 rounded-2xl border border-slate-300">
              <div className="bg-[#DCF8C6] text-slate-900 p-4 rounded-2xl rounded-tr-xs shadow-xs text-xs space-y-2 border border-[#C5E1A5]/60">
                <div className="font-bold text-sm text-slate-950">
                  ✨ {plan.input.name} ✨
                </div>
                <div className="font-semibold text-slate-800 italic">
                  {ideas.invitationWording.headline}
                </div>
                <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                  {ideas.invitationWording.body}
                </p>
                <div className="pt-2 border-t border-black/10 space-y-0.5 text-[11px] text-slate-700">
                  <div>📅 <strong>Date:</strong> {formatDate(plan.input.date)}</div>
                  <div>📍 <strong>Location:</strong> {plan.input.city}</div>
                  <div>👥 <strong>Guest Count:</strong> {plan.input.guestCount} Attendees</div>
                  <div className="pt-1 italic">💬 <strong>RSVP:</strong> {ideas.invitationWording.rsvpNote}</div>
                </div>
                <div className="text-[10px] text-slate-500 text-right pt-1 flex items-center justify-end gap-1">
                  <span>10:30 AM</span>
                  <span className="text-sky-600 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          )}
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
