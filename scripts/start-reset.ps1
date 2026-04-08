param(
    [switch]$NoBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

function Invoke-Compose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$ComposeArgs
    )

    if (Get-Command docker -ErrorAction SilentlyContinue) {
        & docker compose @ComposeArgs
        return
    }

    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        & docker-compose @ComposeArgs
        return
    }

    throw 'Docker Compose is not installed. Install Docker Desktop (or docker-compose) and retry.'
}

Push-Location $repoRoot
try {
    Write-Host '[1/4] Stopping stack and removing volumes...'
    Invoke-Compose -ComposeArgs @('down', '-v', '--remove-orphans')

    Write-Host '[2/4] Starting stack...'
    $upArgs = @('up', '-d')
    if (-not $NoBuild) {
        $upArgs += '--build'
    }
    Invoke-Compose -ComposeArgs $upArgs

    Write-Host '[3/4] Current container status:'
    Invoke-Compose -ComposeArgs @('ps')

    Write-Host '[4/4] Quick health checks:'
    try {
        $health = Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -TimeoutSec 10
        Write-Host "API health: $($health.status)"
    }
    catch {
        Write-Warning 'API health endpoint is not ready yet (http://localhost:3001/api/health).'
    }

    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000' -Method Head -TimeoutSec 10
        Write-Host "Dashboard HTTP status: $($response.StatusCode)"
    }
    catch {
        Write-Warning 'Dashboard endpoint is not ready yet (http://localhost:3000).'
    }

    Write-Host 'Done.'
    Write-Host 'Dashboard: http://localhost:3000'
    Write-Host 'API: http://localhost:3001/api/health'
}
finally {
    Pop-Location
}
