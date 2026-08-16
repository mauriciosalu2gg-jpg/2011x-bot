# 🩸 2011X Discord Bot

Bot de Discord con Inteligencia Artificial inspirado en **2011X (Outcome Memories / Roblox)**, equipado con persistencia en **Firebase Realtime Database** y motor de memoria asíncrono.

## 🚀 Características
- **Personalidad 2011X**: Sarcástico, frío, mordaz, elocuente y con actitud de superioridad en Discord, sin roleplay teatral ni acotaciones narrativas innecesarias.
- **Animación de Escritura Fluida**: Simulación de escritura por palabras completas y progresivas en Discord.
- **Memoria Distribuida en Tiempo Real**: Almacena historiales de chat, preferencias y hechos de usuario en Firebase Realtime Database.
- **Motor de Memoria con IA en Segundo Plano**: Extracción asíncrona de hechos y síntesis contextual sin ralentizar la respuesta principal.
- **Servidor Web Express Integrado**: Inicio inmediato en `$PORT` listo para Render Web Service.
- **Slash Commands**: `/ping`, `/memoria`, `/olvidar`, `/estado`.

## ⚙️ Variables de Entorno
Configura estas variables en Render o en tu archivo `.env`:
```env
DISCORD_TOKEN=...
DISCORD_CLIENT_ID=...
OWNER_DISCORD_ID=...
FIREBASE_PROJECT_ID=alero-company-works
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_DATABASE_URL=https://alero-company-works-default-rtdb.firebaseio.com
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
```
