# Registro de decisiones y delegaciones

## 1. Propósito

Este documento registra las decisiones técnicas y los episodios de delegación realizados durante el desarrollo del sistema de reservas de equipos de laboratorio.

El objetivo es conservar evidencia verificable de la preparación del agente, las tareas delegadas, los resultados obtenidos y las decisiones humanas de aceptación, corrección o rechazo.

## 2. Decisiones iniciales

### D-001. Entorno y agente de programación

**Decisión:** utilizar Orca como entorno de trabajo y Codex CLI como agente de programación.

**Motivo:** permitir que el agente trabaje directamente sobre el repositorio, ejecute herramientas y facilite la revisión humana de los cambios.

**Alternativas consideradas:** VS Code con Codex y Claude Code.

**Consecuencia:** el desarrollo se realizará principalmente desde Orca, utilizando un único agente.

### D-002. Tecnologías de desarrollo

**Decisión:** utilizar React, TypeScript, Vite y Tailwind CSS para la interfaz; Node.js, Express y TypeScript para el backend; SQLite para persistencia y Vitest para pruebas.

**Motivo:** utilizar tecnologías conocidas, mantener una arquitectura sencilla y permitir la ejecución local.

**Alternativa considerada:** PostgreSQL.

**Consecuencia:** la aplicación no requerirá un servidor externo de base de datos.

### D-003. Interfaz gráfica

**Decisión:** incorporar una interfaz web aunque no sea obligatoria.

**Motivo:** facilitar la consulta de disponibilidad, creación y cancelación de reservas y la demostración del funcionamiento.

**Alternativa considerada:** implementar únicamente una API local.

**Consecuencia:** se agrega trabajo de frontend, manteniendo como prioridad los requisitos y pruebas obligatorias.

### D-004. Supervisión humana

**Decisión:** trabajar con autonomía controlada.

**Motivo:** revisar las modificaciones antes de aceptarlas y conservar evidencia del proceso de desarrollo asistido.

**Consecuencia:** Codex no realizará commits, push ni cambios fuera del alcance autorizado sin aprobación.

### D-005. Gestión de fechas e intervalos

**Decisión:** utilizar intervalos de inicio inclusivo y fin exclusivo, con fechas ISO 8601 y zona horaria `America/Argentina/Buenos_Aires`.

**Motivo:** permitir reservas consecutivas sin generar falsos conflictos de disponibilidad.

**Consecuencia:** las consultas de disponibilidad y la creación de reservas deberán compartir la misma lógica de validación y superposición.

## 3. Episodios de delegación

Se documentarán al menos tres episodios reales de trabajo con Codex.

Cada episodio deberá registrar:

- Objetivo y requisito abordado.
- Contexto e instrucciones proporcionadas.
- Acción o resultado del agente.
- Revisión y decisión humana.
- Evidencia verificable mediante archivos, pruebas o commits.

## Episodio 1 — Implementación del dominio y disponibilidad

**Agente:** OpenAI Codex CLI, ejecutado desde Orca.

**Objetivo delegado:** implementar el inventario inicial, las validaciones de reservas y la lógica de disponibilidad, utilizando TypeScript y Vitest.

### Contexto e instrucciones

El agente recibió como contexto `README.md` y `AGENTS.md`, donde se establecen los requisitos funcionales, las tecnologías y las restricciones del proyecto.

Se autorizó una implementación limitada al dominio, sin incorporar todavía SQLite, Express ni React. También se indicó que no debía realizar commits ni push sin aprobación humana.

### Acciones realizadas por el agente

- Implementación del inventario fijo de cinco unidades.
- Definición de los tipos de reserva y estados `ACTIVE` y `CANCELLED`.
- Validación de solicitantes, unidades, fechas e intervalos.
- Implementación de la detección de superposiciones y consulta de disponibilidad.
- Creación de pruebas automatizadas con Vitest.
- Refactorización para compartir la validación de intervalos entre las operaciones.

### Revisión e intervención humana

Durante la revisión se detectaron vulnerabilidades en las dependencias de Vitest. Se actualizó manualmente a Vitest 5.0.5 y se verificó que las pruebas continuaran funcionando.

También se solicitó al agente mejorar la reutilización de las validaciones y ampliar las pruebas para fechas y desplazamientos horarios.

Se incorporó `.gitignore` para evitar versionar `node_modules/`.

### Verificaciones

- `npm test`: 17 pruebas aprobadas.
- `npx tsc --noEmit`: sin errores.
- `npm audit`: 0 vulnerabilidades.

### Aceptación

La implementación fue revisada y aceptada para incorporarse a la rama `main`.

**Commit:** 0e1ecaf (HEAD -&gt; main, origin/main) feat: implementar dominio y disponibilidad de reservas

**Archivos principales:** `backend/src/domain/equipment.ts`, `backend/src/domain/reservation.ts`, `backend/src/domain/reservation.test.ts`, `package.json`, `package-lock.json`, `tsconfig.json` y `.gitignore`.

### Episodio 2. Pendiente

### Episodio 3. Pendiente

## 4. Verificaciones

Se registrarán los comandos ejecutados, versiones de herramientas, resultados observados, fallos y verificaciones pendientes.

No se registrarán como ejecutadas pruebas que solamente hayan sido propuestas o informadas por el agente.