# FINZN - Tu Compañero Financiero Inteligente

Una aplicación web moderna para gestionar tus finanzas personales de manera simple y divertida.

## 🚀 Características

- **Gestión de Gastos**: Registra y categoriza tus gastos con facilidad
- **Seguimiento de Ingresos**: Maneja ingresos fijos y extras
- **Objetivos de Ahorro**: Establece y sigue tus metas financieras
- **Cuotas y Pagos**: Gestiona gastos en cuotas automáticamente
- **Límites de Gasto**: Establece límites por categoría con alertas inteligentes
- **Reportes Inteligentes**: Análisis detallados con IA
- **Chat Asistente**: Consejos financieros personalizados
- **Logros**: Sistema de gamificación para motivar buenos hábitos

## 🛠️ Tecnologías

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Supabase (Base de datos y autenticación)
- **Funciones**: Netlify Functions
- **IA**: Google Gemini API
- **Build Tool**: Vite
- **Hosting**: Netlify

## 📋 Configuración

### 1. Configurar Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ejecuta el script SQL en `supabase/migrations/001_initial_schema.sql`
4. Obtén tu Project URL y anon key

### 2. Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
VITE_SUPABASE_URL=tu_supabase_project_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
GEMINI_API_KEY=tu_gemini_api_key
```

### 3. Instalación Local

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🚀 Despliegue en Netlify

1. Conecta tu repositorio de Git a Netlify
2. Configura las variables de entorno en Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
3. Netlify detectará automáticamente la configuración de `netlify.toml`

## 📊 Estructura de la Base de Datos

- `user_profiles`: Perfiles de usuario
- `categories`: Categorías de gastos personalizables
- `expenses`: Registro de gastos con soporte para cuotas
- `income`: Ingresos fijos y extras por mes
- `extra_incomes`: Detalle de ingresos adicionales
- `goals`: Objetivos de ahorro
- `spending_limits`: Límites de gasto por categoría
- `achievements`: Sistema de logros
- `monthly_savings`: Ahorros acumulados por mes

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Autenticación segura con Supabase Auth
- Variables de entorno para claves sensibles
- Políticas de acceso granulares

## 🤖 Funcionalidades de IA

- Análisis financiero personalizado
- Recomendaciones inteligentes
- Chat asistente con consejos financieros
- Detección de patrones de gasto

## 📱 Características de UX

- Diseño responsive
- Tema claro/oscuro
- Animaciones suaves
- Interfaz intuitiva
- Mascota interactiva

## 🎯 Próximas Funcionalidades

- [ ] Exportación de datos avanzada
- [ ] Integración con bancos
- [ ] Notificaciones push
- [ ] Modo offline
- [ ] Análisis predictivo

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Si tienes preguntas o necesitas ayuda, puedes:

- Abrir un issue en GitHub
- Contactar al equipo de desarrollo

---

Hecho con ❤️ para ayudarte a alcanzar tus metas financieras.