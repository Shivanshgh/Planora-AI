import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { storageService } from './storageService';
import { SAMPLE_WEDDING_PLAN } from '../utils/sampleData';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

function withMemoryStorage(run: () => void): void {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
  try { run(); }
  finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
}

test('saves, updates, duplicates, and removes an event from browser storage', () => {
  withMemoryStorage(() => {
    const plan = structuredClone(SAMPLE_WEDDING_PLAN);
    plan.id = 'test-event';
    plan.input.id = plan.id;
    plan.input.name = 'Test wedding';

    storageService.saveEvent(plan);
    assert.equal(storageService.getEventById('test-event')?.input.name, 'Test wedding');
    assert.equal(storageService.getActiveEventId(), 'test-event');

    const updated = { ...plan, input: { ...plan.input, name: 'Updated wedding' } };
    storageService.saveEvent(updated);
    assert.equal(storageService.getEvents().filter(event => event.id === 'test-event').length, 1);
    assert.equal(storageService.getEventById('test-event')?.input.name, 'Updated wedding');

    const duplicate = storageService.duplicateEvent('test-event');
    assert.ok(duplicate);
    assert.notEqual(duplicate.id, 'test-event');
    assert.equal(duplicate.input.name, 'Updated wedding (Copy)');

    storageService.deleteEvent('test-event');
    assert.equal(storageService.getEventById('test-event'), undefined);
    assert.ok(storageService.getEventById(duplicate.id));
  });
});

test('exports and imports saved plans and rejects malformed JSON', () => {
  withMemoryStorage(() => {
    const plan = structuredClone(SAMPLE_WEDDING_PLAN);
    plan.id = 'round-trip-event';
    plan.input.id = plan.id;
    storageService.saveEvent(plan);

    const result = storageService.importData(storageService.exportData());
    assert.equal(result.success, true);
    assert.ok((result.count ?? 0) >= 1);
    assert.ok(storageService.getEvents().some(event => event.id === 'round-trip-event'));
    assert.equal(storageService.importData('{broken').success, false);
  });
});
