import express from 'express';
import * as alunoController from '../controllers/alunoController.js';
import { validateAluno, validateObjectId } from '../middlewares/validations.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Adicionar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas protegidas
router.get('/', alunoController.getAlunos);
router.get('/:id', validateObjectId, alunoController.getAlunoById);
router.post('/', validateAluno, alunoController.createAluno);
router.put('/:id', [validateObjectId, validateAluno], alunoController.updateAluno);
router.delete('/:id', validateObjectId, alunoController.deleteAluno);


router.get('/consulta/avancada', alunoController.getAlunosAvancado);

export default router;