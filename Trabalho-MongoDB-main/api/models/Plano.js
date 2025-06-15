const mongoose = require('mongoose');

const planoSchema = new mongoose.Schema({
    nome: { 
        type: String, 
        required: true 
    },
    descricao: String,
    preco: Number,
    duracaoMeses: Number
});

module.exports = mongoose.model('Plano', planoSchema);