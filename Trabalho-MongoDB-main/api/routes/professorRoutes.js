import express from 'express'
import * as professorController from '../controllers/professorController.js'
import { validateProfessor, validateObjectId } from '../middlewares/validations.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = express.Router()

// Adicionar middleware de autenticação em todas as rotas
router.use(authMiddleware)

// Rotas protegidas
router.get('/', professorController.getProfessores)
router.get('/:id', validateObjectId, professorController.getProfessorById)
router.post('/', validateProfessor, professorController.createProfessor)
router.put('/:id', [validateObjectId, validateProfessor], professorController.updateProfessor)
router.delete('/:id', validateObjectId, professorController.deleteProfessor)

export default router