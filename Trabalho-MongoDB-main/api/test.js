// Arquivo de teste para verificar se a API está funcionando no Vercel
export default function handler(req, res) {
  return res.json({
    message: 'API Test funcionando!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  })
}
