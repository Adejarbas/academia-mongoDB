import mongoose from 'mongoose';

const alunoSchema = new mongoose.Schema({
    nome: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    dataNascimento: { 
        type: Date, 
        required: true 
    },
    telefone: { 
        type: String, 
        required: true 
    },
    idade: { 
        type: Number, 
        required: true 
    }, // Inteiro
    peso: { 
        type: Number, 
        required: true 
    }, // Decimal
    endereco: String,
    plano: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plano' 
    },
    treinos: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Treino' 
    }]
});

const Aluno = mongoose.model('Aluno', alunoSchema);
export default Aluno;