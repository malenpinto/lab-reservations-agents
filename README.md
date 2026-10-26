# Sistema de reservas de equipos de laboratorio

Aplicación web local para consultar disponibilidad, reservar y cancelar unidades físicas del laboratorio. Las reservas canceladas permanecen en el historial y los datos se guardan en SQLite.

## Equipos incluidos

| Identificador | Equipo |
| --- | --- |
| MIC-01 | Microscopio digital |
| MIC-02 | Microscopio digital |
| OSC-01 | Osciloscopio |
| MUL-01 | Multímetro |
| FUE-01 | Fuente de alimentación |

Cada identificador corresponde a una unidad independiente. El inventario es fijo.

## Funcionalidades y reglas

- Consultar el inventario y la disponibilidad para un intervalo.
- Crear reservas con un nombre ficticio y cancelar reservas activas.
- Ver todas las reservas, incluidas las canceladas y las que corresponden a fechas anteriores.
- Los intervalos son `[inicio, fin)`: se permiten reservas consecutivas, pero no superpuestas en una misma unidad.
- Unidades diferentes pueden reservarse al mismo tiempo. Las canceladas no bloquean disponibilidad.
- El inicio debe ser anterior al fin y no puede estar en el pasado al crear una reserva o consultar disponibilidad.
- La interfaz presenta horas de `America/Argentina/Buenos_Aires`. La API recibe fechas ISO 8601 con `Z` o desplazamiento horario explícito y las compara como instantes UTC.
- Los datos persisten en `backend/data/reservations.sqlite`; las reservas no se borran al cancelar ni al reiniciar la aplicación.

## Tecnologías

- Backend: Node.js 22.5 o posterior, TypeScript, Express y el módulo integrado `node:sqlite`.
- Frontend: React, TypeScript, Vite y Tailwind CSS.
- Pruebas: Vitest y Supertest.

`node:sqlite` forma parte de Node.js y puede mostrar una advertencia de que su API sigue siendo experimental en esta versión de Node.

## Instalación y ejecución

Requisitos: Node.js 22.5 o posterior y npm.

Desde la raíz del repositorio, instalá las dependencias:

```sh
npm install
```

En PowerShell, si la política local bloquea `npm.ps1`, usá `npm.cmd` seguido de los mismos argumentos.

Iniciá el backend y el frontend en dos terminales, ambas en la raíz del repositorio:

```sh
npm run dev:backend
```

```sh
npm run dev:frontend
```

Abrí la URL local que Vite indique (normalmente `http://localhost:5173`). Vite reenvía las solicitudes `/api` al backend en `http://localhost:3000`. El backend crea `backend/data/` y el esquema SQLite si aún no existen; no borra ni reinicializa una base existente. Para cambiar el puerto del backend se puede definir `PORT`.

## API local

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/equipment` | Consultar las cinco unidades |
| `GET` | `/api/equipment/:id/availability?start=...&end=...` | Consultar disponibilidad |
| `POST` | `/api/reservations` | Crear una reserva |
| `POST` | `/api/reservations/:id/cancel` | Cancelar sin borrar el registro |
| `GET` | `/api/reservations` | Consultar el historial |

Los conflictos de reserva responden con HTTP `409`; las entradas inválidas, incluidas fechas pasadas, con `400`; y las reservas inexistentes al cancelar con `404`.

## Pruebas y compilación

```sh
npm test
npm run typecheck
npm run build:frontend
```

## Trabajo con Orca y Codex

El challenge se trabajó en Orca, con el repositorio abierto como espacio de trabajo y terminales de PowerShell para npm y las verificaciones. Codex se utilizó como agente de programación con revisión humana por episodios. Antes de cada intervención se consultaron `README.md` y `AGENTS.md`; para trabajos de persistencia y API también se revisaron los módulos del dominio y el registro de decisiones.

Las instrucciones del agente están en [`AGENTS.md`](AGENTS.md). Allí se definen el alcance del challenge, las tecnologías acordadas, las reglas de intervalos y fechas, el manejo del inventario y las reservas canceladas, las pruebas requeridas y las restricciones sobre dependencias, datos persistidos, documentación y Git. Las solicitudes humanas autorizaron cada episodio y las dependencias correspondientes. El agente no hizo commits ni push; los commits anotados en [`docs/decisions.md`](docs/decisions.md) fueron creados por el flujo humano del proyecto.

El desarrollo se organizó en tres episodios: dominio y disponibilidad, persistencia/API y frontend. La política final de no aceptar fechas pasadas se agregó después, por decisión humana, como mejora funcional adicional.
