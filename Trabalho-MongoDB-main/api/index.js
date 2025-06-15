import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectToDatabase } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import alunoRoutes from './routes/alunoRoutes.js'
import professorRoutes from './routes/professorRoutes.js'
import treinoRoutes from './routes/treinoRoutes.js'
import planoRoutes from './routes/planoRoutes.js'

const app = express()
app.use(cors())
app.use(express.json())

// Caminho absoluto para a pasta public
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicPath = path.join(__dirname, '../public')

// Servir arquivos estáticos (HTML, CSS, JS, imagens)
app.use(express.static(publicPath))

// Rota raiz para servir home.html como página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'home.html'))
})

// Suas rotas de API
app.use('/api/auth', authRoutes)
app.use('/api/alunos', alunoRoutes)
app.use('/api/professores', professorRoutes)
app.use('/api/treinos', treinoRoutes)
app.use('/api/planos', planoRoutes)

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: true,
    message: 'Erro interno do servidor',
    details: err.message
  })
})

// Handler para Vercel
let isConnected = false
export default async function handler(req, res) {
  if (!isConnected) {
    await connectToDatabase()
    isConnected = true
  }
  app(req, res)
}

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000
  
  connectToDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`)
      console.log(`📱 Acesse: http://localhost:${PORT}/home.html`)
    })
  }).catch(error => {
    console.error('❌ Erro ao iniciar servidor:', error)
    process.exit(1)
  })
}