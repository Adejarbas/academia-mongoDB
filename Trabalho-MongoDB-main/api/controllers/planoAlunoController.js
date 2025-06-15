import { ObjectId } from 'mongodb'
import { getDb } from '../config/db.js'

export async function getPlanosAlunos(req, res, next) {
  try {
    console.log('🔗 Buscando planos-alunos para usuário:', req.user._id, 'Role:', req.user.role);
    
    const db = getDb()
    let query = {};
    
    // Se não for admin, filtrar apenas os planos-alunos do usuário logado
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    const planosAlunos = await db.collection('planoalunos').find(query).toArray()
    console.log('📊 Planos-Alunos encontrados:', planosAlunos.length);
    
    res.json(planosAlunos)
  } catch (err) {
    console.error('❌ Erro ao buscar planos-alunos:', err);
    next(err)
  }
}

export async function getPlanoAlunoById(req, res, next) {
  try {
    const db = getDb()
    let query = { _id: new ObjectId(req.params.id) };
    
    // Se não for admin, verificar se o plano-aluno pertence ao usuário
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    const planoAluno = await db.collection('planoalunos').findOne(query)
    if (!planoAluno) {
      return res.status(404).json({ 
        success: false,
        message: 'Plano-Aluno não encontrado ou você não tem permissão para visualizá-lo' 
      })
    }
    res.json(planoAluno)
  } catch (err) {
    next(err)
  }
}

export async function createPlanoAluno(req, res, next) {
  try {
    console.log('➕ Criando plano-aluno para usuário:', req.user._id);
    
    const db = getDb()
    const novoPlanoAluno = {
      ...req.body,
      userId: req.user._id.toString(), // Sempre associar ao usuário logado
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('planoalunos').insertOne(novoPlanoAluno)
    
    const planoAlunoSalvo = await db.collection('planoalunos').findOne({ _id: result.insertedId })
    console.log('✅ Plano-Aluno criado com sucesso');
    
    res.status(201).json({
      success: true,
      message: 'Plano-Aluno criado com sucesso',
      data: planoAlunoSalvo
    })
  } catch (err) {
    console.error('❌ Erro ao criar plano-aluno:', err);
    next(err)
  }
}

export async function updatePlanoAluno(req, res, next) {
  try {
    console.log('✏️ Atualizando plano-aluno ID:', req.params.id, 'para usuário:', req.user._id);
    
    const db = getDb()
    const id = new ObjectId(req.params.id)
    
    let query = { _id: id };
    
    // Se não for admin, verificar se o plano-aluno pertence ao usuário
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    // Primeiro verificar se o plano-aluno existe e pertence ao usuário
    const planoAlunoExistente = await db.collection('planoalunos').findOne(query)
    if (!planoAlunoExistente) {
      return res.status(404).json({ 
        success: false,
        message: 'Plano-Aluno não encontrado ou você não tem permissão para atualizá-lo' 
      })
    }
    
    const dadosAtualizacao = {
      ...req.body,
      updatedAt: new Date()
    }
    
    // Não permitir alterar o userId
    delete dadosAtualizacao.userId;
    
    const result = await db.collection('planoalunos').updateOne(
      query,
      { $set: dadosAtualizacao }
    )
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Plano-Aluno não encontrado ou você não tem permissão para atualizá-lo' 
      })
    }
    
    const planoAlunoAtualizado = await db.collection('planoalunos').findOne(query)
    console.log('✅ Plano-Aluno atualizado com sucesso');
    
    res.json({
      success: true,
      message: 'Plano-Aluno atualizado com sucesso',
      data: planoAlunoAtualizado
    })
  } catch (err) {
    console.error('❌ Erro ao atualizar plano-aluno:', err);
    next(err)
  }
}

export async function deletePlanoAluno(req, res, next) {
  try {
    console.log('🗑️ Deletando plano-aluno ID:', req.params.id, 'para usuário:', req.user._id);
    
    const db = getDb()
    const id = new ObjectId(req.params.id)
    
    let query = { _id: id };
    
    // Se não for admin, verificar se o plano-aluno pertence ao usuário
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    // Primeiro verificar se o plano-aluno existe e pertence ao usuário
    const planoAlunoExistente = await db.collection('planoalunos').findOne(query)
    if (!planoAlunoExistente) {
      return res.status(404).json({ 
        success: false,
        message: 'Plano-Aluno não encontrado ou você não tem permissão para deletá-lo' 
      })
    }
    
    const result = await db.collection('planoalunos').deleteOne(query)
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Erro ao deletar plano-aluno' 
      })
    }
    
    console.log('✅ Plano-Aluno deletado com sucesso');
    
    res.json({ 
      success: true,
      message: 'Plano-Aluno removido com sucesso' 
    })
  } catch (err) {
    console.error('❌ Erro ao deletar plano-aluno:', err);
    next(err)
  }
}
