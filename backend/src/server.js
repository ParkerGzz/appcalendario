// server.js - Main Express server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routesRouter from './routes/routes.js';
import trafficRouter from './routes/traffic.js';
import placesRouter from './routes/places.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Verificar que la API key esté configurada
if (!process.env.GMAPS_SERVER_KEY) {
  console.error('❌ ERROR: GMAPS_SERVER_KEY no está configurada en .env');
  process.exit(1);
}

// Middleware - CORS configurado para permitir acceso desde cualquier origen
app.use(cors({
  origin: process.env.CORS_ORIGINS === '*' ? '*' : (process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8000']),
  credentials: process.env.CORS_ORIGINS === '*' ? false : true
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Calendario Backend',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api', routesRouter);
app.use('/api', trafficRouter);
app.use('/api', placesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

// Start server - Escuchar en todas las interfaces (0.0.0.0)
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log('');
  console.log('🚀 ================================');
  console.log('🚀 Calendario Backend iniciado');
  console.log('🚀 ================================');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 Host: ${HOST}`);
  console.log(`🌐 URL Local: http://localhost:${PORT}`);
  console.log(`🌍 URL Red: http://<TU_IP>:${PORT}`);
  console.log(`🔑 Google Maps API: ${process.env.GMAPS_SERVER_KEY ? '✅ Configurada' : '❌ NO configurada'}`);
  console.log('');
  console.log('📚 Endpoints disponibles:');
  console.log('   GET  /health                      - Health check');
  console.log('   POST /api/route                   - Routes API (computeRoutes)');
  console.log('   POST /api/traffic-matrix          - Distance Matrix (con tráfico)');
  console.log('   POST /api/calculate-detour        - Calcular desvío con parada');
  console.log('   POST /api/places-along-route      - Places a lo largo de ruta');
  console.log('   POST /api/places-nearby           - Places cerca de un punto');
  console.log('   GET  /api/category-types/:cat     - Tipos de Google por categoría');
  console.log('');
  console.log('💡 Modo:', process.env.NODE_ENV || 'development');
  console.log('');
});

export default app;
