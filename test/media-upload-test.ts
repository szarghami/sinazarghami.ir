import { onRequestPost as uploadPost } from '../functions/api/upload-r2';
import { uploadImageToGitHub } from '../src/utils/githubMediaService';

// Test environment
const testEnv = {
  GITHUB_TOKEN: 'testtoken',
  GITHUB_REPO: 'testuser/testrepo',
};

// Sample image data URL
const sampleImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// Mock request object
const mockUploadRequest = (dataUrl: string) => ({
  json: async () => ({ dataUrl }),
  headers: new Headers(),
});

// Test cases
async function runMediaUploadTests() {
  // Test 1: Upload image to R2
  const r2Request = mockUploadRequest(sampleImageDataUrl);
  const r2Response = await uploadPost({ request: r2Request, env: testEnv });
  console.log('Test 1 - Upload to R2:', r2Response);

  // Test 2: Upload image to GitHub
  const githubResponse = await uploadImageToGitHub(sampleImageDataUrl, testEnv);
  console.log('Test 2 - Upload to GitHub:', githubResponse);

  // Test 3: Upload invalid image data
  const invalidRequest = mockUploadRequest('invalid-data-url');
  const invalidResponse = await uploadPost({ request: invalidRequest, env: testEnv });
  console.log('Test 3 - Invalid image data:', invalidResponse);

  // Test 4: Upload without GitHub token
  const noTokenResponse = await uploadImageToGitHub(sampleImageDataUrl, { ...testEnv, GITHUB_TOKEN: undefined });
  console.log('Test 4 - Missing GitHub token:', noTokenResponse);
}

runMediaUploadTests();