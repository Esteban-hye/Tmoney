# Copie la version construite dans %LOCALAPPDATA%\Programs\Tmoney et crée les raccourcis (Bureau + menu Démarrer).
# Les données (tmoney.vault) sont dans %APPDATA%\Tmoney et ne sont pas touchées.
$ErrorActionPreference = 'Stop'
$src = Join-Path $PSScriptRoot '..\dist\win-unpacked'
$dest = Join-Path $env:LOCALAPPDATA 'Programs\Tmoney'

$running = Get-Process Tmoney -ErrorAction SilentlyContinue
if ($running) { $running | Stop-Process -Force; $running | Wait-Process -Timeout 10 -ErrorAction SilentlyContinue; Start-Sleep 2 }
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item "$src\*" $dest -Recurse -Force

$shell = New-Object -ComObject WScript.Shell
$targets = @(
  (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Tmoney.lnk'),
  (Join-Path ([Environment]::GetFolderPath('Programs')) 'Tmoney.lnk')
)
foreach ($t in $targets) {
  $lnk = $shell.CreateShortcut($t)
  $lnk.TargetPath = Join-Path $dest 'Tmoney.exe'
  $lnk.WorkingDirectory = $dest
  $lnk.IconLocation = (Join-Path $dest 'Tmoney.exe') + ',0'
  $lnk.Description = 'Tmoney - gestion de budget'
  $lnk.Save()
}
Write-Output "Tmoney installé dans $dest"
