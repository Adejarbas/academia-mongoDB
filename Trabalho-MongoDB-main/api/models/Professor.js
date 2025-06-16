import mongoose from 'mongoose';

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
    especialidade: { 
        type: String, 
        required: true 
    },
    telefone: String,
    dataContratacao: { 
        type: Date, 
        default: Date.now 
    }, // Campo data
    salario: { 
        type: Number, 
        required: true 
    }, // Campo decimal
    ativo: { 
        type: Boolean, 
        default: true 
    }
});

export default mongoose.model('Professor', professorSchema);