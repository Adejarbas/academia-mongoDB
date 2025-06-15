import { MongoClient } from 'mongodb';

let db;
let client;

export async function connectToDatabase() {
  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db(); // pega o banco padrão da URI
    console.log('✅ Conectado ao MongoDB com sucesso!');
    return db;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database não inicializado. Chame connectToDatabase() primeiro.');
  }
  return db;
}

export { db };