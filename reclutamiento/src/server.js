// server.js - Arranque del servidor de reclutamiento
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { openDb } from './db.js';
import { createApp } from './app.js';

// Carga .env si existe (sin dependencias)
const envFile = path.resolve('.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const env = process.env;
const dataDir = path.resolve(env.DATA_DIR || 'data');

let adminPassword = env.ADMIN_PASSWORD;
if (!adminPassword) {
  adminPassword = crypto.randomBytes(9).toString('base64url');
  console.warn(`⚠️  ADMIN_PASSWORD no está definida. Contraseña temporal del panel: ${adminPassword}`);
}

const app = createApp({
  db: openDb(path.join(dataDir, 'reclutamiento.db')),
  uploadDir: path.join(dataDir, 'cv'),
  config: {
    adminPassword,
    sessionSecret: env.SESSION_SECRET || adminPassword,
    companyName: env.COMPANY_NAME || 'Reclutamiento',
    timeZone: env.TIME_ZONE || 'America/Santiago',
    countryCode: env.DEFAULT_COUNTRY_CODE || '56',
    publicUrl: env.PUBLIC_URL || '',
    maxCvMb: Number(env.MAX_CV_MB) || 5,
  },
});

const port = Number(env.PORT) || 3100;
app.listen(port, () => {
  console.log(`✅ Reclutamiento en http://localhost:${port}`);
  console.log(`   Postulación: http://localhost:${port}/`);
  console.log(`   Panel:       http://localhost:${port}/admin`);
});
