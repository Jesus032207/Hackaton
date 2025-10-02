import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';

// Configuración de variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_produccion_2024';

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-frontend.netlify.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lineas_profundizacion';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  });

// Esquemas de MongoDB
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'El usuario es requerido'], 
    unique: true,
    trim: true,
    minlength: [3, 'El usuario debe tener al menos 3 caracteres']
  },
  password: { 
    type: String, 
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  role: { 
    type: String, 
    enum: ['admin', 'student'], 
    default: 'student' 
  },
  fechaCreacion: { type: Date, default: Date.now }
});

const LineaSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  descripcion: { 
    type: String, 
    required: [true, 'La descripción es requerida'] 
  },
  coordinador: { 
    type: String, 
    required: [true, 'El coordinador es requerido'] 
  },
  estudiantes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  estado: { 
    type: String, 
    enum: ['activa', 'inactiva'], 
    default: 'activa' 
  },
  fechaCreacion: { type: Date, default: Date.now }
});

const InscripcionSchema = new mongoose.Schema({
  estudiante: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  linea: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Linea', 
    required: true 
  },
  fechaInscripcion: { type: Date, default: Date.now },
  estado: { 
    type: String, 
    enum: ['pendiente', 'aprobada', 'rechazada'], 
    default: 'pendiente' 
  }
});

// Índices compuestos para evitar duplicados
InscripcionSchema.index({ estudiante: 1, linea: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);
const Linea = mongoose.model('Linea', LineaSchema);
const Inscripcion = mongoose.model('Inscripcion', InscripcionSchema);

// Interfaces TypeScript
interface AuthRequest extends Request {
  user?: any;
}

// Middleware de autenticación
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token de acceso requerido' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Token inválido o expirado' 
      });
    }
    req.user = user;
    next();
  });
};

// Middleware de validación
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array()
    });
  }
  next();
};

// Rutas de autenticación
app.post('/api/auth/register', [
  body('username')
    .isLength({ min: 3 })
    .withMessage('El usuario debe tener al menos 3 caracteres')
    .isAlphanumeric()
    .withMessage('El usuario solo puede contener letras y números'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { username, password, role = 'student' } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'El usuario ya existe' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ 
      username, 
      password: hashedPassword, 
      role 
    });
    
    await user.save();

    res.status(201).json({ 
      success: true,
      message: 'Usuario creado exitosamente' 
    });
  } catch (error: any) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
});

app.post('/api/auth/login', [
  body('username')
    .notEmpty()
    .withMessage('El usuario es requerido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
});

// Ruta de salud
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Rutas CRUD para líneas de profundización
app.get('/api/lineas', async (req: Request, res: Response) => {
  try {
    const lineas = await Linea.find().populate('estudiantes', 'username');
    res.json({
      success: true,
      data: lineas,
      count: lineas.length
    });
  } catch (error: any) {
    console.error('Error obteniendo líneas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error obteniendo líneas de profundización' 
    });
  }
});

app.get('/api/lineas/:id', async (req: Request, res: Response) => {
  try {
    const linea = await Linea.findById(req.params.id).populate('estudiantes', 'username');
    if (!linea) {
      return res.status(404).json({ 
        success: false,
        message: 'Línea no encontrada' 
      });
    }
    res.json({
      success: true,
      data: linea
    });
  } catch (error: any) {
    console.error('Error obteniendo línea:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error obteniendo línea' 
    });
  }
});

app.post('/api/lineas', authenticateToken, [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido'),
  body('descripcion')
    .notEmpty()
    .withMessage('La descripción es requerida'),
  body('coordinador')
    .notEmpty()
    .withMessage('El coordinador es requerido')
], validateRequest, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'No autorizado. Se requiere rol de administrador' 
      });
    }

    const { nombre, descripcion, coordinador } = req.body;

    const linea = new Linea({ nombre, descripcion, coordinador });
    await linea.save();
    
    res.status(201).json({
      success: true,
      message: 'Línea creada exitosamente',
      data: linea
    });
  } catch (error: any) {
    console.error('Error creando línea:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creando línea de profundización' 
    });
  }
});

app.put('/api/lineas/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'No autorizado. Se requiere rol de administrador' 
      });
    }

    const { nombre, descripcion, coordinador, estado } = req.body;
    const linea = await Linea.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion, coordinador, estado },
      { new: true, runValidators: true }
    );

    if (!linea) {
      return res.status(404).json({ 
        success: false,
        message: 'Línea no encontrada' 
      });
    }

    res.json({
      success: true,
      message: 'Línea actualizada exitosamente',
      data: linea
    });
  } catch (error: any) {
    console.error('Error actualizando línea:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error actualizando línea' 
    });
  }
});

app.delete('/api/lineas/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'No autorizado. Se requiere rol de administrador' 
      });
    }

    const linea = await Linea.findByIdAndDelete(req.params.id);
    if (!linea) {
      return res.status(404).json({ 
        success: false,
        message: 'Línea no encontrada' 
      });
    }

    // Eliminar también las inscripciones asociadas
    await Inscripcion.deleteMany({ linea: req.params.id });

    res.json({
      success: true,
      message: 'Línea eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('Error eliminando línea:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error eliminando línea' 
    });
  }
});

// Rutas para inscripciones
app.get('/api/inscripciones', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    let query: any = {};
    
    // Si no es admin, solo puede ver sus propias inscripciones
    if (req.user.role !== 'admin') {
      query.estudiante = req.user.id;
    }

    const inscripciones = await Inscripcion.find(query)
      .populate('estudiante', 'username')
      .populate('linea', 'nombre descripcion coordinador')
      .sort({ fechaInscripcion: -1 });

    res.json({
      success: true,
      data: inscripciones,
      count: inscripciones.length
    });
  } catch (error: any) {
    console.error('Error obteniendo inscripciones:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error obteniendo inscripciones' 
    });
  }
});

app.post('/api/inscripciones', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { lineaId } = req.body;
    
    if (!lineaId) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de línea requerido' 
      });
    }

    // Verificar si la línea existe
    const linea = await Linea.findById(lineaId);
    if (!linea) {
      return res.status(404).json({ 
        success: false,
        message: 'Línea no encontrada' 
      });
    }

    // Verificar si ya está inscrito
    const inscripcionExistente = await Inscripcion.findOne({
      estudiante: req.user.id,
      linea: lineaId
    });

    if (inscripcionExistente) {
      return res.status(400).json({ 
        success: false,
        message: 'Ya estás inscrito en esta línea' 
      });
    }

    const inscripcion = new Inscripcion({
      estudiante: req.user.id,
      linea: lineaId
    });

    await inscripcion.save();
    await inscripcion.populate('linea', 'nombre descripcion coordinador');
    
    res.status(201).json({
      success: true,
      message: 'Inscripción realizada exitosamente',
      data: inscripcion
    });
  } catch (error: any) {
    console.error('Error creando inscripción:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Ya estás inscrito en esta línea' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error realizando inscripción' 
    });
  }
});

app.put('/api/inscripciones/:id/estado', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'No autorizado. Se requiere rol de administrador' 
      });
    }

    const { estado } = req.body;
    
    if (!['pendiente', 'aprobada', 'rechazada'].includes(estado)) {
      return res.status(400).json({ 
        success: false,
        message: 'Estado inválido' 
      });
    }

    const inscripcion = await Inscripcion.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    ).populate('estudiante', 'username').populate('linea', 'nombre');

    if (!inscripcion) {
      return res.status(404).json({ 
        success: false,
        message: 'Inscripción no encontrada' 
      });
    }

    res.json({
      success: true,
      message: 'Estado de inscripción actualizado',
      data: inscripcion
    });
  } catch (error: any) {
    console.error('Error actualizando inscripción:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error actualizando inscripción' 
    });
  }
});

// Middleware de manejo de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Ruta no encontrada
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Base de datos: ${MONGODB_URI}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
