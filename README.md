# Gestión Pro · Frontend

Frontend del proyecto integrador de Gestión de Proyectos de Software (Duoc UC): proyectos, EDT y planificación, Carta Gantt, recursos y costos, hitos, KPI, gestión del cambio y dos tableros de comando.

- [Características](docs/caracteristicas.md): todo lo que hace el sistema, pantalla por pantalla.
- [Documentación técnica](docs/documentacion-tecnica.md): requerimientos, modelo de datos, arquitectura, reglas de cálculo y justificación de los KPI.
- [Guion de la demostración](docs/guion-demostracion.md): el caso de prueba paso a paso, con los efectos esperados.
- Backend: [iscalles/gestion-pro-backend](https://github.com/iscalles/gestion-pro-backend).

**Stack:** Angular 21 · PrimeNG 21 (MIT) · SCSS con tokens propios · gráficos y Carta Gantt en SVG propio · backend Spring Boot + Oracle en `http://localhost:8080/api`.

> Se usa PrimeNG 21 porque desde la versión 22 PrimeNG cambió a la licencia PrimeUI y muestra un aviso de licencia inválida sin clave.

## Levantar la app completa

La app son dos repositorios: este (frontend) y [iscalles/gestion-pro-backend](https://github.com/iscalles/gestion-pro-backend) (API). La base de datos Oracle corre en Docker y la levanta el backend.

### Requisitos

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), abierto antes de empezar
- Java 21 (JDK)
- Node 22.12 o más reciente, con npm 11 (con npm 10 usa siempre `npm ci`, no `npm install`)

La primera vez se necesita internet para descargar la imagen de Oracle y las dependencias de Maven y npm. Después funciona sin conexión: la fuente tipográfica se instala con npm y se sirve desde la propia app.

### 1. Clonar los dos repositorios

```bash
git clone https://github.com/iscalles/gestion-pro-backend.git
git clone https://github.com/iscalles/gestion-pro.git
```

### 2. Base de datos y backend (primera terminal)

```bash
cd gestion-pro-backend
docker compose up -d
./mvnw spring-boot:run
```

- En Windows con PowerShell, el segundo comando es `.\mvnw spring-boot:run`.
- La primera vez Oracle tarda 1 a 2 minutos en quedar listo. Si el backend parte antes y no logra conectarse, espera a que `docker ps` muestre `gestion-pro-oracle` como `(healthy)` y vuelve a ejecutar `./mvnw spring-boot:run`.
- La primera vez el backend crea las tablas y carga el caso de prueba. Está listo cuando el log muestra `Started GestionProBackendApplication`. La API queda en http://localhost:8080 (Swagger en http://localhost:8080/swagger-ui.html).

### 3. Frontend (segunda terminal)

```bash
cd gestion-pro
npm ci
npm start
```

Abre http://localhost:4200 e inicia sesión con una de las cuentas de demostración (contraseña `demo1234`):

| Correo | Rol |
|---|---|
| `admin@gestionpro.cl` | Administrador: ve y modifica todo |
| `usuario@gestionpro.cl` | Usuario de proyecto (miembro de PRY-2026-01) |

### Detener y volver a levantar sin perder datos

- `Ctrl+C` en cada terminal detiene el frontend y el backend.
- `docker compose stop` (en el repositorio del backend) detiene Oracle. Para volver a usar la app: `docker compose start`, `./mvnw spring-boot:run` y `npm start`.
- Los datos quedan guardados en el volumen de Docker `oracle-data`: reiniciar el backend, Docker o el equipo no los borra, y el backend no vuelve a cargar el caso de prueba si ya existe.
- Solo se borran con `docker compose down -v` o con el script de reinicio del backend, que devuelven todo al caso de prueba original (ver [su README](https://github.com/iscalles/gestion-pro-backend#volver-al-caso-de-prueba-original)).

### Si algo falla

| Síntoma | Qué hacer |
|---|---|
| El backend no conecta con la base de datos | Oracle aún está iniciando: espera a que `docker ps` lo muestre `(healthy)` y vuelve a iniciar el backend. |
| `Port 8080 was already in use` | Otro programa usa el 8080 (por ejemplo, NVIDIA Broadcast). Ciérralo, o levanta el backend con `./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8081` y el frontend con `npx ng serve --configuration puerto-8081`. |
| El puerto 1521 está ocupado | Otro programa (por ejemplo, otra base Oracle) usa el 1521: detenlo antes de `docker compose up -d`. |
| `npm install` falla al resolver dependencias | Usa `npm ci` (respeta el `package-lock.json`) o actualiza npm con `npm install -g npm@11`. |
| El login no responde o no carga datos | Revisa que el backend esté corriendo en http://localhost:8080. La URL del backend está en `src/environments/environment.ts`. |

## Estructura

```
src/
├─ environments/             URL del backend (8080 por defecto, 8081 con la configuración puerto-8081)
├─ styles/_tokens.scss       colores, tipografía, espaciado (fuente única de verdad)
├─ styles/_pantallas.scss    piezas comunes de las pantallas (cifras, secciones, leyendas, tablas de datos)
├─ styles/_movimiento.scss   animaciones (curvas, duraciones, movimiento reducido)
└─ app/
   ├─ theme/                 preset de PrimeNG con la paleta del proyecto
   ├─ core/
   │  ├─ api/                forma de los errores del backend y mensajes para el usuario
   │  ├─ auth/               login contra la API, guards por rol, interceptor JWT (401 → login)
   │  └─ layout/             shell con menú lateral y navegación
   ├─ shared/
   │  ├─ graficos/           barras agrupadas, barra apilada, líneas, sparkline y paleta validada
   │  ├─ ui/                 page-header, selector de proyecto, semáforo, status-badge, evidencias, movimiento
   │  ├─ pipes/              clp (montos en pesos)
   │  └─ util/               fechas ISO ↔ Date sin corrimiento de zona horaria, formatos, proyecto recordado
   └─ features/              un módulo por requerimiento, con carga diferida
      ├─ auth/login
      ├─ proyectos/          Módulo 1
      ├─ actividades/        Módulos 2 y 3: EDT, actividades, dependencias, calendario laboral
      ├─ gantt/              Módulo 4: Carta Gantt propia en SVG
      ├─ recursos/           Módulo 5: costos, profesionales, recursos, requerimientos, carga semanal, catálogo
      ├─ hitos/              Módulo 6
      ├─ kpi/                Módulos 7 y 9
      ├─ cambios/            Módulo 8: solicitudes, diez etapas, acciones, trazabilidad, líneas base
      └─ tableros/           /tableros/proyecto y /tableros/cambio
```

Cada feature sigue el mismo patrón:

- `models/`: interfaces TypeScript que reflejan los DTO del backend.
- `data/`: servicio que llama a la API con `HttpClient` y `environment.apiUrl`.
- `pages/`: pantallas; `ui/`: componentes propios del módulo.
- `<feature>.routes.ts`: rutas del módulo.

Todas las pantallas de un proyecto usan `?proyecto=ID` y recuerdan el último proyecto elegido, así que al pasar de Actividades a Gantt, Recursos o los tableros se mantiene el mismo.

## Pantallas

| Ruta | Qué permite |
|---|---|
| `/proyectos` | listar, crear, editar, cerrar y eliminar proyectos (administrador); ver avance, costo y estado |
| `/actividades` | EDT jerárquica con códigos 1.1.1, fechas, avance, costo plan/real; detalle con predecesoras FS/SS/FF/SF; calendario laboral (lo modifica el administrador) |
| `/gantt` | Carta Gantt dinámica: plan vs real, dependencias, hitos, línea de hoy, escala días/semanas/meses; clic en una barra para editarla |
| `/recursos` | costos (plan, real, valor ganado, SPI, CPI, por tipo y por etapa), asignaciones de profesionales y recursos, requerimientos por tipo de profesional, carga semanal con sobreasignación, catálogo (administrador) |
| `/hitos` | hitos con criterios de aceptación, actividades y KPI vinculados, evidencias; marcar cumplido o volver a pendiente |
| `/kpi` | catálogo de KPI con semáforo, tendencia e histórico; registrar mediciones manuales (todos); crear y editar fórmulas con prueba en vivo (administrador) |
| `/cambios` | solicitudes con sus diez etapas, impacto y riesgo, modificaciones al plan, acciones correctivas, evidencias; aprobar o rechazar (administrador); trazabilidad y comparación de líneas base |
| `/tableros/proyecto` | Tablero 1: avance, curva S plan vs real, costos, hitos, KPI, actividades por atender, carga del equipo y alertas; filtros por etapa, responsable y fechas |
| `/tableros/cambio` | Tablero 2: solicitudes por estado, tipo y etapa, tiempos, costos, matriz de riesgo, cumplimiento de etapas, efectividad y adopción, KPI, acciones y alertas |

Las fechas planificadas, costos, avances, KPI y alertas nunca se calculan en el frontend: los entrega el backend después de cada recálculo, y cada pantalla vuelve a pedirlos al guardar.

## Paleta y movimiento

Dirección visual «Papel de plano»: fondo claro, líneas finas en vez de cajas, cifras protagonistas y color solo donde significa algo. Todos los colores viven como tokens en `src/styles/_tokens.scss`.

| Token | Color | Uso | Contraste |
|---|---|---|---|
| `--gp-text` | `#0F2A2B` | texto principal | 15.15:1 |
| `--gp-text-muted` | `#4A5F60` | texto secundario | 6.78:1 |
| `--gp-accent` | `#0B6E6A` | botones, enlaces, selección, foco y línea Hoy | 6.08:1, también con texto blanco |
| `--gp-data` | `#2E9690` | íconos y marcas de datos (no texto) | 3.57:1 |
| `--gp-canvas` / `--gp-surface` | `#F5F7F6` / `#FFFFFF` | lienzo de la app / paneles y tablas | |
| `--gp-rail` | `#EBF1F0` | menú lateral | |
| `--gp-night` | `#0B2224` | panel del login y tooltips | |

El semáforo de KPI (verde `#1F6B3A`, ámbar `#8A5300`, rojo `#A3231B`) queda fuera de la paleta de marca para que el acento turquesa nunca se confunda con un estado. Cada estado lleva además ícono y texto.

En los gráficos, las series plan y real usan `#009490` y `#8059C9` (par validado para daltonismo), las magnitudes usan una rampa turquesa de un solo tono y cada gráfico de dos o más series tiene leyenda, tooltip y la opción **Ver datos en tabla**.

Las animaciones usan solo `transform` y `opacity` con una curva ease-out fuerte: hasta 200 ms en las interacciones y hasta 500 ms en los momentos expresivos (dibujo de gráficos, aprobación de un cambio). Con «reducir movimiento» activado en el sistema, todo pasa a un desvanecido corto. Están en `src/styles/_movimiento.scss` y `src/app/shared/ui/movimiento/`.

## Carta Gantt (Módulo 4)

`/gantt?proyecto=ID` dibuja la carta con los datos del backend (plan, hitos y calendario) y se vuelve a dibujar cada vez que cambian:

- Jerarquía plegable etapa → actividad → subactividad, con la grilla fija a la izquierda.
- Barras planificadas con el avance pintado, barra real debajo (en ámbar si termina o sigue después del plan; rayada si está en curso) y barras de resumen para los elementos con hijos.
- Flechas FS, SS, FF y SF; las de la actividad bajo el puntero o seleccionada se resaltan.
- Actividades atrasadas marcadas en rojo; hitos como diamantes (cumplido, pendiente, en riesgo, atrasado) con su fecha comprometida y la real o prevista.
- Escala de días, semanas o meses; línea de hoy; fines de semana y feriados del calendario sombreados.
- Clic en una barra o en un nombre: panel lateral con el mismo detalle de Actividades. Al guardar, el backend recalcula y la carta muestra el efecto.

Se hizo a mano en lugar de usar DHTMLX Gantt porque su edición libre (MIT desde la v10) no trae capas de tareas, marcadores ni ruta crítica: sin capas no se puede dibujar la barra real bajo la planificada, que la rúbrica pide como comparación plan/real. La escala y las preferencias (plan vs real, dependencias) se recuerdan en el navegador.

## Compilar

```bash
npx ng build                               # producción, en dist/
npx ng build --configuration development   # comprobación rápida de tipos y plantillas
```
