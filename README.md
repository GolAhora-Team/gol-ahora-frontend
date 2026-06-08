# Gol Ahora - Frontend

¡Bienvenido al repositorio frontend de **Gol Ahora**! Esta es una aplicación desarrollada en React Native (con Expo) enfocada en la gestión integral de complejos deportivos, permitiendo tanto a administradores como a clientes y profesores interactuar de manera fluida y en tiempo real.

## 🚀 Características Principales

* **Dashboard Interactivo:** Un panel de control central para todos los perfiles, con un carrusel informativo, acceso rápido a los módulos del sistema y tarjetas de métricas para administradores (ingresos, asistencias y turnos).
* **Gestión de Reservas:** Visualización de cronogramas con actualización en tiempo real, monitoreo de canchas en uso con temporizadores interactivos ("X min"), confirmaciones visuales de estados (Pendiente, En Juego, Finalizado, Cancelada) y generación de comprobantes PDF.
* **Gestión de Usuarios:** Listados alfabéticos de usuarios ordenados por perfiles (Admin, Personal, Clientes, Profesores), con vistas detalladas de credenciales como Aptos Físicos y estado de Socio Activo.
* **Gestión de Competencias y Equipos:** Módulo para la creación de torneos, ligas y la inscripción de equipos personalizados con selección de escudos y colores representativos.
* **Roles y Permisos:** Vistas y accesos restringidos dinámicamente según el rol del usuario logueado en la plataforma.

## 🛠 Tecnologías y Configuración

* **Framework:** [React Native](https://reactnative.dev/) ejecutado con **Expo SDK 54**
* **Lenguaje:** JavaScript / ES6+
* **Navegación:** React Navigation (`@react-navigation/native` y `@react-navigation/native-stack`)
* **Iconografía:** `@expo/vector-icons` (principalmente MaterialCommunityIcons)
* **Reportes y Exportación:** `expo-print` y `expo-sharing` (para la generación y descarga de comprobantes en PDF)

## 📦 Instalación y Ejecución Local

Para levantar el proyecto localmente, asegúrate de tener [Node.js](https://nodejs.org/) y [Git](https://git-scm.com/) instalados.

1. **Clonar el proyecto:**
   ```bash
   git clone https://github.com/GolAhora-Team/gol-ahora-frontend.git
   cd gol-ahora-frontend
   ```

2. **Instalar las dependencias de Node:**
   ```bash
   npm install
   ```

3. **Iniciar la aplicación:**
   ```bash
   npx expo start
   ```
   > Esto abrirá las herramientas de desarrollador de Expo. Podés probar la aplicación en la web presionando `w`, en un emulador Android presionando `a`, o escaneando el código QR con la app **Expo Go** en tu dispositivo físico.

## 🌿 Flujo de Trabajo y Ramas (Git Flow)

El repositorio está organizado bajo las siguientes convenciones de ramas:

* **`main`**: Versión estable y lista para producción. **No se debe hacer push directo a esta rama.**
* **`develop`**: Rama principal de integración y desarrollo. Aquí se unifican las funcionalidades antes de pasar a producción.
* **`feat/`**: Ramas de trabajo para la creación de nuevas características. Ejemplo: `feat/modulo-reservas`.
* **`fix/`**: Ramas enfocadas en solucionar errores o bugs. Ejemplo: `fix/error-login`.

> **Nota para el equipo:** Asegurate siempre de hacer un `git pull --rebase` desde `develop` y resolver conflictos locales antes de crear un Pull Request.

---
*© 2026 Gol Ahora. Todos los derechos reservados.*
