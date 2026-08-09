param(
  [string]$Target,
  [switch]$Plan,
  [switch]$Write,

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RemainingArgs
)

$ForwardArgs = @()
if ($Target) {
  $ForwardArgs += "--target"
  $ForwardArgs += $Target
}
if ($Plan) {
  $ForwardArgs += "--plan"
}
if ($Write) {
  $ForwardArgs += "--write"
}
if ($RemainingArgs) {
  $ForwardArgs += $RemainingArgs
}

& (Join-Path $PSScriptRoot "ai-teams-run.ps1") "ai-teams-init-project.sh" @ForwardArgs
exit $LASTEXITCODE
