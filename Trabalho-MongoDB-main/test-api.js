// Arquivo de teste para verificar se a API está funcionando
import fetch from 'node-fetch';

async function testAPI() {
    try {
        // Primeiro, vamos fazer login para obter um token
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@academia.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);

        if (loginData.token) {
            // Agora vamos testar a rota de plano-alunos
            const planoAlunosResponse = await fetch('http://localhost:3000/api/plano-alunos', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Plano-alunos response status:', planoAlunosResponse.status);
            const planoAlunosData = await planoAlunosResponse.json();
            console.log('Plano-alunos data:', planoAlunosData);
        }
    } catch (error) {
        console.error('Erro no teste:', error);
    }
}

testAPI();
