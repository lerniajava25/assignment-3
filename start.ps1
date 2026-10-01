$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

# Prefer JAVA_HOME, then look for Java 21 installed by IntelliJ.
$candidates = @($env:JAVA_HOME)
$jdkDirectory = Join-Path $env:USERPROFILE '.jdks'
if (Test-Path -LiteralPath $jdkDirectory) {
    $candidates += Get-ChildItem -LiteralPath $jdkDirectory -Directory | Select-Object -ExpandProperty FullName
}
$javaCommand = Get-Command java.exe -ErrorAction SilentlyContinue
if ($javaCommand) {
    $candidates += Split-Path (Split-Path $javaCommand.Source -Parent) -Parent
}
$jdk = $candidates | Where-Object {
    $_ -and
    (Test-Path -LiteralPath (Join-Path $_ 'bin/javac.exe')) -and
    (Test-Path -LiteralPath (Join-Path $_ 'release')) -and
    (Select-String -LiteralPath (Join-Path $_ 'release') -Pattern '^JAVA_VERSION="21[."]' -Quiet)
} | Select-Object -First 1

if (-not $jdk) {
    throw 'Java 21 hittades inte. Installera JDK 21 via IntelliJ eller ange JAVA_HOME till din JDK 21-mapp.'
}
$env:JAVA_HOME = $jdk
# Keep Windows' Java socket files in the project instead of a long TEMP path.
$socketDirectory = Join-Path $PSScriptRoot 'target'
New-Item -ItemType Directory -Path $socketDirectory -Force | Out-Null
$env:JAVA_TOOL_OPTIONS = ($env:JAVA_TOOL_OPTIONS + ' -Djdk.net.unixdomain.tmpdir="' + $socketDirectory + '"').Trim()
Write-Host "Anvander Java 21: $jdk"
Write-Host 'Startar appen: http://localhost:8080/api/hello-world (stoppa med Ctrl+C)'
& "$PSScriptRoot/mvnw.cmd" --no-transfer-progress wildfly:run
exit $LASTEXITCODE
