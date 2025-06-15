import express from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import { 
  getPlanosAlunos,
  getPlanoAlunoById,
  createPlanoAluno,
  updatePlanoAluno,
  deletePlanoAluno
} from '../controllers/planoAlunoController.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware)

// Rotas CRUD para planos-alunos
router.get('/', getPlanosAlunos)            // GET /api/plano-alunos
router.get('/:id', getPlanoAlunoById)       // GET /api/plano-alunos/:id
router.post('/', createPlanoAluno)          // POST /api/plano-alunos
router.put('/:id', updatePlanoAluno)        // PUT /api/plano-alunos/:id
router.delete('/:id', deletePlanoAluno)     // DELETE /api/plano-alunos/:id

export default router
