import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectToDatabase } from './config/db.js'
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

// Rota raiz para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'))
})

// Suas rotas de API
app.use('/alunos', alunoRoutes)
app.use('/professores', professorRoutes)
app.use('/treinos', treinoRoutes)
app.use('/planos', planoRoutes)

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