# Gestión Pro · Características

Sistema de información para planificar, costear, controlar y gestionar cambios en proyectos de software. Proyecto integrador de Gestión de Proyectos de Software (Duoc UC).

- Frontend: Angular 21 + PrimeNG 21 · [iscalles/gestion-pro](https://github.com/iscalles/gestion-pro)
- Backend: Java 21 + Spring Boot 4.1 + Oracle 23ai · [iscalles/gestion-pro-backend](https://github.com/iscalles/gestion-pro-backend)
- Más detalle: [documentación técnica](documentacion-tecnica.md) · [guion de la demostración](guion-demostracion.md)

---

## Resumen

| Área | Qué ofrece |
|---|---|
| Proyectos | Alta, edición, cierre y eliminación con estados, presupuesto, equipo y calendario |
| EDT y planificación | Etapas, actividades y subactividades con códigos automáticos, dependencias FS/SS/FF/SF y calendario laboral |
| Programación | Motor tipo MS Project que calcula todas las fechas y detecta ciclos |
| Carta Gantt | Gantt propia en SVG, editable, con plan vs real, dependencias e hitos |
| Recursos y costos | Profesionales, recursos de 4 tipos, costos plan/real, valor ganado, carga semanal y sobreasignación |
| Hitos | Criterios de aceptación, actividades asociadas, evidencias, en riesgo y atrasados |
| KPI | Indicadores configurables con fórmulas, semáforo, histórico y mediciones manuales |
| Gestión del cambio | Solicitudes con 10 etapas, impacto y riesgo, modificaciones al plan, acciones correctivas, líneas base y trazabilidad |
| Alertas | Se abren y resuelven solas según el estado del proyecto |
| Tableros | Seguimiento del proyecto y gestión del cambio, con filtros |
| Roles | Administrador y usuario de proyecto |

**La idea central:** cualquier cambio (una duración, un recurso, una solicitud aprobada) recalcula en cadena **fechas → costos → avance → KPI → alertas** en una sola transacción, y todas las pantallas muestran el resultado al instante.

---

## 1. Acceso y roles

- Inicio de sesión con correo y contraseña; sesión con token JWT.
- Si la sesión vence, la app vuelve al inicio de sesión.
- Menú lateral con las secciones según el rol.
- **Administrador:** trabaja en todos los proyectos; además crea y cierra proyectos, modifica calendarios, administra el catálogo de profesionales, crea y edita KPI, y aprueba o rechaza solicitudes de cambio.
- **Usuario de proyecto:** trabaja solo en los proyectos que dirige o integra; planifica, asigna recursos, gestiona hitos, registra mediciones y tramita solicitudes.
- Los permisos se validan en el servidor; la interfaz solo oculta lo que el rol no puede usar.

## 2. Proyectos

- Listado con código, nombre, responsable, estado, fechas (inicio, término comprometido, previsto y real), avance y costo planificado vs real.
- Cifras de resumen: proyectos en ejecución, presupuesto y costo planificado en ejecución, solicitudes de cambio abiertas.
- Búsqueda y filtros por estado.
- Crear y editar (administrador): código, nombre, descripción, responsable, equipo de usuarios de proyecto, calendario laboral, fechas planificadas y presupuesto.
- Estados: planificado, en ejecución, suspendido, terminado.
- **Cerrar proyecto** con fecha real: solo si todas las actividades están al 100 % y no quedan solicitudes de cambio abiertas.
- Eliminar solo proyectos que no han comenzado.
- El proyecto elegido se recuerda al pasar de una pantalla a otra.

## 3. EDT y actividades

- Estructura jerárquica **etapa → actividad → subactividad** (máximo tres niveles), plegable, con «Expandir todo» y «Contraer etapas».
- **Códigos EDT automáticos** (1, 1.2, 1.2.3) derivados del orden del árbol: nunca quedan desfasados.
- Columnas: código, nombre, tipo, responsable, duración, inicio, término, avance, costo planificado (con aviso si el real lo supera) y marca de **atrasada**.
- Cifras del proyecto: elementos, avance, actividades atrasadas, fechas del plan.
- **Nueva actividad:** el tipo se deduce del lugar donde se crea (sin padre = etapa).
- **Panel de detalle:**
  - Nombre, tipo, responsable y duración estimada en días hábiles.
  - Inicio y término planificados (los calcula el sistema, no se escriben).
  - Inicio real, término real, duración real y avance (%).
  - **Predecesoras** con tipo FS, SS, FF o SF y desfase en días hábiles (positivo o negativo).
  - Antes de guardar avisa qué sucesoras se van a mover; **Guardar y recalcular** muestra el resultado.
- Reglas: 100 % de avance exige término real (y al revés); las dependencias solo unen elementos sin hijos; una actividad con dependencias no puede recibir subactividades.
- Enlace directo a la Carta Gantt del mismo proyecto.

### Calendario laboral

- Días hábiles de la semana y horas por día.
- Días no laborables (feriados 2026-2027 cargados).
- Solo el administrador lo modifica; al cambiarlo se reprograman todos los proyectos que lo usan.

## 4. Motor de programación

- Calcula inicio y término de cada actividad según sus dependencias, el calendario y el inicio del proyecto.
- Los cuatro tipos de dependencia con la convención de MS Project y desfases en días hábiles.
- Salta fines de semana y feriados.
- Etapas y actividades con hijos toman fechas, duración y avance de sus hijos (avance ponderado por duración).
- **Detecta dependencias circulares** y muestra el camino del ciclo; no guarda nada si lo hay.
- Informa qué actividades cambiaron de fecha en cada recálculo.

## 5. Carta Gantt

- Gantt propia dibujada en SVG con la grilla (nombre, inicio, término, avance) fija a la izquierda.
- Jerarquía plegable igual que la EDT.
- **Barra planificada** con el avance pintado y **barra real** debajo (ámbar si se pasa del plan, rayada si sigue en curso).
- Barras de resumen para etapas y actividades con hijos.
- **Flechas de dependencias** FS, SS, FF y SF; se resaltan al pasar el puntero o seleccionar una actividad.
- Actividades atrasadas en rojo.
- **Hitos como diamantes** (cumplido, pendiente, en riesgo, atrasado) con fecha comprometida y real o prevista.
- Escala de **días, semanas o meses**; línea de **hoy**; fines de semana y feriados sombreados.
- Interruptores «Plan vs real» y «Dependencias»; la escala y las preferencias se recuerdan.
- Cifras: plan calculado, término comprometido, avance y atrasos.
- **Editable:** clic en una barra o nombre abre el detalle; al guardar se recalcula y la carta se redibuja.

## 6. Recursos y costos

Pantalla con pestañas:

- **Costos**
  - Presupuesto, costo planificado, costo real, valor ganado (EV), valor planificado (PV), **SPI** y **CPI**, sobreasignaciones.
  - Gráficos de costo planificado vs real **por tipo de recurso** y **por etapa**.
  - Árbol de costos por actividad con la **desviación respecto del valor ganado**.
- **Profesionales:** asignar profesionales a actividades con horas por semana, valor hora y horas reales trabajadas; filtro por profesional.
- **Recursos materiales:** recursos de 4 tipos (licencia, material, equipamiento, otro) con cantidad, costo unitario y periodo, y sus asignaciones a actividades.
- **Requerimientos:** cantidad de profesionales requerida por tipo y tarifa, marcando los requerimientos sin cubrir.
- **Carga semanal:** mapa de calor de horas por profesional y semana (suma todos sus proyectos), semanas sobreasignadas en rojo con ícono y detalle de qué actividades aportan las horas.
- **Catálogo de profesionales** (administrador): profesionales, tipos de profesional, valor hora y horas disponibles por semana.

Reglas:
- Costo planificado = horas × semanas × valor hora + recursos; las semanas salen de la duración, así que **alargar una actividad la encarece**.
- No se puede asignar más de un recurso que la cantidad disponible.
- Recursos y profesionales solo se asignan a actividades sin hijos.

## 7. Hitos

- Listado con código, descripción, responsable, fecha comprometida, fecha prevista o real, estado, avance de criterios y KPI vinculados.
- Cifras: hitos cumplidos, cumplidos en plazo, en riesgo y atrasados.
- **Fecha prevista** = término más tardío de sus actividades; si supera la comprometida, el hito queda **en riesgo**.
- Vencido y sin cumplir = **atrasado**.
- **Criterios de aceptación** que se marcan uno a uno (y recalculan los KPI vinculados).
- **Marcar cumplido** con fecha real, solo con todos los criterios cumplidos; **Volver a pendiente** si hace falta.
- Actividades asociadas y KPI vinculados.
- **Evidencias:** adjuntar, descargar y eliminar archivos (hasta 10 MB).
- Crear, editar y eliminar hitos.

## 8. Indicadores (KPI)

- Catálogo con código, nombre, categoría (proyecto o cambio), ámbito, valor actual, **semáforo**, meta, **tendencia** y mini gráfico de evolución.
- Filtros por categoría y búsqueda; cifras por color del semáforo.
- **Detalle:** objetivo, fórmula, umbrales, periodicidad, responsable, gráfico del histórico con la línea de meta y tabla de mediciones (valor, semáforo, origen, observación).
- **Registrar medición** manual (todos los roles), para KPI sin fuente automática.
- **Crear y editar KPI** (administrador):
  - Fórmula con las variables del catálogo (se insertan con un clic), operaciones aritméticas, `MIN` y `MAX`.
  - **«Probar con los datos de hoy»** muestra el valor antes de guardar.
  - Sentido: mayor es mejor, menor es mejor o rango.
  - Umbrales verde y ámbar, meta, unidad, periodicidad (diaria, semanal, quincenal, mensual, al evento), fuente (automática o manual).
  - Ámbito: proyecto, etapa, actividad, hito o solicitud de cambio; vínculo con hitos.
- Medición automática en cada recálculo (solo guarda si cambia el valor o el semáforo) y una medición programada diaria.
- Cada medición provocada por un cambio queda anotada con su solicitud.
- 20 KPI cargados: 8 de proyecto e hitos (avance, cumplimiento de hitos, desviación de costos, actividades atrasadas, utilización, cumplimiento de actividades, SPI, criterios de H4) y 12 de gestión del cambio.

## 9. Gestión del cambio

### Solicitudes

- Listado con código, título, tipo, prioridad, riesgo, etapa actual, responsable, fecha comprometida, costo estimado vs real y estado.
- Cifras: en registro y evaluación, aprobadas en curso, cerradas o rechazadas, atrasadas, riesgos críticos.
- Filtros por estado, tipo, prioridad y búsqueda.
- **Nueva solicitud:** título, solicitante, fecha de solicitud, descripción, justificación, tipo (alcance, tiempo, costo, recurso, tecnología, organización), prioridad, responsable, fecha comprometida, costo estimado.
- **Impacto estimado:** plazo (días), costo, recursos y alcance.
- **Riesgo:** descripción, probabilidad e impacto (riesgo crítico si ambos son altos).

### Detalle de una solicitud

- **Las diez etapas** como pasos: registro, análisis de impacto, evaluación de riesgo, aprobación, planificación, comunicación, implementación, verificación, adopción y cierre.
- Cada etapa con responsable, fecha límite, fechas de inicio y término, estado y observaciones; **Responsable y plazo** editable.
- **Completar y pasar** a la siguiente etapa, con validaciones (por ejemplo, no se aprueba sin calificar el riesgo).
- **Modificaciones al plan** que se aplicarán al aprobar: duración de actividades, tipo o desfase de dependencias, horas de asignaciones, cantidad o costo de recursos, fecha comprometida de hitos, presupuesto o término del proyecto.
- **Aprobar y aplicar** o **Rechazar** con motivo (administrador).
- **Seguimiento de la implementación:** costo real, efectividad y adopción (%).
- **Cerrar solicitud** con resultado y fecha real (sin acciones correctivas abiertas).
- **Acciones correctivas** con responsable, fecha de compromiso y cierre.
- **Evidencias** adjuntas.
- Solo se eliminan solicitudes recién registradas (administrador).

### Al aprobar una solicitud

En una sola transacción:
1. Se guarda una **línea base** con el plan vigente.
2. Se aplican las modificaciones, guardando valor anterior y nuevo.
3. Se recalcula todo el proyecto.
4. Se mide el impacto real y se anotan los KPI afectados.

Un diálogo muestra el **término y el costo antes y después**, las actividades reprogramadas, la línea base creada y los **KPI afectados** con su semáforo, con un acceso directo a la Gantt.

### Trazabilidad y líneas base

- **Trazabilidad:** cada modificación aplicada con su solicitud, elemento, campo, valor anterior, valor nuevo y fecha.
- **Líneas base:** listado y **comparación** entre dos líneas base (fechas, duraciones y costos), con opción de ver solo lo que cambió.
- **Acciones correctivas:** vista de todas las acciones del proyecto con su estado (abierta, cerrada, vencida).

## 10. Alertas

Se abren, actualizan y resuelven solas en cada recálculo, y quedan en el historial:

| Alerta | Cuándo aparece |
|---|---|
| Sobreasignación | un profesional supera sus horas disponibles en una semana |
| KPI fuera de meta | un indicador queda en ámbar o rojo |
| Actividad atrasada | venció su término planificado sin terminar |
| Hito atrasado | venció su fecha comprometida y sigue pendiente |
| Cambio atrasado | una solicitud o una de sus etapas venció |
| Riesgo crítico | una solicitud en curso tiene probabilidad e impacto altos |
| Desviación de costo | el costo real supera al planificado o el plan supera el presupuesto |

Cada alerta tiene severidad, mensaje explicativo y fecha desde la que está abierta.

## 11. Tableros de comando

### Tablero 1 · Seguimiento del proyecto

- **Filtros:** proyecto, etapa, responsable y rango de fechas.
- **Cifras:** avance real vs planificado a hoy, costo real vs plan y presupuesto, SPI y CPI, actividades terminadas, en curso y atrasadas, hitos cumplidos, alertas abiertas.
- **Curva S:** avance planificado acumulado vs avance real, con marca de hoy.
- Avance planificado vs real **por etapa**.
- **Costo** planificado vs real por etapa.
- Mosaico de **KPI** con semáforo y tendencia.
- **Hitos** con su estado.
- **Actividades por atender:** las no terminadas, atrasadas primero.
- **Carga del equipo** con línea de 100 %.
- **Alertas** del proyecto.

### Tablero 2 · Gestión del cambio

- **Filtros:** tipo, prioridad y rango de fechas de solicitud.
- **Cifras:** solicitudes, tasa de aprobación, tiempo medio de evaluación e implementación, costo real vs estimado, impacto en el plan (días y costo), atrasadas, riesgos críticos, acciones correctivas, efectividad y adopción.
- **Matriz de riesgo** 3×3 (probabilidad × impacto) con las celdas críticas marcadas.
- **Cumplimiento de plazos por etapa** (a tiempo, fuera de plazo, vencida en curso, en curso a tiempo).
- Costo estimado vs real **por solicitud**.
- Tiempos de evaluación e implementación por solicitud.
- Solicitudes **por estado, por tipo y en curso por etapa**.
- Mosaico de los **12 KPI de cambio**.
- **Acciones correctivas** y **alertas** de cambios.

## 12. Gráficos y presentación

- Todos los gráficos son SVG propios: líneas, barras agrupadas, barras apiladas, mapas de calor, sparklines.
- Colores validados para daltonismo (plan `#009490`, real `#8059C9`); magnitudes en una rampa turquesa.
- Leyenda cuando hay dos o más series, **tooltip** al pasar el puntero y **«Ver datos en tabla»** en cada gráfico.
- El semáforo nunca depende solo del color: lleva ícono y texto.
- Formato chileno: montos en pesos (`$1.234.567`, negativos `-$152.000`), coma decimal, fechas `dd-mm-aaaa`.
- Paleta turquesa de marca y tipografía Atkinson Hyperlegible Next, pensada para la lectura.
- Se adapta a pantallas angostas sin desbordes horizontales.
- Mensajes de error claros en español, con el detalle por campo en los formularios.

## 13. Integridad y validaciones

Tres capas:

1. **Base de datos (Oracle):** restricciones de fechas, estados, montos y porcentajes; unicidad de códigos; triggers que impiden asignar recursos a actividades con hijos.
2. **Formularios (backend):** validación de cada campo con mensajes en español.
3. **Reglas de negocio:** dependencias circulares, recurso insuficiente, criterios pendientes, riesgo sin evaluar, etapas fuera de orden, cierre con pendientes, entre otras.

Errores con una forma única (estado, código, mensaje, campos) y códigos HTTP coherentes (400, 401/403, 404, 409, 422).

## 14. Técnica

- **Monolito modular** Spring Boot: un paquete por módulo, todo transaccional.
- **API REST** documentada con Swagger (`/swagger-ui.html`).
- **Flyway** crea el esquema (30 tablas, 5 vistas, 3 triggers) y carga el caso de prueba al arrancar.
- `scripts/reiniciar-datos.sql` vuelve a los datos originales para ensayar la demo.
- Configuración alternativa para usar el puerto **8081** si el 8080 está ocupado.
- **46 pruebas automáticas** (motor de programación, calendario, costos, fórmulas, semáforo, curva S, alertas) y una prueba de integración contra Oracle.
- Frontend con componentes standalone, signals y carga diferida por módulo.

## 15. Caso de prueba incluido

PRY-2026-01 · Sistema de Inventario Regional (01-09-2026 a 29-01-2027, presupuesto $48.500.000):

| Elemento | Cantidad |
|---|---|
| Etapas | 4 |
| Actividades | 12 |
| Subactividades | 20 |
| Dependencias | 25 (FS, SS, FF y SF) |
| Profesionales | 5 |
| Recursos | 10 de los 4 tipos |
| Hitos | 6 |
| KPI de proyecto e hitos | 8 |
| Solicitudes de cambio | 5 en distintos estados |
| KPI de gestión del cambio | 12 |
| Tableros | 2 |

Incluye a propósito situaciones para mostrar: un profesional sobreasignado, un hito vencido, una solicitud atrasada, otra con riesgo crítico y acciones correctivas vencidas.
