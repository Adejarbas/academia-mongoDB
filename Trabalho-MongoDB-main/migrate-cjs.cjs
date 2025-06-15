const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_USER_ID = new ObjectId('684c38e81ae411a6b7c00b65');

async function migrateData() {
    console.log('🚀 Iniciando migração...');
    console.log('MONGO_URI:', MONGO_URI ? 'Definido' : 'Não definido');
    
    const client = new MongoClient(MONGO_URI);
    
    try {
        await client.connect();
        console.log('🔗 Conectado ao MongoDB');
        
        const db = client.db();
        
        // Collections to migrate
        const collections = ['alunos', 'professores', 'planos', 'planosalunos', 'treinos'];
        
        for (const collectionName of collections) {
            console.log(`\n📦 Migrando coleção: ${collectionName}`);
            
            // Update documents without userId
            const result = await db.collection(collectionName).updateMany(
                { userId: { $exists: false } },
                { $set: { userId: ADMIN_USER_ID } }
            );
            
            console.log(`✅ ${collectionName}: ${result.modifiedCount} documentos atualizados`);
        }
        
        console.log('\n🎉 Migração concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
    } finally {
        await client.close();
        console.log('🔌 Conexão fechada');
    }
}

migrateData();
