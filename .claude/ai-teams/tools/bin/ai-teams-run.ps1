param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Script,

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RemainingArgs
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$ScriptPath = Join-Path $Root ("tools/bin/" + $Script)

if (-not (Test-Path $ScriptPath)) {
  Write-Error "AI-Teams script not found: $ScriptPath"
  exit 1
}

$Bash = Get-Command bash -ErrorAction SilentlyContinue
if ($Bash) {
  & $Bash.Source $ScriptPath @RemainingArgs
  exit $LASTEXITCODE
}

$Wsl = Get-Command wsl -ErrorAction SilentlyContinue
if ($Wsl) {
  $UnixPath = $ScriptPath -replace "\\", "/"
  if ($UnixPath -match "^([A-Za-z]):/(.*)$") {
    $Drive = $Matches[1].ToLower()
    $UnixPath = "/mnt/$Drive/$($Matches[2])"
  }
  & $Wsl.Source bash $UnixPath @RemainingArgs
  exit $LASTEXITCODE
}

Write-Error "Windows needs Git Bash or WSL to run AI-Teams Bash tools. Hooks use Node natively; tools can be run through this PowerShell wrapper when bash or WSL is available."
exit 1
