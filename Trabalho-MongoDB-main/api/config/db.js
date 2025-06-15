import { MongoClient } from 'mongodb'

let db

export async function connectToDatabase() {
  const client = new MongoClient(process.env.MONGO_URI)
  await client.connect()
  db = client.db() // pega o banco padrão da URI
}

export function getDb() {
  return db
}