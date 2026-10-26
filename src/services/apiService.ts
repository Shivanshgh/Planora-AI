import { EventInput, EventPlan } from '../types/event';

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
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`Healthcheck failed: ${res.statusText}`);
      return await res.json();
    } catch {
      return { status: 'offline', hasKey: false, model: 'gemini-3.8-flash' };
    }
  },

  /**
   * Request full AI Event Plan from server
   */
  async generatePlan(input: EventInput): Promise<EventPlan> {
    const res = await fetch('/api/events/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.error || 'Failed to generate event plan';
      const errorObj = new Error(msg);
      (errorObj as any).status = res.status;
      (errorObj as any).details = data.details;
      throw errorObj;
    }

    return data as EventPlan;
  },

  /**
   * Regenerate a single section
   */
  async regenerateSection(
    eventInput: EventInput,
    section: 'budget' | 'timeline' | 'checklist' | 'ideas' | 'risks',
    instruction?: string
  ): Promise<any> {
    const res = await fetch('/api/events/regenerate-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventInput, section, instruction }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Failed to regenerate ${section}`);
    }

    return data.data;
  },

  /**
   * Propose cost savings and budget optimization
   */
  async optimizeBudget(plan: EventPlan, targetSavingsPercent: number = 15): Promise<any> {
    const res = await fetch('/api/events/optimize-budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, targetSavingsPercent }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to optimize budget');
    }

    return data;
  },

  /**
   * Propose creative twists & signature experiences
   */
  async makeCreative(plan: EventPlan, focusArea: string = 'all'): Promise<any> {
    const res = await fetch('/api/events/make-creative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, focusArea }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to generate creative concepts');
    }

    return data;
  },

  /**
   * Query contextual assistant
   */
  async askAssistant(
    plan: EventPlan | null,
    messages: { sender: string; text: string }[],
    userQuestion: string
  ): Promise<string> {
    const res = await fetch('/api/events/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, messages, userQuestion }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Assistant failed to answer');
    }

    return data.reply;
  },
};
