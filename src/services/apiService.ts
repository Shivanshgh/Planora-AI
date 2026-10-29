import type { EventInput, EventPlan } from '../types/event';

export interface BudgetOptimizationResult {
  strategicAdvice: string;
  quickWins: string[];
  recommendedBudget: Array<{
    category: string;
    proposedAmount: number;
    savingsAmount: number;
    rational: string;
  }>;
}

export interface CreativeIdeasResult {
  themeConcept: string;
  signatureGuestExperiences: string[];
  viralPhotoMoments: string[];
  culinaryTwists: string[];
  personalizedSurprises: string[];
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function requestJSON<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('The server returned an unreadable response. Please retry.', response.status);
  }

  if (!response.ok) {
    const payload = typeof data === 'object' && data !== null ? data as { error?: unknown; details?: unknown } : {};
    const message = typeof payload.error === 'string' ? payload.error : 'The request could not be completed.';
    throw new ApiError(message, response.status, payload.details);
  }

  return data as T;
}

export interface HealthStatus {
  status: string;
  hasKey: boolean;
  model: string;
}

export const apiService = {
  /**
   * Check server health and API key readiness
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      return await requestJSON<HealthStatus>('/api/health');
    } catch {
      return { status: 'offline', hasKey: false, model: 'gemini-3.8-flash' };
    }
  },

  /**
   * Request full AI Event Plan from server
   */
  async generatePlan(input: EventInput): Promise<EventPlan> {
    return requestJSON<EventPlan>('/api/events/generate', input);
  },

  /**
   * Regenerate a single section
   */
  async regenerateSection(
    eventInput: EventInput,
    section: 'budget' | 'timeline' | 'checklist' | 'ideas' | 'risks',
    instruction?: string
  ): Promise<unknown> {
    const response = await requestJSON<{ data: unknown }>('/api/events/regenerate-section', { eventInput, section, instruction });
    return response.data;
  },

  /**
   * Propose cost savings and budget optimization
   */
  async optimizeBudget(plan: EventPlan, targetSavingsPercent: number = 15): Promise<BudgetOptimizationResult> {
    return requestJSON<BudgetOptimizationResult>('/api/events/optimize-budget', { plan, targetSavingsPercent });
  },

  /**
   * Propose creative twists & signature experiences
   */
  async makeCreative(plan: EventPlan, focusArea: 'all' | 'guest-experience' | 'culinary' | 'visual-decor' = 'all'): Promise<CreativeIdeasResult> {
    return requestJSON<CreativeIdeasResult>('/api/events/make-creative', { plan, focusArea });
  },

  /**
   * Query contextual assistant
   */
  async askAssistant(
    plan: EventPlan | null,
    messages: { sender: 'user' | 'assistant'; text: string }[],
    userQuestion: string
  ): Promise<string> {
    const response = await requestJSON<{ reply: string }>('/api/events/assistant', { plan, messages, userQuestion });
    return response.reply;
  },
};
