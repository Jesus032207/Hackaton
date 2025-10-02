import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Linea } from './models/Linea';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lineas_profundizacion');
    
    // Limpiar base de datos
    await User.deleteMany({});
    await Linea.deleteMany({});

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });
    await adminUser.save();

    // Crear líneas de profundización
    const lineas = [
      {
        nombre: 'Desarrollo de Software',
        descripcion: 'Enfocada en metodologías ágiles, arquitecturas modernas y mejores prácticas de desarrollo',
        coordinador: 'Dr. Carlos Rodríguez'
      },
      {
        nombre: 'Ciberseguridad',
        descripcion: 'Especialización en protección de sistemas, análisis de vulnerabilidades y seguridad ofensiva',
        coordinador: 'Dra. María González'
      },
      {
        nombre: 'Ciencia de Datos e IA',
        descripcion: 'Enfoque en machine learning, análisis de datos y sistemas inteligentes',
        coordinador: 'Dr. Luis Fernández'
      },
      {
        nombre: 'Infraestructura y Cloud',
        descripcion: 'Administración de sistemas, redes y computación en la nube',
        coordinador: 'Ing. Ana Martínez'
      }
    ];

    await Linea.insertMany(lineas);

    console.log('Base de datos inicializada con datos de ejemplo');
    process.exit(0);
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    process.exit(1);
  }
};

seedDatabase();