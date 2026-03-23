# 🎫 Sistema de Gestión de Tickets

Aplicación web fullstack para la gestión de tickets, diseñada para simular un entorno real de soporte técnico y operaciones.

Este proyecto fue desarrollado como parte de un proceso de autoaprendizaje con IA enfocado en la construcción de sistemas reales, arquitectura backend y experiencia de usuario.

---

## 🚀 Funcionalidades principales

### 📌 Gestión de Tickets

* Creación de tickets con título, descripción, ubicación y categoría
* Asignación de tickets a agentes
* Flujo de estados: **Open → In Progress → Closed**
* Historial y seguimiento de tickets

---

### 📊 Dashboard (Metrics)

* Total de tickets
* Tickets por estado
* MTTR (Mean Time To Resolution)
* Visualización mediante gráficas

---

### 📋 Kanban Board

* Visualización de tickets por estado (Open / In Progress / Closed)
* Interfaz tipo tablero para seguimiento de flujo de trabajo
* Funcionalidad de arrastrar y soltar (drag & drop)
* Actualización de estado en tiempo real al mover tickets
* Sincronización con backend para persistencia de cambios

---

## 🧩 Estructura del Proyecto

El proyecto está dividido en dos aplicaciones principales:

* **/tickets-api** → Backend (API REST)
* **/tickets-ui** → Frontend (Interfaz de usuario)

---

## 🛠️ Tecnologías utilizadas

### Backend

* Node.js
* NestJS
* Prisma ORM
* PostgreSQL

### Frontend

* React
* Vite
* TypeScript
* TailwindCSS

### Otros

* Axios (consumo de API)
* Chart.js (gráficas)
* dnd-kit (drag & drop en Kanban)

---

## 🧠 Enfoque del proyecto

Este sistema fue desarrollado con el objetivo de:

* Simular un entorno real de trabajo en desarrollo fullstack
* Aplicar buenas prácticas en arquitectura backend y frontend
* Implementar funcionalidades comunes en herramientas empresariales (tipo Jira o ServiceNow)
* Mejorar habilidades en integración de APIs, manejo de estado y diseño de interfaces

---

## 📋 Próximas mejoras

* Notificaciones en tiempo real
* Mejora del sistema de roles y permisos
* Optimización de rendimiento en Kanban (sin recarga)
* Sistema de comentarios y archivos por mensaje

---

## 👨‍💻 Autor

Desarrollado por Wallter Barbosa (Estilium)

---

## 📌 Notas

Este proyecto continúa en evolución como parte de aprendizaje continuo y mejora de habilidades en desarrollo de software.
