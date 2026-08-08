$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
$ProjectPython = Join-Path $ProjectDir ".venv\Scripts\python.exe"
$PythonCandidates = @(
  $ProjectPython,
  "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe",
  "python",
  "py"
)

$Python = $null
foreach ($Candidate in $PythonCandidates) {
  try {
    if ($Candidate -eq "python" -or $Candidate -eq "py") {
      $null = & $Candidate --version 2>$null
      $Python = $Candidate
    } elseif (Test-Path $Candidate) {
      $Python = $Candidate
    }
  } catch {}
  if ($Python) { break }
}

if (-not $Python) {
  throw "Khong tim thay Python. Hay cai Python 3.11+ hoac mo app bang runtime Codex."
}

Set-Location $ProjectDir
& $Python -m uvicorn app:app --host 0.0.0.0 --port 8000
