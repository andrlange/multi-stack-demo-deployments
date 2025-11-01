# Multi-Stack Demo Applications

## Overview
This repository contains demo applications built with different technology stacks to showcase cloud-native development patterns and deployment strategies. The project includes two types of demos, each implemented in three different technology stacks (Spring Boot/Java, .NET Core/C#, Node.js/React).

## Purpose
The goal of this demo is to:
- **Compare Tech Stacks**: See how the same application is implemented in Spring Boot (Java), .NET Core, and Node.js + React
- **Cloud Native Patterns**: Demonstrate containerization, external configuration, stateless and stateful designs
- **Database Integration**: Show cloud-native database patterns with PostgreSQL and MySQL
- **Deployment Flexibility**: Show multiple deployment options (local, Docker, Cloud Foundry)
- **Blue/Green Deployments**: Visualize deployment strategies with version and color coding
- **Multi-Instance Awareness**: Use UUIDs to identify different instances in load-balanced scenarios
- **Service Binding**: Demonstrate Cloud Foundry service binding with VCAP_SERVICES

## Demo Applications

### Simple-Demo (Stateless Applications)
Basic stateless applications showcasing fundamental cloud-native patterns.

![Simple Demo Screenshot](assets/simple-demo.png)

#### 1. Spring Boot Demo (`simple-demo/spring-boot-demo`)
- **Framework**: Spring Boot 3.5.7
- **Language**: Java 21
- **Port**: 8080 (configurable via PORT env var)

#### 2. .NET Core Demo (`simple-demo/dotnet-demo`)
- **Framework**: .NET 8.0
- **Language**: C#
- **Port**: 8081 (configurable via PORT env var)

#### 3. Node.js + React Demo (`simple-demo/nodejs-demo`)
- **Backend**: Express.js
- **Frontend**: React
- **Port**: 8082 (configurable via PORT env var)

### DB-Demo (Database-Backed Applications)
Applications with PostgreSQL database integration demonstrating cloud-native data patterns.

![DB Demo Screenshot](assets/db-demo.png)

#### 1. Spring Boot DB Demo (`db-demo/spring-boot-demo`)
- **Framework**: Spring Boot 3.5.7 + Spring Data JPA
- **Language**: Java 21
- **Database**: PostgreSQL 17
- **Port**: 8080 (configurable via PORT env var)

#### 2. .NET Core DB Demo (`db-demo/dotnet-demo`)
- **Framework**: .NET 8.0 + Entity Framework Core
- **Language**: C#
- **Database**: PostgreSQL 17
- **Port**: 8081 (configurable via PORT env var)

#### 3. Node.js DB Demo (`db-demo/nodejs-demo`)
- **Backend**: Express.js + pg (node-postgres)
- **Frontend**: React
- **Database**: PostgreSQL 17
- **Port**: 8082 (configurable via PORT env var)

## Features

### Simple-Demo Features

#### Web Interface
- **Instance UUID**: Displayed in the header to identify individual instances
- **Tech Stack Info**: Framework, language version, runtime details
- **Version Badge**: Configurable version number with color coding for deployment visualization

#### REST API
- **Endpoint**: `GET /api/infos`
- **Returns**: JSON with tech stack information and instance details

![API Infos Response](assets/api-infos.png)

### DB-Demo Features

#### Web Interface
- **Instance UUID**: Displayed in the header to identify individual instances
- **Tech Stack Info**: Framework, language version, runtime details
- **Version Badge**: Configurable version number with color coding for deployment visualization
- **Pets Table**: Database-backed table showing 8 sample pet entries (race, gender, name, age, description)

#### REST API
- **Endpoint**: `GET /api/infos` - Tech stack information
- **Endpoint**: `GET /api/pets` - List all pets from PostgreSQL database

![API Pets Response](assets/api-pets.png)

#### Database Integration
- **PostgreSQL 17 or MySQL 8**: Dual database support with automatic detection
- **Sample Data**: 8 pre-populated pet entries
- **Auto-initialization**: Creates table and data on first run
- **Docker Compose**: Includes PostgreSQL and pgAdmin 4 for local development
- **Cloud Foundry**: Auto-detects MySQL or PostgreSQL via VCAP_SERVICES (my-demo-db)
- **Flexible Deployment**: Choose between PostgreSQL or MySQL when deploying to Cloud Foundry

## Deployment Options

### Simple-Demo: Local Development
Each application can be run directly on your machine:
```bash
# Spring Boot
cd simple-demo/spring-boot-demo
./mvnw spring-boot:run

# .NET Core
cd simple-demo/dotnet-demo
dotnet run

# Node.js
cd simple-demo/nodejs-demo
npm install
npm start
```

### DB-Demo: Local Development with Docker Compose
The db-demo apps require PostgreSQL, provided via Docker Compose:
```bash
# Spring Boot
cd db-demo/spring-boot-demo
docker-compose up

# .NET Core
cd db-demo/dotnet-demo
docker-compose up

# Node.js
cd db-demo/nodejs-demo
docker-compose up
```

This starts:
- The application (Spring Boot/8080, .NET/8081, Node.js/8082)
- PostgreSQL 17 database (internal network only)
- pgAdmin 4 at http://localhost:5050 (admin@demo.com / admin)

### Docker with Cloud Native Buildpacks
Build and run using Paketo buildpacks:
```bash
cd simple-demo/<app-name>
./build.sh
docker-compose up
```

### Cloud Foundry Deployment

#### Simple-Demo
```bash
cd simple-demo/<app-name>
cf push
```

#### DB-Demo (with Database Service)

**Option 1: PostgreSQL (default)**
```bash
cd db-demo/<app-name>
# Create PostgreSQL service if it doesn't exist
./create-db-service.sh
# or explicitly:
./create-db-service.sh postgres
# Deploy application
cf push
```

**Option 2: MySQL**
```bash
cd db-demo/<app-name>
# Create MySQL service if it doesn't exist
./create-db-service.sh mysql
# Deploy application
cf push
```

The db-demo applications automatically detect and bind to either MySQL or PostgreSQL service (`my-demo-db`) in Cloud Foundry via VCAP_SERVICES. The application will configure itself accordingly based on the detected database type.

## Configuration
Each application uses its native configuration format to set:
- **Version Number**: For blue/green deployment identification
- **Deployment Color**: Visual indicator (blue, green, etc.)

Configuration files:
- Spring Boot: `application.properties`
- .NET Core: `appsettings.json`
- Node.js: `.env` or `config.json`

## Blue/Green Deployment Demo
1. Deploy version 1.0.0 with color "blue"
2. Access the application and note the UUID and color
3. Deploy version 2.0.0 with color "green"
4. Toggle traffic between versions to demonstrate zero-downtime deployment
5. Use the UUID to track which instance is handling requests

## Cloud Native Patterns Demonstrated

### Simple-Demo Patterns
- ✅ **Stateless Design**: No shared state between instances
- ✅ **External Configuration**: Version and color from config files
- ✅ **Containerization**: Cloud Native Buildpacks for security and consistency
- ✅ **API-First**: REST endpoints alongside web UI
- ✅ **Health Monitoring**: Each app exposes health information
- ✅ **Platform Portability**: Runs on local, Docker, Cloud Foundry

#### Health Check Endpoints
All applications provide health check endpoints for monitoring and orchestration:

![Spring Boot Actuator Health](assets/actuator-health.png)

- **Spring Boot**: `/actuator/health` - Actuator health endpoint
- **.NET Core**: `/health` - ASP.NET Core health check
- **Node.js**: `/health` - Custom health endpoint

### DB-Demo Patterns (Additional)
- ✅ **External Service Dependency**: Database as a separate, managed service
- ✅ **Service Binding**: Cloud Foundry VCAP_SERVICES for database credentials
- ✅ **Multi-Database Support**: Automatic detection and configuration for MySQL or PostgreSQL
- ✅ **Loose Coupling**: Application doesn't manage database lifecycle
- ✅ **Environment-Based Configuration**: Database connection from environment variables
- ✅ **Service Discovery**: Platform provides database location and credentials
- ✅ **Database Initialization**: Automatic schema creation on first run
- ✅ **Docker Compose for Dev**: Local development with PostgreSQL and pgAdmin

## Architecture
```
┌─────────────────────────────────────────┐
│          Load Balancer                  │
└─────────────────────────────────────────┘
         │              │
         ▼              ▼
    ┌─────────┐    ┌─────────┐
    │ App v1  │    │ App v2  │
    │ (Blue)  │    │ (Green) │
    │ UUID: A │    │ UUID: B │
    └─────────┘    └─────────┘
```

## Getting Started
1. Clone this repository
2. Navigate to the demo of your choice in `simple-demo/`
3. Follow the README in each subdirectory for specific setup instructions
4. Start the application using your preferred method (local, Docker, or CF)
5. Access the web UI or call the `/api/infos` endpoint

## Project Structure
```
demo/
├── README.md (this file)
├── CLAUDE.md (planning document)
├── LICENSE (MIT License)
├── .gitignore
├── assets/ (screenshots)
├── simple-demo/
│   ├── spring-boot-demo/
│   ├── dotnet-demo/
│   └── nodejs-demo/
└── db-demo/
    ├── spring-boot-demo/
    ├── dotnet-demo/
    └── nodejs-demo/
```

## Documentation
- See `CLAUDE.md` for detailed planning and architectural decisions
- Each application subdirectory contains its own README with specific instructions

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

This is a demonstration project specifically designed for **educational purposes**. Feel free to use, modify, and share for learning and teaching.

## Happy Coding
### 11/2025 - Andreas Lange