import { onRequestPost as authPost } from '../functions/api/auth/verify';
import { onRequestPost as siteDataPost } from '../functions/api/site-data';
import { onRequestPost as uploadPost } from '../functions/api/upload-r2';
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
  GITHUB_TOKEN: 'testtoken',
  GITHUB_REPO: 'testuser/testrepo',
  TELEGRAM_BOT_TOKEN: 'testtoken',
  TELEGRAM_CHAT_ID: 'testchatid',
  ADMIN_INITIAL_PASSCODE: 'testpassword123',
  ADMIN_SESSION_SECRET: 'testsecret',
};

// Sample data
const sampleContent = {
  profile: {
    name: 'Test User',
    bio: 'Test bio',
  },
  photos: [],
  expeditions: [],
  software: [],
  resume: [],
  books: [],
  equipment: [],
  commercialCategories: [],
  travelCategories: [],
  tripCategories: [],
  gearCategories: [],
  definedTechniques: [],
  homeCategoryCards: [],
  articles: [],
  navLabels: [],
  aboutBio: '',
  aboutPage: '',
  homeShowcaseConfig: {},
};

const sampleImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const sampleEvent = {
  id: 'test-event-1',
  sessionId: 'test-session-1',
  eventType: 'page_view',
  clientTimestamp: new Date().toISOString(),
};

// Mock request objects
const mockAuthRequest = (passcode: string) => ({
  json: async () => ({ passcode }),
  headers: new Headers(),
});

const mockContentRequest = (content: unknown) => ({
  text: async () => JSON.stringify(content),
  headers: new Headers({
    'Content-Type': 'application/json',
    'Content-Length': JSON.stringify(content).length.toString(),
  }),
});

const mockUploadRequest = (dataUrl: string) => ({
  json: async () => ({ dataUrl }),
  headers: new Headers(),
});

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
async function runE2ETests() {
  // Test 1: Authentication
  const authRequest = mockAuthRequest('testpassword123');
  const authResponse = await authPost({ request: authRequest, env: testEnv });
  console.log('Test 1 - Authentication:', authResponse);

  // Test 2: Save content
  const contentRequest = mockContentRequest(sampleContent);
  const contentResponse = await siteDataPost({ request: contentRequest, env: testEnv });
  console.log('Test 2 - Save content:', contentResponse);

  // Test 3: Upload image
  const uploadRequest = mockUploadRequest(sampleImageDataUrl);
  const uploadResponse = await uploadPost({ request: uploadRequest, env: testEnv });
  console.log('Test 3 - Upload image:', uploadResponse);

  // Test 4: Record analytics event
  const eventRequest = mockEventRequest(sampleEvent);
  const eventResponse = await eventPost({ request: eventRequest, env: testEnv });
  console.log('Test 4 - Record event:', eventResponse);

  // Test 5: Generate analytics summary
  const summaryRequest = mockSummaryRequest();
  const summaryResponse = await summaryGet({ request: summaryRequest, env: testEnv });
  console.log('Test 5 - Generate summary:', summaryResponse);

  // Test 6: Send Telegram report
  const telegramRequest = mockTelegramRequest();
  const telegramResponse = await telegramPost({ request: telegramRequest, env: testEnv });
  console.log('Test 6 - Send Telegram report:', telegramResponse);
}

runE2ETests();