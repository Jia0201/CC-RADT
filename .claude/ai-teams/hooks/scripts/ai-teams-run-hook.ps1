param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$HookName
)

$ErrorActionPreference = "Stop"
$Runner = Join-Path $PSScriptRoot "ai-teams-run-hook.mjs"

if (-not (Test-Path $Runner)) {
  Write-Error "AI-Teams hook runner not found: $Runner"
  exit 0
}

$InputText = [Console]::In.ReadToEnd()
$TempFile = [System.IO.Path]::GetTempFileName()

try {
  [System.IO.File]::WriteAllText($TempFile, $InputText, [System.Text.UTF8Encoding]::new($false))
  Get-Content -Raw -Path $TempFile | node $Runner $HookName
  exit $LASTEXITCODE
}
finally {
  Remove-Item -Path $TempFile -ErrorAction SilentlyContinue
}
