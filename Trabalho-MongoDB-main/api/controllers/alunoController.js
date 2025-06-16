import { ObjectId } from 'mongodb'
import { getDb } from '../config/db.js'

// Listar todos os alunos (filtrados por usuário)
export async function getAlunos(req, res, next) {
  try {
    console.log('👥 Buscando alunos para usuário:', req.user._id, 'Role:', req.user.role);
    
    const db = getDb()
    let query = {};
    
    // Se não for admin, filtrar apenas os alunos do usuário logado
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    console.log('🔍 Query de busca:', query);
    const alunos = await db.collection('alunos').find(query).toArray()
    console.log('📊 Alunos encontrados:', alunos.length);
    
    res.json(alunos)
  } catch (err) {
    console.error('❌ Erro ao buscar alunos:', err);
    next(err)
  }
}

// Buscar aluno por ID (verificar ownership)
export async function getAlunoById(req, res, next) {
  try {
    console.log('🔍 Buscando aluno ID:', req.params.id, 'para usuário:', req.user._id);
    
    const db = getDb()
    let query = { _id: new ObjectId(req.params.id) };
    
    // Se não for admin, verificar se o aluno pertence ao usuário
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    const aluno = await db.collection('alunos').findOne(query)
    
    if (!aluno) {
      return res.status(404).json({ 
        success: false,
        message: 'Aluno não encontrado ou você não tem permissão para visualizá-lo' 
      })
    }
    
    console.log('✅ Aluno encontrado:', aluno.nome);
    res.json(aluno)
  } catch (err) {
    console.error('❌ Erro ao buscar aluno:', err);
    next(err)
  }
}

// Criar novo aluno
export async function createAluno(req, res, next) {
  try {
    console.log('➕ Criando aluno para usuário:', req.user._id, req.user.name);
    
    const db = getDb()
    const novoAluno = {
      ...req.body,
      userId: req.user._id.toString(), // Sempre associar ao usuário logado
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('📋 Dados do novo aluno:', { nome: novoAluno.nome, email: novoAluno.email, userId: novoAluno.userId });
    
    const result = await db.collection('alunos').insertOne(novoAluno)
    
    const alunoSalvo = await db.collection('alunos').findOne({ _id: result.insertedId })
    console.log('✅ Aluno criado com sucesso:', alunoSalvo.nome);
    
    res.status(201).json({
      success: true,
      message: 'Aluno criado com sucesso',
      data: alunoSalvo
    })
  } catch (err) {
    console.error('❌ Erro ao criar aluno:', err);
    next(err)
  }
}

// Atualizar aluno
export async function updateAluno(req, res, next) {
  try {
    console.log('✏️ Atualizando aluno ID:', req.params.id, 'para usuário:', req.user._id);
    
    const db = getDb()
    const id = new ObjectId(req.params.id)
    
    let query = { _id: id };
    
    // Se não for admin, verificar se o aluno pertence ao usuário
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    // Primeiro verificar se o aluno existe e pertence ao usuário
    const alunoExistente = await db.collection('alunos').findOne(query)
    if (!alunoExistente) {
      return res.status(404).json({ 
        success: false,
        message: 'Aluno não encontrado ou você não tem permissão para atualizá-lo' 
      })
    }
    
    const dadosAtualizacao = {
      ...req.body,
      updatedAt: new Date()
    }
    
    // Não permitir alterar o userId
    delete dadosAtualizacao.userId;
    
    console.log('📝 Atualizando dados:', Object.keys(dadosAtualizacao));
      const result = await db.collection('alunos').updateOne(
      query,
      { $set: dadosAtualizacao }
    )
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Aluno não encontrado ou você não tem permissão para atualizá-lo' 
      })
    }
    
    const alunoAtualizado = await db.collection('alunos').findOne(query)
    console.log('✅ Aluno atualizado com sucesso:', alunoAtualizado.nome);
    
    res.json({
      success: true,
      message: 'Aluno atualizado com sucesso',
      data: alunoAtualizado
    })
  } catch (err) {
    console.error('❌ Erro ao atualizar aluno:', err);
    next(err)
  }
}

// Deletar aluno
export async function deleteAluno(req, res, next) {
  try {
    console.log('🗑️ Deletando aluno ID:', req.params.id, 'para usuário:', req.user._id);
    
    const db = getDb()
    const id = new ObjectId(req.params.id)
    
    let query = { _id: id };
    
    // Se não for admin, verificar se o aluno pertence ao usuário
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    // Primeiro verificar se o aluno existe e pertence ao usuário
    const alunoExistente = await db.collection('alunos').findOne(query)
    if (!alunoExistente) {
      return res.status(404).json({ 
        success: false,
        message: 'Aluno não encontrado ou você não tem permissão para deletá-lo' 
      })
    }
    
    console.log('🗑️ Deletando aluno:', alunoExistente.nome);
    
    const result = await db.collection('alunos').deleteOne(query)
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Erro ao deletar aluno' 
      })
    }
    
    console.log('✅ Aluno deletado com sucesso');
    
    res.json({ 
      success: true,
      message: 'Aluno removido com sucesso' 
    })
  } catch (err) {
    console.error('❌ Erro ao deletar aluno:', err);
    next(err)
  }
}

// Consulta avançada: alunos com idade > X e peso > Y (filtrado por usuário)
export async function getAlunosAvancado(req, res, next) {
  try {
    console.log('🔍 Busca avançada para usuário:', req.user._id, 'Role:', req.user.role);
    
    const db = getDb();
    const idade = Number(req.query.idade) || 18;
    const peso = Number(req.query.peso) || 70;
    
    let query = {
      idade: { $gt: idade },
      peso: { $gt: peso }
    };
    
    // Se não for admin, filtrar apenas os alunos do usuário logado
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    console.log('🔍 Query avançada:', query);
    
    const alunos = await db.collection('alunos').find(query).toArray();
    
    console.log('📊 Alunos encontrados na busca avançada:', alunos.length);
      res.json({
      success: true,
      filtros: { idade, peso },
      total: alunos.length,
      data: alunos
    });
  } catch (err) {
    console.error('❌ Erro na busca avançada:', err);
    next(err);
  }
}

// Nova consulta com múltiplos operadores: $in, $or, $lt, $gte
export async function getAlunosComplexo(req, res, next) {
  try {
    console.log('🔍 Busca complexa para usuário:', req.user._id);
    
    const db = getDb();
    const { idades, pesoMin, pesoMax, nomes } = req.query;
    
    // Construir query complexa
    let query = {
      $or: [
        { 
          $and: [
            { peso: { $gte: Number(pesoMin) || 60 } },
            { peso: { $lt: Number(pesoMax) || 100 } }
          ]
        },
        {
          idade: { 
            $in: idades ? idades.split(',').map(Number) : [18, 25, 30] 
          }
        }
      ]
    };
    
    // Adicionar filtro por nomes se fornecido
    if (nomes) {
      query.$or.push({
        nome: { 
          $in: nomes.split(',').map(nome => new RegExp(nome, 'i')) 
        }
      });
    }
    
    // Se não for admin, filtrar apenas os alunos do usuário logado
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    console.log('🔍 Query complexa:', JSON.stringify(query, null, 2));
    
    const alunos = await db.collection('alunos').find(query).toArray();
    
    console.log('📊 Alunos encontrados na busca complexa:', alunos.length);
    
    res.json({
      success: true,
      message: 'Busca complexa executada com sucesso',
      operadores_usados: ['$or', '$and', '$gte', '$lt', '$in'],
      filtros: { 
        pesoMin: Number(pesoMin) || 60,
        pesoMax: Number(pesoMax) || 100,
        idades: idades ? idades.split(',').map(Number) : [18, 25, 30],
        nomes: nomes ? nomes.split(',') : null
      },
      total: alunos.length,
      data: alunos
    });
  } catch (err) {
    console.error('❌ Erro na busca complexa:', err);
    next(err);
  }
}