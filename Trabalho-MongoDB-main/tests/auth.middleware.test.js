import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../api/index.js';
import { getDb } from '../api/config/db.js';

describe('🔒 Middleware - Validação Token JWT', () => {
  let db;
  let validToken;
  let testUser;

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

    // Criar usuário e obter token válido
    const userData = {
      name: 'User Token Test',
      email: 'token@teste.com',
      password: 'senha123456'
    };

    const registerResponse = await request(app)
      .post('/auth/register')
      .send(userData);

    testUser = registerResponse.body.data.user;
    validToken = registerResponse.body.data.token;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (db) {
      await db.collection('users').deleteMany({});
      await db.collection('alunos').deleteMany({});
    }
  });

  describe('✅ Token Válido', () => {
    test('Deve permitir acesso com token válido', async () => {
      const response = await request(app)
        .get('/alunos')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Deve permitir acesso com token no formato correto', async () => {
      const response = await request(app)
        .get('/professores')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Deve decodificar token e disponibilizar dados do usuário', async () => {
      // Criar um aluno para testar se o userId é aplicado corretamente
      const alunoData = {
        nome: 'Aluno Teste Token',
        email: 'aluno.token@teste.com',
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
      expect(response.body.data).toHaveProperty('userId', testUser.id);
    });
  });

  describe('❌ Token Inválido', () => {
    test('Deve rejeitar requisição sem token', async () => {
      const response = await request(app)
        .get('/alunos')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Token não fornecido');
    });

    test('Deve rejeitar token mal formatado', async () => {
      const response = await request(app)
        .get('/alunos')
        .set('Authorization', 'Bearer token-mal-formatado')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Token inválido');
    });

    test('Deve rejeitar token sem "Bearer"', async () => {
      const response = await request(app)
        .get('/alunos')
        .set('Authorization', validToken)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Token não fornecido');
    });

    test('Deve rejeitar token expirado', async () => {
      // Gerar token com expiração de 1 segundo
      const expiredToken = jwt.sign(
        { id: testUser.id, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1ms' } // Expira imediatamente
      );

      // Aguardar para garantir que expirou
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/alunos')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Token inválido');
    });

    test('Deve rejeitar token com assinatura inválida', async () => {
      // Gerar token com secret diferente
      const tokenWithWrongSecret = jwt.sign(
        { id: testUser.id, role: testUser.role },
        'secret-errado',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/alunos')
        .set('Authorization', `Bearer ${tokenWithWrongSecret}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Token inválido');
    });

    test('Deve rejeitar token de usuário inexistente', async () => {
      // Gerar token com ID que não existe no banco
      const tokenWithFakeUser = jwt.sign(
        { id: '507f1f77bcf86cd799439011', role: 'user' }, // ObjectId falso
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/alunos')
        .set('Authorization', `Bearer ${tokenWithFakeUser}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Usuário não encontrado');
    });
  });

  describe('🔐 Segurança Adicional', () => {
    test('Deve validar integridade do payload do token', async () => {
      // Token deve conter as informações corretas
      const decoded = jwt.verify(validToken, process.env.JWT_SECRET);
      
      expect(decoded).toHaveProperty('id', testUser.id);
      expect(decoded).toHaveProperty('role', testUser.role);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('Deve proteger todas as rotas que requerem autenticação', async () => {
      const protectedRoutes = [
        { method: 'get', path: '/alunos' },
        { method: 'get', path: '/professores' },
        { method: 'get', path: '/treinos' },
        { method: 'get', path: '/planos' },
      ];

      for (const route of protectedRoutes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);
      }
    });
  });
});
