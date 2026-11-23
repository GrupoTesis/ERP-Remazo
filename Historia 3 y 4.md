ÉPICA 2: Habitaciones y tablero de recepción
HU-03: Configuración de habitaciones y tarifas por franja — 5 pts

Descripción: Como administrador, quiero configurar las 6 habitaciones y sus tarifas por franja horaria para que el sistema calcule los cobros correctamente.

Criterios de aceptación:

Dado que soy administrador, cuando creo o edito una habitación, entonces puedo definir número, nombre y tarifas por franja.
Dado que modifico una tarifa, cuando guardo, entonces solo aplica a folios nuevos, no a los ya abiertos.

Notas técnicas: El formato es short-stay (1 a 3 horas). Las franjas horarias exactas son un supuesto a validar con el hospedaje.

HU-04: Tablero visual de estados con colores semánticos — 8 pts

Descripción: Como recepcionista, quiero ver todas las habitaciones en un tablero con colores semánticos según su estado para identificar la situación operativa en fracciones de segundo sin abandonar el mostrador.

Criterios de aceptación:

Dado que abro el panel de recepción, cuando carga el tablero, entonces veo las 6 habitaciones, cada una con un color y etiqueta según su estado (disponible, ocupada, en limpieza).
Dado que una habitación está en un estado, cuando la miro, entonces el estado se distingue también por texto o icono, no solo por color.
Dado que hay estados definidos, cuando se intenta una transición inválida (ej. disponible a limpieza), entonces el sistema la rechaza.

Notas técnicas: Implementar una máquina de estados explícita con transiciones permitidas. Los estados exactos aparecen en el Anexo 5: ocupado, limpieza, disponible.