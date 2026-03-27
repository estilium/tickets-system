# 🎫 Sistema de Gestión de Tickets

Aplicación web fullstack para la gestión de tickets, diseñada para simular un entorno real de soporte técnico y operaciones.

Este proyecto fue desarrollado como parte de un proceso de autoaprendizaje con IA enfocado en la construcción de sistemas reales, arquitectura backend y experiencia de usuario.

---

## 🚀 Funcionalidades principales

### 📌 Gestión de Tickets

* Creación de tickets con título, descripción, ubicación, categoría e imagen inicial
* Envío de mensajes dentro del ticket con adjuntos por mensaje
* Vista detallada del ticket con título, descripción, imagen inicial, historial de mensajes y archivos
* Asignación de tickets a agentes (solo roles de agente/manager)
* Cierre de tickets
* Historial y seguimiento de tickets

---

### 🗂️ Gestión de Categorías

* Creación, edición y eliminación de categorías desde un modal en la página de usuarios
* Reordenación de categorías por drag & drop
* Persistencia del orden en la base de datos

---

### 🔐 Roles y permisos

* `REQUESTER`: acceso limitado a Inicio y Tickets
* `REQUESTER`: no ve Usuarios, Kanban ni opciones de asignación/cierre en Ticket Detail
* `AGENT`/`ADMIN`: acceso completo a Tickets, Dashboard, Kanban y gestión de usuarios

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
