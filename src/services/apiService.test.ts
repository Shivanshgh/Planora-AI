import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ApiError, apiService } from './apiService';

async function withMockFetch(mock: typeof fetch, run: () => Promise<void>): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock;
  try { await run(); }
  finally { globalThis.fetch = originalFetch; }
}

test('returns API status and safe validation details for failed generation', async () => {
  await withMockFetch(async () => new Response(JSON.stringify({
    error: 'Invalid request data.',
    details: [{ path: ['name'], message: 'Event name is required.' }],
  }), { status: 400, headers: { 'Content-Type': 'application/json' } }), async () => {
    await assert.rejects(
      apiService.generatePlan({
        id: 'test', name: 'Test event', eventType: 'birthday', date: '2026-12-01', city: 'Pune', guestCount: 10, totalBudget: 10000,
      }),
      error => error instanceof ApiError && error.status === 400 && error.message === 'Invalid request data.' && Array.isArray(error.details)
    );
  });
});

test('reports unreadable server responses without exposing response contents', async () => {
  await withMockFetch(async () => new Response('<html>proxy error</html>', { status: 502 }), async () => {
    const health = await apiService.checkHealth();
    assert.equal(health.status, 'offline');

    await assert.rejects(
      apiService.askAssistant(null, [], 'Help me plan'),
      error => error instanceof ApiError && error.status === 502 && error.message === 'The server returned an unreadable response. Please retry.'
    );
  });
});
