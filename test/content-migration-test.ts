import { onRequestPost as siteDataPost } from '../functions/api/site-data';
import { onRequestGet as siteDataGet } from '../functions/api/site-data';

// Test environment
const testEnv = {
  DB: {
    prepare: (query: string) => ({
      bind: (...values: unknown[]) => ({
        run: async () => ({}),
        first: async () => ({ value: '{}' }),
        all: async () => ({ results: [] }),
      }),
    }),
  },
  GITHUB_TOKEN: 'testtoken',
};

// Sample content
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

// Mock request objects
const mockPostRequest = (content: unknown) => ({
  text: async () => JSON.stringify(content),
  headers: new Headers({
    'Content-Type': 'application/json',
    'Content-Length': JSON.stringify(content).length.toString(),
  }),
});

const mockGetRequest = () => ({
  headers: new Headers(),
});

// Test cases
async function runContentMigrationTests() {
  // Test 1: Save content
  const saveRequest = mockPostRequest(sampleContent);
  const saveResponse = await siteDataPost({ request: saveRequest, env: testEnv });
  console.log('Test 1 - Save content:', saveResponse);

  // Test 2: Retrieve content
  const getRequest = mockGetRequest();
  const getResponse = await siteDataGet({ request: getRequest, env: testEnv });
  console.log('Test 2 - Retrieve content:', getResponse);

  // Test 3: Save content with invalid structure
  const invalidContent = { invalid: 'structure' };
  const invalidRequest = mockPostRequest(invalidContent);
  const invalidResponse = await siteDataPost({ request: invalidRequest, env: testEnv });
  console.log('Test 3 - Invalid content structure:', invalidResponse);

  // Test 4: Save content with missing GitHub token
  const noTokenRequest = mockPostRequest(sampleContent);
  const noTokenResponse = await siteDataPost({ request: noTokenRequest, env: { ...testEnv, GITHUB_TOKEN: undefined } });
  console.log('Test 4 - Missing GitHub token:', noTokenResponse);
}

runContentMigrationTests();