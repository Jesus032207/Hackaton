import { body } from 'express-validator';

export const registerValidator = [
  body('username')
    .isLength({ min: 3 })
    .withMessage('El usuario debe tener al menos 3 caracteres')
    .isAlphanumeric()
    .withMessage('El usuario solo puede contener letras y números'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
];

export const loginValidator = [
  body('username')
    .notEmpty()
    .withMessage('El usuario es requerido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];