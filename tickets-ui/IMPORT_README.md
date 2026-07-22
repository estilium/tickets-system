Importar tickets desde la UI (CSV)

Página: /tickets/import (visible para ADMIN en la barra lateral)

Flujo de uso
1. Haz clic en "Importar CSV" en la barra lateral (solo ADMIN).
2. Descarga la plantilla (botón "Descargar plantilla CSV") o usa tu CSV con encabezados.
3. Selecciona el archivo CSV local.
4. Revisa la previsualización de encabezados y primeras filas.
5. Asocia (mapear) cada campo del sistema al nombre de columna CSV.
6. Haz clic en "Subir CSV mapeado".
7. Revisa el resumen: totales, filas creadas y errores por fila.

Notas sobre la plantilla
- Los `headers` de la plantilla coinciden con los campos que el backend espera: title, description, requesterEmail, assignedToEmail, category, ticketLocation, status, priority, createdAt, closedAt.
- `requesterEmail` debe existir previamente en el sistema.

Validaciones que ya implementé
- Previsualización de encabezados y primeras filas (hasta 10 filas)
- Mapeo manual/auto para columnas con nombre similar
- Normalización del CSV antes de enviarlo al backend

Siguientes mejoras recomendadas
- Validar formatos de fecha localmente antes de subir
- Límite en número de filas por carga y progress bar
- Reporte descargable con filas fallidas para reintento

Para probar localmente
```bash
cd tickets-ui
npm install
npm run dev
```

Abrir la app, iniciar sesión como ADMIN y navegar a `Importar CSV`.
