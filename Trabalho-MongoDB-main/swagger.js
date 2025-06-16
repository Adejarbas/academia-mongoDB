import swaggerAutogen from 'swagger-autogen';

const swaggerGenerator = swaggerAutogen();

const doc = {
  info: {
    title: '🏋️‍♂️ Academia MongoDB API',
    description: `Sistema Completo de Gerenciamento de Academia

TUTORIAL PRÁTICO:

1. AUTENTICAÇÃO (OBRIGATÓRIO):
   - Faça Login: POST /api/auth/login
   - Credenciais: {"email": "admin@academia.com", "password": "admin123"}
   - Copie o token da resposta
   - Clique em "Authorize" (🔒) no topo da página
   - Cole: Bearer SEU_TOKEN_AQUI
   - Clique "Authorize" → "Close"

2. TESTANDO AS ROTAS:
   - Alunos: GET /api/alunos/ (listar) | POST /api/alunos/ (criar)
   - Professores: GET /api/professores/ | POST /api/professores/
   - Treinos: GET /api/treinos/ | POST /api/treinos/
   - Consultas Avançadas: GET /api/alunos/consulta/avancada

FUNCIONALIDADES:
✅ CRUD completo (Alunos, Professores, Treinos, Planos)
✅ Autenticação JWT (tokens válidos por 7 dias)
✅ Operadores MongoDB ($gt, $and, $or, $in, $gte, $lt)
✅ Validação robusta com express-validator
✅ Controle de acesso por middleware


Repositório: https://github.com/Adejarbas/academia-mongoDB`,
    version: '1.0.0',
    contact: {
      name: 'Daniel Adejarbas',
      url: 'https://github.com/Adejarbas/academia-mongoDB',
      email: 'adejarbas@github.com'
    }
  },
  host: 'localhost:3000',
  basePath: '/',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Insira o token JWT no formato: Bearer {seu-token}'
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./api/index.js'];

swaggerGenerator(outputFile, endpointsFiles, doc).then(() => {
  console.log('✅ Documentação Swagger gerada com sucesso!');
  console.log('📁 Arquivo criado: swagger-output.json');
  console.log('🌐 Para visualizar: http://localhost:3000/api-docs');
});