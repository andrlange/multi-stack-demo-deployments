# .NET Core PostgreSQL/MySQL Demo Application

A cloud-native demo application built with .NET 8.0 and PostgreSQL/MySQL, demonstrating database integration, service binding, and blue/green deployment patterns.

## Features

- **PostgreSQL 17 Integration** - Entity Framework Core with Npgsql provider
- **Auto Database Initialization** - Creates schema and seeds sample data on startup
- **REST API** - Endpoints for tech stack info and pets data
- **Cloud Foundry Service Binding** - VCAP_SERVICES parsing for database credentials
- **Blue/Green Deployment** - Version and color-based deployment strategies
- **Docker Support** - Docker Compose with PostgreSQL and pgAdmin 4
- **Health Checks** - HTTP endpoint for container orchestration

## Tech Stack

- **.NET Core**: 8.0
- **Database**: PostgreSQL 17 or MySQL 8 with auto-detection
- **ORM**: Entity Framework Core 8.0
- **Database Drivers**: Npgsql (PostgreSQL) + Pomelo.EntityFrameworkCore.MySql (MySQL)
- **Frontend**: HTML + Vanilla JavaScript
- **Build Tool**: dotnet CLI
- **Container**: Docker with multi-stage builds

## Prerequisites

- .NET 8.0 SDK or later
- Docker and Docker Compose (for local development)
- Cloud Foundry CLI (for CF deployments)
- PostgreSQL 17 or MySQL 8 (or use Docker Compose)

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start PostgreSQL, pgAdmin, and the application
docker-compose up --build

# Access the application
open http://localhost:8081

# Access pgAdmin (database admin UI)
open http://localhost:5050
# Login: admin@demo.com / admin
```

### Option 2: Local Development

```bash
# Ensure PostgreSQL is running locally or via Docker
docker-compose up postgres -d

# Run the application
dotnet run

# Access the application
open http://localhost:8081
```

## Configuration

### Environment Variables

- `PORT` - HTTP port (default: 8081)
- `DATABASE_URL` - PostgreSQL connection string (for local dev)
- `VCAP_SERVICES` - Cloud Foundry service binding (auto-injected in CF)
- `App__Version` - Application version (default: 1.0.0)
- `App__DeploymentColor` - Deployment color (default: blue)

### Configuration Files

**appsettings.json**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=demodb;Username=demouser;Password=demopass"
  },
  "App": {
    "Version": "1.0.0",
    "DeploymentColor": "blue"
  }
}
```

## Database Schema

### Pets Table

```sql
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    race VARCHAR(50) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    name VARCHAR(50) NOT NULL,
    age INTEGER NOT NULL,
    description TEXT
);
```

Sample data is automatically seeded on first startup:
- 8 pet records (dogs, cats, birds)
- Includes race, gender, name, age, and descriptions

## REST API Endpoints

### GET /api/infos

Returns technology stack information and application metadata.

**Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "version": "1.0.0",
  "deploymentColor": "blue",
  "techStack": {
    "framework": "ASP.NET Core",
    "version": "8.0",
    "language": "C#",
    "languageVersion": "8.0.x",
    "runtime": ".NET Runtime",
    "database": "PostgreSQL"
  }
}
```

### GET /api/pets

Returns all pets from the database.

**Response:**
```json
[
  {
    "id": 1,
    "race": "Golden Retriever",
    "gender": "Male",
    "name": "Max",
    "age": 5,
    "description": "Friendly and energetic dog"
  }
]
```

### GET /health

Health check endpoint for Cloud Foundry and container orchestration.

**Response:** `200 OK` with "Healthy" text

## Cloud Foundry Deployment

### 1. Create PostgreSQL Service

```bash
# Create the database service (idempotent)
./create-db-service.sh

# Verify service is ready
cf service my-demo-db
```

### 2. Deploy Application

The application automatically detects Cloud Foundry environment and:
- Parses `VCAP_SERVICES` for database credentials
- Uses Cloud Foundry provided `PORT` environment variable
- Initializes database schema and sample data

```bash
# Deploy with default manifest
cf push

# Or deploy specific version
cf push -f manifest-blue.yml   # Version 1.0.0 (blue)
cf push -f manifest-green.yml  # Version 2.0.0 (green)
```

### VCAP_SERVICES Integration

The application automatically parses Cloud Foundry service bindings:

```csharp
var vcapServices = Environment.GetEnvironmentVariable("VCAP_SERVICES");
if (!string.IsNullOrEmpty(vcapServices))
{
    var services = JsonDocument.Parse(vcapServices);
    var postgres = services.RootElement.GetProperty("postgres")[0];
    var credentials = postgres.GetProperty("credentials");

    var host = credentials.GetProperty("host").GetString();
    var port = credentials.GetProperty("port").GetInt32();
    var database = credentials.GetProperty("name").GetString();
    var username = credentials.GetProperty("username").GetString();
    var password = credentials.GetProperty("password").GetString();

    return $"Host={host};Port={port};Database={database};Username={username};Password={password}";
}
```

## Blue/Green Deployment

### Version Toggle

```bash
# Toggle between versions 1.0.0 (blue) and 2.0.0 (green)
./toggle.sh
```

This updates `appsettings.json`:
- Version: 1.0.0 ↔ 2.0.0
- DeploymentColor: blue ↔ green

### Deploy Blue Version

```bash
./deploy-blue.sh
```

Steps:
1. Auto-toggles to version 1.0.0 if needed
2. Builds the application
3. Pushes to Cloud Foundry as `dotnet-db-demo-blue`
4. Maps to temporary route

### Deploy Green Version

```bash
./deploy-green.sh
```

Steps:
1. Auto-toggles to version 2.0.0 if needed
2. Builds the application
3. Pushes to Cloud Foundry as `dotnet-db-demo-green`
4. Maps to temporary route

### Blue/Green Cutover Process

**Step 1: Deploy new version (green) alongside existing (blue)**
```bash
# Current production: blue on dotnet-db-demo.apps.example.com
cf apps
# dotnet-db-demo-blue - dotnet-db-demo.apps.example.com (production)

# Deploy green version
./deploy-green.sh
# dotnet-db-demo-green - dotnet-db-demo-green-temp.apps.example.com (testing)
```

**Step 2: Test green version**
```bash
# Access green via temporary route
curl https://dotnet-db-demo-green-temp.apps.example.com/api/infos
# Verify database connectivity and functionality
```

**Step 3: Map production route to green**
```bash
cf map-route dotnet-db-demo-green apps.example.com --hostname dotnet-db-demo
```

**Step 4: Verify both versions receiving traffic**
```bash
cf apps
# Both blue and green now serve production traffic
```

**Step 5: Remove production route from blue**
```bash
cf unmap-route dotnet-db-demo-blue apps.example.com --hostname dotnet-db-demo
```

**Step 6: Cleanup**
```bash
# Optional: Delete old blue deployment
cf delete dotnet-db-demo-blue

# Or keep for quick rollback
cf stop dotnet-db-demo-blue
```

**Rollback:** Simply reverse the route mapping to switch back to blue instantly.

## Docker Compose Services

### PostgreSQL
- **Image**: postgres:17
- **Database**: demodb
- **User**: demouser
- **Password**: demopass
- **Port**: 5432 (internal only, no external mapping)
- **Volume**: postgres_data (persistent storage)

### pgAdmin
- **Image**: dpage/pgadmin4:latest
- **Port**: 5050
- **Login**: admin@demo.com / admin
- **Purpose**: Database administration UI

### Application
- **Build**: Dockerfile in current directory
- **Port**: 8081
- **Dependencies**: Waits for PostgreSQL health check
- **Network**: Shared network with PostgreSQL

## Database Initialization

The application uses Entity Framework Core migrations and a custom `DatabaseInitializer`:

1. **On Startup**: Checks if `pets` table has data
2. **If Empty**: Seeds 8 sample pet records
3. **If Exists**: Skips initialization (idempotent)

```csharp
public class DatabaseInitializer
{
    public async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        if (!await context.Pets.AnyAsync())
        {
            // Seed sample data
        }
    }
}
```

## Project Structure

```
dotnet-demo/
├── Program.cs                    # Application entry point, VCAP_SERVICES parsing
├── dotnet-demo.csproj           # Project dependencies
├── appsettings.json             # Configuration (connection string, version)
├── Models/
│   ├── Pet.cs                   # Pet entity
│   ├── TechStack.cs             # Tech stack info model
│   └── InfoResponse.cs          # API response model
├── Data/
│   ├── AppDbContext.cs          # Entity Framework DbContext
│   └── DatabaseInitializer.cs  # Database seeding logic
├── Controllers/
│   ├── InfoController.cs        # GET /api/infos
│   └── PetController.cs         # GET /api/pets
├── wwwroot/
│   └── index.html               # Frontend UI
├── docker-compose.yaml          # Multi-container setup
├── Dockerfile                   # Container build
├── manifest.yml                 # Default CF manifest
├── manifest-blue.yml            # Blue version manifest
├── manifest-green.yml           # Green version manifest
├── toggle.sh                    # Version toggle script
├── deploy-blue.sh               # Blue deployment script
├── deploy-green.sh              # Green deployment script
└── create-db-service.sh         # CF service creation script
```

## Cloud-Native Patterns Demonstrated

1. **Externalized Configuration** - Environment variables and VCAP_SERVICES
2. **Service Binding** - Automatic database credential injection
3. **Health Checks** - HTTP endpoint for orchestration
4. **Stateless Design** - All state in PostgreSQL
5. **Blue/Green Deployment** - Zero-downtime deployments
6. **Auto-scaling Ready** - Stateless design supports horizontal scaling
7. **Containerization** - Docker support with buildpacks
8. **Database Migrations** - Automatic schema management

## Troubleshooting

### Port Already in Use

If port 8081 is occupied:
```bash
# Find process using port
lsof -ti:8081

# Kill process
kill -9 <PID>

# Or change port
export PORT=8082
dotnet run
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### pgAdmin Cannot Connect

In pgAdmin, create server connection:
- **Host**: postgres (not localhost)
- **Port**: 5432
- **Database**: demodb
- **Username**: demouser
- **Password**: demopass

## License

MIT
