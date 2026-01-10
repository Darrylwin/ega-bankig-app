export default async function handler(req, res) {
  // Active CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Gère les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, body, headers, url } = req;
  
  // Récupère le chemin après /api/
  const path = url.replace('/api', '');
  
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
    
    // Copie les headers de la réponse
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
}