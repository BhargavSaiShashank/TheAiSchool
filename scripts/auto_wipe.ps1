Write-Host "[PulseSend Auto-Wipe Monitor Engaged]" -ForegroundColor Cyan
Write-Host "Waiting for Supabase Project 'crookspuisiuiujolegj' to unpause and restore DNS..." -ForegroundColor Yellow
Write-Host "Keep this running. Once you restore it in Supabase Dashboard, the wipe triggers automatically!`n"

$hostName = "db.crookspuisiuiujolegj.supabase.co"
$port = 6543

do {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Probing connection to $hostName..." -NoNewline
    
    try {
        $connection = Test-NetConnection -ComputerName $hostName -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        
        if ($connection.TcpTestSucceeded) {
            Write-Host " CONNECTED!" -ForegroundColor Green
            Write-Host "`nDATABASE IS ACTIVE! Initiating Database Wipe Script..." -ForegroundColor Green
            
            npm run clear-db
            
            Write-Host "`nENVIRONMENT WIPE FULLY COMPLETE!" -ForegroundColor Cyan
            break
        } else {
            Write-Host " Offline/DNS Missing. Retrying in 15s..." -ForegroundColor Gray
        }
    } catch {
        Write-Host " Connection probe failed. Retrying in 15s..." -ForegroundColor Gray
    }

    Start-Sleep -Seconds 15
} while ($true)
