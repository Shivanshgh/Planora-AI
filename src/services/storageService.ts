import { EventPlan } from '../types/event';
import { ALL_SAMPLE_PLANS } from '../utils/sampleData';

const STORAGE_KEY = 'planora_ai_events_v1';
const ACTIVE_EVENT_KEY = 'planora_ai_active_id';

export const storageService = {
  /**
   * Retrieves all saved event plans from localStorage.
   * If local storage has never been initialized, seeds it with sample plans clearly tagged as samples.
   */
  getEvents(): EventPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Initialize with realistic samples
        this.saveAllEvents(ALL_SAMPLE_PLANS);
        return ALL_SAMPLE_PLANS;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) throw new Error('Saved event data is not a list.');
      return parsed;
    } catch {
      console.error('Saved event data was unreadable; restored sample plans.');
      this.saveAllEvents(ALL_SAMPLE_PLANS);
      return ALL_SAMPLE_PLANS;
    }
  },

  /**
   * Save array of plans into localStorage.
   */
  saveAllEvents(events: EventPlan[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (err) {
      console.error('Failed to save events to localStorage:', err);
    }
  },

  /**
   * Get a specific plan by ID
   */
  getEventById(id: string): EventPlan | undefined {
    const events = this.getEvents();
    return events.find(e => e.id === id);
  },

  /**
   * Saves or updates a plan.
   */
  saveEvent(plan: EventPlan): EventPlan {
    const events = this.getEvents();
    const updatedPlan: EventPlan = {
      ...plan,
      updatedAt: new Date().toISOString(),
    };

    const index = events.findIndex(e => e.id === plan.id);
    if (index >= 0) {
      events[index] = updatedPlan;
    } else {
      events.unshift(updatedPlan);
    }

    this.saveAllEvents(events);
    this.setActiveEventId(updatedPlan.id);
    return updatedPlan;
  },

  /**
   * Delete an event by ID
   */
  deleteEvent(id: string): boolean {
    const events = this.getEvents();
    const filtered = events.filter(e => e.id !== id);
    this.saveAllEvents(filtered);

    // If active event was deleted, clean or reset
    if (this.getActiveEventId() === id) {
      if (filtered.length > 0) {
        this.setActiveEventId(filtered[0].id);
      } else {
        localStorage.removeItem(ACTIVE_EVENT_KEY);
      }
    }
    return true;
  },

  /**
   * Duplicates an existing event plan with a new title and fresh ID.
   */
  duplicateEvent(id: string): EventPlan | null {
    const original = this.getEventById(id);
    if (!original) return null;

    const newId = 'plan-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const duplicated: EventPlan = {
      ...original,
      id: newId,
      isSample: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      input: {
        ...original.input,
        id: newId,
        name: `${original.input.name} (Copy)`,
      },
    };

    this.saveEvent(duplicated);
    return duplicated;
  },

  /**
   * Returns ID of currently selected or last viewed event.
   */
  getActiveEventId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_EVENT_KEY);
    } catch {
      return null;
    }
  },

  setActiveEventId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_EVENT_KEY, id);
    } catch (err) {
      console.error('Failed to set active event ID:', err);
    }
  },

  /**
   * Reset all plans to default samples or clear.
   */
  resetToSamples(): EventPlan[] {
    this.saveAllEvents(ALL_SAMPLE_PLANS);
    if (ALL_SAMPLE_PLANS.length > 0) {
      this.setActiveEventId(ALL_SAMPLE_PLANS[0].id);
    }
    return ALL_SAMPLE_PLANS;
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_EVENT_KEY);
  },

  /**
   * Export all plans as a downloadable JSON file.
   */
  exportData(): string {
    const events = this.getEvents();
    return JSON.stringify(events, null, 2);
  },

  /**
   * Import plans from JSON string.
   */
  importData(jsonString: string): { success: boolean; count?: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { success: false, error: 'File content must be an array of event plans' };
      }
      this.saveAllEvents(parsed);
      if (parsed.length > 0 && parsed[0].id) {
        this.setActiveEventId(parsed[0].id);
      }
      return { success: true, count: parsed.length };
    } catch (err) {
      return { success: false, error: (err as Error).message || 'Invalid JSON format' };
    }
  },
};
