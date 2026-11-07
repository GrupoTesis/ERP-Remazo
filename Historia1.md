Roles
Recepcionista (de turno): gestiona el mostrador, el panel central, el folio, la caja y las ventas de consumibles. Sus transacciones deben llevar su firma o registro.
Personal de limpieza: limpia las habitaciones y reporta el fin de la limpieza desde el dispositivo móvil.
Administrador: acceso global

Las cuentas se crearan por el administrador

Con cuentas desactivadas se le restringirá el acceso a cualquier pantalla

Con cuentas desactivadas se le restringirá el acceso a cualquier accion
Si el usuario intenta ingresar con una cuenta desactivada debera de indicarsele que no está registrado

Administrador al panel de administrador
Recepcion al panel central
Limpieza al panel de habitacion para indicar detalles

Framework
tenemos 3 ambientes
Desarrollo: local
Pruebas : desplegaremos el proyecto como version 1 a un ambiente restringido
Producción : si pasan las pruebas conformes se cargaran los cambios a entorno productivo

Framework: next.js
las rutas y configuracion las definiras tu al desarrollar

configuraciones a supabase las decidirás tu

arquitectura
src/
  app/                 Rutas y páginas de Next.js
  features/
    auth/
    shifts/
    rooms/
    cleaning/
    folios/
    inventory/
    reports/
  components/          Componentes visuales compartidos
  lib/
    supabase/          Clientes y configuración de Supabase
    permissions/       Reglas de acceso compartidas
    validation/        Esquemas de validación
  types/               Tipos compartidos
supabase/
  migrations/          Cambios versionados de base de datos
  seed.sql             Datos iniciales para desarrollo
tests/
  e2e/

