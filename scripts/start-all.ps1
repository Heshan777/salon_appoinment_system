# Start all Salon Management System microservices in background
$baseDir = Split-Path -Parent $PSScriptRoot

$services = @(
  @{ Name="api-gateway"; Dir="services/api-gateway"; Port=5000 },
  @{ Name="auth-service"; Dir="services/auth-service"; Port=5001 },
  @{ Name="booking-service"; Dir="services/booking-service"; Port=5002 },
  @{ Name="catalog-service"; Dir="services/catalog-service"; Port=5003 },
  @{ Name="payment-service"; Dir="services/payment-service"; Port=5004 },
  @{ Name="notification-service"; Dir="services/notification-service"; Port=5005 },
  @{ Name="ai-assistant-service"; Dir="services/ai-assistant-service"; Port=5006 }
)

Write-Host "Starting microservices..."
foreach ($s in $services) {
  $targetDir = Join-Path $baseDir $s.Dir
  Start-Process -FilePath "node" -ArgumentList "src/index.js" -WorkingDirectory $targetDir -WindowStyle Hidden
  Write-Host "  -> Started $($s.Name) on port $($s.Port)"
}

Write-Host "All services started! UI is available at http://localhost:5000/"
