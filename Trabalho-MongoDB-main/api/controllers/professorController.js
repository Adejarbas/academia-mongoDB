import { ObjectId } from 'mongodb'
import { getDb } from '../config/db.js'

export async function getProfessores(req, res, next) {
  try {
    console.log('👨‍🏫 Buscando professores para usuário:', req.user._id, 'Role:', req.user.role);
    
    const db = getDb()
    let query = {};
    
    // Se não for admin, filtrar apenas os professores do usuário logado
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    console.log('🔍 Query de busca professores:', query);
    const professores = await db.collection('professores').find(query).toArray()
    console.log('📊 Professores encontrados:', professores.length);
    
    res.json(professores)
  } catch (err) {
    console.error('❌ Erro ao buscar professores:', err);
    next(err)
  }
}

export async function getProfessorById(req, res, next) {
  try {
    console.log('🔍 Buscando professor ID:', req.params.id, 'para usuário:', req.user._id);
    
    const db = getDb()
    let query = { _id: new ObjectId(req.params.id) };
    
    // Se não for admin, verificar se o professor pertence ao usuário
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    const professor = await db.collection('professores').findOne(query)
    
    if (!professor) {
      return res.status(404).json({ 
        success: false,
        message: 'Professor não encontrado ou você não tem permissão para visualizá-lo' 
      })
    }
    
    console.log('✅ Professor encontrado:', professor.nome);
    res.json(professor)
  } catch (err) {
    console.error('❌ Erro ao buscar professor:', err);
    next(err)
  }
}

export async function createProfessor(req, res, next) {
  try {
    console.log('➕ Criando professor para usuário:', req.user._id, req.user.name);
    
    const db = getDb()
    const novoProfessor = {
      ...req.body,
      userId: req.user._id.toString(), // Sempre associar ao usuário logado
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('📋 Dados do novo professor:', { nome: novoProfessor.nome, especialidade: novoProfessor.especialidade, userId: novoProfessor.userId });
      const result = await db.collection('professores').insertOne(novoProfessor)
    
    const professorSalvo = await db.collection('professores').findOne({ _id: result.insertedId })
    console.log('✅ Professor criado com sucesso:', professorSalvo.nome);
    
    res.status(201).json({
      success: true,
      message: 'Professor criado com sucesso',
      data: professorSalvo
    })
  } catch (err) {
    console.error('❌ Erro ao criar professor:', err);
    next(err)
  }
}

export async function updateProfessor(req, res, next) {
  try {
    console.log('✏️ Atualizando professor ID:', req.params.id, 'para usuário:', req.user._id);
    
    const db = getDb()
    const id = new ObjectId(req.params.id)
    
    let query = { _id: id };
    
    // Se não for admin, verificar se o professor pertence ao usuário
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    // Primeiro verificar se o professor existe e pertence ao usuário
    const professorExistente = await db.collection('professores').findOne(query)
    if (!professorExistente) {
      return res.status(404).json({ 
        success: false,
        message: 'Professor não encontrado ou você não tem permissão para atualizá-lo' 
      })
    }
    
    const dadosAtualizacao = {
      ...req.body,
      updatedAt: new Date()
    }
    
    // Não permitir alterar o userId
    delete dadosAtualizacao.userId;
      console.log('📝 Atualizando dados do professor:', Object.keys(dadosAtualizacao));
    
    const result = await db.collection('professores').updateOne(
      query,
      { $set: dadosAtualizacao }
    )
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Professor não encontrado ou você não tem permissão para atualizá-lo' 
      })
    }
    
    const professorAtualizado = await db.collection('professores').findOne(query)
    console.log('✅ Professor atualizado com sucesso:', professorAtualizado.nome);
    
    res.json({
      success: true,
      message: 'Professor atualizado com sucesso',
      data: professorAtualizado
    })
  } catch (err) {
    console.error('❌ Erro ao atualizar professor:', err);
    next(err)
  }
}

export async function deleteProfessor(req, res, next) {
  try {
    console.log('🗑️ Deletando professor ID:', req.params.id, 'para usuário:', req.user._id);
    
    const db = getDb()
    const id = new ObjectId(req.params.id)
    
    let query = { _id: id };
    
    // Se não for admin, verificar se o professor pertence ao usuário
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    // Primeiro verificar se o professor existe e pertence ao usuário
    const professorExistente = await db.collection('professores').findOne(query)
    if (!professorExistente) {
      return res.status(404).json({ 
        success: false,
        message: 'Professor não encontrado ou você não tem permissão para deletá-lo' 
      })
    }
    
    console.log('🗑️ Deletando professor:', professorExistente.nome);
    
    const result = await db.collection('professores').deleteOne(query)
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Erro ao deletar professor' 
      })
    }
    
    console.log('✅ Professor deletado com sucesso');
    
    res.json({ 
      success: true,
      message: 'Professor removido com sucesso' 
    })
  } catch (err) {
    next(err)
  }
}