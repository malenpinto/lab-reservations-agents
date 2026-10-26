# Sistema de Reservas de Equipos de Laboratorio

## 1. Especificación inicial

### 1.1. Descripción del problema

La coordinación de un laboratorio necesita administrar las reservas de sus equipos. Actualmente, los pedidos se registran mediante mensajes y planillas, lo que puede provocar reservas superpuestas o que una reserva cancelada continúe bloqueando la disponibilidad de una unidad.

Se propone desarrollar una aplicación web local que permita consultar la disponibilidad, registrar reservas, cancelarlas y conservar su historial.

### 1.2. Objetivo

Desarrollar un sistema de reservas de equipos de laboratorio que permita administrar los intervalos de utilización de cada unidad, evitando superposiciones y garantizando la persistencia de los registros.

El desarrollo se realizará utilizando un agente de programación, con supervisión y verificación humana de los resultados.

### 1.3. Inventario inicial

El sistema contará con cinco unidades físicas precargadas:


| Identificador | Equipo                 |
| ------------- | ---------------------- |
| MIC-01        | Microscopio digital    |
| MIC-02        | Microscopio digital    |
| OSC-01        | Osciloscopio           |
| MUL-01        | Multímetro             |
| FUE-01        | Fuente de alimentación |


Cada identificador representa una unidad física independiente. No se contempla la administración del inventario.

### 1.4. Requisitos funcionales

- **RF-01:** Consultar el inventario de unidades disponibles en el sistema.
- **RF-02:** Consultar la disponibilidad de una unidad para un intervalo determinado.
- **RF-03:** Crear una reserva con identificador único, unidad, solicitante ficticio, fecha y hora de inicio y finalización.
- **RF-04:** Rechazar reservas que se superpongan con otras reservas activas de la misma unidad.
- **RF-05:** Permitir reservas consecutivas cuando el inicio de una coincida con la finalización de otra.
- **RF-06:** Permitir reservas simultáneas de unidades físicas diferentes.
- **RF-07:** Cancelar reservas sin eliminar sus datos históricos.
- **RF-08:** Liberar automáticamente el intervalo correspondiente a una reserva cancelada.
- **RF-09:** Conservar las reservas activas y canceladas después de reiniciar la aplicación.
- **RF-10:** Consultar el historial de reservas y sus estados.

### 1.5. Reglas de negocio

- Solo se pueden reservar unidades existentes en el inventario.
- El nombre del solicitante es obligatorio y no puede contener únicamente espacios.
- Las fechas y horas deben ser válidas.
- La fecha y hora de inicio debe ser estrictamente anterior a la finalización.
- Una reserva activa bloquea su intervalo.
- Una reserva cancelada no bloquea disponibilidad.
- Las reservas activas de una misma unidad no pueden superponerse.
- Los intervalos consecutivos están permitidos.
- Dos unidades diferentes pueden reservarse simultáneamente.
- La consulta de disponibilidad debe utilizar las mismas reglas que la creación de reservas.

### 1.6. Supuestos y decisiones iniciales

- La aplicación funcionará localmente.
- Se utilizarán solicitantes ficticios.
- No se implementará autenticación ni administración de roles.
- El inventario estará precargado y no será editable desde la aplicación.
- Se utilizará una interfaz web para facilitar las operaciones.
- Se utilizará SQLite para la persistencia local.
- Se utilizará un único agente de programación, con revisión humana.
- El formato de fechas será ISO 8601, utilizando la zona horaria `America/Argentina/Buenos_Aires`.
- Se permitirán reservas en fechas pasadas, siempre que cumplan las validaciones del intervalo, dado que la consigna no exige restringirlas.
- No se establecerán límites adicionales de duración o anticipación de reservas.

### 1.7. Criterios de aceptación

Se considerará que el sistema cumple sus requisitos cuando:

1. Permita consultar las cinco unidades precargadas.
2. Cree correctamente una reserva válida.
3. Rechace una reserva superpuesta para la misma unidad.
4. Permita reservas con intervalos consecutivos.
5. Permita reservas simultáneas para unidades distintas.
6. Rechace identificadores de unidades inexistentes, solicitantes vacíos y fechas u horarios inválidos.
7. Permita cancelar una reserva sin eliminar su registro.
8. Libere el intervalo de una reserva cancelada.
9. Conserve reservas activas y canceladas después de detener y reiniciar la aplicación sin borrar los datos.
10. Ejecute pruebas automáticas que verifiquen las reglas principales.

## 2. Solución

Pendiente de implementación.

## 3. Preparación y uso del agente

Pendiente de documentación.

## 4. Registro de decisiones y delegación

Pendiente de documentación.