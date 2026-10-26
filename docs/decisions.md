# Registro de decisiones y delegaciones

Este registro conserva las decisiones humanas, el trabajo delegado a Codex, los problemas observados, las verificaciones y los commits que aparecen en el historial Git. Los commits de los episodios 1 a 3 son hechos del historial; el ajuste de fechas pasadas de la entrega final no tiene commit todavía.

## Decisiones

### D-001. Entorno y agente

**Decisión inicial:** utilizar Orca como entorno de trabajo y Codex CLI como agente, con revisión humana.

**Motivo:** trabajar directamente sobre el repositorio y revisar cada episodio antes de continuar.

### D-002. Tecnologías

**Decisión:** React, TypeScript, Vite y Tailwind CSS para la interfaz; Node.js, Express y TypeScript para el backend; SQLite para persistencia y Vitest para pruebas.

**Motivo:** mantener la aplicación local y la arquitectura sencilla, sin servidor externo de base de datos.

**Implementación acordada durante el Episodio 2:** usar `node:sqlite` integrado en Node 22.5 o posterior, `tsx` para ejecutar TypeScript y Supertest para pruebas HTTP.

### D-003. Interfaz web

**Decisión:** incorporar una interfaz para consultar disponibilidad, crear/cancelar reservas y ver el historial.

**Motivo:** facilitar el uso y la demostración del challenge.

### D-004. Supervisión y publicación

**Decisión:** trabajar con autonomía controlada y revisión humana por episodios. Codex no realiza commits ni push sin autorización.

**Consecuencia:** los commits existentes fueron realizados por el flujo humano del proyecto. Este registro anota sus identificadores verificados.

### D-005. Fechas e intervalos — decisión histórica parcialmente reemplazada

**Decisión inicial:** usar ISO 8601, `America/Argentina/Buenos_Aires` e intervalos `[inicio, fin)`; se permitían reservas pasadas porque la consigna inicial no las prohibía.

**Vigente:** se mantienen ISO 8601, la zona horaria indicada y los intervalos `[inicio, fin)`. La regla inicial que permitía reservas pasadas fue modificada por D-006 al final del desarrollo. Las reservas históricas existentes siguen siendo consultables.

### D-006. No admitir solicitudes con inicio pasado

**Decisión humana de entrega:** impedir una nueva reserva cuyo instante de inicio ya pasó. La consulta de disponibilidad aplica la misma regla para mantener coherencia entre consulta y creación. La interfaz interpreta la entrada como hora de Buenos Aires y muestra un mensaje claro; el backend compara el instante normalizado con el momento de la solicitud.

**Alcance:** el historial de reservas, incluidas las reservas anteriores y las canceladas, continúa disponible sin esta restricción. La comprobación afecta la creación y la consulta de disponibilidad, no la lectura histórica.

**Motivo:** hacer más lógica la operación del sistema de reservas, aunque el requisito inicial no exigiera este límite.

## Episodios de delegación

### Episodio 1 — Dominio e inventario

**Objetivo:** implementar las cinco unidades, tipos/estados de reserva, validaciones y disponibilidad con TypeScript y Vitest.

**Instrucciones:** leer `README.md` y `AGENTS.md`; limitar la intervención al dominio; no agregar persistencia, API o interfaz en esa etapa; no modificar dependencias sin autorización ni hacer commit/push.

**Trabajo:** dominio bajo `backend/src/domain/`, intervalos `[inicio, fin)`, normalización UTC, validación de timestamps ISO con zona y pruebas de reglas.

**Problemas y soluciones:** la revisión detectó que las fechas inválidas del calendario y offsets fuera del rango estándar requerían casos adicionales. Se extrajo `validateInterval()` para compartir la normalización y se documentó la precondición de `intervalsOverlap()`. Vitest encontró que se aceptaba `+14:01`; el rango se ajustó a `±14:00`.

**Verificación registrada:** 17 pruebas Vitest aprobadas y `tsc --noEmit` sin errores. En la revisión humana también se informó `npm audit` con 0 vulnerabilidades tras actualizar a Vitest 5.0.5.

**Commit real:** `0e1ecaf` — `feat: implementar dominio y disponibilidad de reservas`.

### Episodio 2 — SQLite y API REST

**Objetivo:** añadir persistencia SQLite y endpoints de inventario, disponibilidad, creación, cancelación e historial, reutilizando el dominio.

**Instrucciones:** usar `node:sqlite` si funcionaba con Node 22, `tsx` y Supertest; conservar datos al reiniciar y cancelaciones; serializar comprobación e inserción; no agregar interfaz todavía.

**Trabajo:** `backend/src/db/`, repositorio, servicio, rutas, composición Express y pruebas HTTP. El archivo persistente se ubica en `backend/data/reservations.sqlite` y está excluido de Git. `BEGIN IMMEDIATE` mantiene atómicos el chequeo de superposición y la inserción.

**Problemas y soluciones:** la instalación npm dentro del sandbox quedó esperando y se solicitó autorización para repetirla fuera del sandbox. En la primera ejecución de verificaciones, se corrigieron expectativas que comparaban fechas originales en lugar de UTC, y tipos de filas SQLite/parámetros Express. Se ajustaron y volvieron a ejecutar las pruebas.

**Verificación registrada:** 23 pruebas aprobadas, `npm run typecheck` sin errores y las instalaciones informaron 0 vulnerabilidades. Node 22.23.4 emitió la advertencia de que `node:sqlite` es experimental.

**Commit real:** `0c5a5d7` — `feat: implementar API y persistencia SQLite`.

### Episodio 3 — Interfaz React

**Objetivo:** completar la interfaz web conectada a la API, con inventario, disponibilidad, formulario, estados y listado histórico.

**Instrucciones:** usar React, TypeScript, Vite y Tailwind; mantener la aplicación sencilla; enviar fechas ISO con offset de Buenos Aires; permitir cancelación sin ocultar el historial cancelado.

**Trabajo:** aplicación en `frontend/`, cliente de API, conversión de hora local `America/Argentina/Buenos_Aires`, proxy Vite para `/api` y scripts npm para frontend/backend.

**Problemas y soluciones:** la instalación de React también quedó esperando dentro del sandbox; se solicitó autorización y se completó fuera de él. Se usó el proxy de Vite para conectar con el backend local sin agregar un servicio o dependencia de CORS.

**Verificación registrada:** 23 pruebas aprobadas, `npm run typecheck` sin errores y `npm run build:frontend` compiló correctamente. La persona usuaria informó que probó la interfaz en el navegador y confirmó reservas, cancelaciones e historial; Codex no realizó esa comprobación manual.

**Commit real:** `a4d212f` — `feat: implementar interfaz web de reservas`.

### Ajuste final de entrega — regla contra horarios pasados

**Objetivo delegado:** validar en backend y frontend que el inicio de una nueva reserva/consulta no haya pasado, manteniendo visible el historial anterior; actualizar pruebas y completar README y este registro.

**Estado:** cambio solicitado e implementado en esta intervención, aún no versionado. No se registra commit para este ajuste.

**Problemas y soluciones:** las fechas fijas del Episodio 2 podían quedar en el pasado al cambiar el día. Se reemplazaron por intervalos futuros generados al ejecutar las pruebas. Se añadió una prueba que verifica que creación y disponibilidad rechazan el mismo intervalo pasado y otra que confirma que el historial sigue devolviendo reservas antiguas. La validación del frontend se extrajo a una función pequeña para probarla directamente.

**Verificación ejecutada:** `npm.cmd test` pasó con 28 pruebas en 3 archivos; `npm.cmd run typecheck` terminó sin errores; `npm.cmd run build:frontend` compiló correctamente. Vitest mostró la advertencia experimental de `node:sqlite` de Node 22.

**Commit:** ninguno todavía; el cambio queda pendiente de revisión humana y publicación por la persona usuaria.

## Instrucciones y configuración usadas

- El repositorio se trabajó desde Orca; PowerShell fue la terminal para Node/npm y Git.
- Codex recibió `AGENTS.md` como instrucciones persistentes del repositorio. Ese archivo pide revisar el README antes de implementar, respetar el alcance autorizado, conservar datos, justificar dependencias, ejecutar y reportar verificaciones, no publicar cambios sin permiso y dejar la revisión humana entre etapas.
- El README y las instrucciones se consultaron al comenzar cada etapa; las decisiones aceptadas y restricciones específicas también se pasaron en las solicitudes humanas de cada episodio.
- Las herramientas/configuraciones del proyecto incluyen scripts npm en `package.json`, `tsconfig.json`, Vite con proxy `/api`, Tailwind mediante el plugin de Vite y pruebas Vitest/Supertest.

## Verificaciones de entrega

- `npm.cmd test`: 28 pruebas aprobadas en 3 archivos.
- `npm.cmd run typecheck`: sin errores.
- `npm.cmd run build:frontend`: compilación Vite aprobada.
- Limitación observada: Node 22 presenta la advertencia habitual de que `node:sqlite` es experimental.

No se registraron como ejecutadas verificaciones que solo se propusieron.
