#!/bin/bash

# Script para iniciar el Calendario Inteligente
# Uso: ./start-all.sh

echo "🚀 Iniciando Calendario Inteligente..."
echo ""

# Obtener IP local
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "📍 Tu IP local es: $IP"
echo ""

# Iniciar backend en background
echo "🔧 Iniciando backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Esperar a que el backend inicie
sleep 3

# Iniciar servidor HTTP para frontend
echo "🌐 Iniciando frontend..."
python3 -m http.server 8000 &
FRONTEND_PID=$!

echo ""
echo "✅ Aplicación iniciada correctamente!"
echo ""
echo "📱 Accede desde:"
echo "   - Este dispositivo: http://localhost:8000"
echo "   - Misma WiFi: http://$IP:8000"
echo "   - Backend: http://$IP:3000"
echo ""
echo "⏹  Para detener, presiona Ctrl+C"
echo ""

# Esperar a que el usuario presione Ctrl+C
trap "echo ''; echo '🛑 Deteniendo servicios...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Mantener el script corriendo
wait
