using Microsoft.EntityFrameworkCore;
using DotnetDbDemo.Data;
using DotnetDbDemo.Models;

var builder = WebApplication.CreateBuilder(args);

// Configure port from environment variable or use default
var port = Environment.GetEnvironmentVariable("PORT") ?? "8081";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add services to the container
builder.Services.AddControllers();

// Configure application settings
builder.Services.AddSingleton<AppConfig>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    return new AppConfig
    {
        Uuid = Guid.NewGuid().ToString(),
        Version = configuration["App:Version"] ?? "1.0.0",
        DeploymentColor = configuration["App:DeploymentColor"] ?? "blue"
    };
});

// Configure database
var (connectionString, dbType) = GetDatabaseConnectionString(builder.Configuration);
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (dbType == "mysql")
    {
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 21));
        options.UseMySql(connectionString, serverVersion);
        Console.WriteLine("Using MySQL database provider");
    }
    else
    {
        options.UseNpgsql(connectionString);
        Console.WriteLine("Using PostgreSQL database provider");
    }
});

// Add health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    DatabaseInitializer.Initialize(context);
}

// Configure the HTTP request pipeline
app.UseStaticFiles();
app.UseRouting();

app.MapControllers();
app.MapHealthChecks("/health");

// Serve index.html for root
app.MapFallbackToFile("index.html");

app.Run();

static (string connectionString, string dbType) GetDatabaseConnectionString(IConfiguration configuration)
{
    // Check for Cloud Foundry VCAP_SERVICES
    var vcapServices = Environment.GetEnvironmentVariable("VCAP_SERVICES");
    if (!string.IsNullOrEmpty(vcapServices))
    {
        try
        {
            var services = System.Text.Json.JsonDocument.Parse(vcapServices);

            // Check for MySQL first (both "mysql" and "p.mysql" service types)
            if (services.RootElement.TryGetProperty("mysql", out var mysqlServices) ||
                services.RootElement.TryGetProperty("p.mysql", out mysqlServices))
            {
                var mysql = mysqlServices[0];
                var credentials = mysql.GetProperty("credentials");

                // Check if credentials contain a URI (common with CredHub)
                if (credentials.TryGetProperty("uri", out var uriElement))
                {
                    var uri = uriElement.GetString();
                    if (!string.IsNullOrEmpty(uri))
                    {
                        var parsedUri = ParseMySqlUri(uri);
                        Console.WriteLine("Using MySQL database from VCAP_SERVICES (URI)");
                        return (parsedUri, "mysql");
                    }
                }

                // Otherwise parse individual credential fields
                var host = credentials.GetProperty("hostname").GetString() ?? credentials.GetProperty("host").GetString();
                var port = credentials.TryGetProperty("port", out var portElement) ? portElement.GetInt32() : 3306;
                var database = credentials.GetProperty("name").GetString() ?? credentials.GetProperty("database").GetString();
                var username = credentials.GetProperty("username").GetString() ?? credentials.GetProperty("user").GetString();
                var password = credentials.GetProperty("password").GetString();

                Console.WriteLine("Using MySQL database from VCAP_SERVICES");
                return ($"Server={host};Port={port};Database={database};User={username};Password={password};SslMode=Required;", "mysql");
            }
            // Check for PostgreSQL (both "postgres" and "p.postgresql" service types)
            else if (services.RootElement.TryGetProperty("postgres", out var postgresServices) ||
                     services.RootElement.TryGetProperty("p.postgresql", out postgresServices) ||
                     services.RootElement.TryGetProperty("postgresql", out postgresServices))
            {
                var postgres = postgresServices[0];
                var credentials = postgres.GetProperty("credentials");

                // Check if credentials contain a URI (common with CredHub)
                if (credentials.TryGetProperty("uri", out var uriElement))
                {
                    var uri = uriElement.GetString();
                    if (!string.IsNullOrEmpty(uri))
                    {
                        var parsedUri = ParsePostgreSqlUri(uri);
                        Console.WriteLine("Using PostgreSQL database from VCAP_SERVICES (URI)");
                        return (parsedUri, "postgres");
                    }
                }

                // Otherwise parse individual credential fields
                var host = credentials.GetProperty("hostname").GetString() ?? credentials.GetProperty("host").GetString();
                var port = credentials.TryGetProperty("port", out var portElement) ? portElement.GetInt32() : 5432;
                var database = credentials.GetProperty("name").GetString() ?? credentials.GetProperty("database").GetString();
                var username = credentials.GetProperty("username").GetString() ?? credentials.GetProperty("user").GetString();
                var password = credentials.GetProperty("password").GetString();

                Console.WriteLine("Using PostgreSQL database from VCAP_SERVICES");
                return ($"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true", "postgres");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error parsing VCAP_SERVICES: {ex.Message}");
        }
    }

    // Check environment variable first (for Docker Compose), then fall back to configuration
    // Default to PostgreSQL for local/Docker development
    var connString = Environment.GetEnvironmentVariable("DATABASE_URL")
        ?? configuration.GetConnectionString("DefaultConnection")
        ?? "Host=localhost;Port=5432;Database=demodb;Username=demouser;Password=demopass";

    // Detect database type from connection string
    var dbType = connString.Contains("Server=") || connString.Contains("server=") ? "mysql" : "postgres";

    Console.WriteLine($"Using {dbType} database from configuration/environment");
    return (connString, dbType);
}

static string ParseMySqlUri(string uri)
{
    // Parse URI format: mysql2://username:password@host:port/database?params
    // or mysql://username:password@host:port/database?params
    try
    {
        var cleanUri = uri.Replace("mysql2://", "mysql://");
        var mysqlUri = new Uri(cleanUri);

        var host = mysqlUri.Host;
        var port = mysqlUri.Port > 0 ? mysqlUri.Port : 3306;
        var database = mysqlUri.AbsolutePath.TrimStart('/').Split('?')[0];
        var userInfo = mysqlUri.UserInfo.Split(':');
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";

        return $"Server={host};Port={port};Database={database};User={username};Password={password};SslMode=Required;";
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error parsing MySQL URI: {ex.Message}");
        throw;
    }
}

static string ParsePostgreSqlUri(string uri)
{
    // Parse URI format: postgres://username:password@host:port/database?params
    try
    {
        var postgresUri = new Uri(uri);

        var host = postgresUri.Host;
        var port = postgresUri.Port > 0 ? postgresUri.Port : 5432;
        var database = postgresUri.AbsolutePath.TrimStart('/').Split('?')[0];
        var userInfo = postgresUri.UserInfo.Split(':');
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";

        return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error parsing PostgreSQL URI: {ex.Message}");
        throw;
    }
}
