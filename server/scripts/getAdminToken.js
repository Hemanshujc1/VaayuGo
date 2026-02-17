async function getToken() {
  try {
    const res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@vaayugo.com',
        password: 'admin123'
      })
    });
    
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    console.log(data.token);
  } catch (err) {
    console.error(err.message);
  }
}

getToken();
