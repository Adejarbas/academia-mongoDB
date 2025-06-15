import express from 'express';

const router = express.Router();

// Rota de status da API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API da Academia funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota de health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

export default router;