import { ObjectId } from 'mongodb'
import { getDb } from '../config/db.js'

export async function getPlanos(req, res, next) {
  try {
    console.log('📋 Buscando planos para usuário:', req.user._id, 'Role:', req.user.role);
    
    const db = getDb()
    let query = {};
    
    // Se não for admin, filtrar apenas os planos do usuário logado
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    const planos = await db.collection('planos').find(query).toArray()
    console.log('📊 Planos encontrados:', planos.length);
    
    res.json(planos)
  } catch (err) {
    console.error('❌ Erro ao buscar planos:', err);
    next(err)
  }
}

export async function getPlanoById(req, res, next) {
  try {
    const db = getDb()
    let query = { _id: new ObjectId(req.params.id) };
    
    // Se não for admin, verificar se o plano pertence ao usuário
    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    
    const plano = await db.collection('planos').findOne(query)
    if (!plano) {
      return res.status(404).json({ 
        success: false,
        message: 'Plano não encontrado ou você não tem permissão para visualizá-lo' 
      })
    }
    res.json(plano)
  } catch (err) {
    next(err)
  }
}

export async function createPlano(req, res, next) {
  try {
    console.log('➕ Criando plano para usuário:', req.user._id);
    
    const db = getDb()
    const novoPlano = {
      ...req.body,
      userId: req.user._id.toString(), // Sempre associar ao usuário logado
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('planos').insertOne(novoPlano)
    res.status(201).json({ _id: result.insertedId, ...req.body })
  } catch (err) {
    next(err)
  }
}

export async function updatePlano(req, res, next) {
  try {
    const db = getDb()
    const id = new ObjectId(req.params.id)
    const result = await db.collection('planos').updateOne(
      { _id: id },
      { $set: req.body }
    )
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Plano não encontrado' })
    }
    const planoAtualizado = await db.collection('planos').findOne({ _id: id })
    res.json(planoAtualizado)
  } catch (err) {
    next(err)
  }
}

export async function deletePlano(req, res, next) {
  try {
    const db = getDb()
    const id = new ObjectId(req.params.id)
    const result = await db.collection('planos').deleteOne({ _id: id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Plano não encontrado' })
    }
    res.json({ message: 'Plano removido com sucesso' })
  } catch (err) {
    next(err)
  }
}