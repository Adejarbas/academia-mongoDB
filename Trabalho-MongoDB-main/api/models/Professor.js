const mongoose = require('mongoose');

const professorSchema = new mongoose.Schema({
    nome: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    especialidade: String,
    telefone: String
});

module.exports = mongoose.model('Professor', professorSchema);