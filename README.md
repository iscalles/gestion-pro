# Gestión Pro · Frontend

Frontend del proyecto integrador de Gestión de Proyectos de Software (Duoc UC): proyectos, EDT y planificación, Carta Gantt, recursos y costos, hitos, KPI, gestión del cambio y dos tableros de comando.

- [Documentación técnica](docs/documentacion-tecnica.md): requerimientos, modelo de datos, arquitectura, reglas de cálculo y justificación de los KPI.
- [Guion de la demostración](docs/guion-demostracion.md): el caso de prueba paso a paso, con los efectos esperados.
- Backend: [iscalles/gestion-pro-backend](https://github.com/iscalles/gestion-pro-backend).

**Stack:** Angular 21 · PrimeNG 21 (MIT) · SCSS con tokens propios · gráficos y Carta Gantt en SVG propio · backend Spring Boot + Oracle en `http://localhost:8080/api`.

> Se usa PrimeNG 21 porque desde la versión 22 PrimeNG cambió a la licencia PrimeUI y muestra un aviso de licencia inválida sin clave.

## Levantar en local

Requiere Node 22 y npm 11 (npm 10 falla al resolver dependencias desde cero; con el `package-lock.json` `npm ci` funciona en ambos).

```bash
npm ci
npm start          # http://localhost:4200
```

Necesita el backend corriendo en `http://localhost:8080`: `docker compose up -d` y `./mvnw spring-boot:run` en el repositorio del backend. La URL se cambia en `src/environments/environment.ts`.

Si el puerto 8080 está ocupado (por ejemplo, por NVIDIA Broadcast), levanta el backend en el 8081 y usa la configuración `puerto-8081`, que apunta a `src/environments/environment.8081.ts`:

```bash
npx ng serve --configuration puerto-8081
```

Cuentas de demostración (las crea el backend), contraseña `demo1234`:

- `admin@gestionpro.cl`: administrador
- `usuario@gestionpro.cl`: usuario de proyecto (miembro de PRY-2026-01)

## Estructura

```
src/
├─ environments/             URL del backend (8080 por defecto, 8081 con la configuración puerto-8081)
├─ styles/_tokens.scss       colores, tipografía, espaciado (fuente única de verdad)
├─ styles/_pantallas.scss    piezas comunes de las pantallas (cifras, secciones, leyendas, tablas de datos)
└─ app/
   ├─ theme/                 preset de PrimeNG con la paleta del proyecto
   ├─ core/
   │  ├─ api/                forma de los errores del backend y mensajes para el usuario
   │  ├─ auth/               login contra la API, guards por rol, interceptor JWT (401 → login)
   │  └─ layout/             shell con menú lateral y navegación
   ├─ shared/
   │  ├─ graficos/           barras agrupadas, barra apilada, líneas, sparkline y paleta validada
   │  ├─ ui/                 page-header, selector de proyecto, semáforo, status-badge, evidencias
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

## Paleta

| Token | Color | Uso | Contraste |
|---|---|---|---|
| `--gp-sidebar` / `--gp-text` | `#0C3133` | menú lateral, texto principal | 13.97:1 |
| `--gp-accent` | `#2C6163` | botones, enlaces, foco | 7.01:1 con blanco |
| `--gp-data` | `#609496` | gráficos, íconos, bordes (no texto) | 3.40:1 |
| `--gp-line-strong` | `#A9C8C9` | bordes fuertes, texto secundario en menú | 7.85:1 sobre `#0C3133` |
| `--gp-text-on-dark-active` | `#C1FAFD` | ítem activo del menú | 12.22:1 sobre `#0C3133` |

El semáforo de KPI (verde `#1F6B3A`, ámbar `#8A5300`, rojo `#A3231B`) queda fuera de la paleta de marca para que el acento turquesa nunca se confunda con un estado. Cada estado lleva además ícono y texto.

En los gráficos, las series plan y real usan `#009490` y `#8059C9` (par validado para daltonismo), las magnitudes usan una rampa turquesa de un solo tono y cada gráfico de dos o más series tiene leyenda, tooltip y la opción **Ver datos en tabla**.

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
