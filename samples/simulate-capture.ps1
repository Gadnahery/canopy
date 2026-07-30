# Simulate an ESP32-CAM capture: upload an image and run it through the
# live pipeline (Storage -> process-capture -> dashboard). No hardware needed.
#
#   ./simulate-capture.ps1 [imagePath] [deviceId]
#   defaults: samples/canopy-medium.jpg , canopy-01
#
# Reads Supabase URL + anon key from web/.env.local (nothing hardcoded).

param(
  [string]$Image  = "$PSScriptRoot\canopy-medium.jpg",
  [string]$Device = "canopy-01"
)

$envFile = Join-Path $PSScriptRoot "..\web\.env.local"
$lines = Get-Content $envFile
$URL  = (($lines | Select-String '^VITE_SUPABASE_URL=').Line -split '=', 2)[1]
$ANON = (($lines | Select-String '^VITE_SUPABASE_ANON_KEY=').Line -split '=', 2)[1]
$hostName = $URL -replace '^https?://', '' -replace '/$', ''

$ts = [int][double]::Parse((Get-Date -UFormat %s))
$name = [IO.Path]::GetFileNameWithoutExtension($Image)
$path = "samples/sim-$name-$ts.jpg"

Write-Host "Uploading $Image -> $path ..."
curl.exe -s -X POST "https://$hostName/storage/v1/object/captures/$path" `
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" `
  -H "Content-Type: image/jpeg" -H "x-upsert: true" --data-binary "@$Image" | Out-Null

Write-Host "Processing ..."
$body = "{`"device_id`":`"$Device`",`"image_path`":`"$path`"}"
curl.exe -s -X POST "https://$hostName/functions/v1/process-capture" `
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" `
  -H "Content-Type: application/json" -d $body

Write-Host "`nDone - check the dashboard."
