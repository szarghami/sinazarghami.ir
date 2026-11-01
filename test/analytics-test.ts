import { onRequestPost as eventPost } from '../analytics/event';
import { onRequestGet as summaryGet } from '../analytics/summary';
import { onRequestPost as telegramPost } from '../analytics/send-telegram-report';

// Test environment
const testEnv = {
  DB: {
    prepare: (query: string) => ({
      bind: (...values: unknown[]) => ({
        run: async () => ({}),
        first: async () => ({ window_started: 0, request_count: 0 }),
        all: async () => ({ results: [] }),
      }),
    }),
  },
  TELEGRAM_BOT_TOKEN: 'testtoken',
  TELEGRAM_CHAT_ID: 'testchatid',
};

// Sample event data
const sampleEvent = {
  id: 'test-event-1',
  sessionId: 'test-session-1',
  eventType: 'page_view',
  clientTimestamp: new Date().toISOString(),
};

// Mock request objects
const mockEventRequest = (event: unknown) => ({
  text: async () => JSON.stringify(event),
  headers: new Headers({
    'CF-Connecting-IP': '127.0.0.1',
  }),
});

const mockSummaryRequest = () => ({
  headers: new Headers(),
});

const mockTelegramRequest = () => ({
  headers: new Headers(),
});

// Test cases
async function runAnalyticsTests() {
  // Test 1: Record analytics event
  const eventRequest = mockEventRequest(sampleEvent);
  const eventResponse = await eventPost({ request: eventRequest, env: testEnv });
  console.log('Test 1 - Record event:', eventResponse);

  // Test 2: Generate analytics summary
  const summaryRequest = mockSummaryRequest();
  const summaryResponse = await summaryGet({ request: summaryRequest, env: testEnv });
  console.log('Test 2 - Generate summary:', summaryResponse);

  // Test 3: Send Telegram report
  const telegramRequest = mockTelegramRequest();
  const telegramResponse = await telegramPost({ request: telegramRequest, env: testEnv });
  console.log('Test 3 - Send Telegram report:', telegramResponse);

  // Test 4: Record event with rate limiting
  const rateLimitRequest = mockEventRequest(sampleEvent);
  const rateLimitResponse = await eventPost({ request: rateLimitRequest, env: { ...testEnv, DB: { prepare: () => ({ bind: () => ({ first: async () => ({ window_started: Math.floor(Date.now() / 1000), request_count: 40 }) }) }) } } });
  console.log('Test 4 - Rate limiting:', rateLimitResponse);

  // Test 5: Send Telegram report without credentials
  const noTelegramRequest = mockTelegramRequest();
  const noTelegramResponse = await telegramPost({ request: noTelegramRequest, env: { ...testEnv, TELEGRAM_BOT_TOKEN: undefined, TELEGRAM_CHAT_ID: undefined } });
  console.log('Test 5 - Missing Telegram credentials:', noTelegramResponse);
}

runAnalyticsTests();