import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

// Rota de teste simples sem autenticação
app.get('/api/plano-alunos', (req, res) => {
  console.log('✅ Rota /api/plano-alunos foi chamada!');
  res.json({ 
    success: true, 
    message: 'Teste da rota plano-alunos funcionando!',
    timestamp: new Date()
  });
});

// Rota de teste para comparação
app.get('/api/test', (req, res) => {
  res.json({ message: 'Teste básico funcionando!' });
});

const PORT = 3001; // Porta diferente para não conflitar
app.listen(PORT, () => {
  console.log(`🧪 Servidor de teste rodando na porta ${PORT}`);
  console.log(`🔗 Teste: http://localhost:${PORT}/api/plano-alunos`);
  console.log(`🔗 Teste básico: http://localhost:${PORT}/api/test`);
});
