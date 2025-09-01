# 🤖 Luis IA - Sistema CRM de Ventas Inteligente

Sistema de ventas con IA que combina Gemini AI y ElevenLabs para crear un vendedor virtual conversacional con CRM integrado.

## ✨ Características

- **🎙️ Conversación por voz**: Reconocimiento de voz en tiempo real
- **🧠 IA Avanzada**: Respuestas inteligentes con Gemini AI
- **🗣️ Voz Natural**: Síntesis de voz premium con ElevenLabs
- **📊 CRM Completo**: Base de datos de clientes y análisis
- **📈 Informes IA**: Análisis automático de conversaciones
- **🔍 Búsqueda Inteligente**: Filtros avanzados de clientes

## 🚀 Despliegue en Vercel

### 1. Preparar el Proyecto

Crea la siguiente estructura de archivos:

```
mi-proyecto/
├── index.html          # (tu archivo actual)
├── style.css           # (tu archivo actual)
├── script.js           # (usar el script actualizado)
├── package.json
├── vercel.json
├── .env.example
├── api/
│   ├── gemini.js
│   └── elevenlabs.js
└── README.md
```

### 2. Obtener Claves de API

#### **Gemini AI (Google)**
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta Google
3. Crea una nueva API key
4. Copia la clave generada

#### **ElevenLabs (Audio)**
1. Regístrate en [ElevenLabs](https://elevenlabs.io/)
2. Ve a [Speech Synthesis](https://elevenlabs.io/app/speech-synthesis)
3. En tu perfil, copia tu API Key
4. Opcional: En "Voices", copia el ID de voz que prefieras

### 3. Configurar Variables de Entorno

#### **Opción A: Desde la Web de Vercel**
1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Settings → Environment Variables
3. Agrega estas variables:

```bash
GEMINI_API_KEY=tu_clave_gemini_real
ELEVENLABS_API_KEY=tu_clave_elevenlabs_real
ELEVENLABS_VOICE_ID=ucWwAruuGtBeHfnAaKcJ
```

#### **Opción B: Archivo Local (para desarrollo)**
```bash
# Crea .env.local en la raíz del proyecto
cp .env.example .env.local

# Edita .env.local con tus claves reales
GEMINI_API_KEY=AIzaSyC...
ELEVENLABS_API_KEY=sk_461...
ELEVENLABS_VOICE_ID=ucWwA...
```

### 4. Desplegar en Vercel

#### **Método 1: GitHub (Recomendado)**
1. Sube tu proyecto a GitHub
2. Conecta el repositorio en [Vercel](https://vercel.com/new)
3. Vercel detectará automáticamente la configuración
4. Agrega las variables de entorno antes del despliegue

#### **Método 2: CLI de Vercel**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Inicializar y desplegar
vercel

# Seguir las instrucciones en pantalla
```

#### **Método 3: Drag & Drop**
1. Ve a [Vercel New Project](https://vercel.com/new)
2. Arrastra la carpeta del proyecto
3. Configura las variables de entorno
4. Deploy

### 5. Verificar el Despliegue

1. **Probar APIs**: Ve a `tu-dominio.vercel.app/api/gemini` (debería mostrar error 405, es normal)
2. **Abrir la App**: `tu-dominio.vercel.app`
3. **Probar Llamada**: Clic en "Iniciar Llamada" y habla

## 🔧 Solución de Problemas

### **Error: "API key no configurada"**
- Verifica que las variables de entorno estén correctamente configuradas en Vercel
- Asegúrate de que los nombres coincidan exactamente

### **Error: "Gemini API error"**
- Verifica que tu clave de Gemini sea válida
- Asegúrate de tener créditos/cuota disponible en Google AI

### **Error: "ElevenLabs API error"**  
- Verifica tu clave de ElevenLabs
- Comprueba tu plan (algunos planes tienen límites estrictos)
- Verifica que el Voice ID sea correcto

### **Error: "Micrófono no funciona"**
- El navegador debe tener permisos de micrófono
- Solo funciona en HTTPS (Vercel automáticamente usa HTTPS)
- Chrome y Firefox son los más compatibles

### **No se escucha audio**
- Verifica el volumen del navegador y sistema
- Algunos navegadores bloquean autoplay hasta interacción del usuario
- Si ElevenLabs falla, el sistema usa síntesis de voz del navegador

## 🎯 Uso de la Aplicación

1. **Iniciar**: Clic en "Iniciar Llamada"
2. **Hablar**: El micrófono se activa automáticamente
3. **Escuchar**: Luis IA responde con voz natural
4. **Navegar**: Usa las pestañas para CRM, búsquedas e informes

## 💡 Personalización

### **Cambiar Personalidad IA**
Edita el prompt en `api/gemini.js` línea ~30

### **Cambiar Voz**
1. Ve a [ElevenLabs Voices](https://elevenlabs.io/app/voices)
2. Copia el Voice ID que prefieras  
3. Actualiza `ELEVENLABS_VOICE_ID` en las variables de entorno

### **Modificar Productos**
Actualiza la sección "PRODUCTOS DESTACADOS" en `api/gemini.js`

## 📋 Estructura de APIs

### `/api/gemini` (POST)
```json
{
  "message": "string",
  "conversationHistory": [],
  "salesPhase": "string"
}
```

### `/api/elevenlabs` (POST)
```json
{
  "text": "string"
}
```

## 🔒 Seguridad

- ✅ Claves de API seguras en variables de entorno
- ✅ Validación de entrada en todas las APIs  
- ✅ Límites de caracteres para prevenir abuso
- ✅ CORS configurado correctamente
- ✅ Timeouts para prevenir cuelgues

## 📞 Soporte

¿Problemas con el despliegue? Verifica:

1. **Logs en Vercel**: Dashboard → Functions → View Logs
2. **Console del navegador**: F12 → Console (para errores de frontend)
3. **Network tab**: F12 → Network (para errores de API)

## 🎉 ¡Listo!

Tu sistema Luis IA debería estar funcionando en `https://tu-proyecto.vercel.app`

El sistema manejará automáticamente:
- Conversaciones fluidas por voz
- Respuestas inteligentes contextuales  
- CRM con base de datos local
- Informes automatizados con IA
- Búsqueda inteligente de clientes

¡Disfruta tu nuevo sistema de ventas con IA! 🚀