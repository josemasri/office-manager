# Office Manager - Sistema de Gestión de Espacios de Coworking

Un sistema integral de gestión de espacios de coworking construido con NestJS (backend) y React (frontend), que incluye reservaciones de salas de reuniones con control de acceso basado en roles y límites de horas semanales.

## Características

### Backend (NestJS + TypeORM + PostgreSQL)
- **Autenticación y Autorización**: Autenticación basada en JWT con acceso basado en roles (admin/usuario)
- **Gestión de Usuarios**: Diferentes tipos de usuarios con límites de horas semanales (Básico, Premium, VIP, Ilimitado)
- **Gestión de Salas de Reuniones**: Operaciones CRUD para salas con información de equipo y capacidad
- **Sistema de Reservaciones**:
  - Detección de conflictos para prevenir reservas dobles
  - Validación de límite de horas semanales
  - Seguimiento de estado (confirmado, cancelado, pendiente)
  - Verificación de disponibilidad en tiempo real

### Frontend (React + Tailwind CSS)
- **Diseño Responsivo**: UI moderna con Tailwind CSS
- **Autenticación**: Login/Registro con gestión de tokens JWT
- **Panel de Usuario**: Resumen de reservaciones, uso semanal y acciones rápidas
- **Reserva de Salas de Reuniones**: Explorar salas y crear reservaciones con validación en tiempo real
- **Panel de Administración**: Gestión completa de salas y supervisión de reservaciones
- **Navegación Basada en Roles**: Diferentes interfaces para usuarios vs administradores

## Arquitectura

### Esquema de Base de Datos
- **Users**: Almacenar información de usuario con relaciones de rol y tipo de usuario
- **UserTypes**: Definir tipos de membresía con límites de horas semanales
- **MeetingRooms**: Detalles de salas, capacidad, equipo y tarifas
- **Reservations**: Registros de reservas con seguimiento de tiempo y estado

### Endpoints de API
- `POST /auth/login` - Autenticación de usuario
- `POST /auth/register` - Registro de usuario
- `GET /meeting-rooms` - Listar todas las salas
- `POST /meeting-rooms` - Crear sala (solo admin)
- `GET /reservations/my-reservations` - Reservaciones del usuario
- `POST /reservations` - Crear reservación
- `PATCH /reservations/:id/cancel` - Cancelar reservación

## Comenzando

### Prerrequisitos
- Node.js (v18+)
- Docker y Docker Compose
- pnpm (recomendado) o npm

### 1. Clonar y Configurar

```bash
# Clonar el repositorio
git clone <repository-url>
cd office-manager

# Instalar dependencias del backend
cd ofice-manager-api
npm install

# Instalar dependencias del frontend
cd ../office-manager-front
npm install
```

### 2. Configuración de Base de Datos

```bash
# Iniciar PostgreSQL con Docker Compose
docker-compose up -d

# Ejecutar migraciones y semillas (desde el directorio ofice-manager-api)
cd ofice-manager-api
npm run migration:run
npm run seed:run
```

### 3. Iniciar las Aplicaciones

**Backend (Terminal 1):**
```bash
cd ofice-manager-api
npm run start:dev
# El backend corre en http://localhost:3000
```

**Frontend (Terminal 2):**
```bash
cd office-manager-front
npm run dev
# El frontend corre en http://localhost:5173
```

## Credenciales de Demostración

El sistema viene con cuentas de demostración pre-configuradas:

### Cuenta de Administrador
- **Email**: `admin@example.com`
- **Contraseña**: `admin123`
- **Rol**: Administrador (acceso ilimitado)

### Cuenta de Usuario Regular
- **Email**: `user@example.com`
- **Contraseña**: `user123`
- **Rol**: Usuario regular con membresía Premium

## Guía de Uso

### Para Usuarios Regulares

1. **Iniciar Sesión**: Usa las credenciales de demostración o registra una nueva cuenta
2. **Panel Principal**: Ve las estadísticas de tus reservaciones y próximas reservas
3. **Explorar Salas**: Explora las salas de reuniones disponibles con detalles del equipo
4. **Reservar una Sala**:
   - Selecciona una sala y haz clic en "Reservar Sala"
   - Elige horarios de inicio/fin
   - Agrega descripción de propósito opcional
   - El sistema valida contra límites de horas semanales y conflictos
5. **Gestionar Reservaciones**: Ve y cancela tus reservas

### Para Administradores

1. **Panel de Administración**: Accede a través del menú de navegación
2. **Gestión de Salas**:
   - Crear nuevas salas de reuniones
   - Editar detalles de salas existentes
   - Eliminar salas no utilizadas
3. **Supervisión de Reservaciones**: Ver todas las reservaciones de usuarios en todo el sistema
4. **Gestión de Usuarios**: Monitorear el uso en todos los tipos de usuarios

## Reglas de Negocio

### Límites de Horas Semanales
- **Básico**: 10 horas/semana
- **Premium**: 20 horas/semana
- **VIP**: 40 horas/semana
- **Ilimitado**: Sin límites (cuentas de administrador)

### Reglas de Reservación
- No hay reservas superpuestas para la misma sala
- Debe reservar solo slots de tiempo futuros
- Puede cancelar reservaciones confirmadas antes del tiempo de inicio
- Límites semanales calculados de lunes a domingo

## Implementación Técnica

### Arquitectura del Backend
- **Estructura Modular**: Módulos separados para Auth, Usuarios, Salas y Reservaciones
- **Base de Datos**: PostgreSQL con TypeORM para relaciones de datos robustas
- **Validación**: DTOs con class-validator para validación de solicitudes
- **Seguridad**: Autenticación JWT con estrategias Passport
- **Lógica de Negocio**: Cálculos de horas semanales y detección de conflictos

### Arquitectura del Frontend
- **Estructura de Componentes**: Componentes reutilizables con separación adecuada de responsabilidades
- **Gestión de Estado**: React Context para estado de autenticación
- **Enrutamiento**: React Router con rutas protegidas y acceso basado en roles
- **Capa de API**: Axios con interceptores para gestión de tokens
- **UI/UX**: Tailwind CSS para diseño responsivo y moderno

## Esquema de Base de Datos

### Relaciones Clave
- Users → UserTypes (muchos-a-uno)
- Users → Reservations (uno-a-muchos)
- MeetingRooms → Reservations (uno-a-muchos)
- Las reservaciones incluyen horas totales calculadas y seguimiento de estado

### Datos de Muestra
Los scripts de semillas crean:
- 4 tipos de usuarios con diferentes límites de horas
- 2 usuarios de demostración (admin y regular)
- 6 salas de reuniones de muestra con varios equipos
- Sistema listo para usar para pruebas

## Pruebas de API

Puedes probar los endpoints de la API usando herramientas como Postman o curl:

```bash
# Iniciar sesión para obtener token JWT
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}'

# Obtener salas de reuniones (usando el token del login)
curl -X GET http://localhost:3000/meeting-rooms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Solución de Problemas

### Problemas Comunes

**Conexión de Base de Datos**
- Asegúrate de que Docker esté ejecutándose: `docker ps`
- Verifica los logs de PostgreSQL: `docker-compose logs db`

**Conflictos de Puertos**
- Backend (3000): Cambiar en `ofice-manager-api/src/main.ts`
- Frontend (5173): Cambiar en `office-manager-front/vite.config.js`
- Base de datos (5432): Cambiar en `docker-compose.yml`

**Problemas de CORS**
- El backend incluye configuración CORS para desarrollo
- Verifica `ofice-manager-api/src/main.ts` para configuraciones CORS

**Problemas de JWT**
- Los tokens expiran después de 1 hora por defecto
- Limpia localStorage e inicia sesión nuevamente si experimentas problemas de autenticación

## Desarrollo

### Desarrollo del Backend
```bash
cd ofice-manager-api
npm run start:dev    # Modo watch
npm run test         # Ejecutar pruebas
npm run build        # Build de producción
```

### Desarrollo del Frontend
```bash
cd office-manager-front
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Vista previa del build de producción
```

## Despliegue en Producción

Para despliegue en producción:

1. **Variables de Entorno**: Actualizar todos los archivos `.env` con valores de producción
2. **Base de Datos**: Usar servicio PostgreSQL administrado
3. **Build**: Crear builds de producción de ambas aplicaciones
4. **Seguridad**: Habilitar HTTPS, actualizar configuraciones CORS, usar secretos JWT fuertes
5. **Monitoreo**: Agregar soluciones de logging y monitoreo

## Contribuir

1. Hacer fork del repositorio
2. Crear una rama de característica
3. Hacer tus cambios
4. Probar exhaustivamente
5. Enviar un pull request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.