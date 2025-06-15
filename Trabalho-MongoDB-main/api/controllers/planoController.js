import { ObjectId } from 'mongodb'
import { getDb } from '../config/db.js'

export async function getPlanos(req, res, next) {
  try {
    const db = getDb()
    const planos = await db.collection('planos').find().toArray()
    res.json(planos)
  } catch (err) {
    next(err)
  }
}

export async function getPlanoById(req, res, next) {
  try {
    const db = getDb()
    const plano = await db.collection('planos').findOne({ _id: new ObjectId(req.params.id) })
    if (!plano) {
      return res.status(404).json({ message: 'Plano não encontrado' })
    }
    res.json(plano)
  } catch (err) {
    next(err)
  }
}

export async function createPlano(req, res, next) {
  try {
    const db = getDb()
    const result = await db.collection('planos').insertOne(req.body)
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