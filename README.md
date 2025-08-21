# FINZN - Tu Compañero Financiero Inteligente 🤖💰

<p align="center">
  <img src="public/isotipo.png" alt="FINZN Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Una aplicación web moderna para la gestión inteligente de finanzas personales con integración de Inteligencia Artificial</strong>
</p>

<p align="center">
  <a href="https://finzn.netlify.app">🌐 Demo en Vivo</a> |
  <a href="#características">✨ Características</a> |
  <a href="#tecnologías">🛠 Tecnologías</a> |
  <a href="#instalación">⚙️ Instalación</a>
</p>

---

## 📖 Descripción

**FINZN** es una aplicación web completa de gestión financiera personal que combina funcionalidades tradicionales de control de gastos e ingresos con capacidades avanzadas de **Inteligencia Artificial** y **Machine Learning**. Diseñada para ayudar a los usuarios a tomar decisiones financieras más inteligentes mediante análisis automatizados, predicciones de gastos y recomendaciones personalizadas.

### 🎯 Objetivo

Democratizar el acceso a herramientas financieras avanzadas, proporcionando a cualquier persona las capacidades de análisis que tradicionalmente solo tenían los asesores financieros profesionales.

---

## ✨ Características

### 📊 **Gestión Financiera Core**
- **Dashboard Interactivo**: Vista consolidada de balance, ingresos y gastos
- **Gestión de Transacciones**: Registro detallado de gastos e ingresos con categorización automática
- **Sincronización Automática via API**: Conexión directa con bancos y servicios financieros para importar transacciones automáticamente
- **Sistema de Cuotas**: Manejo inteligente de compras en cuotas con cálculo de intereses
- **Objetivos de Ahorro**: Creación y seguimiento de metas financieras personalizadas
- **Presupuestos Inteligentes**: Configuración de límites de gasto por categoría con alertas automáticas
- **Calendario Financiero**: Planificación y seguimiento de eventos financieros importantes

### 🤖 **Inteligencia Artificial Integrada**
- **Chat Asistente IA**: Asesor financiero virtual disponible 24/7 con respuestas personalizadas
- **Análisis Predictivo**: Modelo de Machine Learning con TensorFlow.js para predecir gastos futuros
- **Recomendaciones Automáticas**: Sugerencias personalizadas para optimizar presupuestos
- **Reportes IA**: Generación automática de informes financieros detallados con análisis profundo
- **Detección de Patrones**: Identificación automática de comportamientos de gasto y tendencias
- **Optimización de Presupuestos**: Recomendaciones basadas en IA para mejores decisiones financieras

### 📈 **Analytics y Visualización**
- **Gráficos Interactivos**: Visualización de datos con Chart.js
- **Análisis de Tendencias**: Seguimiento de patrones de gasto a lo largo del tiempo
- **Distribución por Categorías**: Análisis detallado del destino de los gastos
- **Métricas Clave**: KPIs financieros calculados automáticamente
- **Exportación de Datos**: Descarga de informes en CSV y HTML

### 🔒 **Seguridad y Privacidad**
- **Autenticación Segura**: Sistema de usuarios con Supabase
- **APIs Seguras**: Todas las llamadas a IA se realizan a través de funciones serverless seguras
- **Sin Exposición de Claves**: API keys protegidas en el servidor, nunca expuestas en el cliente
- **Validación de Datos**: Sanitización completa de inputs del usuario
- **Almacenamiento Seguro**: Base de datos PostgreSQL con Row Level Security

### 🎨 **Experiencia de Usuario**
- **Diseño Responsivo**: Optimizado para desktop, tablet y móvil
- **Tema Oscuro/Claro**: Interfaz adaptable según preferencias del usuario
- **Animaciones Fluidas**: Transiciones y efectos visuales modernos
- **Navegación Intuitiva**: UX diseñada para facilidad de uso
- **Accesibilidad**: Cumple con estándares de accesibilidad web

---

## 🛠 Tecnologías

### **Frontend**
- **Vanilla JavaScript (ES6+)**: Lógica de aplicación modular y eficiente
- **HTML5 & CSS3**: Estructura semántica y estilos modernos
- **Vite**: Bundler rápido para desarrollo y build optimizado
- **Chart.js**: Biblioteca de visualización de datos
- **Phosphor Icons**: Sistema de iconografía consistente

### **Backend & Database**
- **Supabase**: Backend-as-a-Service con PostgreSQL
- **Netlify Functions**: Funciones serverless para APIs seguras
- **Row Level Security**: Seguridad a nivel de base de datos

### **Inteligencia Artificial**
- **Google Gemini AI**: Modelo de lenguaje para chat y análisis
- **TensorFlow.js**: Machine Learning en el navegador
- **Análisis Predictivo**: Algoritmos propios para predicción de gastos

### **Herramientas de Desarrollo**
- **Git**: Control de versiones
- **Netlify**: Hosting y CI/CD
- **ESLint**: Linting de código JavaScript
- **Responsive Design**: CSS Grid y Flexbox

---

## ⚙️ Instalación

### **Prerrequisitos**
- Node.js (v16 or superior)
- npm o yarn
- Cuenta en Supabase
- API Key de Google Gemini (opcional, funciona con fallbacks)

### **Pasos de Instalación**

1. **Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/FINZN1.git
cd FINZN1
```

2. **Instalar Dependencias**
```bash
npm install
```

3. **Configurar Variables de Entorno**

Crear archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_supabase
GEMINI_API_KEY=tu_api_key_gemini
```

4. **Configurar Base de Datos**

Ejecutar las migraciones SQL en Supabase (archivos en `/supabase/migrations/`)

5. **Ejecutar en Desarrollo**
```bash
npm run dev
```

6. **Build para Producción**
```bash
npm run build
```

---

## 🚀 Uso

### **Registro e Inicio de Sesión**
1. Crear cuenta con email y contraseña
2. Completar perfil personal
3. Acceder al dashboard principal

### **Gestión Básica**
1. **Agregar Gastos**: Usar botones + en el dashboard o sección transacciones
2. **Registrar Ingresos**: Configurar ingresos fijos y extras
3. **Crear Objetivos**: Establecer metas de ahorro con montos y fechas
4. **Configurar Presupuestos**: Definir límites por categoría

### **Funciones Avanzadas**
1. **Chat IA**: Hacer clic en el robot para consultas financieras
2. **Análisis IA**: Generar reportes automáticos desde la sección Reportes
3. **Predicciones ML**: Activar análisis predictivo en Presupuestos
4. **Calendario**: Planificar eventos financieros futuros

### **Integración Automática (Próximamente)**
1. **Conexión Bancaria**: Vincular cuentas bancarias para importar movimientos automáticamente
2. **Wallets Digitales**: Sincronizar con Mercado Pago, Ualá, Brubank y otras fintech
3. **Tarjetas de Crédito**: Importación automática de gastos y resúmenes
4. **Categorización IA**: Clasificación automática de transacciones importadas

---

## 🔗 API de Integración Automática (En Desarrollo)

**FINZN** está desarrollando un sistema completo de APIs para automatizar la importación de transacciones financieras, eliminando la necesidad de registro manual.

### **🏦 Integración Bancaria**
- **Open Banking**: Conexión segura con bancos argentinos que soporten PSD2
- **Scraping Seguro**: Integración con bancos que aún no soporten Open Banking
- **Importación Automática**: Transacciones importadas cada hora o en tiempo real
- **Reconciliación Inteligente**: Detección y eliminación de duplicados automática

### **💳 Wallets Digitales y Fintech**
- **Mercado Pago**: API oficial para importar pagos, cobros y movimientos
- **Ualá**: Integración con tarjeta prepaga y movimientos
- **Brubank**: Sincronización de cuenta y tarjeta de crédito
- **Naranja X**: Importación de gastos y pagos de tarjeta
- **Personal Pay**: Movimientos de billetera digital

### **🤖 Categorización Automática con IA**
- **Análisis de Comercios**: Identificación automática del tipo de gasto por comercio
- **Patrones de Usuario**: Aprendizaje de las preferencias de categorización del usuario
- **Sugerencias Inteligentes**: Propuesta de categorías para transacciones nuevas
- **Corrección Automática**: Mejora continua basada en feedback del usuario

### **🔒 Seguridad y Privacidad**
- **Encriptación End-to-End**: Todas las comunicaciones protegidas
- **Tokens Temporales**: Sin almacenamiento de credenciales bancarias
- **Auditoría Completa**: Log detallado de todos los accesos
- **Cumplimiento Normativo**: Adherencia a regulaciones bancarias argentinas

### **⚡ Beneficios para el Usuario**
- **Cero Esfuerzo Manual**: Todas las transacciones se importan automáticamente
- **Datos Siempre Actualizados**: Balance y gastos en tiempo real
- **Mayor Precisión**: Eliminación de errores de tipeo o omisiones
- **Análisis IA Mejorado**: Más datos = mejores predicciones y recomendaciones

---

## 🤖 Características de IA

### **Chat Asistente Financiero**
- Respuestas personalizadas sobre finanzas personales
- Consejos basados en tu situación financiera actual
- Disponible 24/7 sin conexión a internet (con fallbacks)

### **Machine Learning**
- **Modelo Predictivo**: Predice gastos futuros basado en historial
- **Detección de Patrones**: Identifica comportamientos de gasto
- **Entrenamiento Automático**: El modelo mejora con más datos

### **Análisis Inteligente**
- **Reportes Automáticos**: Informes financieros generados por IA
- **Recomendaciones Personalizadas**: Sugerencias específicas para tu situación
- **Optimización de Presupuestos**: Ajustes automáticos basados en patrones

---

## 📱 Características Móviles

- **PWA Ready**: Se puede instalar como app nativa
- **Navegación Móvil**: Menú bottom optimizado para móviles
- **Touch Optimizado**: Gestos y controles táctiles
- **Offline Support**: Funcionalidad básica sin conexión

---

## 🔐 Seguridad

- **No API Keys Expuestas**: Todas las claves están en el servidor
- **Validación de Datos**: Input sanitization completo
- **HTTPS**: Todas las comunicaciones encriptadas
- **Row Level Security**: Datos aislados por usuario en la DB
- **Autenticación Robusta**: Sistema de auth con Supabase

---

## 📊 Métricas y Analytics

- **Balance Total**: Cálculo en tiempo real
- **Tasa de Ahorro**: Porcentaje de ingresos ahorrados
- **Distribución de Gastos**: Por categorías y períodos
- **Tendencias**: Análisis temporal de patrones financieros
- **KPIs Financieros**: Métricas clave calculadas automáticamente

---

## 🚧 Roadmap

### **Próximas Características**
- [ ] **API de Integración Automática**: Sistema completo de APIs para conectar automáticamente con bancos, wallets digitales y servicios financieros
- [ ] **Open Banking Integration**: Conexión segura con bancos para importar transacciones en tiempo real
- [ ] **Sincronización Multi-Plataforma**: Integración con apps como Mercado Pago, Ualá, Brubank, etc.
- [ ] Notificaciones push
- [ ] Compartir presupuestos familiares
- [ ] Inversiones tracking
- [ ] Crypto portfolio
- [ ] Alertas inteligentes por WhatsApp
- [ ] Reconocimiento de recibos con OCR
- [ ] Exportación a Excel avanzada
- [ ] API pública para desarrolladores

### **Mejoras de IA Planificadas**
- [ ] Modelo de recomendaciones más sofisticado
- [ ] Predicción de ingresos futuros
- [ ] Análisis de riesgo financiero
- [ ] Chatbot con memoria de conversaciones
- [ ] Detección automática de gastos inusuales
- [ ] Optimización automática de inversiones


## 👨‍💻 Autor

**Mateo Martin**
- GitHub: [@matemartiin](https://github.com/matemartiin)
- LinkedIn: [Mateo Martin](https://www.linkedin.com/in/mateo-martin-7958ab37b/)
- Email: tu-email@dominio.com


---

<p align="center">
  <strong>Hecho con ❤️ y ☕ para democratizar las finanzas personales</strong>
</p>

<p align="center">
  <a href="https://finzn.netlify.app">🚀 Prueba FINZN ahora</a>
</p>