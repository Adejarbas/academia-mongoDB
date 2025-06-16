import { getDb } from '../api/config/db.js';

/**
 * Utilitários para testes
 */

// Limpar todas as collections de teste
export async function clearTestData() {
  const db = getDb();
  if (db) {
    await Promise.all([
      db.collection('users').deleteMany({}),
      db.collection('alunos').deleteMany({}),
      db.collection('professores').deleteMany({}),
      db.collection('treinos').deleteMany({}),
      db.collection('planos').deleteMany({})
    ]);
  }
}

// Aguardar conexão com banco
export async function waitForDatabase(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkConnection = () => {
      try {
        const db = getDb();
        if (db) {
          resolve(db);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(checkConnection, 100);
        } else {
          reject(new Error('Timeout waiting for database connection'));
        }
      } catch (error) {
        if (Date.now() - startTime < timeout) {
          setTimeout(checkConnection, 100);
        } else {
          reject(error);
        }
      }
    };
    
    checkConnection();
  });
}

// Criar usuário de teste
export async function createTestUser(userData = {}) {
  const defaultData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  };
  
  return { ...defaultData, ...userData };
}

// Gerar dados de aluno de teste
export function generateAlunoData(overrides = {}) {
  const defaultData = {
    nome: 'Aluno Teste',
    email: 'aluno@teste.com',
    telefone: '11999999999',
    dataNascimento: '1995-01-01',
    idade: 29,
    peso: 75.0
  };
  
  return { ...defaultData, ...overrides };
}

// Gerar dados de professor de teste
export function generateProfessorData(overrides = {}) {
  const defaultData = {
    nome: 'Professor Teste',
    email: 'professor@teste.com',
    especialidade: 'Musculação',
    telefone: '11888888888',
    salario: 3000.00
  };
  
  return { ...defaultData, ...overrides };
}

// Gerar dados de treino de teste
export function generateTreinoData(overrides = {}) {
  const defaultData = {
    nome: 'Treino Teste',
    descricao: 'Descrição do treino de teste',
    exercicios: ['Flexão', 'Agachamento', 'Abdominais'],
    duracao: 60,
    dificuldade: 5
  };
  
  return { ...defaultData, ...overrides };
}

// Gerar dados de plano de teste
export function generatePlanoData(overrides = {}) {
  const defaultData = {
    nome: 'Plano Teste',
    descricao: 'Plano de teste',
    preco: 99.90,
    duracaoMeses: 12
  };
  
  return { ...defaultData, ...overrides };
}
