# Instrucciones para agentes de programación

## 1. Contexto del proyecto

Este repositorio corresponde a un challenge individual de desarrollo asistido por agentes.

El objetivo es construir una aplicación web local para administrar reservas de equipos de laboratorio, con consulta de disponibilidad, creación, cancelación y persistencia de reservas.

La especificación funcional y los criterios de aceptación se encuentran en [`README.md`](http://README.md). Consultarlos antes de implementar cambios.

## 2. Tecnologías acordadas

- Frontend: React, TypeScript, Vite y Tailwind CSS.
- Backend: Node.js, Express y TypeScript.
- Persistencia: SQLite mediante una biblioteca de Node.js.
- Pruebas automatizadas: Vitest.
- Control de versiones: Git y GitHub.
- Entorno de trabajo: Orca.
- Agente de programación: Codex.

No incorporar frameworks, servicios externos ni dependencias adicionales sin justificar su necesidad y solicitar aprobación.

## 3. Reglas de implementación

- Respetar los requisitos y criterios de aceptación del README.
- Mantener una arquitectura sencilla y modular.
- Evitar código duplicado, archivos innecesarios y funcionalidades fuera de alcance.
- No implementar autenticación, pagos, notificaciones ni integraciones externas.
- Mantener el inventario precargado sin funcionalidades para modificarlo.
- Conservar los datos de las reservas canceladas.
- No eliminar ni reinicializar datos persistidos sin autorización humana.
- Utilizar datos ficticios en ejemplos y pruebas.

## 4. Reglas específicas de reservas

- Una reserva activa ocupa el intervalo desde su inicio, inclusive, hasta su finalización, exclusive.
- Dos reservas activas de una misma unidad no pueden superponerse.
- Se permiten reservas consecutivas cuando la finalización de una coincide exactamente con el inicio de otra.
- Se permiten reservas simultáneas de unidades físicas distintas.
- Las reservas canceladas no bloquean disponibilidad.
- La consulta de disponibilidad y la creación de reservas deben utilizar la misma lógica de superposición.
- El inicio debe ser estrictamente anterior al fin.
- Las fechas y horas deben validarse.
- El solicitante no puede estar vacío ni contener únicamente espacios.
- La unidad debe existir en el inventario.

## 5. Fechas y horarios

- Utilizar fechas y horas en formato ISO 8601.
- Aplicar la zona horaria `America/Argentina/Buenos_Aires`.
- Permitir reservas en fechas pasadas, de acuerdo con los supuestos iniciales.
- No establecer límites adicionales de duración o anticipación.
- Mantener un criterio consistente para interpretar, almacenar y comparar intervalos.

## 6. Pruebas y verificación

Implementar y ejecutar pruebas automáticas para:

- Creación válida.
- Rechazo de superposiciones.
- Reservas consecutivas.
- Reservas simultáneas de unidades diferentes.
- Entradas inválidas.
- Cancelación y conservación del historial.
- Liberación del intervalo cancelado.
- Persistencia después de reiniciar.

No afirmar que una prueba pasó si no fue ejecutada.

Informar los comandos utilizados, resultados y limitaciones de verificación.

## 7. Autonomía y aprobaciones

- Antes de modificar archivos, explicar brevemente qué se propone cambiar.
- Trabajar únicamente sobre el alcance de la tarea solicitada.
- No realizar commits ni push sin autorización explícita.
- No eliminar archivos ni modificar dependencias sin justificarlo previamente.
- No ejecutar comandos destructivos sin autorización.
- No modificar el README ni los registros de decisiones sin una solicitud específica.
- Al finalizar una tarea, resumir los archivos modificados y las verificaciones realizadas.
- Solicitar revisión humana antes de continuar con otra funcionalidad.

## 8. Registro del trabajo

El desarrollo debe permitir identificar qué tareas fueron delegadas al agente y cuáles fueron las decisiones humanas.

Cuando corresponda, proporcionar información verificable para documentar:

- Objetivo y requisito abordado.
- Contexto e instrucciones recibidas.
- Archivos creados o modificados.
- Comandos y pruebas ejecutadas.
- Resultados observados.
- Limitaciones y pendientes.

Las decisiones humanas y los episodios de delegación se documentarán en `docs/[decisions.md](http://decisions.md)`.

No inventar resultados, errores, correcciones ni verificaciones.