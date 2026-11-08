# Stop all Salon Management System microservices on ports 5000-5006
$ports = 5000..5006
$connections = Get-NetTCPConnection -LocalPort $ports -ErrorAction SilentlyContinue
if ($connections) {
  $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($id in $pids) {
    Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped process $id"
  }
}
Write-Host "Microservices stopped."
