using Microsoft.AspNetCore.Mvc;
using DotnetDemo.Models;
using System.Runtime.InteropServices;

namespace DotnetDemo.Controllers;

[ApiController]
[Route("api")]
public class InfoController : ControllerBase
{
    private readonly AppConfig _appConfig;

    public InfoController(AppConfig appConfig)
    {
        _appConfig = appConfig;
    }

    [HttpGet("infos")]
    public ActionResult<TechStackInfo> GetInfo()
    {
        var dotnetVersion = Environment.Version.ToString();
        var frameworkDescription = RuntimeInformation.FrameworkDescription;

        var techStack = new TechStack
        {
            Framework = "ASP.NET Core",
            Version = "8.0",
            Language = "C#",
            LanguageVersion = dotnetVersion,
            Runtime = ".NET Runtime"
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
}
