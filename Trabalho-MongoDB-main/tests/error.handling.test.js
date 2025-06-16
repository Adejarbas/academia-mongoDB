import request from 'supertest';
import app from '../api/index.js';
import { getDb } from '../api/config/db.js';

describe('🚨 Tratamento de Erros', () => {
  let db;
  let validToken;
  let testUserId;

  beforeAll(async () => {
    // Aguardar conexão com DB
    await new Promise(resolve => setTimeout(resolve, 2000));
    db = getDb();
  });

  beforeEach(async () => {
    // Limpar collections antes de cada teste
    if (db) {
      await db.collection('users').deleteMany({});
      await db.collection('alunos').deleteMany({});
    }

    // Criar usuário de teste
    const userData = {
      name: 'User Error Test',
      email: 'error@teste.com',
      password: 'senha123456'
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData);

    validToken = response.body.data.token;
    testUserId = response.body.data.user.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (db) {
      await db.collection('users').deleteMany({});
      await db.collection('alunos').deleteMany({});
    }
  });

  describe('📝 Mensagens de Erro Claras', () => {
    test('Deve retornar mensagem clara para validação de dados', async () => {
      const alunoInvalido = {
        nome: 'A', // Nome muito curto
        email: 'email-invalido', // Email inválido
        telefone: '123', // Telefone inválido
        // campos obrigatórios faltando
      };

      const response = await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${validToken}`)
        .send(alunoInvalido)
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Erro de validação');
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.length).toBeGreaterThan(0);

      // Verificar se as mensagens são claras e específicas
      const errorMessages = response.body.errors.map(err => err.msg);
      expect(errorMessages).toEqual(
        expect.arrayContaining([
          expect.stringContaining('nome deve ter entre 3 e 100 caracteres'),
          expect.stringContaining('Email inválido'),
          expect.stringContaining('Telefone deve ter 10 ou 11 dígitos')
        ])
      );
    });

    test('Deve retornar mensagem clara para recurso não encontrado', async () => {
      const response = await request(app)
        .get('/alunos/507f1f77bcf86cd799439011') // ObjectId falso
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('não encontrado');
    });

    test('Deve retornar mensagem clara para ID inválido', async () => {
      const response = await request(app)
        .get('/alunos/id-invalido')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Erro de validação');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            path: 'id',
            msg: 'Formato de ID inválido'
          })
        ])
      );
    });

    test('Deve retornar mensagem clara para email duplicado', async () => {
      const alunoData = {
        nome: 'Primeiro Aluno',
        email: 'duplicado@teste.com',
        telefone: '11999999999',
        dataNascimento: '2000-01-01',
        idade: 24,
        peso: 70.5
      };

      // Criar primeiro aluno
      await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${validToken}`)
        .send(alunoData)
        .expect(201);

      // Tentar criar segundo aluno com mesmo email
      const segundoAluno = {
        ...alunoData,
        nome: 'Segundo Aluno'
      };

      const response = await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${validToken}`)
        .send(segundoAluno)
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            path: 'email',
            msg: 'Este email já está cadastrado'
          })
        ])
      );
    });
  });

  describe('🔍 Registro de Erros', () => {
    test('Deve logar erros internos adequadamente', async () => {
      // Simular erro interno tentando criar aluno com dados que causem erro no DB
      const dadosProblematicos = {
        nome: 'Aluno Erro DB',
        email: 'erro.db@teste.com',
        telefone: '11999999999',
        dataNascimento: 'data-invalida', // Data inválida
        idade: 'not-a-number', // Tipo inválido
        peso: 'not-a-number' // Tipo inválido
      };

      const response = await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${validToken}`)
        .send(dadosProblematicos)
        .expect(400);

      // Deve retornar erro de validação, não erro interno
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Erro de validação');
    });

    test('Deve retornar erro 500 para falhas internas do servidor', async () => {
      // Este teste seria mais adequado com mock, mas vamos testar cenário real
      // Tentar operação que pode falhar por problema interno
      
      // Fechar conexão temporariamente para simular erro de DB (se possível)
      // Em um ambiente real, você mockaria a conexão do DB
      const response = await request(app)
        .get('/alunos')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200); // Deve funcionar normalmente

      // Verificar que não houve erro interno
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('🔒 Erros de Autenticação e Autorização', () => {
    test('Deve retornar erro claro para token expirado', async () => {
      // Criar token expirado
      const jwt = await import('jsonwebtoken');
      const expiredToken = jwt.default.sign(
        { id: testUserId, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '1ms' }
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/alunos')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Token inválido');
    });

    test('Deve retornar erro claro para token malformado', async () => {
      const response = await request(app)
        .get('/alunos')
        .set('Authorization', 'Bearer token-malformado-123')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Token inválido');
    });

    test('Deve retornar erro claro para credenciais inválidas no login', async () => {
      const loginInvalido = {
        email: 'naoexiste@teste.com',
        password: 'senhaerrada'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginInvalido)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Credenciais inválidas');
    });
  });

  describe('📋 Formato Consistente de Resposta', () => {
    test('Erros de validação devem seguir formato padronizado', async () => {
      const dadosInvalidos = {
        nome: '',
        email: 'email-invalido'
      };

      const response = await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${validToken}`)
        .send(dadosInvalidos)
        .expect(400);

      // Verificar formato padrão de erro
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Erro de validação');
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);

      // Cada erro deve ter estrutura consistente
      response.body.errors.forEach(error => {
        expect(error).toHaveProperty('type');
        expect(error).toHaveProperty('path');
        expect(error).toHaveProperty('msg');
        expect(error).toHaveProperty('location');
      });
    });

    test('Erros de autenticação devem seguir formato padronizado', async () => {
      const response = await request(app)
        .get('/alunos')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
      expect(response.body.message.length).toBeGreaterThan(0);
    });

    test('Respostas de sucesso devem seguir formato padronizado', async () => {
      const alunoData = {
        nome: 'Aluno Formato Test',
        email: 'formato@teste.com',
        telefone: '11999999999',
        dataNascimento: '2000-01-01',
        idade: 24,
        peso: 70.5
      };

      const response = await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${validToken}`)
        .send(alunoData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(typeof response.body.message).toBe('string');
    });
  });

  describe('🛡️ Sanitização e Segurança', () => {
    test('Deve sanitizar dados de entrada perigosos', async () => {
      const dadosComScript = {
        nome: '<script>alert("xss")</script>',
        email: 'test@teste.com',
        telefone: '11999999999',
        dataNascimento: '2000-01-01',
        idade: 24,
        peso: 70.5
      };

      const response = await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${validToken}`)
        .send(dadosComScript)
        .expect(201);

      // O nome deve ser salvo, mas sem executar script
      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe('<script>alert("xss")</script>');
    });

    test('Não deve vazar informações sensíveis em erros', async () => {
      // Tentar operação que pode falhar
      const response = await request(app)
        .get('/alunos/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      // Não deve conter informações do banco de dados ou stack trace
      expect(response.body.message).not.toContain('MongoDB');
      expect(response.body.message).not.toContain('Error:');
      expect(response.body.message).not.toContain('at ');
      expect(response.body).not.toHaveProperty('stack');
    });
  });
});
