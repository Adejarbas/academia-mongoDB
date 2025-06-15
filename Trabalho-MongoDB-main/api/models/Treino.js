const mongoose = require('mongoose');

const treinoSchema = new mongoose.Schema({
    nome: { 
        type: String, 
        required: true 
    },
    descricao: String,
    professor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Professor' 
    },
    exercicios: [String]
});

module.exports = mongoose.model('Treino', treinoSchema);