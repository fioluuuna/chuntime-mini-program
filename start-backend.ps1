$node = "C:\Users\fioluuuna\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root "backend")
& $node .\server.js

