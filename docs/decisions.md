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

### Episodio 1. Pendiente

### Episodio 2. Pendiente

### Episodio 3. Pendiente

## 4. Verificaciones

Se registrarán los comandos ejecutados, versiones de herramientas, resultados observados, fallos y verificaciones pendientes.

No se registrarán como ejecutadas pruebas que solamente hayan sido propuestas o informadas por el agente.