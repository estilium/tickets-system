# Sistema de Gestion de Tickets

Aplicacion web fullstack para gestion de tickets de soporte, checklist operativo, metricas y herramientas administrativas. El proyecto esta construido con una API en NestJS/Prisma/PostgreSQL y una UI en React/Vite/Tailwind.

## Funcionalidades principales

### Tickets

- Creacion de tickets con titulo, descripcion, ubicacion, categoria e imagen inicial opcional.
- Vista detallada con historial de mensajes, archivos adjuntos, imagen inicial, estado y usuario asignado.
- Conversacion por ticket con adjuntos por mensaje.
- Asignacion de tickets a usuarios con rol `AGENT` o `ADMIN`.
- Cierre de tickets y control de permisos por rol.
- Filtros por busqueda, ano, mes y tickets cerrados.
- Actualizacion en vivo por Socket.io para tickets creados, actualizados, eliminados y mensajes nuevos.

### Ticket historico

- Acceso desde `Panel > Herramientas`.
- Creacion de tickets con fecha y hora historica usando listas desplegables.
- Campo de cierre por duracion en minutos. Ejemplo: si el ticket se creo a las 14:35 y se capturan 5 minutos, se guarda cerrado a las 14:40.
- Imagen opcional.
- Comentario inicial / serie que se guarda como mensaje dentro de la conversacion del ticket.

### Panel administrativo

El panel centraliza administracion y herramientas para reducir opciones visibles en la barra lateral.

- Usuarios: alta, edicion, roles, estado y area asignada.
- Catalogos: categorias y ubicaciones.
- Avisos: mensajes visibles para usuarios requester.
- MTTR: consulta y generacion de registros historicos de tiempo de resolucion.
- Herramientas:
  - Administrador de checklist.
  - Importar CSV.
  - Kanban.
  - Ticket historico.
  - Admin actions.

### Catalogos

- Categorias y ubicaciones administrables desde el panel.
- Reordenacion por drag and drop para categorias y ubicaciones.
- Campos de traduccion opcionales:
  - `Name EN`
  - `Name KR`
- El nombre base se captura en espanol y las traducciones se usan para mostrar los catalogos segun el idioma seleccionado.

### Checklist

- Checklist diario por maquinas, items, turnos y area asignada.
- Administrador de checklist para crear, editar, duplicar, ordenar y desactivar maquinas e items.
- Llenado historico de checklist desde herramientas administrativas.

### Kanban

- Vista por columnas `OPEN`, `IN_PROGRESS` y `CLOSED`.
- Movimiento de tickets por drag and drop.
- Sincronizacion con API y eventos en vivo.

### MTTR

- Consulta mensual de Mean Time To Resolution.
- Historial de registros MTTR.
- Backfill administrativo para generar registros historicos.

### Importacion CSV

- Carga masiva de tickets por CSV.
- Descarga de plantilla.
- Mapeo manual de columnas.
- Normalizacion antes de enviar al backend.

### Multilenguaje

La UI tiene una base multilenguaje ligera sin dependencias externas.

- Selector `ES | KR | EN` en el header.
- Idioma persistido en `localStorage`.
- Diccionario central en `tickets-ui/src/i18n.tsx`.
- Traducciones iniciales para:
  - Header.
  - Sidebar.
  - Panel administrativo.
  - Tickets.
  - Modal de crear ticket.
  - Ticket historico.
  - Algunas etiquetas de catalogos.

## Roles

- `REQUESTER`: puede crear y consultar sus tickets.
- `AGENT`: puede atender tickets, asignarse tickets y trabajar flujos operativos permitidos.
- `ADMIN`: acceso completo al panel, herramientas administrativas, ticket historico, eliminacion y configuracion.
- `CHECKLIST_MANAGER`: acceso orientado a checklist segun area asignada.

## Estructura del repositorio

```text
ticket-system/
  tickets-api/   API NestJS, Prisma, PostgreSQL, JWT, Socket.io
  tickets-ui/    UI React, Vite, TypeScript, Tailwind, dnd-kit
```

## Tecnologias

### Backend

- Node.js
- NestJS
- Prisma ORM
- PostgreSQL
- JWT
- Socket.io
- Multer para adjuntos

### Frontend

- React 19
- Vite
- TypeScript
- TailwindCSS
- Axios
- dnd-kit
- chart.js
- papaparse

## Comandos utiles

### Backend

```bash
cd tickets-api
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

Si `npx prisma generate` falla en Windows con `EPERM` sobre `query_engine-windows.dll.node`, cierra el servidor backend o cualquier proceso Node que este usando Prisma y vuelve a intentarlo.

### Frontend

```bash
cd tickets-ui
npm install
npm run dev
npm run build
```

## Variables y acceso local

La UI calcula por defecto la API como:

```text
http://<host-actual>:3000/api
```

Tambien se puede configurar con:

```text
VITE_API_URL=http://localhost:3000/api
```

## Estado actual

El proyecto ya incluye una base funcional para operacion real: tickets, adjuntos, asignacion, historicos, checklist, dashboard, MTTR, importacion, catalogos ordenables y traduccion inicial.

Quedan areas naturales para seguir mejorando:

- Completar traducciones en todas las pantallas y mensajes.
- Mejorar limpieza visual de pantallas antiguas.
- Agregar pruebas automatizadas.
- Code splitting para reducir el tamano del bundle del frontend.
- Regenerar Prisma Client despues de cerrar procesos Node si Windows bloquea el engine.

## Autor

Desarrollado por Walter Barbosa (Estilium).
