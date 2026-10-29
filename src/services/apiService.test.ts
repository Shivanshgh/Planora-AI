import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ApiError, apiService, requestJSON } from './apiService';

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

test('returns parsed data for successful API requests', async () => {
  await withMockFetch(async () => new Response(JSON.stringify({ reply: 'A practical plan.' }), { status: 200 }), async () => {
    assert.deepEqual(await requestJSON('/api/test'), { reply: 'A practical plan.' });
  });
});

test('maps network timeouts to a retryable API error', async () => {
  await withMockFetch((_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  }), async () => {
    await assert.rejects(requestJSON('/api/test', undefined, 5), error =>
      error instanceof ApiError && error.status === 408 && error.message.includes('too long')
    );
  });
});

test('returns a safe message for server errors', async () => {
  await withMockFetch(async () => new Response(JSON.stringify({ error: 'Service unavailable.' }), { status: 503 }), async () => {
    await assert.rejects(requestJSON('/api/test'), error =>
      error instanceof ApiError && error.status === 503 && error.message === 'Service unavailable.'
    );
  });
});
