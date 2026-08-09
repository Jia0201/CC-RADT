param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

& (Join-Path $PSScriptRoot "ai-teams-run.ps1") "ai-teams-package.sh" @Args
exit $LASTEXITCODE
