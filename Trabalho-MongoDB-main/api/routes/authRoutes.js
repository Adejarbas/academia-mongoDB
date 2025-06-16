import express from 'express'
import { login, register } from '../controllers/authController.js'
import { validateAuth, validateLogin } from '../middlewares/validations.js'

const router = express.Router()

router.post('/login', validateLogin, login)
router.post('/register', validateAuth, register)

export default router
