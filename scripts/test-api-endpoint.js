// Using built-in fetch (Node.js 18+)

async function testAPIEndpoint() {
  try {
    console.log('🔄 Testing API Endpoint: /api/auth/users');
    
    const API_BASE = 'http://localhost:3001';
    const response = await fetch(`${API_BASE}/api/auth/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock token for testing
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response received:');
      console.log(`   Success: ${data.success}`);
      console.log(`   Count: ${data.count}`);
      console.log(`   Users: ${data.users ? data.users.length : 0} users`);
      
      if (data.users && data.users.length > 0) {
        console.log('\n📋 Users in response:');
        data.users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name} (${user.email})`);
          console.log(`      Role: ${user.role}, Approved: ${user.isApproved}, Active: ${user.isActive}`);
        });

        // Check for pending users
        const pending = data.users.filter((user) => 
          ['sales-executive', 'customer-executive', 'executive'].includes(user.role) && 
          user.isApproved === false
        );
        console.log(`\n📋 Pending users: ${pending.length}`);
        pending.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        });
      }
    } else {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`❌ Error response: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Error testing API endpoint:', error.message);
    console.log('💡 Make sure the development server is running on localhost:3001');
  }
}

testAPIEndpoint();
