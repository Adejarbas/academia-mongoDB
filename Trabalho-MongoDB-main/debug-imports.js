// Teste simples das rotas
console.log('Iniciando teste de rotas...');

try {
    console.log('1. Testando importação do express...');
    const express = await import('express');
    console.log('✅ Express importado com sucesso');
    
    console.log('2. Testando importação do authMiddleware...');
    const { authMiddleware } = await import('./api/middlewares/auth.js');
    console.log('✅ AuthMiddleware importado:', typeof authMiddleware);
    
    console.log('3. Testando importação do controller...');
    const controller = await import('./api/controllers/planoAlunoController.js');
    console.log('✅ Controller importado:', Object.keys(controller));
    
    console.log('4. Testando importação das rotas...');
    const routes = await import('./api/routes/planoAlunoRoutes.js');
    console.log('✅ Rotas importadas:', typeof routes.default);
    
    console.log('✅ TODOS OS MÓDULOS FORAM IMPORTADOS COM SUCESSO!');
    
} catch (error) {
    console.error('❌ Erro na importação:', error.message);
    console.error('❌ Stack trace:', error.stack);
}
