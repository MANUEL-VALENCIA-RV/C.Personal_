# Cambios para datos compartidos

Este frontend quedó conectado con las rutas del backend compartido:

- `GET /api/observaciones?trabajadorId=ID`
- `POST /api/observaciones`
- `PUT /api/observaciones/:id`
- `DELETE /api/observaciones/:id`
- `GET /api/cursos-trabajador?trabajadorId=ID`
- `POST /api/cursos-trabajador`
- `PUT /api/cursos-trabajador/:id`
- `DELETE /api/cursos-trabajador/:id`
- `GET /api/calendario?trabajadorId=ID`
- `POST /api/calendario`
- `DELETE /api/calendario/:id`

También se activó `useEventStream()` en `App.jsx` para que otros navegadores invaliden datos cuando el backend avise cambios.

## Importante

Para desarrollo local no se necesita archivo `.env` — el proxy de Vite redirige `/api` al backend en `localhost:3001` automáticamente.

Si necesitas apuntar a un backend externo, usa un `.env` en frontend con:

```env
VITE_API_URL=/api
```

Luego ejecuta:

```bash
npm install
npm run dev
```

La compilación se probó con:

```bash
npm run build
```
