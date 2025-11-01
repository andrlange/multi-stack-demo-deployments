# .NET Core Demo Application

A cloud-native demo application built with ASP.NET Core 8.0 and C#.

## Features
- Web interface showing tech stack information
- Instance UUID for multi-instance identification
- Configurable version and deployment color for blue/green deployments
- REST API endpoint for programmatic access
- Health check endpoints

## Prerequisites

### For Local Development
- .NET 8.0 SDK or later

### For Docker Build
- Docker
- Pack CLI (Buildpacks): `brew install buildpacks/tap/pack`

### For Cloud Foundry
- CF CLI
- Access to a Cloud Foundry environment

## Running Locally

### Using dotnet CLI
```bash
dotnet restore
dotnet run
```

The application will start on `http://localhost:8081`

### Using dotnet watch (with hot reload)
```bash
dotnet watch run
```

## Building and Running with Docker

### Build with Cloud Native Buildpacks
```bash
chmod +x build.sh
./build.sh
```

### Run with Docker Compose
```bash
docker-compose up
```

### Run with Docker directly
```bash
docker run -p 8081:8081 dotnet-demo:latest
```

## Deploying to Cloud Foundry

Cloud Foundry will automatically detect the .NET application and use the appropriate buildpack.

### Quick Deploy (Default)

Deploy the default blue version:
```bash
./deploy-default.sh
```

This deploys a single app instance named `dotnet-demo` with version 1.0.0 (blue).

### Blue/Green Deployment Strategy

This application includes scripts for zero-downtime blue/green deployments on Cloud Foundry.

#### Deploy Blue Version
```bash
./deploy-blue.sh
```
- App name: `dotnet-demo-blue`
- Version: 1.0.0
- Color: Blue
- Instances: 2

#### Deploy Green Version
```bash
./deploy-green.sh
```
- App name: `dotnet-demo-green`
- Version: 2.0.0
- Color: Green
- Instances: 2

### Step-by-Step Blue/Green Cutover

This demonstrates a zero-downtime deployment with gradual traffic shifting:

**Step 1: Initial State - Blue is live (100% traffic)**
```bash
./deploy-blue.sh
cf map-route dotnet-demo-blue apps.example.com --hostname dotnet-demo
```
State: Blue (2 instances) → 100% traffic

**Step 2: Deploy Green (0% traffic)**
```bash
./deploy-green.sh
cf scale dotnet-demo-green -i 0
```
State: Blue (2 instances) → 100% traffic, Green (0 instances) → 0% traffic

**Step 3: Start Green instances and add to routing (50/50 split)**
```bash
cf scale dotnet-demo-green -i 2
cf map-route dotnet-demo-green apps.example.com --hostname dotnet-demo
```
State: Blue (2 instances) → 50% traffic, Green (2 instances) → 50% traffic

**Step 4: Monitor and verify Green is healthy**
```bash
cf app dotnet-demo-green
cf logs dotnet-demo-green --recent
# Test the endpoint and check UUIDs to verify both versions
curl https://dotnet-demo.apps.example.com/api/infos
```

**Step 5: Gradual cutover - Scale down Blue, keep Green (25/75 split)**
```bash
cf scale dotnet-demo-blue -i 1
```
State: Blue (1 instance) → 25% traffic, Green (2 instances) → 75% traffic

**Step 6: Complete cutover - Remove Blue (0/100 split)**
```bash
cf unmap-route dotnet-demo-blue apps.example.com --hostname dotnet-demo
cf scale dotnet-demo-blue -i 0
# Or delete the blue app entirely
cf delete dotnet-demo-blue
```
State: Blue (0 instances) → 0% traffic, Green (2 instances) → 100% traffic

**Step 7: Rollback (if needed)**

If issues are detected, instantly rollback:
```bash
cf scale dotnet-demo-blue -i 2
cf map-route dotnet-demo-blue apps.example.com --hostname dotnet-demo
cf unmap-route dotnet-demo-green apps.example.com --hostname dotnet-demo
```

### Manual Deployment

If you prefer manual deployment:
```bash
# Build the application
dotnet publish -c Release

# Deploy using specific manifest
cf push -f manifest-blue.yml
# or
cf push -f manifest-green.yml
# or default
cf push -f manifest.yml
```

## Configuration

### Port Configuration

The application uses port 8081 by default, but can be customized via the `PORT` environment variable:

```bash
# Run on default port 8081
dotnet run

# Run on custom port
PORT=9000 dotnet run
```

The port is configured in `Program.cs` as:
```csharp
var port = Environment.GetEnvironmentVariable("PORT") ?? "8081";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
```

### Version and Color Configuration

Edit `appsettings.json` to change:

```json
{
  "App": {
    "Version": "1.0.0",
    "DeploymentColor": "blue"
  }
}
```

Available colors: `blue`, `green`, `red`, `yellow`

### Environment Variables
You can also configure via environment variables:
```bash
export App__Version=2.0.0
export App__DeploymentColor=green
dotnet run
```

### Quick Toggle Script

Use the `toggle.sh` script to quickly switch between version 1.0.0 (blue) and version 2.0.0 (green):

```bash
./toggle.sh
```

Each time you run the script, it toggles between:
- Version 1.0.0 with blue color
- Version 2.0.0 with green color

**Note**: You must restart the application after running `toggle.sh` for changes to take effect.

## API Endpoints

### Web Interface
- `GET /` - HTML page with tech stack information

### REST API
- `GET /api/infos` - JSON response with tech stack details

### Health Checks
- `GET /health` - Application health status

## Example API Response

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
    "runtime": ".NET Runtime"
  }
}
```

## Blue/Green Deployment Example

1. Deploy version 1.0.0 with blue color
2. Verify application is running
3. Change configuration to version 2.0.0 with green color
4. Deploy new version
5. Route traffic between versions as needed

## Project Structure
```
dotnet-demo/
├── Controllers/
│   └── InfoController.cs
├── Models/
│   ├── AppConfig.cs
│   ├── TechStack.cs
│   └── TechStackInfo.cs
├── wwwroot/
│   └── index.html
├── Program.cs
├── dotnet-demo.csproj
├── appsettings.json
├── Dockerfile
├── build.sh
├── toggle.sh
├── docker-compose.yaml
├── manifest.yml
├── manifest-blue.yml
├── manifest-green.yml
├── deploy-default.sh
├── deploy-blue.sh
└── deploy-green.sh
```

## Technology Stack
- **Framework**: ASP.NET Core 8.0
- **Language**: C#
- **Build Tool**: dotnet CLI
- **Containerization**: Multi-stage Docker builds
