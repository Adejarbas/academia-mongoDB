import { ObjectId } from 'mongodb'
import { getDb } from '../config/db.js'

export async function getTreinos(req, res, next) {
  try {
    const db = getDb()
    const treinos = await db.collection('treinos').find().toArray()
    res.json(treinos)
  } catch (err) {
    next(err)
  }
}

export async function getTreinoById(req, res, next) {
  try {
    const db = getDb()
    const treino = await db.collection('treinos').findOne({ _id: new ObjectId(req.params.id) })
    if (!treino) {
      return res.status(404).json({ message: 'Treino não encontrado' })
    }
    res.json(treino)
  } catch (err) {
    next(err)
  }
}

export async function createTreino(req, res, next) {
  try {
    const db = getDb()
    const result = await db.collection('treinos').insertOne(req.body)
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