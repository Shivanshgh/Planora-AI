import React, { useRef, useState } from 'react';
import {
  X,
  Wand2,
  Sparkles,
  Loader2,
  Camera,
  Utensils,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { EventPlan, PersonalizedIdeas } from '../../types/event';
import { apiService } from '../../services/apiService';
import type { CreativeIdeasResult } from '../../services/apiService';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';

interface MakeCreativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: EventPlan;
  onAppendIdeas: (updatedIdeas: PersonalizedIdeas) => void;
}

export const MakeCreativeModal: React.FC<MakeCreativeModalProps> = ({
  isOpen,
  onClose,
  plan,
  onAppendIdeas,
}) => {
  const [focusArea, setFocusArea] = useState<'all' | 'guest-experience' | 'culinary' | 'visual-decor'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CreativeIdeasResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  useDialogAccessibility(isOpen, dialogRef, onClose);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.makeCreative(plan, focusArea);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate creative concepts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppend = () => {
    if (!result) return;

    const current = plan.ideas || {
      themesAndColors: [],
      decorations: [],
      foodAndRefreshments: [],
      activitiesAndEntertainment: [],
      guestExperiences: [],
      invitationWording: { headline: '', body: '', rsvpNote: '' },
      lowCostAlternatives: [],
      ecoFriendlyOptions: [],
    };

    const updated: PersonalizedIdeas = {
      ...current,
      decorations: [
        ...(current.decorations || []),
        ...(result.viralPhotoMoments || []),
      ],
      foodAndRefreshments: [
        ...(current.foodAndRefreshments || []),
        ...(result.culinaryTwists || []),
      ],
      guestExperiences: [
        ...(current.guestExperiences || []),
        ...(result.signatureGuestExperiences || []),
        ...(result.personalizedSurprises || []),
      ],
    };

    onAppendIdeas(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="creative-dialog-title" className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-violet-950 via-indigo-900 to-purple-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs">
              <Wand2 className="w-5 h-5 text-violet-100" />
            </div>
            <div>
              <h3 id="creative-dialog-title" className="font-bold text-base text-white">Make It More Creative</h3>
              <p className="text-xs text-violet-200">
                AI brainstorm engine for immersive twists, viral photo corners, and culinary spectacles
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close creative ideas"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Controls */}
          <div className="bg-violet-50/60 p-4 rounded-xl border border-violet-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-violet-950 uppercase tracking-wider" id="creative-focus-label">
                Select Creative Focus:
              </span>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Igniting Imagination...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Creative Twists</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="creative-focus-label">
              {[
                { id: 'all', label: 'All Dimensions' },
                { id: 'guest-experience', label: 'Guest Touchpoints' },
                { id: 'culinary', label: 'Culinary & Bar' },
                { id: 'visual-decor', label: 'Instagrammable Decor' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={focusArea === opt.id}
                  onClick={() => setFocusArea(opt.id as typeof focusArea)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    focusArea === opt.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-white text-slate-700 border border-violet-200 hover:bg-violet-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-5">
              {/* Concept */}
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
                  Concept Evolution
                </span>
                <p className="text-sm font-semibold mt-1 text-slate-100">
                  "{result.themeConcept}"
                </p>
              </div>

              {/* Signature Guest Experiences */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-pink-500" />
                  <span>Signature Guest Experiences</span>
                </h4>
                <div className="space-y-2">
                  {result.signatureGuestExperiences.map((exp, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      {exp}
                    </div>
                  ))}
                </div>
              </div>

              {/* Viral Photo Moments */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Viral Photo & Video Moments</span>
                </h4>
                <div className="space-y-2">
                  {result.viralPhotoMoments.map((photo, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      {photo}
                    </div>
                  ))}
                </div>
              </div>

              {/* Culinary Twists */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Interactive Culinary Twists</span>
                </h4>
                <div className="space-y-2">
                  {result.culinaryTwists.map((culinary, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      {culinary}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          {result && (
            <button
              onClick={handleAppend}
              className="inline-flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Add These Ideas to My Plan</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
