# Gestión Pro · Frontend

Frontend del proyecto integrador de Gestión de Proyectos de Software (Duoc UC): planificación, Carta Gantt, recursos y costos, hitos, KPI, gestión del cambio y dos tableros.

**Stack:** Angular 21 · PrimeNG 21 (MIT) · SCSS con tokens propios · backend Spring Boot + Oracle en `http://localhost:8080/api`.

> Se usa PrimeNG 21 porque desde la versión 22 PrimeNG cambió a la licencia PrimeUI y muestra un aviso de licencia inválida sin clave.

## Levantar en local

Requiere Node 22 y npm 11 (npm 10 falla al resolver dependencias desde cero; con el `package-lock.json` `npm ci` funciona en ambos).

```bash
npm ci
npm start          # http://localhost:4200
```

Necesita el backend corriendo en `http://localhost:8080` ([iscalles/gestion-pro-backend](https://github.com/iscalles/gestion-pro-backend)): `docker compose up -d` y `./mvnw spring-boot:run`. La URL se cambia en `src/environments/environment.ts`.

Cuentas de demostración (las crea el backend), contraseña `demo1234`:

- `admin@gestionpro.cl`: administrador
- `usuario@gestionpro.cl`: usuario de proyecto

## Estructura

```
src/
├─ environments/             URL del backend
├─ styles/_tokens.scss       colores, tipografía, espaciado (fuente única de verdad)
├─ styles.scss               estilos globales
└─ app/
   ├─ theme/                 preset de PrimeNG con la paleta del proyecto
   ├─ core/
   │  ├─ api/                forma de los errores del backend y mensajes para el usuario
   │  ├─ auth/               login contra la API, guards por rol, interceptor JWT (401 → login)
   │  └─ layout/             shell con menú lateral y navegación
   ├─ shared/
   │  ├─ ui/                 page-header, status-badge, en-construccion
   │  └─ pipes/              clp (montos en pesos)
   └─ features/              un módulo por requerimiento, con carga diferida
      ├─ auth/login
      ├─ proyectos/          models/ data/ pages/   ← módulo de referencia, conectado a la API
      ├─ actividades/        jerarquía + dependencias FS/SS/FF/SF + calendario
      ├─ gantt/
      ├─ recursos/
      ├─ hitos/
      ├─ kpi/                solo administrador
      ├─ cambios/
      └─ tableros/           /tableros/proyecto y /tableros/cambio
```

Cada feature sigue el mismo patrón que `proyectos/`:

- `models/`: interfaces TypeScript que reflejan los DTO del backend.
- `data/`: servicio que llama a la API con `HttpClient` y `environment.apiUrl`.
- `pages/`: componentes de pantalla.
- `<feature>.routes.ts`: rutas del módulo.

## Paleta

| Token | Color | Uso | Contraste |
|---|---|---|---|
| `--gp-sidebar` / `--gp-text` | `#0C3133` | menú lateral, texto principal | 13.97:1 |
| `--gp-accent` | `#2C6163` | botones, enlaces, foco | 7.01:1 con blanco |
| `--gp-data` | `#609496` | gráficos, íconos, bordes (no texto) | 3.40:1 |
| `--gp-line-strong` | `#A9C8C9` | bordes fuertes, texto secundario en menú | 7.85:1 sobre `#0C3133` |
| `--gp-text-on-dark-active` | `#C1FAFD` | ítem activo del menú | 12.22:1 sobre `#0C3133` |

El semáforo de KPI (verde `#1F6B3A`, ámbar `#8A5300`, rojo `#A3231B`) queda fuera de la paleta de marca para que el acento turquesa nunca se confunda con un estado. Cada estado lleva además ícono y texto.
