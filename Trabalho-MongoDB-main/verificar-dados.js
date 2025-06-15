// Script para verificar dados no banco por usuário
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const client = new MongoClient(process.env.MONGO_URI);

async function verificarDados() {
    try {
        await client.connect();
        const db = client.db();
        
        console.log('=== VERIFICAÇÃO DE DADOS POR USUÁRIO ===\n');
        
        // Buscar usuários
        const users = await db.collection('users').find({}).toArray();
        console.log('USUÁRIOS CADASTRADOS:');
        users.forEach(user => {
            console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user._id}`);
        });
        
        console.log('\n=== DADOS POR USUÁRIO ===');
        
        for (const user of users) {
            console.log(`\n--- USUÁRIO: ${user.name} (${user._id}) ---`);
            
            const alunos = await db.collection('alunos').countDocuments({ 
                $or: [
                    { userId: user._id.toString() },
                    { userId: user._id }
                ]
            });
            
            const professores = await db.collection('professores').countDocuments({ 
                $or: [
                    { userId: user._id.toString() },
                    { userId: user._id }
                ]
            });
            
            const treinos = await db.collection('treinos').countDocuments({ 
                $or: [
                    { userId: user._id.toString() },
                    { userId: user._id }
                ]
            });
            
            const planos = await db.collection('planos').countDocuments({ 
                $or: [
                    { userId: user._id.toString() },
                    { userId: user._id }
                ]
            });
            
            const planoalunos = await db.collection('planoalunos').countDocuments({ 
                $or: [
                    { userId: user._id.toString() },
                    { userId: user._id }
                ]
            });
            
            console.log(`Alunos: ${alunos}`);
            console.log(`Professores: ${professores}`);
            console.log(`Treinos: ${treinos}`);
            console.log(`Planos: ${planos}`);
            console.log(`Planos-Alunos: ${planoalunos}`);
        }
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await client.close();
    }
}

verificarDados();
