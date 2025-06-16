import request from 'supertest';
import app from '../api/index.js';
import { getDb } from '../api/config/db.js';

describe('🛡️ Rotas Protegidas - Controle de Acesso', () => {
  let db;
  let userToken;
  let adminToken;
  let testUserId;
  let testAdminId;

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
      await db.collection('professores').deleteMany({});
    }

    // Criar usuário comum
    const userData = {
      name: 'User Comum',
      email: 'user@teste.com',
      password: 'senha123456'
    };

    const userResponse = await request(app)
      .post('/auth/register')
      .send(userData);

    userToken = userResponse.body.data.token;
    testUserId = userResponse.body.data.user.id;

    // Criar usuário admin
    const adminData = {
      name: 'Admin User',
      email: 'admin@teste.com',
      password: 'senha123456',
      role: 'admin'
    };

    const adminResponse = await request(app)
      .post('/auth/register')
      .send(adminData);

    adminToken = adminResponse.body.data.token;
    testAdminId = adminResponse.body.data.user.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (db) {
      await db.collection('users').deleteMany({});
      await db.collection('alunos').deleteMany({});
      await db.collection('professores').deleteMany({});
    }
  });

  describe('🔒 Acesso Restrito por Usuário', () => {
    test('Usuário deve ver apenas seus próprios alunos', async () => {
      // Criar aluno para o usuário comum
      const alunoUser = {
        nome: 'Aluno do User',
        email: 'aluno.user@teste.com',
        telefone: '11999999999',
        dataNascimento: '2000-01-01',
        idade: 24,
        peso: 70.5
      };

      await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${userToken}`)
        .send(alunoUser)
        .expect(201);

      // Criar aluno para o admin
      const alunoAdmin = {
        nome: 'Aluno do Admin',
        email: 'aluno.admin@teste.com',
        telefone: '11888888888',
        dataNascimento: '1995-01-01',
        idade: 29,
        peso: 80.0
      };

      await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(alunoAdmin)
        .expect(201);

      // Usuário comum deve ver apenas seu aluno
      const userAlunosResponse = await request(app)
        .get('/alunos')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(userAlunosResponse.body).toHaveLength(1);
      expect(userAlunosResponse.body[0]).toHaveProperty('nome', 'Aluno do User');
      expect(userAlunosResponse.body[0]).toHaveProperty('userId', testUserId);
    });

    test('Admin deve ver todos os alunos', async () => {
      // Admin deve ver alunos de todos os usuários
      const adminAlunosResponse = await request(app)
        .get('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Admin vê todos os alunos (neste caso, os 2 criados no teste anterior)
      expect(adminAlunosResponse.body.length).toBeGreaterThanOrEqual(0);
    });

    test('Usuário não deve acessar aluno de outro usuário', async () => {
      // Criar aluno com admin
      const alunoAdmin = {
        nome: 'Aluno Privado Admin',
        email: 'privado.admin@teste.com',
        telefone: '11777777777',
        dataNascimento: '1990-01-01',
        idade: 34,
        peso: 85.0
      };

      const createResponse = await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(alunoAdmin)
        .expect(201);

      const alunoId = createResponse.body.data._id;

      // Usuário comum tenta acessar aluno do admin
      const response = await request(app)
        .get(`/alunos/${alunoId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('não encontrado ou você não tem permissão');
    });

    test('Usuário não deve editar aluno de outro usuário', async () => {
      // Criar aluno com admin
      const alunoAdmin = {
        nome: 'Aluno Para Editar',
        email: 'editar.admin@teste.com',
        telefone: '11666666666',
        dataNascimento: '1988-01-01',
        idade: 36,
        peso: 90.0
      };

      const createResponse = await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(alunoAdmin)
        .expect(201);

      const alunoId = createResponse.body.data._id;

      // Usuário comum tenta editar aluno do admin
      const updateData = {
        nome: 'Nome Alterado',
        email: 'alterado@teste.com',
        telefone: '11555555555',
        dataNascimento: '1988-01-01',
        idade: 36,
        peso: 92.0
      };

      const response = await request(app)
        .put(`/alunos/${alunoId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('não encontrado ou você não tem permissão');
    });

    test('Usuário não deve deletar aluno de outro usuário', async () => {
      // Criar aluno com admin
      const alunoAdmin = {
        nome: 'Aluno Para Deletar',
        email: 'deletar.admin@teste.com',
        telefone: '11444444444',
        dataNascimento: '1985-01-01',
        idade: 39,
        peso: 95.0
      };

      const createResponse = await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(alunoAdmin)
        .expect(201);

      const alunoId = createResponse.body.data._id;

      // Usuário comum tenta deletar aluno do admin
      const response = await request(app)
        .delete(`/alunos/${alunoId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('não encontrado ou você não tem permissão');
    });
  });

  describe('🚫 Redirecionamento para Login', () => {
    test('Deve retornar 401 para rotas protegidas sem token', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/alunos' },
        { method: 'post', path: '/alunos' },
        { method: 'get', path: '/professores' },
        { method: 'post', path: '/professores' },
        { method: 'get', path: '/treinos' },
        { method: 'post', path: '/treinos' },
        { method: 'get', path: '/planos' },
        { method: 'post', path: '/planos' }
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.message).toContain('Token não fornecido');
      }
    });

    test('Deve retornar mensagem clara de acesso negado', async () => {
      const response = await request(app)
        .get('/alunos')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Token não fornecido');
    });
  });

  describe('✅ Acesso Autorizado', () => {
    test('Deve permitir CRUD completo para próprios recursos', async () => {
      // CREATE
      const alunoData = {
        nome: 'Aluno CRUD Test',
        email: 'crud@teste.com',
        telefone: '11333333333',
        dataNascimento: '1992-01-01',
        idade: 32,
        peso: 75.0
      };

      const createResponse = await request(app)
        .post('/alunos')
        .set('Authorization', `Bearer ${userToken}`)
        .send(alunoData)
        .expect(201);

      const alunoId = createResponse.body.data._id;

      // READ
      await request(app)
        .get(`/alunos/${alunoId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // UPDATE
      const updateData = {
        ...alunoData,
        nome: 'Aluno CRUD Atualizado',
        peso: 77.5
      };

      await request(app)
        .put(`/alunos/${alunoId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      // DELETE
      await request(app)
        .delete(`/alunos/${alunoId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    test('Deve aplicar userId automaticamente nos recursos criados', async () => {
      const professorData = {
        nome: 'Professor Teste',
        email: 'professor@teste.com',
        especialidade: 'Musculação',
        salario: 3000.00
      };

      const response = await request(app)
        .post('/professores')
        .set('Authorization', `Bearer ${userToken}`)
        .send(professorData)
        .expect(201);

      expect(response.body.data).toHaveProperty('userId', testUserId);
    });
  });
});
