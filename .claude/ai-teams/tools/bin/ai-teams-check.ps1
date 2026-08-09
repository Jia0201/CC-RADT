param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

& (Join-Path $PSScriptRoot "ai-teams-run.ps1") "ai-teams-check.sh" @Args
exit $LASTEXITCODE
