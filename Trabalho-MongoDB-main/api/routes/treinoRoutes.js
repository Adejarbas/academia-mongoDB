import express from 'express'
import * as treinoController from '../controllers/treinoController.js'
import { validateTreino, validateObjectId } from '../middlewares/validations.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = express.Router()

// Adicionar middleware de autenticação em todas as rotas
router.use(authMiddleware)

// Rotas protegidas
router.get('/', treinoController.getTreinos)
router.get('/:id', validateObjectId, treinoController.getTreinoById)
router.post('/', validateTreino, treinoController.createTreino)
router.put('/:id', [validateObjectId, validateTreino], treinoController.updateTreino)
router.delete('/:id', validateObjectId, treinoController.deleteTreino)

export default router