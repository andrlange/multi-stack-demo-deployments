# Demo Project Planning Document

## Project Goal
Create identical demo applications across three different technology stacks to showcase cloud-native patterns and deployment strategies. This project demonstrates how the same application functionality can be implemented in different languages/frameworks while maintaining consistent behavior and deployment capabilities.

The project includes two demo applications:
1. **simple-demo**: Stateless application showcasing basic cloud-native patterns
2. **db-demo**: Database-backed application demonstrating external service integration and cloud-native data patterns

## Technology Stacks

### 1. Spring Boot (Java)
- **Framework**: Spring Boot 3.5.7
- **Language**: Java 25
- **Build Tool**: Maven
- **Port**: 8080

### 2. .NET Core
- **Framework**: .NET 9.0 (latest LTS)
- **Language**: C#
- **Build Tool**: dotnet CLI
- **Port**: 8081

### 3. Node.js + React
- **Backend**: Node.js with Express
- **Frontend**: React
- **Build Tool**: npm
- **Port**: 8082

## Application Features

### Web Interface
Each application provides a web page displaying:
1. **Header UUID**: Unique identifier generated on startup to distinguish between multiple instances
2. **Tech Stack Information**: Details about the framework, language version, runtime, etc.
3. **Version Display**: Configurable version number with color coding for blue/green deployment visualization
   - Version and color should be configurable via a single configuration file
   - Color coding helps visually distinguish deployment versions

### REST API
- **Endpoint**: `GET /api/infos`
- **Response**: JSON containing tech stack information (same data as displayed on web page)

## Configuration Strategy

### Version and Color Configuration
Each application will use its native configuration mechanism:
- **Spring Boot**: `application.properties` or `application.yml`
- **.NET Core**: `appsettings.json`
- **Node.js**: `.env` file or `config.json`

Configuration fields:
```
app.version=1.0.0
app.deployment.color=blue  # or green, or any color
```

## Deployment Strategies

### 1. Local Development
Each application can be run locally on macOS:
- Spring Boot: `mvn spring-boot:run` (requires Maven installed)
- .NET Core: `dotnet run`
- Node.js: `npm start`

### 2. Docker with Multi-Stage Builds
Using standard multi-stage Docker builds for consistent, secure container images:
- **Dockerfile**: Multi-stage builds with builder and runtime stages
- **build.sh**: Script to build applications locally
- **docker-compose.yaml**: For running the application locally in containers
- Each Dockerfile includes health checks for container orchestration

### 3. Cloud Foundry
- **manifest.yml**: CF deployment descriptor
- Leverages platform-provided buildpacks (Java, .NET Core, Node.js)
- Zero-downtime blue/green deployments using version/color configuration

## Folder Structure
```
demo/
├── CLAUDE.md (this file)
├── README.md
├── LICENSE (MIT License for educational use)
├── .gitignore (comprehensive ignore file for all stacks)
├── assets/ (screenshots for documentation)
│   ├── simple-demo.png
│   ├── db-demo.png
│   ├── api-infos.png
│   ├── api-pets.png
│   └── actuator-health.png
├── simple-demo/
│   ├── spring-boot-demo/
│   │   ├── src/
│   │   ├── pom.xml
│   │   ├── Dockerfile (multi-stage: Maven builder + JRE runtime)
│   │   ├── docker-compose.yaml
│   │   ├── manifest.yml, manifest-blue.yml, manifest-green.yml
│   │   ├── build.sh, deploy-default.sh, deploy-blue.sh, deploy-green.sh
│   │   ├── toggle.sh (switch between blue/green versions)
│   │   └── README.md
│   ├── dotnet-demo/
│   │   ├── Program.cs
│   │   ├── *.csproj
│   │   ├── Dockerfile (multi-stage: .NET SDK builder + ASP.NET runtime)
│   │   ├── docker-compose.yaml
│   │   ├── manifest.yml, manifest-blue.yml, manifest-green.yml
│   │   ├── build.sh, deploy-default.sh, deploy-blue.sh, deploy-green.sh
│   │   ├── toggle.sh (switch between blue/green versions)
│   │   └── README.md
│   └── nodejs-demo/
│       ├── src/
│       ├── package.json
│       ├── Dockerfile (Node.js 22 Alpine)
│       ├── docker-compose.yaml
│       ├── manifest.yml, manifest-blue.yml, manifest-green.yml
│       ├── build.sh, deploy-default.sh, deploy-blue.sh, deploy-green.sh
│       ├── toggle.sh (switch between blue/green versions)
│       └── README.md
└── db-demo/
    ├── spring-boot-demo/
    │   ├── src/ (Spring Data JPA repositories, entities, services)
    │   ├── pom.xml
    │   ├── Dockerfile (multi-stage: Maven builder + JRE runtime)
    │   ├── docker-compose.yaml (PostgreSQL 17 + pgAdmin + app)
    │   ├── manifest.yml, manifest-blue.yml, manifest-green.yml
    │   ├── build.sh, deploy-default.sh, deploy-blue.sh, deploy-green.sh
    │   ├── toggle.sh, create-db-service.sh
    │   └── README.md
    ├── dotnet-demo/
    │   ├── Controllers/, Models/, Data/ (EF Core DbContext)
    │   ├── Program.cs (VCAP_SERVICES parsing)
    │   ├── *.csproj
    │   ├── Dockerfile (multi-stage: .NET SDK builder + ASP.NET runtime)
    │   ├── docker-compose.yaml (PostgreSQL 17 + pgAdmin + app)
    │   ├── manifest.yml, manifest-blue.yml, manifest-green.yml
    │   ├── build.sh, deploy-default.sh, deploy-blue.sh, deploy-green.sh
    │   ├── toggle.sh, create-db-service.sh
    │   └── README.md
    └── nodejs-demo/
        ├── public/, server.js (pg client, database initialization)
        ├── package.json
        ├── Dockerfile (Node.js 22 Alpine)
        ├── docker-compose.yaml (PostgreSQL 17 + pgAdmin + app)
        ├── manifest.yml, manifest-blue.yml, manifest-green.yml
        ├── build.sh, deploy-default.sh, deploy-blue.sh, deploy-green.sh
        ├── toggle.sh, create-db-service.sh
        └── README.md
```

## Cloud Native Patterns Demonstrated

1. **Stateless Applications**: Each instance is independently runnable
2. **Twelve-Factor App**: Configuration externalized, environment-based settings
3. **Health Checks**: Endpoints for monitoring application health
4. **Containerization**: Multi-stage Docker builds for reproducible, secure images
5. **Blue/Green Deployments**: Version and color coding for zero-downtime deployments
6. **Platform Portability**: Same app runs on local, Docker, Cloud Foundry
7. **Build Automation**: Automated build and deployment scripts for each stack

## Key Decisions

### UUID Generation
- Generated once at application startup
- Stored in memory (not persisted)
- Displayed in page header to identify specific instances in load-balanced scenarios

### Color Scheme for Versions
- Blue/Green are primary colors for deployment strategies
- Additional colors can be used (red, yellow, etc.) for more complex scenarios
- Colors applied via CSS classes based on configuration

### Docker Build Strategy
- **Multi-stage builds**: Separate builder and runtime stages for smaller, more secure images
- **Official base images**: Using official Maven, .NET SDK, and Node.js images for builders
- **Minimal runtime images**: Alpine-based JRE, ASP.NET runtime, and Node.js for production
- **Layer caching**: Dependencies cached separately from source code for faster builds
- **Health checks**: Built into Dockerfiles for container orchestration
- **Cloud Foundry**: Platform still uses buildpacks automatically during `cf push`

**Why Multi-Stage Builds Instead of Paketo Buildpacks? For this Demo-Setup only!**
- Simpler setup without CNB lifecycle complexity
- More transparent build process
- Easier to customize and debug
- Works consistently across all environments
- Smaller final images with Alpine Linux
- Direct control over build and runtime stages

### Build Tool Strategy
- **Maven**: Direct `mvn` command instead of Maven Wrapper (`./mvnw`)
  - Assumes Maven is installed locally (standard for development environments)
  - Simpler scripts without wrapper complexity
  - Docker builds use official Maven images with built-in Maven
- **.NET**: Standard `dotnet` CLI (no wrapper needed)
- **Node.js**: Standard `npm` CLI (no wrapper needed)

### Toggle Script Behavior
The `toggle.sh` script switches between blue (1.0.0) and green (2.0.0) versions by updating:
1. **Configuration files**: `application.properties`, `appsettings.json`, or `.env`
2. **docker-compose.yaml**: Environment variables for Docker builds
This ensures version consistency between local development and Docker Compose deployments.

### API Response Format
```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "version": "1.0.0",
  "deploymentColor": "blue",
  "techStack": {
    "framework": "Spring Boot",
    "version": "3.5.7",
    "language": "Java",
    "languageVersion": "25",
    "runtime": "JVM"
  }
}
```

---

# DB-Demo Application

## Overview
The **db-demo** application extends the simple-demo by adding PostgreSQL database integration to demonstrate cloud-native patterns for stateful services and external dependencies.

## Database Features

### PostgreSQL 17 Integration
- **Database**: PostgreSQL 17
- **Table**: `pets` with 8 dummy entries
- **Schema**:
  ```sql
  CREATE TABLE IF NOT EXISTS pets (
      id SERIAL PRIMARY KEY,
      race VARCHAR(50) NOT NULL,
      gender VARCHAR(10) NOT NULL,
      name VARCHAR(50) NOT NULL,
      age INTEGER NOT NULL,
      description TEXT
  );
  ```

### Sample Data
The application pre-populates the database with 8 pet entries:
1. Golden Retriever, Male, "Max", Age 5
2. Persian Cat, Female, "Luna", Age 3
3. German Shepherd, Male, "Rocky", Age 7
4. Siamese Cat, Female, "Bella", Age 2
5. Labrador, Male, "Charlie", Age 4
6. Maine Coon, Female, "Daisy", Age 6
7. Border Collie, Female, "Molly", Age 3
8. Bengal Cat, Male, "Oliver", Age 4

### Web Interface Enhancement
The db-demo web page displays:
1. Tech stack information (same as simple-demo)
2. **Pets Table**: Below tech stack info, showing all pet entries in a nicely formatted table

### Database Initialization
- **Auto-creation**: Application checks if `pets` table exists on startup
- **If not exists**: Creates table and inserts sample data
- **Idempotent**: Safe to restart multiple times

## Local Development with Docker Compose

Each db-demo application includes a `docker-compose.yaml` that provides:
- **PostgreSQL 17**: Database service (no external port mapping to avoid conflicts)
- **pgAdmin 4**: Database administration UI at http://localhost:5050
- **Application**: The demo app itself

### Docker Compose Configuration
```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: demodb
      POSTGRES_USER: demouser
      POSTGRES_PASSWORD: demopass
    # No ports mapping - internal only

  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - "5050:80"  # pgAdmin on port 5050
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@demo.com
      PGADMIN_DEFAULT_PASSWORD: admin

  app:
    # Application configuration
    depends_on:
      - postgres
```

### Port Strategy for Multi-Stack Local Development
- PostgreSQL: No external port (internal to Docker network)
- pgAdmin: Port 5050 (shared across all demos)
- Spring Boot app: Port 8080
- .NET app: Port 8081
- Node.js app: Port 8082

This allows all three db-demo apps to run simultaneously with the same pgAdmin instance.

## Cloud Foundry Integration

### Service Binding
Cloud Foundry uses **service binding** to connect applications to databases, following cloud-native principles:
- **Loose Coupling**: Database is an external, managed service
- **VCAP Variables**: Connection info provided via `VCAP_SERVICES` environment variable
- **Zero Configuration**: No hardcoded connection strings

### Database Service: `my-demo-db`
- **Service Name**: `my-demo-db`
- **Service Type**: `postgres` (or platform-specific PostgreSQL service)
- **Plan**: `small` (configurable based on platform)

### Manifest Configuration
Each manifest includes service binding:
```yaml
services:
  - my-demo-db
```

### Automatic Service Creation
The `create-db-service.sh` script:
1. Checks if `my-demo-db` service exists using `cf service`
2. If not found, creates the service: `cf create-service postgres small my-demo-db`
3. Waits for service to be ready
4. Reports status

Example:
```bash
#!/bin/bash
if cf service my-demo-db > /dev/null 2>&1; then
    echo "Service my-demo-db already exists"
else
    echo "Creating my-demo-db service..."
    cf create-service postgres small my-demo-db
    echo "Waiting for service to be ready..."
    # Wait and check
fi
```

### VCAP_SERVICES Pattern
Applications read database credentials from `VCAP_SERVICES`:
```json
{
  "postgres": [{
    "name": "my-demo-db",
    "credentials": {
      "uri": "postgres://user:pass@host:5432/dbname",
      "username": "user",
      "password": "pass",
      "host": "hostname",
      "port": 5432,
      "database": "dbname"
    }
  }]
}
```

Each framework has its own way to parse VCAP_SERVICES:
- **Spring Boot**: Spring Cloud Connectors or manual parsing
- **.NET Core**: Environment variable parsing
- **Node.js**: `cfenv` package or manual parsing

## Cloud Native Database Patterns Demonstrated

1. **External Service Dependency**: Database is a separate, managed service
2. **Environment-Based Configuration**: Connection info from environment, not code
3. **Service Discovery**: Applications discover database via platform (VCAP_SERVICES)
4. **Portability**: Same code runs locally (Docker) and in cloud (CF service binding)
5. **Database Initialization**: Automatic schema creation on startup
6. **Connection Pooling**: Proper connection management for cloud environments
7. **Resilience**: Graceful handling of database connectivity issues

## API Endpoints

### Web Interface
- `GET /` - HTML page with tech stack info and pets table

### REST API
- `GET /api/infos` - Tech stack information (same as simple-demo)
- `GET /api/pets` - List all pets from database

### Example API Response
```json
{
  "pets": [
    {
      "id": 1,
      "race": "Golden Retriever",
      "gender": "Male",
      "name": "Max",
      "age": 5,
      "description": "Friendly and energetic"
    },
    // ... more pets
  ]
}
```

## Technology-Specific Database Access

### Spring Boot
- **ORM**: Spring Data JPA with Hibernate
- **Driver**: PostgreSQL JDBC driver
- **Connection**: DataSource auto-configuration from VCAP_SERVICES

### .NET Core
- **ORM**: Entity Framework Core
- **Driver**: Npgsql (PostgreSQL .NET driver)
- **Connection**: DbContext configuration with priority order:
  1. VCAP_SERVICES (Cloud Foundry)
  2. DATABASE_URL environment variable (Docker Compose)
  3. appsettings.json ConnectionStrings (local development)
  4. Hardcoded fallback

### Node.js
- **Client**: `pg` (node-postgres)
- **ORM** (optional): Sequelize or raw SQL
- **Connection**: Connection pool from environment variables

## Future Enhancements
- Kubernetes manifests with PostgreSQL StatefulSet
- Helm charts with database subchart
- CI/CD pipeline examples with database migrations
- Observability (metrics, logging, tracing)
- Database migration tools (Flyway, Liquibase)
