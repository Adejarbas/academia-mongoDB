import express from 'express';
import * as alunoController from '../controllers/alunoController.js';
import { validateAluno, validateObjectId } from '../middlewares/validations.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Adicionar middleware de autenticação em todas as rotas
// #swagger.tags = ['👥 Alunos']
router.use(authMiddleware);

// Rotas de consulta avançada (devem vir ANTES das rotas com parâmetros)
router.get('/consulta/avancada', 
  // #swagger.summary = 'Consulta Avançada de Alunos'
  // #swagger.description = 'Busca alunos com idade > X e peso > Y usando operadores $gt e $and'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['idade'] = {
       in: 'query',
       description: 'Idade mínima (maior que)',
       required: false,
       type: 'integer',
       example: 20
  } */
  /* #swagger.parameters['peso'] = {
       in: 'query',
       description: 'Peso mínimo (maior que)',
       required: false,
       type: 'number',
       example: 70
  } */
  /* #swagger.responses[200] = {
       description: 'Busca realizada com sucesso',
       schema: {
         success: true,
         filtros: { idade: 20, peso: 70 },
         total: 5,
         data: [{ $ref: '#/definitions/Aluno' }]
       }
  } */
  alunoController.getAlunosAvancado
);

router.get('/consulta/complexa', 
  // #swagger.summary = 'Consulta Complexa de Alunos'
  // #swagger.description = 'Busca alunos usando múltiplos operadores: $or, $and, $gte, $lt, $in'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['pesoMin'] = {
       in: 'query',
       description: 'Peso mínimo',
       required: false,
       type: 'number'
  } */
  /* #swagger.parameters['pesoMax'] = {
       in: 'query',
       description: 'Peso máximo',
       required: false,
       type: 'number'
  } */
  /* #swagger.parameters['idades'] = {
       in: 'query',
       description: 'Idades específicas (separadas por vírgula)',
       required: false,
       type: 'string',
       example: '18,25,30'
  } */
  /* #swagger.parameters['nomes'] = {
       in: 'query',
       description: 'Nomes para buscar (separados por vírgula)',
       required: false,
       type: 'string',
       example: 'João,Maria'
  } */
  alunoController.getAlunosComplexo
);

// Rotas protegidas básicas
router.get('/', 
  // #swagger.summary = 'Listar Alunos'
  // #swagger.description = 'Lista todos os alunos do usuário logado (ou todos se for admin)'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.responses[200] = {
       description: 'Lista de alunos',
       schema: [{ $ref: '#/definitions/Aluno' }]
  } */
  alunoController.getAlunos
);

router.get('/:id', 
  // #swagger.summary = 'Buscar Aluno por ID'
  // #swagger.description = 'Retorna um aluno específico pelo ID'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID do aluno',
       required: true,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: 'Aluno encontrado',
       schema: { $ref: '#/definitions/Aluno' }
  } */
  /* #swagger.responses[404] = {
       description: 'Aluno não encontrado',
       schema: { $ref: '#/definitions/Error' }
  } */
  validateObjectId, 
  alunoController.getAlunoById
);

router.post('/', 
  // #swagger.summary = 'Criar Aluno'
  // #swagger.description = 'Cria um novo aluno associado ao usuário logado'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['body'] = {
       in: 'body',
       description: 'Dados do aluno',
       required: true,
       schema: { $ref: '#/definitions/Aluno' }
  } */
  /* #swagger.responses[201] = {
       description: 'Aluno criado com sucesso',
       schema: { $ref: '#/definitions/Success' }
  } */
  /* #swagger.responses[400] = {
       description: 'Dados inválidos',
       schema: { $ref: '#/definitions/Error' }
  } */
  validateAluno, 
  alunoController.createAluno
);

router.put('/:id', 
  // #swagger.summary = 'Atualizar Aluno'
  // #swagger.description = 'Atualiza dados de um aluno existente'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID do aluno',
       required: true,
       type: 'string'
  } */
  /* #swagger.parameters['body'] = {
       in: 'body',
       description: 'Dados atualizados do aluno',
       required: true,
       schema: { $ref: '#/definitions/Aluno' }
  } */
  /* #swagger.responses[200] = {
       description: 'Aluno atualizado com sucesso',
       schema: { $ref: '#/definitions/Success' }
  } */
  [validateObjectId, validateAluno], 
  alunoController.updateAluno
);

router.delete('/:id', 
  // #swagger.summary = 'Deletar Aluno'
  // #swagger.description = 'Remove um aluno do sistema'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID do aluno',
       required: true,
       type: 'string'
  } */
  /* #swagger.responses[200] = {
       description: 'Aluno removido com sucesso',
       schema: { $ref: '#/definitions/Success' }
  } */
  /* #swagger.responses[404] = {
       description: 'Aluno não encontrado',
       schema: { $ref: '#/definitions/Error' }
  } */
  validateObjectId, 
  alunoController.deleteAluno
);

export default router;