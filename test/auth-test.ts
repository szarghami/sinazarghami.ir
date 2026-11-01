import { onRequestPost } from '../functions/api/auth/verify';

// Test environment with initial passcode
const testEnv = {
  ADMIN_INITIAL_PASSCODE: 'testpassword123',
  ADMIN_SESSION_SECRET: 'testsecret',
};

// Mock request object
const mockRequest = (passcode: string) => ({
  json: async () => ({ passcode }),
  headers: new Headers(),
});

// Test cases
async function runAuthTests() {
  // Test 1: Successful authentication with initial passcode
  const successRequest = mockRequest('testpassword123');
  const successResponse = await onRequestPost({ request: successRequest, env: testEnv });
  console.log('Test 1 - Successful auth:', successResponse);

  // Test 2: Failed authentication with wrong passcode
  const failRequest = mockRequest('wrongpassword');
  const failResponse = await onRequestPost({ request: failRequest, env: testEnv });
  console.log('Test 2 - Failed auth:', failResponse);

  // Test 3: Authentication with empty passcode
  const emptyRequest = mockRequest('');
  const emptyResponse = await onRequestPost({ request: emptyRequest, env: testEnv });
  console.log('Test 3 - Empty passcode:', emptyResponse);

  // Test 4: Authentication without initial passcode
  const noInitialRequest = mockRequest('testpassword123');
  const noInitialResponse = await onRequestPost({ request: noInitialRequest, env: { ...testEnv, ADMIN_INITIAL_PASSCODE: undefined } });
  console.log('Test 4 - No initial passcode:', noInitialResponse);
}

runAuthTests();