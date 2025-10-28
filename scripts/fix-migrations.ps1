# Fix Failed Migrations - PowerShell Script
# Use this to resolve failed migrations in production

Write-Host "🔧 Migration Fix Script for Taadiway CRM" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check current database
Write-Host "Current database from .env:" -ForegroundColor Yellow
npx prisma migrate status

Write-Host ""
Write-Host "⚠️  IMPORTANT: Make sure you're using the correct database URL" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Do you want to continue? (y/n)"
if ($confirmation -ne 'y') {
    exit
}

Write-Host ""
Write-Host "Step 1: Checking for failed migrations..." -ForegroundColor Green
npx prisma migrate status

Write-Host ""
Write-Host "Step 2: Resolving failed migration..." -ForegroundColor Green
Write-Host "If migration '20251024185709_taadiway_crm' is in failed state:" -ForegroundColor Yellow

# Try to resolve the failed migration
$null = npx prisma migrate resolve --rolled-back "20251024185709_taadiway_crm" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration not in failed state or already resolved" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Deploying all migrations..." -ForegroundColor Green
npx prisma migrate deploy

Write-Host ""
Write-Host "✅ Migration fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To verify:" -ForegroundColor Cyan
Write-Host "  npx prisma migrate status" -ForegroundColor White
