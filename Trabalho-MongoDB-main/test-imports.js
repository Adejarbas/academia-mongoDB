import express from 'express';
import { authMiddleware } from './api/middlewares/auth.js';
import { 
  getPlanosAlunos,
  getPlanoAlunoById,
  createPlanoAluno,
  updatePlanoAluno,
  deletePlanoAluno
} from './api/controllers/planoAlunoController.js';

console.log('✅ Todas as importações foram bem-sucedidas!');
console.log('✅ Middleware auth:', typeof authMiddleware);
console.log('✅ getPlanosAlunos:', typeof getPlanosAlunos);
console.log('✅ getPlanoAlunoById:', typeof getPlanoAlunoById);
console.log('✅ createPlanoAluno:', typeof createPlanoAluno);
console.log('✅ updatePlanoAluno:', typeof updatePlanoAluno);
console.log('✅ deletePlanoAluno:', typeof deletePlanoAluno);
