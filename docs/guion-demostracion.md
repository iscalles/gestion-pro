# Gestión Pro · Guion de la demostración

Duración objetivo: 15 a 18 minutos. La rúbrica pide demostrar los recálculos por **cambio de duración**, **modificación de recursos** y **solicitud aprobada**, explicando sus efectos en Gantt, costos, KPI y tableros. Las tres pruebas están ensayadas con los datos recién cargados: las cifras de plan y costo de este guion son exactas; los valores de los KPI dependen del día de la demostración y pueden variar un poco.

## Antes de empezar (15 minutos antes)

1. **Cerrar NVIDIA Broadcast** (u otro programa que use el puerto 8080). Si no se puede, usar el puerto 8081 (ver el README del backend) y `npx ng serve --configuration puerto-8081`.
2. Levantar Oracle: `docker compose up -d` en el repositorio del backend.
3. Volver al caso de prueba original, con el backend detenido:
   ```bash
   docker exec -i gestion-pro-oracle sqlplus -s gestion/gestion@FREEPDB1 < scripts/reiniciar-datos.sql
   ```
4. Iniciar el backend (`./mvnw spring-boot:run`) y esperar `Started GestionProBackendApplication`.
5. Iniciar el frontend (`npm start`) y abrir http://localhost:4200.
6. Ventana normal: iniciar sesión como administrador. Ventana de incógnito: como usuario de proyecto (para la parte de roles).
7. Dejar abiertas en pestañas: Actividades, Carta Gantt, Recursos y costos, Solicitudes de cambio, Seguimiento del proyecto y Gestión del cambio, todas con PRY-2026-01.
8. Anotar los valores de partida del Tablero 1 para comparar en voz alta: término del plan **28-12-2026**, costo planificado **$30.165.000**, presupuesto **$48.500.000**.

## Reparto sugerido

| Parte | Quién | Minutos |
|---|---|---|
| 1. Contexto, arquitectura y caso de prueba | Integrante 1 | 2 |
| 2. Planificación, Gantt, recursos, hitos y KPI | Integrante 2 | 5 |
| 3. Prueba 1 · cambio de duración | Integrante 2 | 2 |
| 4. Prueba 2 · modificación de recursos | Integrante 3 | 2 |
| 5. Prueba 3 · solicitud de cambio aprobada | Integrante 3 | 4 |
| 6. Roles e integridad, cierre | Integrante 1 | 2 |

## 1. Contexto (Proyectos)

- Mostrar `/proyectos`: PRY-2026-01 Sistema de Inventario Regional, presupuesto, fechas y avance.
- Explicar en una frase la arquitectura: Angular → API REST con JWT → Spring Boot → Oracle. **Todo cambio recalcula fechas → costos → avance → KPI → alertas en una sola transacción**: o se aplica completo o no se aplica.
- Mencionar el caso de prueba: 4 etapas, 12 actividades, 20 subactividades, 4 tipos de dependencia, 5 profesionales, 4 tipos de recurso, 6 hitos, 8 KPI de proyecto, 5 solicitudes, 12 KPI de cambio y 2 tableros.

## 2. Recorrido por los módulos

**Actividades** (`/actividades`)
- EDT jerárquica con códigos 1, 1.1, 1.1.1 derivados del árbol.
- Abrir una subactividad con predecesoras y mostrar FS, SS, FF y SF con desfase en días hábiles.
- Pestaña **Calendario laboral**: lunes a viernes y feriados 2026-2027 (solo el administrador los modifica).

**Carta Gantt** (`/gantt`)
- Barra planificada con el avance pintado y barra real debajo; actividades atrasadas en rojo.
- Flechas de dependencias (pasar el puntero sobre una barra las resalta), hitos como diamantes, línea de hoy.
- Cambiar la escala días / semanas / meses.

**Recursos y costos** (`/recursos`)
- Pestaña **Costos**: costo planificado y real, valor ganado, SPI y CPI; gráficos por tipo de recurso y por etapa.
- Pestaña **Carga semanal**: Tomás Vidal sobreasignado en octubre (backend y frontend se cruzan).

**Hitos** (`/hitos`)
- Seis hitos con criterios de aceptación, actividades y KPI vinculados, evidencias. H1 y H2 cumplidos (H2 fuera de plazo); H3 vencido: comprometido el 30-10 y sigue pendiente.
- Explicar la **fecha prevista**: el término más tardío de sus actividades. Si supera la comprometida, el hito queda **en riesgo** (se verá en las pruebas 1 y 3).

**Indicadores** (`/kpi`)
- Fórmula, meta, umbrales, semáforo e histórico de un KPI (por ejemplo KP-07 SPI).
- Con el administrador: **Editar** → **Probar con los datos de hoy** muestra el valor que daría la fórmula.

## 3. Prueba 1 · cambio de duración

1. En la **Carta Gantt**, clic en **4.1.1 Pruebas funcionales** (8 días, del 27-11 al 09-12).
2. En el panel lateral cambiar **Duración estimada** de 8 a **10** y pulsar **Guardar y recalcular**.

Qué mostrar y explicar:

| Dónde | Antes | Después |
|---|---|---|
| Gantt: Pruebas funcionales | termina 09-12 | termina 11-12; las sucesoras (aceptación, migración, paso a producción) se corren 2 días hábiles |
| Término del plan | 28-12-2026 | **30-12-2026** |
| Elementos reprogramados | | 7 (hojas y sus padres) |
| Costo planificado (Recursos y costos) | $30.165.000 | **$30.485.000** (+$320.000: Valentina Pérez trabaja 0,4 semanas más) |
| Hito H5 Aceptación formal del cliente | previsto 16-12 | previsto 18-12 > comprometido 16-12: queda **en riesgo** |
| KP-01 Avance del proyecto | | baja un poco: el trabajo total creció y lo completado no |

Frase clave: *"La duración alarga las semanas de cada asignación, por eso cambian a la vez el cronograma y el costo, y con ellos el avance y los KPI."*

## 4. Prueba 2 · modificación de recursos

1. **Recursos y costos** → pestaña **Profesionales** → **Asignar profesional**.
2. Actividad **4.1.1 Pruebas funcionales**, profesional **Diego Rojas**, **20** horas por semana. Guardar.

Qué mostrar y explicar:

| Dónde | Antes | Después |
|---|---|---|
| Costo planificado | $30.485.000 | **$31.365.000** (+$880.000 = 20 h × 2 semanas × $22.000) |
| Carga semanal | Diego sin exceso | Diego en rojo las semanas del **30-11 y 07-12: 50 h de 40** (ya tenía Material y Sesiones de capacitación) |
| Tablero 1 · alertas y carga del equipo | | alertas nuevas de **sobreasignación** de Diego Rojas |

Frase clave: *"El sistema suma las horas de cada profesional en todos sus proyectos y avisa apenas una semana supera su disponibilidad."*

Para dejarlo como estaba se puede bajar las horas o eliminar la asignación: la alerta se resuelve sola en el siguiente recálculo.

## 5. Prueba 3 · solicitud de cambio aprobada

1. **Solicitudes de cambio** → **SC-004 Transferencias de stock entre bodegas** (en evaluación, etapa 4 Aprobación).
2. Mostrar la ficha: tipo alcance, prioridad alta, riesgo probabilidad media · impacto alto, impacto estimado +3 días y $2.100.000.
3. Mostrar las **tres modificaciones** que aplicará:
   - Backend API inventario: duración 15 → 18 días.
   - Tomás Vidal en Backend API inventario: 30 → 35 horas por semana.
   - Presupuesto del proyecto: $48.500.000 → $50.600.000.
4. Pulsar **Aprobar y aplicar**.

El diálogo **Cambio aprobado y aplicado** muestra:

| Dato | Antes | Después |
|---|---|---|
| Término del plan | 30-12-2026 | **05-01-2027** (+3 días hábiles; el 01-01 es feriado) |
| Costo planificado | $31.365.000 | **$32.385.000** |
| Línea base | LB-01 | **LB-02** guardada antes de aplicar |
| Hito H4 Integración de módulos | previsto 26-11 | previsto 01-12 > comprometido 27-11: **en riesgo**, justo el riesgo que declaraba la solicitud |
| KPI afectados | | nueve, con valor y semáforo antes y después (KC-01 tasa de aprobación sube a 75 %, KC-05 costo de cambios pasa a ámbar, KC-11 desviación de plazo por cambios sube a 4 días…) |

Luego recorrer los efectos:

1. **Ver en la Gantt**: Backend API inventario con 18 días y la cadena de integración, pruebas e implantación corrida.
2. **Recursos y costos**: presupuesto $50.600.000; la asignación de Tomás Vidal en Backend API inventario con 35 h por semana y su carga semanal recalculada.
3. **Seguimiento del proyecto** (Tablero 1): término, costo, curva S y KPI actualizados.
4. **Gestión del cambio** (Tablero 2): tasa de aprobación, impacto en el plan, matriz de riesgo, KPI de cambio y alertas.
5. **Solicitudes de cambio** → pestaña **Trazabilidad**: cada modificación con valor anterior, nuevo y fecha; pestaña **Líneas base**: comparar LB-01 con LB-02 y marcar **solo cambios**.

Frase clave: *"La aprobación guarda la línea base, aplica las modificaciones y recalcula todo en una transacción; la trazabilidad conecta la solicitud con cada valor que cambió y con las mediciones de KPI que provocó."*

## 6. Roles e integridad

- En la ventana de incógnito (usuario de proyecto): en **Indicadores** no aparecen crear ni editar KPI, pero sí **Registrar medición**; en una solicitud no aparecen **Aprobar** ni **Rechazar**; en Recursos no está el catálogo de profesionales.
- Integridad (opcional, 30 segundos): en Actividades, agregar a una actividad temprana una predecesora que dependa de ella. El sistema rechaza la **dependencia circular** e indica el camino; no se guarda nada.

## Preguntas probables

| Pregunta | Respuesta corta |
|---|---|
| ¿Por qué un monolito? | La regla central es la consistencia entre módulos; con una transacción sobre una base es atómica sin coordinación distribuida. |
| ¿Cómo se calcula el valor ganado? | EV = Σ costo planificado de cada hoja × su avance. PV = costo de lo que el calendario dice que debía estar hecho hoy. SPI = EV ÷ PV, CPI = EV ÷ costo real. |
| ¿Por qué la curva real está bajo la planificada? | El proyecto va atrasado (SPI ≈ 0,66): Backend y Frontend inventario siguen en curso pasada su fecha. |
| ¿Por qué esos KPI en el Tablero 1? | Cubren plazo (KP-01, KP-04, KP-07), costo (KP-03), compromisos (KP-02, KP-08), equipo (KP-05) y calidad de estimación (KP-06). Ver la documentación técnica, sección 8. |
| ¿Dónde se valida la integridad? | En tres capas: restricciones y triggers de Oracle, validación de cada formulario en el backend y reglas de negocio (por ejemplo, avance 100 % ⇔ término real). |
| ¿Qué pasa si una modificación es inválida? | La aprobación se revierte completa y la solicitud sigue en la etapa 4 con el mensaje del error. |

## Si algo falla

| Síntoma | Solución |
|---|---|
| Al iniciar sesión aparece «No hay conexión con el servidor» | El backend no está corriendo o el frontend apunta a otro puerto (el mensaje dice cuál espera): revisar los pasos 1 y 4. |
| El backend no arranca: puerto 8080 en uso | Cerrar NVIDIA Broadcast o usar el puerto 8081. |
| Las cifras no coinciden con este guion | Se ensayó antes sin reiniciar: detener el backend, ejecutar `reiniciar-datos.sql` y volver a iniciarlo. |
| Oracle no responde | `docker compose up -d` y esperar a que el contenedor esté `healthy` (1-2 minutos). |

## Después de la demostración

Volver a cargar el caso de prueba con `reiniciar-datos.sql` para el próximo ensayo.
