import { check, param, validationResult } from "express-validator";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";

// Middleware para verificar resultados da validação
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: true,
            message: "Erro de validação",
            errors: errors.array()
        });
    }
    next();
};

// Validar ObjectId
export const validateObjectId = [
    param("id").isMongoId().withMessage("Formato de ID inválido"),
    validateRequest
];

// Validações para Aluno
export const validateAluno = [
    check("nome")
        .notEmpty()
        .withMessage("O nome é obrigatório")
        .isLength({ min: 3, max: 100 })
        .withMessage("O nome deve ter entre 3 e 100 caracteres")
        .matches(/^[A-Za-zÀ-ú\s]+$/)
        .withMessage("O nome deve conter apenas letras e espaços"),

    check("email")
        .notEmpty()
        .withMessage("O email é obrigatório")
        .isEmail()
        .withMessage("Email inválido")
        .custom(async (email, { req }) => {
            const db = getDb();
            const query = { email };
            
            if (req.params.id) {
                query._id = { $ne: new ObjectId(req.params.id) };
            }

            const existe = await db.collection("alunos").countDocuments(query);
            if (existe > 0) {
                throw new Error("Este email já está cadastrado");
            }
            return true;
        }),

    check("telefone")
        .notEmpty()
        .withMessage("O telefone é obrigatório")
        .matches(/^\d{10,11}$/)
        .withMessage("Telefone deve ter 10 ou 11 dígitos"),

    check("dataNascimento")
        .notEmpty()
        .withMessage("A data de nascimento é obrigatória")
        .isISO8601()
        .withMessage("Data de nascimento inválida"),

    check("idade")
        .notEmpty()
        .withMessage("A idade é obrigatória")
        .isInt({ min: 0 })
        .withMessage("Idade deve ser um número inteiro positivo"),

    check("peso")
        .notEmpty()
        .withMessage("O peso é obrigatório")
        .isFloat({ min: 0 })
        .withMessage("Peso deve ser um número decimal positivo"),

    validateRequest
];

// Validações para Professor
export const validateProfessor = [
    check("nome")
        .notEmpty()
        .withMessage("O nome é obrigatório")
        .isLength({ min: 3, max: 100 })
        .withMessage("O nome deve ter entre 3 e 100 caracteres"),

    check("email")
        .notEmpty()
        .withMessage("O email é obrigatório")
        .isEmail()
        .withMessage("Email inválido")
        .custom(async (email, { req }) => {
            const db = getDb();
            const query = { email };
            
            if (req.params.id) {
                query._id = { $ne: new ObjectId(req.params.id) };
            }

            const existe = await db.collection("professores").countDocuments(query);
            if (existe > 0) {
                throw new Error("Este email já está cadastrado");
            }
            return true;
        }),

    check("especialidade")
        .notEmpty()
        .withMessage("A especialidade é obrigatória"),

    check("telefone")
        .optional({ checkFalsy: true })
        .isLength({ min: 10 })
        .withMessage("Telefone deve ter pelo menos 10 dígitos"),

    check("salario")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("O salário deve ser um número decimal positivo"),

    validateRequest
];

// Validações para Treino
export const validateTreino = [
    check("nome")
        .notEmpty()
        .withMessage("O nome é obrigatório")
        .isLength({ min: 3, max: 100 })
        .withMessage("O nome deve ter entre 3 e 100 caracteres"),

    check("exercicios")
        .isArray()
        .withMessage("Exercícios deve ser um array")
        .notEmpty()
        .withMessage("Deve haver pelo menos um exercício"),

    check("duracao")
        .optional()
        .isInt({ min: 1 })
        .withMessage("A duração deve ser um número inteiro positivo (em minutos)"),

    check("dificuldade")
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage("A dificuldade deve ser um número inteiro entre 1 e 10"),

    check("professor")
        .optional()
        .isMongoId()
        .withMessage("ID do professor inválido"),

    check("aluno")
        .optional()
        .isMongoId()
        .withMessage("ID do aluno inválido"),

    check("descricao")
        .optional()
        .isLength({ max: 500 })
        .withMessage("A descrição deve ter no máximo 500 caracteres"),

    validateRequest
];

// Validações para Plano
export const validatePlano = [
    check("nome")
        .notEmpty()
        .withMessage("O nome é obrigatório")
        .isLength({ min: 3, max: 100 })
        .withMessage("O nome deve ter entre 3 e 100 caracteres"),

    check("preco")
        .notEmpty()
        .withMessage("O preço é obrigatório")
        .isFloat({ min: 0 })
        .withMessage("O preço deve ser um número positivo"),

    check("duracaoMeses")
        .notEmpty()
        .withMessage("A duração é obrigatória")
        .isInt({ min: 1 })
        .withMessage("A duração deve ser um número inteiro positivo"),

    validateRequest
];

// Validações para Autenticação
export const validateAuth = [
    check("name")
        .notEmpty()
        .withMessage("O nome é obrigatório")
        .isLength({ min: 2, max: 100 })
        .withMessage("O nome deve ter entre 2 e 100 caracteres"),

    check("email")
        .notEmpty()
        .withMessage("O email é obrigatório")
        .isEmail()
        .withMessage("Email inválido")
        .custom(async (email, { req }) => {
            const db = getDb();
            const existe = await db.collection("users").countDocuments({ email });
            if (existe > 0) {
                throw new Error("Este email já está cadastrado");
            }
            return true;
        }),

    check("password")
        .notEmpty()
        .withMessage("A senha é obrigatória")
        .isLength({ min: 6 })
        .withMessage("A senha deve ter pelo menos 6 caracteres"),

    validateRequest
];

// Validações para Login
export const validateLogin = [
    check("email")
        .notEmpty()
        .withMessage("O email é obrigatório")
        .isEmail()
        .withMessage("Email inválido"),

    check("password")
        .notEmpty()
        .withMessage("A senha é obrigatória"),

    validateRequest
];