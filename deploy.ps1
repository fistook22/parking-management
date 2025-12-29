# GitHub Pages Deployment Script
# Run this script after creating your GitHub repository

Write-Host "🚀 Parking Management - GitHub Pages Deployment" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (Test-Path .git) {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
} else {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
}

# Check if files are staged
Write-Host ""
Write-Host "Adding files to git..." -ForegroundColor Yellow
git add .
Write-Host "✓ Files added" -ForegroundColor Green

# Check if there's a commit
$hasCommits = git log --oneline -1 2>$null
if ($hasCommits) {
    Write-Host "✓ Repository already has commits" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Creating initial commit..." -ForegroundColor Yellow
    git commit -m "Initial commit: Parking management system with Firebase"
    Write-Host "✓ Initial commit created" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create a GitHub repository:" -ForegroundColor White
Write-Host "   Go to: https://github.com/new" -ForegroundColor Gray
Write-Host "   Name: parking-management (or your choice)" -ForegroundColor Gray
Write-Host "   Make it PUBLIC (required for free GitHub Pages)" -ForegroundColor Gray
Write-Host "   DO NOT initialize with README" -ForegroundColor Gray
Write-Host ""
Write-Host "2. After creating the repository, run:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/parking-management.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Enable GitHub Pages:" -ForegroundColor White
Write-Host "   Go to: Repository → Settings → Pages" -ForegroundColor Gray
Write-Host "   Source: Branch 'main', Folder '/ (root)'" -ForegroundColor Gray
Write-Host "   Click Save" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Your app will be live at:" -ForegroundColor White
Write-Host "   https://YOUR_USERNAME.github.io/parking-management/" -ForegroundColor Green
Write-Host ""
Write-Host "See DEPLOY.md for detailed instructions!" -ForegroundColor Yellow

