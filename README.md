# 🎬 Sistema de Gestión de Tickets

Aplicación web fullstack para la gestión de tickets, diseñada para simular un entorno real de soporte técnico y operaciones. Este repositorio contiene la API en NestJS/Prisma y la UI en React/Vite con Tailwind.

---

## 🚀 Funcionalidades principales

### 🗂 Gestión de Tickets

* Creación de tickets con título, descripción, ubicación, categoría e imagen inicial
* Envío de mensajes dentro del ticket con adjuntos por mensaje y visualización del hilo completo
* Vista detallada con imagen inicial, historial, archivos y usuarios asignados
* Asignación a agentes y cierre de tickets desde la UI (solo AGENT/ADMIN)
* Filtros para ocultar tickets cerrados y mostrar los más recientes al principio
* Las tarjetas muestran quién creó el ticket y tienen una línea de color lateral (como el dashboard) según el estado
* Los archivos adjuntos se sirven desde `/uploads` y pueden visualizarse desde otras máquinas apuntando al host de la API

### 🧾 Gestión de categorías

* Creación, edición y eliminación de categorías desde el modal de usuarios
* Reordenación con drag & drop y persistencia automática

### 🔐 Roles y permisos

* `REQUESTER`: acceso limitado a Inicio y Tickets (no ve usuarios ni Kanban)
* `AGENT`/`ADMIN`: pueden ver dashboard, Kanban, usuarios y asignar/editar/crear tickets y usuarios
* Usuarios ADMIN solo pueden ser creados o eliminados por ADMIN

### 📊 Dashboard (métricas)

* Total de tickets
* Tickets abiertos, en progreso y cerrados (con bordes coloreados)
* MTTR (Mean Time To Resolution) y gráficos de tendencias

### 📋 Kanban Board

* Vista por columnas (Open / In Progress / Closed) con tarjetas arrastrables
* Actualizaciones en tiempo real al mover tickets o recibir nuevos eventos
* Sincronización inmediata con la API al confirmar cambios

### ⚡ Actualizaciones en vivo y mensajería

* Gateway Socket.io con eventos `ticket.created`, `ticket.updated` y `message.created`
* Frontend suscrito desde `useSocketEvent`: lista, Kanban y detalle se actualizan sin recargar
* Las conversaciones nuevas se muestran instantáneamente y el requester puede ver el historial completo

### 🌐 Acceso remoto

* Levanta el backend con `npm run start:dev -- --host 0.0.0.0 --port 3000` y el frontend con `npm run dev -- --host 0.0.0.0 --port 4173`
* Actualiza `tickets-ui/src/api/api.ts` para usar `http://<IP>:3000/api` cuando se accede desde otra máquina
* El backend habilita CORS (dominios permitidos) y expone `/uploads` para mostrar archivos desde la red

---

## 🧰 Estructura

* `/tickets-api`: backend NestJS con Prisma, JWT, socket.io y filtros de error
* `/tickets-ui`: frontend Vite con React 19, Tailwind, dnd-kit y Socket.io client

---

## 🛠 Tecnologías

### Backend

* Node.js
* NestJS
* Prisma ORM + PostgreSQL
* Socket.io para eventos en vivo

### Frontend

* React 19
* Vite
* TypeScript
* TailwindCSS
* Axios
* chart.js y dnd-kit

---

## ⚙️ Enfoque del proyecto

* Replicar un flujo de trabajo tipo Jira/ServiceNow
* Aplicar buenas prácticas en arquitectura fullstack
* Integrar en tiempo real APIs, WebSockets y UI reactiva

---

## ✨ Próximas mejoras

* Notificaciones en vivo (toasts o badges con eventos)
* Sistema de roles más granular y revisiones de seguridad
* Optimización del rendimiento en Kanban y listas de tickets

---

## ✍️ Autor

Desarrollado por Walter Barbosa (Estilium)

---

## 📝 Notas

El proyecto continúa evolucionando como parte del aprendizaje en desarrollo de software fullstack.
