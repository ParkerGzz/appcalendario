# 🚀 Setup Rápido - Backend

Guía de instalación rápida para el backend en **5 minutos**.

## Opción 1: Docker (Más Fácil) ⚡

### Paso 1: Instalar Docker
```bash
# macOS
brew install --cask docker

# Windows/Linux
# Descargar de: https://www.docker.com/get-started
```

### Paso 2: Iniciar Servicios
```bash
cd backend

# Iniciar PostgreSQL + Redis + pgAdmin + Redis Commander
docker-compose up -d

# Verificar que estén corriendo
docker-compose ps
```

Servicios disponibles:
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **pgAdmin**: http://localhost:5050 (admin@calendario.com / admin)
- **Redis Commander**: http://localhost:8081

### Paso 3: Configurar Backend
```bash
# Copiar configuración
cp .env.example .env

# Editar .env (opcional, los valores por defecto funcionan con Docker)
nano .env
```

### Paso 4: Instalar Dependencias
```bash
npm install
```

### Paso 5: Iniciar Backend
```bash
npm run start:dev
```

✅ Backend corriendo en: http://localhost:3000

---

## Opción 2: Instalación Local (Sin Docker)

### macOS

```bash
# 1. Instalar Homebrew (si no lo tienes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Instalar PostgreSQL y Redis
brew install postgresql@15 redis

# 3. Iniciar servicios
brew services start postgresql@15
brew services start redis

# 4. Crear base de datos
createdb calendario_inteligente

# 5. Ejecutar schema
psql -U $(whoami) -d calendario_inteligente -f ../database-schema.sql

# 6. Configurar backend
cd backend
cp .env.example .env
# Editar .env si es necesario

# 7. Instalar dependencias
npm install

# 8. Iniciar
npm run start:dev
```

### Ubuntu/Debian

```bash
# 1. Actualizar paquetes
sudo apt update

# 2. Instalar PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install postgresql-15

# 3. Instalar Redis
sudo apt install redis-server

# 4. Iniciar servicios
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo systemctl enable postgresql
sudo systemctl enable redis-server

# 5. Crear base de datos
sudo -u postgres createdb calendario_inteligente

# 6. Ejecutar schema
sudo -u postgres psql -d calendario_inteligente -f ../database-schema.sql

# 7. Configurar backend
cd backend
cp .env.example .env

# Editar .env (cambiar DB_USERNAME si es necesario)
nano .env

# 8. Instalar dependencias
npm install

# 9. Iniciar
npm run start:dev
```

### Windows

```bash
# 1. Instalar Node.js 18+ desde:
# https://nodejs.org/

# 2. Instalar PostgreSQL 15 desde:
# https://www.postgresql.org/download/windows/

# 3. Instalar Redis desde:
# https://github.com/tporadowski/redis/releases
# O usar WSL2 + Docker

# 4. Abrir pgAdmin (instalado con PostgreSQL)
# Crear database: calendario_inteligente

# 5. Ejecutar schema
# En pgAdmin, abrir Query Tool y ejecutar ../database-schema.sql

# 6. Configurar backend
cd backend
copy .env.example .env
# Editar .env con Notepad o VS Code

# 7. Instalar dependencias
npm install

# 8. Iniciar
npm run start:dev
```

---

## Verificar Instalación ✅

### 1. PostgreSQL
```bash
psql -U postgres -d calendario_inteligente -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Debe retornar: ~10 tablas
```

### 2. Redis
```bash
redis-cli ping

# Debe retornar: PONG
```

### 3. Backend
```bash
curl http://localhost:3000/api/health

# Debe retornar: {"status":"ok","database":"connected","redis":"connected"}
```

---

## Configurar OAuth (Siguiente Paso)

Para habilitar sincronización con Google Calendar:

### 1. Google Cloud Console

```
1. Ve a: https://console.cloud.google.com
2. Crea un proyecto nuevo
3. Habilita "Google Calendar API"
4. Ve a "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Tipo: Web application
6. Redirect URI: http://localhost:3000/api/auth/google/callback
7. Copia Client ID y Client Secret
```

### 2. Actualizar .env

```bash
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

### 3. Reiniciar Backend

```bash
# Ctrl+C para detener
npm run start:dev
```

---

## Scripts Útiles 📝

```bash
# Desarrollo con hot-reload
npm run start:dev

# Build para producción
npm run build

# Ejecutar en producción
npm run start:prod

# Linter
npm run lint

# Tests
npm run test

# Ver logs de Docker
docker-compose logs -f

# Detener servicios Docker
docker-compose down

# Detener y eliminar datos
docker-compose down -v

# Resetear base de datos
docker-compose down -v
docker-compose up -d
npm run migration:run
```

---

## Troubleshooting 🔧

### Error: "ECONNREFUSED 127.0.0.1:5432"

PostgreSQL no está corriendo:
```bash
# Docker
docker-compose up -d postgres

# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Error: "ECONNREFUSED 127.0.0.1:6379"

Redis no está corriendo:
```bash
# Docker
docker-compose up -d redis

# macOS
brew services start redis

# Linux
sudo systemctl start redis-server
```

### Error: "relation does not exist"

Schema no aplicado:
```bash
psql -U postgres -d calendario_inteligente -f ../database-schema.sql
```

### Resetear Todo

```bash
# Con Docker
docker-compose down -v
docker-compose up -d
cd backend
psql -h localhost -U postgres -d calendario_inteligente -f ../database-schema.sql

# Sin Docker
dropdb calendario_inteligente
createdb calendario_inteligente
psql -U postgres -d calendario_inteligente -f ../database-schema.sql
```

---

## Próximos Pasos 🎯

1. ✅ Backend funcionando
2. ⏭️ Configurar OAuth de Google/Microsoft
3. ⏭️ Crear primer usuario
4. ⏭️ Conectar frontend al backend
5. ⏭️ Sincronizar primer calendario

Ver [README.md](README.md) para más detalles.
