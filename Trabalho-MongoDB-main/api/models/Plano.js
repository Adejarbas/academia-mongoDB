import mongoose from 'mongoose';

const planoSchema = new mongoose.Schema({
    nome: { 
        type: String, 
        required: true 
    },
    descricao: String,
    preco: { 
        type: Number, 
        required: true 
    }, // Campo decimal
    duracaoMeses: { 
        type: Number, 
        required: true 
    }, // Campo inteiro
    dataInicio: { 
        type: Date, 
        default: Date.now 
    }, // Campo data
    ativo: { 
        type: Boolean, 
        default: true 
    },
    beneficios: [String] // Array de benefícios
});

export default mongoose.model('Plano', planoSchema);