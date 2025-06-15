// Teste de carregamento do servidor
import 'dotenv/config'
console.log('1. ✅ dotenv carregado');

import express from 'express'
console.log('2. ✅ express carregado');

import cors from 'cors'
console.log('3. ✅ cors carregado');

import { connectToDatabase } from './api/config/db.js'
console.log('4. ✅ db config carregada');

import authRoutes from './api/routes/authRoutes.js'
console.log('5. ✅ authRoutes carregada');

import alunoRoutes from './api/routes/alunoRoutes.js'
console.log('6. ✅ alunoRoutes carregada');

import professorRoutes from './api/routes/professorRoutes.js'
console.log('7. ✅ professorRoutes carregada');

import treinoRoutes from './api/routes/treinoRoutes.js'
console.log('8. ✅ treinoRoutes carregada');

import planoRoutes from './api/routes/planoRoutes.js'
console.log('9. ✅ planoRoutes carregada');

import planoAlunoRoutes from './api/routes/planoAlunoRoutes.js'
console.log('10. ✅ planoAlunoRoutes carregada');

console.log('🎉 TODAS AS IMPORTAÇÕES FORAM BEM-SUCEDIDAS!');
console.log('Tipo de planoAlunoRoutes:', typeof planoAlunoRoutes);

// Teste de criação do app
const app = express()
app.use(cors())
app.use(express.json())

console.log('🚀 Registrando rotas...');
app.use('/api/auth', authRoutes)
app.use('/api/alunos', alunoRoutes)
app.use('/api/professores', professorRoutes)
app.use('/api/treinos', treinoRoutes)
app.use('/api/planos', planoRoutes)
app.use('/api/plano-alunos', planoAlunoRoutes)

console.log('✅ TODAS AS ROTAS FORAM REGISTRADAS COM SUCESSO!');
console.log('🔥 Servidor configurado sem erros!');
