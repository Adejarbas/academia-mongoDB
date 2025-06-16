import mongoose from 'mongoose';

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
    exercicios: [String],
    duracao: { 
        type: Number, 
        required: true 
    }, // Campo inteiro (minutos)
    dificuldade: { 
        type: Number, 
        min: 1, 
        max: 10, 
        required: true 
    }, // Campo inteiro
    dataCriacao: { 
        type: Date, 
        default: Date.now 
    } // Campo data
});

export default mongoose.model('Treino', treinoSchema);