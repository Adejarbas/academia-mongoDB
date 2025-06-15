import { ObjectId } from 'mongodb'
import { getDb } from '../config/db.js'

export async function getTreinos(req, res, next) {
  try {
    console.log('💪 Buscando treinos para usuário:', req.user._id, 'Role:', req.user.role);
    
    const db = getDb()
    let query = {};
    
    // Se não for admin, filtrar apenas os treinos do usuário logado
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    const treinos = await db.collection('treinos').find(query).toArray()
    console.log('📊 Treinos encontrados:', treinos.length);
    
    res.json(treinos)
  } catch (err) {
    console.error('❌ Erro ao buscar treinos:', err);
    next(err)
  }
}

export async function getTreinoById(req, res, next) {
  try {
    const db = getDb()
    let query = { _id: new ObjectId(req.params.id) };
    
    // Se não for admin, verificar se o treino pertence ao usuário
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    const treino = await db.collection('treinos').findOne(query)
    if (!treino) {
      return res.status(404).json({ 
        success: false,
        message: 'Treino não encontrado ou você não tem permissão para visualizá-lo' 
      })
    }
    res.json(treino)
  } catch (err) {
    next(err)
  }
}

export async function createTreino(req, res, next) {
  try {
    console.log('➕ Criando treino para usuário:', req.user._id);
    
    const db = getDb()
    const novoTreino = {
      ...req.body,
      userId: req.user._id.toString(), // Sempre associar ao usuário logado
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('treinos').insertOne(novoTreino)
    res.status(201).json({ _id: result.insertedId, ...req.body })
  } catch (err) {
    next(err)
  }
}

export async function updateTreino(req, res, next) {
  try {
    const db = getDb()
    const id = new ObjectId(req.params.id)
    const result = await db.collection('treinos').updateOne(
      { _id: id },
      { $set: req.body }
    )
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Treino não encontrado' })
    }
    const treinoAtualizado = await db.collection('treinos').findOne({ _id: id })
    res.json(treinoAtualizado)
  } catch (err) {
    next(err)
  }
}

export async function deleteTreino(req, res, next) {
  try {
    const db = getDb()
    const id = new ObjectId(req.params.id)
    const result = await db.collection('treinos').deleteOne({ _id: id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Treino não encontrado' })
    }
    res.json({ message: 'Treino removido com sucesso' })
  } catch (err) {
    next(err)
  }
}