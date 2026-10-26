# Sistema de reservas de equipos de laboratorio

Proyecto desarrollado como parte del **Challenge IA** de la asignatura **Tópicos Avanzados de Ingeniería de Software**, correspondiente a la carrera de **Licenciatura en Sistemas de Información** de la **Facultad de Ciencias Exactas y Naturales y Agrimensura (FaCENA)**, **Universidad Nacional del Nordeste (UNNE)**.

**Estudiante:** Pinto Espíndola, Malen Aymará

**Profesor:** Irrazabal, Emanuel

**Asignatura:** Tópicos Avanzados de Ingeniería de Software

**Carrera:** Licenciatura en Sistemas de Información

**Facultad:** FaCENA – Universidad Nacional del Nordeste

**Año:** 2026

El trabajo desarrolla un sistema local de reservas con asistencia de agentes de inteligencia artificial: Orca como entorno de trabajo y Codex como agente de programación. Las delegaciones, decisiones humanas y evidencia están en [`docs/decisions.md`](docs/decisions.md); las instrucciones persistentes del agente están en [`AGENTS.md`](AGENTS.md).

## 1. Especificación

### Problema, objetivo y alcance

Los pedidos de equipos de laboratorio registrados mediante mensajes o planillas pueden generar reservas superpuestas y dejar intervalos bloqueados después de una cancelación. El objetivo es ofrecer una aplicación web local para consultar disponibilidad, crear y cancelar reservas, consultar su historial y conservar los datos al reiniciar.

El inventario son cinco unidades físicas fijas:

| Identificador | Equipo |
| --- | --- |
| MIC-01 | Microscopio digital |
| MIC-02 | Microscopio digital |
| OSC-01 | Osciloscopio |
| MUL-01 | Multímetro |
| FUE-01 | Fuente de alimentación |

El alcance no incluye edición del inventario, autenticación, usuarios reales, pagos, notificaciones ni integraciones externas. Se usan nombres ficticios.

### Requisitos verificables y reglas

- Consultar las cinco unidades y la disponibilidad de una unidad para un intervalo.
- Crear una reserva con identificador, unidad existente, solicitante, inicio, fin y estado.
- Validar fechas ISO 8601 con `Z` o desplazamiento explícito. La interfaz interpreta y muestra horarios en `America/Argentina/Buenos_Aires`; el backend los normaliza a instantes UTC.
- El inicio debe ser anterior al fin. Desde la mejora final, el inicio de una nueva reserva o consulta de disponibilidad debe ser futuro.
- Una reserva activa ocupa `[inicio, fin)`. No puede superponerse con otra activa de la misma unidad. Los intervalos consecutivos se permiten y otras unidades pueden reservarse simultáneamente.
- Una cancelación cambia el estado a `CANCELLED`, conserva los datos y libera el intervalo.
- Las reservas activas y canceladas persisten en SQLite. El historial también puede mostrar reservas pasadas.

### Supuestos y evolución

La aplicación funciona localmente, el inventario se carga como constante y no se limita la duración ni la anticipación de reservas futuras. La especificación inicial permitía reservas pasadas; al cierre se decidió bloquear nuevas reservas y consultas de disponibilidad cuyo inicio haya pasado. Esa evolución está registrada como D-006 en [`docs/decisions.md`](docs/decisions.md); no altera el acceso al historial previo.

### Criterios de aceptación

- [x] Mostrar las cinco unidades precargadas.
- [x] Crear una reserva válida e identificarla.
- [x] Rechazar entradas inválidas y fechas pasadas.
- [x] Rechazar superposiciones activas de la misma unidad.
- [x] Permitir horarios consecutivos y reservas simultáneas de unidades distintas.
- [x] Cancelar sin borrar y liberar disponibilidad.
- [x] Consultar reservas activas y canceladas, incluidas las históricas.
- [x] Conservar reservas activas y canceladas después de reabrir SQLite.
- [x] Probar automáticamente reglas de dominio y API; verificar tipos y compilación del frontend.

## 2. Solución

### Arquitectura y tecnologías

- `backend/src/domain/`: inventario, tipos, validaciones y disponibilidad.
- `backend/src/db/`, `repositories/`, `services/` y `routes/`: SQLite, acceso a datos, reglas de aplicación y API Express.
- `frontend/`: interfaz React, cliente HTTP y conversión de horario de Buenos Aires.
- Vite reenvía `/api` al backend local durante el desarrollo.

Versiones verificadas en el entorno usado para esta revisión: Node.js `v22.23.4`, npm `10.9.9`; paquetes directos: React `19.3.1`, Vite `8.3.5`, Tailwind CSS `4.3.3`, TypeScript `5.9.3`, Express `5.3.0`, Vitest `5.0.5`, Supertest `7.3.1` y `tsx` `4.23.15`. La persistencia usa el módulo integrado `node:sqlite` (disponible desde Node 22.5); Node puede advertir que esta API continúa experimental. La lista completa está en `package.json` y `package-lock.json`.

### Instalación y ejecución

Requisitos: Node.js 22.5 o posterior y npm. Desde la raíz:

```sh
npm install
```

Iniciá estos procesos en dos terminales:

```sh
npm run dev:backend
```

```sh
npm run dev:frontend
```

Abrí la URL que muestre Vite, normalmente `http://localhost:5173`; la API escucha en `http://localhost:3000`. En PowerShell, si la política local bloquea `npm.ps1`, usá `npm.cmd` con los mismos argumentos. Se puede cambiar el puerto del backend con `PORT`.

### Datos iniciales, persistencia y reinicio

El inventario está definido en `backend/src/domain/equipment.ts`; no requiere seed ni cambios manuales. Las reservas se guardan en `backend/data/reservations.sqlite`, archivo excluido de Git. Al iniciar, el backend crea el directorio y las tablas solo si faltan. No hay comando de reinicialización: detener y volver a iniciar el servidor conserva los datos. Para respaldar la base, detené el backend y copiá el archivo SQLite; no borres el archivo para reiniciar.

La prueba automatizada de `backend/src/api/reservations.test.ts` inserta una reserva activa y otra cancelada, cierra la conexión, abre de nuevo el archivo y comprueba ambos estados. Además, la persona usuaria informó esta prueba manual real: creó la reserva **“Prueba Persistencia”**, detuvo y reinició el backend, y comprobó que la reserva activa seguía en el historial. Este resultado manual fue realizado por la persona usuaria, no por Codex.

### Ejemplos de API

La disponibilidad usa ISO con zona explícita:

```http
GET /api/equipment/MIC-01/availability?start=2099-06-15T10%3A00%3A00-03%3A00&end=2099-06-15T11%3A00%3A00-03%3A00
```

Respuesta ilustrativa (`200`):

```json
{"equipmentId":"MIC-01","start":"2099-06-15T13:00:00.000Z","end":"2099-06-15T14:00:00.000Z","available":true}
```

Crear una reserva:

```http
POST /api/reservations
Content-Type: application/json
```

```json
{"equipmentId":"MIC-01","requester":"Prueba Ficticia","start":"2099-06-15T10:00:00-03:00","end":"2099-06-15T11:00:00-03:00"}
```

Respuesta ilustrativa (`201`):

```json
{"id":"<uuid-generado>","equipmentId":"MIC-01","requester":"Prueba Ficticia","start":"2099-06-15T13:00:00.000Z","end":"2099-06-15T14:00:00.000Z","status":"ACTIVE"}
```

Cancelar usa `POST /api/reservations/<id>/cancel` y devuelve la reserva con `status: "CANCELLED"`. El historial se consulta con `GET /api/reservations`. Son ejemplos ficticios, no datos guardados.

### Pruebas

```sh
npm test
npm run typecheck
npm run build:frontend
```

La suite incluye validaciones de dominio, endpoints, conflicto bajo solicitudes simultáneas, cancelación e historial y persistencia de estados activo/cancelado tras cerrar y reabrir SQLite. La compilación se comprueba con Vite.

### Limitaciones y pendientes

La aplicación está orientada al uso local y no incluye autenticación, copias automáticas, despliegue ni pruebas de navegador automatizadas. `node:sqlite` es experimental en Node 22. No hay otros requisitos funcionales pendientes conocidos dentro del alcance acordado; la validación visual del navegador informada por la persona usuaria no sustituye las pruebas automatizadas.

## 3. Preparación del agente

### Entorno, versiones y modelo

El desarrollo se realizó en Orca con terminal PowerShell. La persona usuaria comprobó directamente en la interfaz de Orca estos datos de la sesión: **Codex CLI `0.164.0`**, modelo **GPT-6-Luna** y nivel de razonamiento **Low**. Son datos confirmados por la persona usuaria, no detectados automáticamente por el agente. La versión de Orca no fue informada. En la verificación del entorno de desarrollo, Node era `v22.23.4` y npm `10.9.9`.

### Configuración, instrucciones y contexto

`AGENTS.md` fue la instrucción persistente del repositorio: revisar el README antes de implementar; usar la arquitectura y tecnologías acordadas; evitar dependencias sin aprobación; limitar cada intervención; conservar datos; ejecutar y reportar verificaciones; no hacer commits/push sin permiso; detenerse para revisión humana. Las solicitudes de cada episodio añadieron alcance, decisiones y restricciones. Se usaron `package.json`, `tsconfig.json`, Vite y los archivos del dominio/backend como configuración y contexto técnico del proyecto.

El contexto compartido incluyó los requisitos del README, AGENTS y, según el episodio, las decisiones y consumidores del código existente. No se suministraron ni se necesitaron secretos, credenciales, datos reales de solicitantes o rutas personales. Los ejemplos y fixtures son ficticios. No se adjuntó ni se versionó el PDF de la consigna.

### Herramientas, permisos, controles y adaptación

Se usaron PowerShell, Node/npm, Git, Vitest, TypeScript y Vite. El acceso de escritura estaba limitado al repositorio; la instalación de paquetes requirió aprobación para ejecutarse fuera del sandbox cuando npm quedó esperando dentro de él. Git se consultó con una excepción `safe.directory` temporal por comando, sin cambiar configuración persistente. Codex no hizo commit ni push; la revisión y publicación quedaron en manos humanas.

Adaptación técnica comprobable: en vez de sumar una biblioteca SQLite, a pedido humano se utilizó `node:sqlite` de Node 22; la inserción se protegió con `BEGIN IMMEDIATE` para serializar la verificación de conflictos y la escritura. Evidencia: `backend/src/db/database.ts`, `backend/src/services/reservationService.ts` y la prueba concurrente en `backend/src/api/reservations.test.ts`.

## 4. Decisiones y delegación

Las decisiones humanas, extractos de instrucciones, contexto incluido/excluido, aceptación o corrección justificada, evidencias y hashes reales están en [`docs/decisions.md`](docs/decisions.md). Ese registro distingue pruebas ejecutadas por el agente de la comprobación manual de persistencia informada por la persona usuaria.
