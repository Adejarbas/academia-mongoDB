import express from 'express'
import { login, register } from '../controllers/authController.js'
import { validateAuth, validateLogin } from '../middlewares/validations.js'

const router = express.Router()

router.post('/login', 
  // #swagger.summary = 'Fazer Login'
  // #swagger.description = 'Autentica usuário e retorna token JWT válido por 7 dias'
  validateLogin, 
  login
)

router.post('/register', 
  // #swagger.summary = 'Registrar Usuário'
  // #swagger.description = 'Cria novo usuário no sistema com senha criptografada'
  validateAuth, 
  register
)

export default router
