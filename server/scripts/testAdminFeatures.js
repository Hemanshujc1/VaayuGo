async function testEndpoints() {
  try {
    // 1. Get Token
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@vaayugo.com', password: 'admin123' })
    });
    
    if (!loginRes.ok) throw new Error('Login failed');
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Token acquired.');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Test Analytics
    console.log('Testing Analytics...');
    const analyticsRes = await fetch('http://localhost:5001/api/admin/analytics', { headers });
    console.log('Analytics Status:', analyticsRes.status);
    const analyticsData = await analyticsRes.json();
    console.log('Analytics Data:', JSON.stringify(analyticsData, null, 2));

    // 3. Test Penalties
    console.log('Testing Penalties...');
    const penaltiesRes = await fetch('http://localhost:5001/api/admin/penalties', { headers });
    console.log('Penalties Status:', penaltiesRes.status);
    const penaltiesData = await penaltiesRes.json();
    console.log('Penalties Data:', JSON.stringify(penaltiesData, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testEndpoints();
