#!/bin/bash

echo "🚀 Iniciando Backend del Calendario Inteligente"
echo ""

# Ir al directorio del backend
cd backend

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias (primera vez)..."
    npm install
    echo ""
fi

# Verificar si .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: No existe archivo .env"
    echo "Por favor configura backend/.env con tu GMAPS_SERVER_KEY"
    echo ""
fi

# Iniciar servidor
echo "✅ Iniciando servidor en puerto 3000..."
echo "Presiona Ctrl+C para detener"
echo ""
npm start
