import request from 'supertest';
import app from '../api/index.js';
import { getDb } from '../api/config/db.js';

describe('🔐 Autenticação - Registro de Usuário', () => {
  let db;

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
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (db) {
      await db.collection('users').deleteMany({});
    }
  });

  describe('✅ Casos de Sucesso', () => {
    test('Deve registrar usuário com dados válidos', async () => {
      const userData = {
        name: 'João Teste',
        email: 'joao@teste.com',
        password: 'senha123456'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Usuário criado com sucesso');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('name', userData.name);
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('Deve definir role padrão como "user"', async () => {
      const userData = {
        name: 'Maria Teste',
        email: 'maria@teste.com',
        password: 'senha123456'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user).toHaveProperty('role', 'user');
    });
  });

  describe('❌ Casos de Erro', () => {
    test('Deve rejeitar registro com campos obrigatórios faltando', async () => {
      const userData = {
        email: 'incompleto@teste.com'
        // name e password faltando
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Erro de validação');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            path: 'name',
            msg: expect.stringContaining('obrigatório')
          }),
          expect.objectContaining({ 
            path: 'password',
            msg: expect.stringContaining('obrigatório')
          })
        ])
      );
    });

    test('Deve rejeitar email duplicado', async () => {
      const userData = {
        name: 'Primeiro User',
        email: 'duplicado@teste.com',
        password: 'senha123456'
      };

      // Primeiro registro
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Segundo registro com mesmo email
      const secondUser = {
        name: 'Segundo User',
        email: 'duplicado@teste.com',
        password: 'outrasenha123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(secondUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('já existe');
    });

    test('Deve rejeitar senha fraca', async () => {
      const userData = {
        name: 'User Senha Fraca',
        email: 'senhafraca@teste.com',
        password: '123' // Senha muito fraca
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            path: 'password',
            msg: expect.stringContaining('6 caracteres')
          })
        ])
      );
    });

    test('Deve rejeitar email inválido', async () => {
      const userData = {
        name: 'User Email Inválido',
        email: 'email-invalido',
        password: 'senha123456'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
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

  describe('🔒 Segurança', () => {
    test('Deve armazenar senha de forma segura (criptografada)', async () => {
      const userData = {
        name: 'User Segurança',
        email: 'seguranca@teste.com',
        password: 'senha123456'
      };

      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Verificar se a senha foi criptografada no banco
      const userInDb = await db.collection('users').findOne({ email: userData.email });
      
      expect(userInDb).toBeTruthy();
      expect(userInDb.password).not.toBe(userData.password);
      expect(userInDb.password).toMatch(/^\$2[ayb]\$\d+\$/); // Formato bcrypt
      expect(userInDb.password.length).toBeGreaterThan(50); // Hash bcrypt é longo
    });
  });
});
