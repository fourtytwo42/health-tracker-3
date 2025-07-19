const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Testing authentication...\n');
    
    // Check if we have users in the database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      }
    });
    
    console.log(`📊 Found ${users.length} users in database:`);
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - ${user.email}`);
    });
    
    if (users.length === 0) {
      console.log('\n❌ No users found in database');
      return;
    }
    
    // Test JWT token generation
    const testUser = users[0];
    console.log(`\n🧪 Testing JWT for user: ${testUser.username}`);
    
    if (!process.env.JWT_ACCESS_SECRET) {
      console.log('❌ JWT_ACCESS_SECRET not configured');
      return;
    }
    
    // Generate a test token
    const payload = {
      userId: testUser.id,
      username: testUser.username,
      role: testUser.role,
    };
    
    const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '7d',
    });
    
    console.log(`✅ Generated token: ${token.substring(0, 50)}...`);
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      console.log(`✅ Token verified successfully:`);
      console.log(`   - userId: ${decoded.userId}`);
      console.log(`   - username: ${decoded.username}`);
      console.log(`   - role: ${decoded.role}`);
    } catch (error) {
      console.log(`❌ Token verification failed: ${error.message}`);
    }
    
    // Test the /api/auth/me endpoint
    console.log('\n🌐 Testing /api/auth/me endpoint...');
    const response = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ /api/auth/me successful:`);
      console.log(`   - user: ${data.user.username} (${data.user.role})`);
    } else {
      const error = await response.text();
      console.log(`❌ /api/auth/me failed: ${response.status} - ${error}`);
    }
    
  } catch (error) {
    console.error('Error testing auth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth(); 