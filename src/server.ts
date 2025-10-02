import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/lineas_profundizacion')
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Esquemas de MongoDB
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], default: 'student' }
});

const LineaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  coordinador: { type: String, required: true },
  estudiantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  estado: { type: String, enum: ['activa', 'inactiva'], default: 'activa' }
});

const InscripcionSchema = new mongoose.Schema({
  estudiante: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  linea: { type: mongoose.Schema.Types.ObjectId, ref: 'Linea', required: true },
  fechaInscripcion: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pendiente', 'aprobada', 'rechazada'], default: 'pendiente' }
});

const User = mongoose.model('User', UserSchema);
const Linea = mongoose.model('Linea', LineaSchema);
const Inscripcion = mongoose.model('Inscripcion', InscripcionSchema);

// Middleware de autenticación
interface AuthRequest extends Request {
  user?: any;
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Rutas de autenticación
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });
    await user.save();

    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Rutas CRUD para líneas de profundización
app.get('/api/lineas', async (req: Request, res: Response) => {
  try {
    const lineas = await Linea.find().populate('estudiantes', 'username');
    res.json(lineas);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo líneas' });
  }
});

app.get('/api/lineas/:id', async (req: Request, res: Response) => {
  try {
    const linea = await Linea.findById(req.params.id).populate('estudiantes', 'username');
    if (!linea) {
      return res.status(404).json({ message: 'Línea no encontrada' });
    }
    res.json(linea);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo línea' });
  }
});

app.post('/api/lineas', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { nombre, descripcion, coordinador } = req.body;
    
    if (!nombre || !descripcion || !coordinador) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const linea = new Linea({ nombre, descripcion, coordinador });
    await linea.save();
    
    res.status(201).json(linea);
  } catch (error) {
    res.status(500).json({ message: 'Error creando línea' });
  }
});

app.put('/api/lineas/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { nombre, descripcion, coordinador, estado } = req.body;
    const linea = await Linea.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion, coordinador, estado },
      { new: true }
    );

    if (!linea) {
      return res.status(404).json({ message: 'Línea no encontrada' });
    }

    res.json(linea);
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando línea' });
  }
});

app.delete('/api/lineas/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const linea = await Linea.findByIdAndDelete(req.params.id);
    if (!linea) {
      return res.status(404).json({ message: 'Línea no encontrada' });
    }

    res.json({ message: 'Línea eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando línea' });
  }
});

// Manejo de excepciones global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo salió mal!' });
});

// Ruta no encontrada
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});