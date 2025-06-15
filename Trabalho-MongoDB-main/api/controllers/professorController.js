import { ObjectId } from 'mongodb'
import { getDb } from '../config/db.js'

export async function getProfessores(req, res, next) {
  try {
    const db = getDb()
    const professores = await db.collection('professores').find().toArray()
    res.json(professores)
  } catch (err) {
    next(err)
  }
}

export async function getProfessorById(req, res, next) {
  try {
    const db = getDb()
    const professor = await db.collection('professores').findOne({ _id: new ObjectId(req.params.id) })
    if (!professor) {
      return res.status(404).json({ message: 'Professor não encontrado' })
    }
    res.json(professor)
  } catch (err) {
    next(err)
  }
}

export async function createProfessor(req, res, next) {
  try {
    const db = getDb()
    const result = await db.collection('professores').insertOne(req.body)
    res.status(201).json({ _id: result.insertedId, ...req.body })
  } catch (err) {
    next(err)
  }
}

export async function updateProfessor(req, res, next) {
  try {
    const db = getDb()
    const id = new ObjectId(req.params.id)
    const result = await db.collection('professores').updateOne(
      { _id: id },
      { $set: req.body }
    )
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Professor não encontrado' })
    }
    const professorAtualizado = await db.collection('professores').findOne({ _id: id })
    res.json(professorAtualizado)
  } catch (err) {
    next(err)
  }
}

export async function deleteProfessor(req, res, next) {
  try {
    const db = getDb()
    const id = new ObjectId(req.params.id)
    const result = await db.collection('professores').deleteOne({ _id: id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Professor não encontrado' })
    }
    res.json({ message: 'Professor removido com sucesso' })
  } catch (err) {
    next(err)
  }
}