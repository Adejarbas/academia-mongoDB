import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../api/index.js';
import { getDb } from '../api/config/db.js';

describe('🔑 Autenticação - Login e Geração JWT', () => {
  let db;
  let testUser;

  beforeAll(async () => {
    // Aguardar conexão com DB
    await new Promise(resolve => setTimeout(resolve, 2000));
    db = getDb();
  });

  beforeEach(async () => {
    // Limpar collection users antes de cada teste
    if (db) {
      await db.collection('users').deleteMany({});
    }

    // Criar usuário de teste
    const userData = {
      name: 'User Login Test',
      email: 'login@teste.com',
      password: 'senha123456'
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData);

    testUser = {
      ...userData,
      id: response.body.data.user.id
    };
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (db) {
      await db.collection('users').deleteMany({});
    }
  });

  describe('✅ Login com Sucesso', () => {
    test('Deve fazer login com credenciais válidas', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login realizado com sucesso');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('Deve gerar token JWT válido', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      const token = response.body.data.token;
      
      // Verificar se o token é válido
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      
      // Decodificar e verificar conteúdo do token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('Deve definir expiração correta do token (7 dias)', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar se expira em aproximadamente 7 dias (604800 segundos)
      const expirationTime = decoded.exp - decoded.iat;
      expect(expirationTime).toBe(604800); // 7 dias em segundos
    });
  });

  describe('❌ Login com Erro', () => {
    test('Deve rejeitar login com email inexistente', async () => {
      const loginData = {
        email: 'naoexiste@teste.com',
        password: 'senha123456'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Credenciais inválidas');
    });

    test('Deve rejeitar login com senha incorreta', async () => {
      const loginData = {
        email: testUser.email,
        password: 'senhaerrada123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Credenciais inválidas');
    });

    test('Deve rejeitar login com campos obrigatórios faltando', async () => {
      const loginData = {
        email: testUser.email
        // password faltando
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            path: 'password',
            msg: expect.stringContaining('obrigatório')
          })
        ])
      );
    });

    test('Deve rejeitar login com email inválido', async () => {
      const loginData = {
        email: 'email-formato-invalido',
        password: 'senha123456'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            path: 'email',
            msg: expect.stringContaining('Email inválido')
          })
        ])
      );
    });
  });

  describe('🔐 Segurança do Token', () => {
    test('Token deve conter informações corretas do usuário', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.role).toBe('user');
    });

    test('Não deve retornar senha no response', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.data.user).not.toHaveProperty('password');
    });
  });
});
