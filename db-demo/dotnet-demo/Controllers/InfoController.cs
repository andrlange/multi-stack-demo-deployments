using Microsoft.AspNetCore.Mvc;
using DotnetDbDemo.Models;
using DotnetDbDemo.Data;
using Microsoft.EntityFrameworkCore;
using System.Runtime.InteropServices;

namespace DotnetDbDemo.Controllers;

[ApiController]
[Route("api")]
public class InfoController : ControllerBase
{
    private readonly AppConfig _appConfig;
    private readonly AppDbContext _dbContext;

    public InfoController(AppConfig appConfig, AppDbContext dbContext)
    {
        _appConfig = appConfig;
        _dbContext = dbContext;
    }

    [HttpGet("infos")]
    public ActionResult<TechStackInfo> GetInfo()
    {
        var dotnetVersion = Environment.Version.ToString();

        // Detect database type from the DbContext provider
        var databaseType = DetectDatabaseType();

        var techStack = new TechStack
        {
            Framework = "ASP.NET Core",
            Version = "8.0",
            Language = "C#",
            LanguageVersion = dotnetVersion,
            Runtime = ".NET Runtime",
            Database = databaseType
        };

        var info = new TechStackInfo
        {
            Uuid = _appConfig.Uuid,
            Version = _appConfig.Version,
            DeploymentColor = _appConfig.DeploymentColor,
            TechStack = techStack
        };

        return Ok(info);
    }

    private string DetectDatabaseType()
    {
        var providerName = _dbContext.Database.ProviderName;

        if (providerName != null && providerName.Contains("MySql", StringComparison.OrdinalIgnoreCase))
        {
            return "MySQL";
        }
        else if (providerName != null && providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            return "PostgreSQL";
        }

        return "Unknown Database";
    }
}
