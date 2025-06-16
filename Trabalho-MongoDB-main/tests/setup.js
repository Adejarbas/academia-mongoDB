import dotenv from 'dotenv';

// Carregar variáveis de ambiente para testes
dotenv.config({ path: '.env.test' });

// Configurar timeout global para testes
jest.setTimeout(10000);

// Mock console para testes mais limpos
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
