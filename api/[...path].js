export default async function handler(req, res) {
  const { method, body, headers } = req;
  
  // Récupère le chemin après /api/
  const path = req.url.replace('/api', '');
  
  // URL de ton API sur Skybots
  const targetUrl = `http://89.187.7.35:25577/api${path}`;
  
  console.log(`🔄 Proxying ${method} ${targetUrl}`);
  
  try {
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(headers.authorization && { 
          'Authorization': headers.authorization 
        })
      }
    };
    
    // Ajoute le body seulement pour POST, PUT, PATCH
    if (method !== 'GET' && method !== 'HEAD' && body) {
      fetchOptions.body = JSON.stringify(body);
    }
    
    const response = await fetch(targetUrl, fetchOptions);
    
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
}