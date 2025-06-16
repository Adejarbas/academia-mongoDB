import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import swaggerUi from 'swagger-ui-express'
import { connectToDatabase } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import alunoRoutes from './routes/alunoRoutes.js'
import professorRoutes from './routes/professorRoutes.js'
import treinoRoutes from './routes/treinoRoutes.js'
import planoRoutes from './routes/planoRoutes.js'
import planoAlunoRoutes from './routes/planoAlunoRoutes.js'

const app = express()

// Verificar se está em produção (Vercel)
const isProduction = process.env.NODE_ENV === 'production'

// Configuração CORS
if (isProduction) {
  // CORS mais permissivo para produção no Vercel
  app.use(cors({
    origin: function (origin, callback) {
      // Permite qualquer origem .vercel.app ou sem origem (para apps mobile)
      if (!origin || origin.includes('.vercel.app')) {
        callback(null, true)
      } else {
        callback(null, true) // Temporariamente permissivo para debug
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))
} else {
  // CORS permissivo para desenvolvimento
  app.use(cors())
}

app.use(express.json())

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - ${new Date().toISOString()}`)
  console.log('📋 Headers:', req.headers)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body)
  }
  next()
})

// Caminho absoluto para a pasta public
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicPath = path.join(__dirname, '../public')

// Debug
console.log('📁 Current directory:', __dirname)
console.log('🌍 Environment:', process.env.NODE_ENV)
console.log('🏭 Is Production:', isProduction)

if (!isProduction) {
  console.log('📁 Public path:', publicPath)
  console.log('📁 Public path exists:', fs.existsSync(publicPath))
}

// Configuração do Swagger
let swaggerDocument
try {
  // Importar o arquivo JSON gerado pelo swagger-autogen
  const swaggerFile = await import('../swagger-output.json', { assert: { type: 'json' } })
  swaggerDocument = swaggerFile.default
} catch (error) {
  console.log('⚠️ Arquivo swagger-output.json não encontrado. Execute: npm run swagger')
}

// Configurar Swagger UI
if (swaggerDocument) {
  const swaggerOptions = {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #2c3e50; }
    `,
    customSiteTitle: '🏋️‍♂️ Academia MongoDB API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  }
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions))
  console.log('📚 Swagger UI configurado em /api-docs')
}

// Configuração diferente para desenvolvimento e produção
if (isProduction) {
  // Em produção (Vercel), apenas rota da API
  app.get('/', (req, res) => {
    // #swagger.ignore = true
    console.log('🏠 API Root accessed (Production)')
    res.json({ 
      message: 'Academia MongoDB API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        alunos: '/api/alunos',
        professores: '/api/professores',
        treinos: '/api/treinos',
        planos: '/api/planos',
        planoAlunos: '/api/plano-alunos',
        docs: '/api-docs'
      }
    })
  })
} else {
  // Em desenvolvimento, servir arquivos estáticos
  console.log('🏠 Configurando arquivos estáticos para desenvolvimento')
  
  // Rota raiz para servir home.html como página principal
  app.get('/', (req, res) => {
    // #swagger.ignore = true
    console.log('🏠 Servindo home.html para rota raiz')
    res.sendFile(path.join(publicPath, 'home.html'))
  })

  // Servir arquivos estáticos (HTML, CSS, JS, imagens) - SEM index automático
  // #swagger.ignore = true
  app.use(express.static(publicPath, { index: false }))
}

// Suas rotas de API
app.use('/api/auth', authRoutes)
app.use('/api/alunos', alunoRoutes)
app.use('/api/professores', professorRoutes)
app.use('/api/treinos', treinoRoutes)
app.use('/api/planos', planoRoutes)
app.use('/api/plano-alunos', planoAlunoRoutes)

// Rota de health check para debug
app.get('/api/health', (req, res) => {
  // #swagger.ignore = true
  console.log('🩺 Health check acessado')
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'API funcionando corretamente'
  })
})

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
  try {
    // Debug detalhado para Vercel
    console.log('🔍 Vercel Handler - Método:', req.method)
    console.log('🔍 Vercel Handler - URL:', req.url)
    console.log('🔍 Vercel Handler - Headers:', JSON.stringify(req.headers, null, 2))
    
    if (!isConnected) {
      console.log('🔌 Conectando ao MongoDB...')
      await connectToDatabase()
      isConnected = true
      console.log('✅ MongoDB conectado com sucesso!')
    }
    
    // Processar requisição através do Express
    app(req, res)
  } catch (error) {
    console.error('❌ Erro no handler do Vercel:', error)
    res.status(500).json({ 
      error: true, 
      message: 'Erro de conexão com o banco de dados',
      details: error.message 
    })
  }
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