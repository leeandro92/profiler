# Seguridad y mantenimiento

## Accesos

- `index.html` es la pantalla publica de login.
- `login.html`, `historial.html` y `vacaciones.html` son paginas de administrador.
- `administrador.html` y `grilla.html` requieren usuario autenticado y correo verificado.
- La visibilidad del menu no reemplaza la seguridad: las reglas reales de datos estan en Firestore.

## Firestore

Las reglas publicadas estan en `firestore.rules`.

- `profilers_history`: solo administradores.
- `profilers_vacations`: lectura para usuarios verificados, escritura solo administradores.
- `profilers_auth_users`: cada usuario puede escribir solamente su propio perfil permitido.

Para publicar reglas:

```powershell
firebase deploy --only firestore:rules --project profiler-7fdb3
```

## Cambios seguros

Antes de cambiar permisos, colecciones o nombres de archivos compartidos, revisar:

- `auth-nav.js`
- `firebase-config.js`
- `firestore.rules`
- `db.js`

Los cambios visuales deben mantenerse separados de la logica siempre que sea posible.
