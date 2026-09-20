# Builds ..\BubbleChamber_MathPhysics.exe — a single self-contained exe (web app + WebView2 SDK DLLs embedded as app.zip).
# Needs nothing but the C# compiler that ships with Windows (.NET Framework 4.x).
# Re-run after changing index.html / style.css / js / vendor so the embedded copy is refreshed.
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$root = Split-Path $here -Parent
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) { throw "csc.exe not found: $csc" }

$stage = Join-Path $env:TEMP ('bubblechamber_stage_' + [guid]::NewGuid().ToString('N'))
$zip = Join-Path $here 'app.zip'
$exe = Join-Path $root 'BubbleChamber_MathPhysics.exe'
New-Item -ItemType Directory -Force (Join-Path $stage 'web'), (Join-Path $stage 'bin') | Out-Null
try {
    Copy-Item (Join-Path $root 'index.html'), (Join-Path $root 'style.css') (Join-Path $stage 'web')
    Copy-Item (Join-Path $root 'js'), (Join-Path $root 'vendor') (Join-Path $stage 'web') -Recurse
    Copy-Item (Join-Path $here 'lib\*.dll') (Join-Path $stage 'bin')

    if (Test-Path $zip) { Remove-Item $zip -Force }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($stage, $zip, 'Optimal', $false)

    & $csc /nologo /codepage:65001 /target:winexe /platform:x64 /optimize+ `
        "/out:$exe" `
        "/win32icon:$(Join-Path $here 'app.ico')" `
        "/resource:$zip,app.zip" `
        /reference:System.dll /reference:System.Core.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll `
        /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll `
        "/reference:$(Join-Path $here 'lib\Microsoft.Web.WebView2.Core.dll')" `
        "/reference:$(Join-Path $here 'lib\Microsoft.Web.WebView2.WinForms.dll')" `
        (Join-Path $here 'Program.cs')
    if ($LASTEXITCODE -ne 0) { throw "csc failed ($LASTEXITCODE)" }
    Get-Item $exe | Select-Object Name, Length, LastWriteTime
}
finally {
    Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $zip -Force -ErrorAction SilentlyContinue
}
