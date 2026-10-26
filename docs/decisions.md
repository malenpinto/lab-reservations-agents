# Registro de decisiones y delegaciones

Registro del trabajo humano y asistido por Codex. Los hashes fueron leídos del historial local de Git; al iniciar el cierre, `HEAD` y `origin/main` señalaban `b51f5e9` y el árbol estaba limpio. El ajuste documental de este cierre no se versiona desde esta intervención.

## Decisiones humanas

### D-001. Entorno y agente

**Decisión:** utilizar Orca como entorno de trabajo y Codex como agente de programación, con revisión humana por etapas.

**Motivo:** trabajar directamente sobre el repositorio, ejecutar herramientas y revisar cada resultado antes de avanzar.

**Alternativas registradas:** VS Code con Codex y Claude Code. Se eligió Orca con Codex para el flujo asistido previsto por el challenge y la supervisión humana desde el mismo espacio de trabajo. No hay evidencia visible de una evaluación comparativa formal entre modelos.

### D-002. Tecnologías

**Decisión inicial:** React, TypeScript, Vite y Tailwind CSS para la interfaz; Node.js, Express y TypeScript para el backend; SQLite para datos y Vitest para pruebas.

**Desarrollo:** para mantener el backend simple y sin paquete de base de datos adicional, se aprobó `node:sqlite` integrado, junto con `tsx` y Supertest. Requiere Node 22.5 o posterior; el runtime verificado fue Node 22.23.4.

**Alternativa de base registrada al inicio:** PostgreSQL; se descartó por requerir un servidor de base de datos para una aplicación local.

### D-003. Interfaz

**Decisión:** incluir interfaz web para inventario, consulta, reservas, cancelación e historial, aunque la interfaz no fuera necesaria para probar el dominio.

**Motivo:** hacer utilizable y demostrable la aplicación local.

**Alternativa registrada:** implementar únicamente la API.

### D-004. Revisión y publicación

**Decisión:** Codex no debía hacer commit ni push; esos controles y la aceptación final correspondían a la persona usuaria. Las dependencias se instalaron solo tras autorización. Git se ejecutó con `-c safe.directory=<ruta>` por comando por la diferencia de propietario, sin cambiar configuración global/local persistente.

### D-005. Fechas e intervalos — decisión histórica parcialmente reemplazada

**Decisión inicial:** timestamps ISO 8601 con zona `America/Argentina/Buenos_Aires`, normalizados a UTC, e intervalos `[inicio, fin)`. La especificación inicial permitía fechas pasadas porque no las prohibía.

**Vigente:** continúan ISO 8601, la interpretación de Buenos Aires en frontend, normalización a UTC y los intervalos `[inicio, fin)`. La permisividad sobre nuevas fechas pasadas fue reemplazada por D-006. El acceso al historial viejo sigue permitido.

### D-006. Rechazar nuevos intervalos cuyo inicio ya pasó

**Decisión humana de cierre:** aunque la consigna inicial permitía fechas pasadas, impedir crear reservas o consultar disponibilidad para un inicio pasado. Mantener el historial de reservas previas sin restricción.

**Motivo:** adecuar la operación del calendario sin ocultar registros históricos.

**Evidencia:** [instrucciones vigentes](../AGENTS.md), [servicio backend](../backend/src/services/reservationService.ts), [conversión/validación horaria frontend](../frontend/src/dateTime.ts), [pruebas API](../backend/src/api/reservations.test.ts) y [pruebas frontend](../frontend/src/dateTime.test.ts).

**Commit real:** `0f2ff9d` — `feat: validar fechas futuras y completar documentación`.

## Episodios reales de delegación

### Episodio 1 — Dominio e inventario

**Objetivo:** implementar las cinco unidades fijas, tipos/estados, validaciones y disponibilidad.

**Contexto suministrado:** README y AGENTS; luego se revisó la propuesta antes de autorizar cambios. Se proporcionó el alcance del dominio y los criterios de aceptación.

**Extracto de instrucción:** “Implementá únicamente el Episodio 1” y “No implementar todavía SQLite, Express ni React”. También se indicó no tocar la documentación ni hacer commit/push.

**Resultado del agente:** `backend/src/domain/equipment.ts`, `reservation.ts` y pruebas Vitest, con intervalos `[inicio, fin)`, timestamps zonificados y normalización UTC.

**Problemas/adaptación:** la revisión humana pidió extraer la validación compartida del intervalo y agregar límites de calendario/offset. Una primera ejecución detectó que se aceptaba `+14:01`; se limitó el offset a `±14:00`. Se corrigió la codificación UTF-8 de mensajes de error. La adaptación a un módulo `backend/src/domain/` aisló el dominio del futuro frontend.

**Decisión humana:** se corrigió la implementación en la revisión y luego se aceptó/versionó cuando las 17 pruebas y TypeScript pasaron. El motivo fue cubrir explícitamente los casos ISO y conservar la regla común sin agregar una biblioteca de fechas.

**Evidencia:** [inventario](../backend/src/domain/equipment.ts), [reglas de reserva](../backend/src/domain/reservation.ts) y [pruebas de dominio](../backend/src/domain/reservation.test.ts); verificación registrada de 17 pruebas y `tsc --noEmit` sin errores.

**Commit real:** `0e1ecaf` — `feat: implementar dominio y disponibilidad de reservas`.

### Episodio 2 — SQLite y API REST

**Objetivo:** agregar almacenamiento persistente y API de inventario, disponibilidad, creación, cancelación e historial.

**Contexto suministrado:** README, AGENTS, registro de decisiones y dominio ya versionado. Se excluyeron React y cualquier funcionalidad ajena a la reserva local.

**Extracto de instrucción:** “Prefiero usar `node:sqlite` para evitar dependencias adicionales, siempre que funcione correctamente con mi versión de Node 22” y “asegurate de que no se puedan crear reservas superpuestas, incluso si llegan solicitudes simultáneas”.

**Resultado del agente:** `backend/src/db/`, repositorio, servicio, rutas Express, composición de la app y pruebas HTTP. El esquema usa creación idempotente; el archivo en `backend/data/` se conserva. `BEGIN IMMEDIATE` hace atómicos chequeo e inserción.

**Problemas/adaptación:** npm quedó esperando dentro del sandbox, se interrumpió y la instalación se repitió fuera del sandbox con autorización. La primera verificación encontró expectativas de fecha sin normalizar y dos incompatibilidades TypeScript; se corrigieron y se volvieron a ejecutar tests y typecheck. El módulo nativo produjo la advertencia experimental esperada.

**Decisión humana:** se aprobó `node:sqlite` por reducir dependencias y se aceptó el episodio luego de comprobar pruebas, tipos y cero vulnerabilidades informadas por npm. La prueba concurrente confirmó una creación (`201`) y un conflicto (`409`).

**Evidencia:** [base SQLite](../backend/src/db/database.ts), [servicio](../backend/src/services/reservationService.ts) y [pruebas API](../backend/src/api/reservations.test.ts); 23 pruebas y `npm run typecheck` aprobados antes del commit.

**Commit real:** `0c5a5d7` — `feat: implementar API y persistencia SQLite`.

### Episodio 3 — Interfaz React

**Objetivo:** permitir consultar equipos/disponibilidad, crear reservas, cancelarlas y conservar el historial desde el navegador.

**Contexto suministrado:** README, AGENTS, backend terminado y contratos HTTP. Se excluyeron cambios de API, documentación, autenticación y dependencias visuales no necesarias.

**Extracto de instrucción:** “Usá fechas y horarios de Argentina, y asegurate de enviar a la API el formato ISO con zona horaria que espera el backend” y “No hagas commit ni push, ni modifiques todavía la documentación”.

**Resultado del agente:** frontend React/TypeScript en `frontend/`, API client, conversión horaria `America/Argentina/Buenos_Aires`, Vite proxy `/api`, estilos Tailwind y scripts npm.

**Problemas/adaptación:** la instalación volvió a quedar esperando dentro del sandbox y se completó con autorización fuera de él. El proxy de Vite conectó la UI al backend local sin una dependencia de CORS.

**Decisión humana:** la persona usuaria probó la interfaz en navegador, confirmó reservas, cancelaciones e historial, y luego realizó el push. Esta aceptación manual se atribuye a la persona usuaria; no fue una prueba de navegador ejecutada por Codex.

**Evidencia:** [pantalla principal](../frontend/src/App.tsx), [cliente API](../frontend/src/api.ts), [fechas](../frontend/src/dateTime.ts) y [configuración Vite](../frontend/vite.config.ts); 23 pruebas, `npm run typecheck` y `npm run build:frontend` aprobados en el episodio.

**Commit real:** `a4d212f` — `feat: implementar interfaz web de reservas`.

## Cierre y persistencia manual

La persona usuaria informó la prueba manual **“Prueba Persistencia”**: creó una reserva con ese nombre, detuvo el backend, lo reinició y verificó que la reserva activa siguiera en el historial. Es evidencia manual reportada por la persona; no se presenta como prueba ejecutada por Codex.

La suite automatizada también incluye `preserves active and cancelled reservations after reopening the database` en las [pruebas API](../backend/src/api/reservations.test.ts): crea una activa y una cancelada, cierra la conexión, reabre el archivo y comprueba que ambos estados sigan en el historial. La prueba sí se ejecutó con Vitest.

## Entorno, harness, modelo, permisos y controles

- **Entorno informado por el proyecto:** Orca, con PowerShell para Node/npm/Git. La versión de Orca no fue informada.
- **Agente/harness:** Codex CLI `0.164.0`, comprobado directamente por la persona usuaria en la interfaz de Orca. No fue detectado automáticamente por el agente.
- **Modelo y razonamiento:** GPT-6-Luna, nivel `Low`, comprobados directamente por la persona usuaria en la interfaz de Orca. No fueron detectados automáticamente por el agente.
- **Runtime verificado en revisión:** Node `v22.23.4`, npm `10.9.9`. Paquetes concretos registrados en `package.json`/lockfile.
- **Instrucciones:** `AGENTS.md` aporta reglas persistentes de arquitectura, alcance, dependencias, datos, pruebas, revisión y Git. En cada episodio se agregaron instrucciones humanas concretas; los extractos están arriba.
- **Contexto incluido:** README, AGENTS y los módulos del dominio/backend relevantes de cada tarea. **Excluido/no suministrado:** credenciales, secretos, datos reales de solicitantes y PDF de la consigna dentro del repositorio.
- **Permisos:** escritura limitada al repositorio; lectura de otros archivos restringida por el sandbox. Las instalaciones npm que no avanzaron en sandbox se repitieron solo con aprobación de escalación. No se usaron cambios persistentes de `safe.directory`.
- **Controles humanos:** aprobación por episodio y revisión de resultados; la persona usuaria hizo los commits/push; Codex no publicó cambios.

## Commits verificados

| Hash | Mensaje |
| --- | --- |
| `0e1ecaf` | `feat: implementar dominio y disponibilidad de reservas` |
| `0c5a5d7` | `feat: implementar API y persistencia SQLite` |
| `a4d212f` | `feat: implementar interfaz web de reservas` |
| `0f2ff9d` | `feat: validar fechas futuras y completar documentación` |
| `b51f5e9` | `docs: completar informacion academica y resultados de pruebas` |

Los dos últimos hashes fueron añadidos después de la actualización inicial de este registro; reemplazan la nota anterior que decía que la validación futura seguía sin commit.

## Verificación de cierre — 2026-10-26

- `npm.cmd test`: 3 archivos y 28 pruebas aprobadas.
- `npm.cmd run typecheck`: finalizó sin errores.
- `npm.cmd run build:frontend`: Vite compiló correctamente (18 módulos transformados).
- Node mostró `ExperimentalWarning` para `node:sqlite`; las verificaciones finalizaron con código 0.
- La prueba manual `Prueba Persistencia` fue informada por la persona usuaria; no se atribuye a Codex.
