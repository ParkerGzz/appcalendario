# ✅ Pre-Commit Checklist - Verificación de Seguridad

## 🔒 Antes de hacer `git push`, verifica:

### **1. Verificar archivos a subir**

```bash
# Ver qué archivos se van a subir
git status

# Ver el contenido exacto que vas a subir
git diff --cached
```

### **2. Buscar API Keys accidentales**

```bash
# Buscar cualquier API Key de Google Maps
grep -r "AIzaSy" .

# Buscar en archivos staged
git diff --cached | grep -i "AIzaSy"
```

**Resultado esperado:** NINGUNA coincidencia (o solo en archivos ignorados).

### **3. Verificar .gitignore**

Archivos que **NUNCA** deben aparecer en `git status`:

- [ ] `config.js`
- [ ] `backend/.env`
- [ ] `HABILITAR-PLACES-API-NEW.md`
- [ ] `AUTOCOMPLETADO-CONFIGURADO.md`
- [ ] `SOLUCION-PROBLEMA-APIS.md`
- [ ] `CONFIGURACION-RAPIDA.md`
- [ ] `LEEME-PRIMERO.md`

Si aparecen, **NO HAGAS COMMIT**.

### **4. Archivos seguros para subir**

Estos archivos **SÍ** pueden subirse:

- [x] `config.example.js` (plantilla sin API Key)
- [x] `backend/.env.example` (plantilla sin API Key)
- [x] `app.js`, `index.html`, `styles.css` (código fuente)
- [x] `.gitignore`
- [x] `SECURITY.md`
- [x] `SETUP.md`
- [x] `README.md`

---

## 🚨 Si encontraste una API Key

### **Paso 1: NO HAGAS COMMIT**

```bash
# Deshacer el stage
git reset HEAD nombre-del-archivo
```

### **Paso 2: Agregar a .gitignore**

```bash
# Editar .gitignore
echo "nombre-del-archivo" >> .gitignore

# Remover del tracking
git rm --cached nombre-del-archivo

# Commit del gitignore actualizado
git add .gitignore
git commit -m "Add file to gitignore"
```

### **Paso 3: Verificar de nuevo**

```bash
grep -r "AIzaSy" .
git status
```

---

## ✅ Checklist Rápido

Antes de `git push`:

```bash
# 1. Buscar API Keys
grep -r "AIzaSy" . && echo "⚠️ API KEY ENCONTRADA" || echo "✅ Sin API Keys"

# 2. Ver archivos staged
git status | grep -E "(config.js|\.env|HABILITAR|AUTOCOMPLETADO|SOLUCION)" && echo "⚠️ ARCHIVO SENSIBLE" || echo "✅ Archivos seguros"

# 3. Ver contenido
git diff --cached | grep -i "AIzaSy" && echo "⚠️ API KEY EN COMMIT" || echo "✅ Commit seguro"
```

**Si todo dice** `✅`, puedes hacer push con confianza.

---

## 📝 Comando Seguro de Commit

```bash
# 1. Verificar
grep -r "AIzaSy" .
git status
git diff --cached

# 2. Si todo está bien, commit
git add <archivos-seguros>
git commit -m "Tu mensaje aquí"

# 3. Push
git push origin main
```

---

## 🆘 Si ya hiciste push con una API Key

### **ACCIÓN INMEDIATA:**

1. **Rotar la API Key** en Google Cloud Console:
   - https://console.cloud.google.com/apis/credentials
   - Regenerar o crear nueva key
   - Eliminar la comprometida

2. **Actualizar tu config.js local** con la nueva key

3. **Limpiar el commit:**
   ```bash
   git rm --cached config.js
   git commit -m "Remove API key from repository"
   git push --force
   ```

⚠️ La key comprometida seguirá en el historial antiguo - por eso es crítico ROTARLA.

---

## 💡 Tips

1. **Siempre revisa** con `git diff --cached` antes de commit
2. **Usa un alias** para verificación automática:
   ```bash
   # Agregar a ~/.bashrc o ~/.zshrc
   alias gitsafe='grep -r "AIzaSy" . && echo "⚠️ API KEY FOUND" || echo "✅ Safe to commit"'
   ```
3. **Configura un pre-commit hook** (automático):
   ```bash
   # En .git/hooks/pre-commit
   #!/bin/bash
   if git diff --cached | grep -i "AIzaSy"; then
     echo "⚠️ API Key detected in commit!"
     exit 1
   fi
   ```

---

**Usa esta checklist SIEMPRE antes de hacer push!**
