ÉPICA 1: Acceso y roles
HU-01: Inicio de sesión con roles — 5 pts

Descripción: Como usuario del hospedaje (recepcionista, personal de limpieza o administrador), quiero iniciar sesión con mi cuenta para acceder solo a las funciones de mi rol.

Criterios de aceptación:

Dado que tengo credenciales válidas, cuando inicio sesión, entonces accedo a la vista de mi rol (panel central o vista móvil de limpieza).
Dado que ingreso credenciales inválidas, cuando intento iniciar sesión, entonces el sistema muestra un error genérico y no da acceso.
Dado que soy personal de limpieza, cuando intento abrir caja o inventario, entonces el sistema lo bloquea.

Notas técnicas: Supabase Auth con RLS por rol. (inferida desde “Seguridad e integridad de datos” y el registro del recepcionista de turno).

HU-02: Registro del recepcionista de turno — 3 pts

Descripción: Como recepcionista, quiero iniciar y registrar mi turno para que cada folio y transacción quede asociado a mi firma digital.

Criterios de aceptación:

Dado que inicio sesión como recepcionista, cuando abro mi turno, entonces el sistema registra mi usuario y la hora de inicio.
Dado que hay un turno abierto, cuando se genera un folio, entonces este queda vinculado al recepcionista del turno.

Notas técnicas: El criterio de inclusión de la tesis exige firma o registro del recepcionista en cada transacción.

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

HU-05: Cambio de estado con mínimos clics (check-in / check-out) — 5 pts

Descripción: Como recepcionista, quiero registrar el ingreso y la salida de un cliente con el menor número de interacciones para atender rápido en horas pico.

Criterios de aceptación:

Dado que una habitación está disponible, cuando registro el check-in, entonces pasa a “ocupada” y se abre un folio automáticamente.
Dado que una habitación está ocupada, cuando registro el check-out, entonces pasa a “en limpieza” y se notifica al personal de limpieza.
Dado que realizo estas acciones desde el tablero, cuando las completo, entonces no requieren formularios extensos.

Notas técnicas: La tesis recomienda flujos de “cero clics innecesarios”.

HU-06: Actualización en tiempo real del tablero — 8 pts

Descripción: Como recepcionista, quiero que el tablero se actualice solo cuando cambia el estado de una habitación para no consultar verbalmente al personal de limpieza.

Criterios de aceptación:

Dado que limpieza marca una habitación como lista, cuando el cambio se guarda, entonces el tablero de recepción se actualiza sin recargar la página.
Dado que hay varios dispositivos conectados, cuando ocurre un cambio, entonces todos reflejan el mismo estado.

Notas técnicas: Supabase Realtime. La meta del estudio fue bajar la latencia de 6,11 a 1,86 min; conviene fijar un objetivo técnico de propagación, p. ej. menos de 2 s (supuesto).

ÉPICA 3: App móvil de limpieza
HU-07: Lista de tareas de limpieza en móvil — 5 pts

Descripción: Como personal de limpieza, quiero ver desde mi celular las habitaciones pendientes de limpiar para saber qué atender sin ir a recepción.

Criterios de aceptación:

Dado que una habitación pasó a “en limpieza”, cuando abro mi vista móvil, entonces aparece en mi lista de pendientes.
Dado que uso un celular, cuando abro la vista, entonces la interfaz es responsiva y operable con una mano.

Notas técnicas: Web responsiva (Next.js), no app nativa. Supuesto: no se requiere instalación.

HU-08: Reportar fin de limpieza — 5 pts

Descripción: Como personal de limpieza, quiero marcar una habitación como lista al terminar para que recepción pueda habilitarla de inmediato.

Criterios de aceptación:

Dado que termino de limpiar, cuando toco “Habitación lista”, entonces el estado cambia a “disponible” y se registra la hora exacta.
Dado que se registran la hora de fin de limpieza y la de actualización de estado, cuando se consulta el registro, entonces se puede calcular la latencia.

Notas técnicas: Estos timestamps alimentan el indicador de latencia del Anexo 1 (T_actualización − T_fin_limpieza).

ÉPICA 4: Folio exprés (caja y facturación)
HU-09: Apertura automática de folio — 3 pts

Descripción: Como recepcionista, quiero que se abra un folio al registrar el check-in para centralizar todos los cargos de la estancia.

Criterios de aceptación:

Dado que registro un check-in, cuando se confirma, entonces se crea un folio vinculado a la habitación, el turno y la hora de inicio.
HU-10: Cálculo automático de tarifa por franja y cargos adicionales — 8 pts

Descripción: Como recepcionista, quiero que el sistema calcule el total según la franja horaria y los cargos extra para eliminar errores de cálculo bajo presión.

Criterios de aceptación:

Dado que un folio está abierto, cuando se consulta el total, entonces el sistema suma tarifa por franja más cargos adicionales sin intervención manual.
Dado que el cliente excede el tiempo contratado, cuando se hace el check-out, entonces se aplica el cargo adicional configurado.

Notas técnicas: Es el núcleo de la reducción de discrepancias (15,38% a 3,46%). Las reglas de exceso de tiempo no están en el PDF; confirmar con el negocio.

HU-11: Agregar consumibles al folio — 5 pts

Descripción: Como recepcionista, quiero agregar bebidas y snacks al folio rápidamente para que ninguna venta quede sin registrar.

Criterios de aceptación:

Dado que un folio está abierto, cuando agrego un consumible con su cantidad, entonces el total se actualiza al instante.
Dado que me equivoco, cuando corrijo un ítem aún no cerrado, entonces el cambio queda registrado.
HU-12: Cobro y cierre del folio — 5 pts

Descripción: Como recepcionista, quiero registrar el método de pago y cerrar el folio para dejar la transacción completa y trazable.

Criterios de aceptación:

Dado que el folio tiene un total calculado, cuando registro el método de pago y confirmo, entonces el folio queda cerrado.
Dado que el monto ingresado difiere del total, cuando intento cerrar, entonces el sistema lo advierte antes de confirmar.

Notas técnicas: La tesis atribuye el 3,46% residual a la digitación manual del medio de pago; la advertencia de monto ayuda a reducirlo.

HU-13: Integridad de folios cerrados — 5 pts

Descripción: Como administrador, quiero que los folios cerrados no se puedan alterar ni eliminar para garantizar la integridad de la caja.

Criterios de aceptación:

Dado que un folio está cerrado, cuando cualquier usuario intenta editarlo o eliminarlo, entonces el sistema lo impide.
Dado que se necesita una corrección, cuando un administrador la autoriza, entonces se registra como ajuste con motivo y autor, sin borrar el original.

Notas técnicas: Corresponde a la dimensión Seguridad del Anexo 5, ítem IV.a. (La política de ajustes es inferida.)

HU-14: Comprobante de la estancia — 5 pts

Descripción: Como recepcionista, quiero emitir un comprobante con el detalle de tarifa y consumos para entregárselo al cliente.

Criterios de aceptación:

Dado que un folio está cerrado, cuando solicito el comprobante, entonces se genera con el detalle de tarifa, consumos, total y método de pago.

Notas técnicas: La tesis habla de “facturación automatizada”, pero la facturación electrónica con pasarela queda como trabajo futuro (sección 4.4). Esta HU cubre solo el comprobante interno; la integración SUNAT sería una épica aparte de 13 o más puntos.

ÉPICA 5: Inventario de consumibles
HU-15: Catálogo de consumibles y stock inicial — 3 pts

Descripción: Como administrador, quiero registrar los consumibles con su precio y stock para tener el inventario teórico en el sistema.

Criterios de aceptación:

Dado que soy administrador, cuando creo o edito un producto, entonces puedo definir nombre, precio y stock.
Dado que un producto tiene stock, cuando se consulta, entonces se muestra la cantidad teórica actual.
HU-16: Descuento automático y atómico de stock — 8 pts

Descripción: Como recepcionista, quiero que al agregar un consumible al folio el stock se descuente automáticamente para evitar omisiones en picos de atención.

Criterios de aceptación:

Dado que agrego un consumible al folio, cuando se confirma, entonces el stock disminuye en la misma transacción.
Dado que falla la conexión a mitad de la operación, cuando se recupera, entonces no quedan folio e inventario desincronizados.
Dado que el stock es insuficiente, cuando intento agregar el producto, entonces el sistema lo advierte.

Notas técnicas: Transacción en base de datos (función RPC o procedimiento en Postgres). Cubre el criterio IV.b del Anexo 5.

HU-17: Conteo físico y conciliación al cierre — 5 pts

Descripción: Como recepcionista, quiero registrar el conteo físico al cierre del turno para medir la diferencia entre stock teórico y real.

Criterios de aceptación:

Dado que cierro mi turno, cuando ingreso el conteo físico por producto, entonces el sistema calcula el % de inconsistencia (faltantes ÷ teórico × 100).
Dado que existe diferencia, cuando se guarda el conteo, entonces queda registrada con fecha y responsable.

Notas técnicas: Fórmula del Anexo 1; la ficha de análisis documental del Anexo 4 es la referencia del formato.

HU-18: Alerta de stock bajo (inferida, prioridad baja) — 3 pts

Descripción: Como administrador, quiero ver alertas de productos con poco stock para reponer a tiempo.

Criterios de aceptación:

Dado que un producto baja de su umbral mínimo, cuando abro el panel, entonces aparece una alerta.
ÉPICA 6: Cierre de jornada y reportes
HU-19: Cierre del día operativo — 5 pts

Descripción: Como recepcionista o administrador, quiero cerrar el día operativo con un resumen de folios, caja e inventario para tener cada cierre documentado.

Criterios de aceptación:

Dado que hay folios abiertos, cuando intento cerrar el día, entonces el sistema me lo advierte.
Dado que el día se cierra, cuando se genera el resumen, entonces muestra folios totales, folios con error, ingresos y % de inconsistencia de inventario.

Notas técnicas: El día de cierre operativo es la unidad de análisis (n = 30) del estudio.

HU-20: Reporte de indicadores de eficiencia — 8 pts

Descripción: Como administrador, quiero un reporte de latencia, discrepancias en caja e inconsistencias de inventario por día para evaluar la eficiencia operativa.

Criterios de aceptación:

Dado que selecciono un rango de fechas, cuando genero el reporte, entonces veo por día los tres indicadores con sus promedios.
Dado que necesito analizar los datos, cuando exporto, entonces obtengo un CSV compatible con el dataset del Anexo 6.

Notas técnicas: Útil para el post-test y para el análisis en SPSS.

ÉPICA 7: Requisitos transversales
HU-21: Operación ante pérdida de conectividad — 8 pts

Descripción: Como recepcionista, quiero que el sistema avise y proteja los datos si se cae internet para no perder registros durante la operación.

Criterios de aceptación:

Dado que se pierde la conexión, cuando intento registrar algo, entonces el sistema indica el estado sin conexión y no confirma falsamente la operación.
Dado que vuelve la conexión, cuando se restablece, entonces el tablero se resincroniza.

Notas técnicas: Las limitaciones y recomendaciones (4.3 y 4.4) mencionan la dependencia de la red y un router 4G/5G de contingencia. Una cola offline completa sería bastante más compleja, así que esta HU cubre detección y resincronización.

HU-22: Auditoría y trazabilidad — 5 pts (inferida)

Descripción: Como administrador, quiero un registro de quién hizo qué y cuándo en folios, estados e inventario para investigar cualquier discrepancia.

Criterios de aceptación:

Dado que se crea, modifica o cierra un folio o un movimiento de stock, cuando ocurre, entonces se guarda usuario, acción y fecha-hora.
HU-23: Protección de datos y anonimato — 3 pts

Descripción: Como administrador, quiero que los datos de clientes y finanzas estén protegidos para cumplir la normativa de datos personales.

Criterios de aceptación:

Dado que se almacenan datos, cuando un usuario sin permiso intenta verlos, entonces el acceso es denegado.
Dado que se exportan reportes, cuando se generan, entonces no incluyen datos personales innecesarios.

Notas técnicas: La tesis cita la Ley de Protección de Datos Personales, aunque escribe “Ley N° 297330”; el número correcto es 29733.