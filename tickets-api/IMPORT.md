Importación masiva de tickets (CSV)

Resumen
- Endpoint: POST /api/tickets/import
- Autorización: Bearer JWT (usuario con rol ADMIN)
- Formato: multipart/form-data, campo `file` con CSV
- El backend espera un CSV con encabezados (cualquiera) y crea tickets por fila.

Encabezados esperados (plantilla)
- title
- description
- requesterEmail
- assignedToEmail
- category
- ticketLocation
- status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- priority (LOW, NORMAL, HIGH)
- createdAt (ISO 8601, opcional)
- closedAt (ISO 8601, opcional)

Notas de comportamiento
- `requesterEmail` es obligatorio por fila y debe existir un usuario con ese email en la base.
- Si `assignedToEmail` se provee, debe corresponder a un usuario existente (no REQUESTER).
- `category` se busca por nombre; si no existe, la fila procede sin category.
- Si `closedAt` está presente se marca el ticket como `CLOSED`.
- Fechas se parsean con `new Date(...)` — usa ISO 8601 para mayor compatibilidad.
- El endpoint responde con un resumen: total filas, creados, fallidos, y detalles con errores por fila.

Ejemplo (curl)

```bash
curl -X POST "http://localhost:3000/api/tickets/import" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@/ruta/al/archivo.csv;type=text/csv"
```

Ejemplo de CSV (encabezado + 1 fila)

```
title,description,requesterEmail,assignedToEmail,category,ticketLocation,status,priority,createdAt,closedAt
"Fallo en máquina","Descripción breve",juan@dominio.com,agent@dominio.com,Mantenimiento,INYECCION,OPEN,HIGH,2024-06-01T08:30:00Z,
```

Límites y recomendaciones
- Tamaño máximo de subida: 10MB por petición (configurable en el backend).
- Para cargas grandes, dividir en múltiples ficheros y/o paginar la importación.
- Recomendado: validar el CSV con la plantilla antes de subir.

Manejo de errores
- El backend devuelve errores por fila en `details.errors` con `{ row, error }`.
- Revisa esos errores para corregir y reintentar las filas fallidas.

Dónde está la implementación
- Controller: src/tickets/tickets.controller.ts (ruta `POST /tickets/import`)
- Servicio: src/tickets/tickets.service.ts (método `importFromCsv`)

Si quieres, puedo añadir: validación estricta de formatos de fecha, creación automática de categorías/usuarios faltantes, o paginación/cola para archivos grandes.
