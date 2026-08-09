param(
  [string]$Root = "",
  [string]$Target = "",
  [int]$MaxFiles = 5000,
  [switch]$Write
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $scriptDir "ai-teams-rule-refresh.mjs"
$arguments = @($runner, "--max-files", "$MaxFiles")
if ($Root) { $arguments += @("--root", $Root) }
if ($Target) { $arguments += @("--target", $Target) }
if ($Write) { $arguments += "--write" }

& node @arguments
exit $LASTEXITCODE
