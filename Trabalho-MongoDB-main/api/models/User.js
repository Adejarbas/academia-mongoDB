import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

class User {
  constructor(userData) {
    this.name = userData.name;
    this.email = userData.email;
    this.password = userData.password;
    this.role = userData.role || 'user';
    this.createdAt = userData.createdAt || new Date();
  }
  static async getCollection() {
    const { getDb } = await import('../config/db.js');
    const db = getDb();
    return db.collection('users');
  }

  async save() {
    const collection = await User.getCollection();
    
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    
    const result = await collection.insertOne(this);
    return { ...this, _id: result.insertedId };
  }

  static async findById(id) {
    const collection = await User.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async findByEmail(email) {
    const collection = await User.getCollection();
    return await collection.findOne({ email });
  }

  static async findAll() {
    const collection = await User.getCollection();
    return await collection.find({}).toArray();
  }

  static async updateById(id, updateData) {
    const collection = await User.getCollection();
    
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    return await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
  }

  static async deleteById(id) {
    const collection = await User.getCollection();
    return await collection.deleteOne({ _id: new ObjectId(id) });
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
}

export default User;