import { AuthService } from '../lib/auth';

async function testAuth() {
  try {
    console.log('Testing JWT Authentication...\n');

    // Test JWT secrets
    console.log('1. Checking JWT secrets...');
    console.log('JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET ? 'Set' : 'Missing');
    console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'Set' : 'Missing');

    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('❌ JWT secrets are missing! Please set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in your environment.');
      return;
    }

    // Test token generation and verification
    console.log('\n2. Testing JWT generation and verification...');
    const testPayload = {
      userId: 'test-user-id',
      username: 'testuser',
      role: 'USER',
    };

    const accessToken = AuthService.generateAccessToken(testPayload);
    console.log('Generated access token:', accessToken.substring(0, 20) + '...');

    try {
      const verified = AuthService.verifyAccessToken(accessToken);
      console.log('✅ Token verification successful:', verified);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
    }

    console.log('\n✅ JWT Authentication test completed');
  } catch (error) {
    console.error('❌ JWT Authentication test failed:', error);
  }
}

// Run the test
testAuth()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 