# Multi-stage build for .NET Core application
# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS builder

WORKDIR /app

# Copy project file and restore dependencies (cached layer)
COPY *.csproj .
RUN dotnet restore

# Copy everything else and build
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine

WORKDIR /app

# Copy published application from builder stage
COPY --from=builder /app/publish .

# Expose port
EXPOSE 8081

# Set default environment variables
ENV ASPNETCORE_URLS=http://+:8081
ENV PORT=8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Run the application
ENTRYPOINT ["dotnet", "dotnet-db-demo.dll"]
