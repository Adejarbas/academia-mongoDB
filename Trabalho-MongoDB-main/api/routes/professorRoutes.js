import express from 'express'
import * as professorController from '../controllers/professorController.js'
import { validateProfessor, validateObjectId } from '../middlewares/validations.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = express.Router()

// Adicionar middleware de autenticação em todas as rotas
// #swagger.tags = ['👨‍🏫 Professores']
router.use(authMiddleware)

// Rotas protegidas
router.get('/', 
  // #swagger.summary = 'Listar Professores'
  // #swagger.description = 'Lista todos os professores do usuário logado'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.responses[200] = {
       description: 'Lista de professores',
       schema: [{ $ref: '#/definitions/Professor' }]
  } */
  professorController.getProfessores
)

router.get('/:id', 
  // #swagger.summary = 'Buscar Professor por ID'
  // #swagger.description = 'Retorna um professor específico pelo ID'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID do professor',
       required: true,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: 'Professor encontrado',
       schema: { $ref: '#/definitions/Professor' }
  } */
  validateObjectId, 
  professorController.getProfessorById
)

router.post('/', 
  // #swagger.summary = 'Criar Professor'
  // #swagger.description = 'Cadastra um novo professor no sistema'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['body'] = {
       in: 'body',
       description: 'Dados do professor',
       required: true,
       schema: { $ref: '#/definitions/Professor' }
  } */
  /* #swagger.responses[201] = {
       description: 'Professor criado com sucesso',
       schema: { $ref: '#/definitions/Success' }
  } */
  validateProfessor, 
  professorController.createProfessor
)

router.put('/:id', 
  // #swagger.summary = 'Atualizar Professor'
  // #swagger.description = 'Atualiza dados de um professor existente'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID do professor',
       required: true,
       type: 'string'
  } */
  /* #swagger.parameters['body'] = {
       in: 'body',
       description: 'Dados atualizados do professor',
       required: true,
       schema: { $ref: '#/definitions/Professor' }
  } */
  [validateObjectId, validateProfessor], 
  professorController.updateProfessor
)

router.delete('/:id', 
  // #swagger.summary = 'Deletar Professor'
  // #swagger.description = 'Remove um professor do sistema'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID do professor',
       required: true,
       type: 'string'
  } */
  validateObjectId, 
  professorController.deleteProfessor
)

export default router