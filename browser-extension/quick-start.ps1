# Quick Start Script for Learning Activity Tracker Extension
# PowerShell version for Windows

Write-Host "🎓 Learning Activity Tracker - Quick Start" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if icons directory exists
if (-not (Test-Path "icons")) {
    Write-Host "📁 Creating icons directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "icons" | Out-Null
    Write-Host "✅ Icons directory created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Note: You need to add icon images before loading the extension:" -ForegroundColor Yellow
    Write-Host "   - icons/icon16.png (16x16 pixels)"
    Write-Host "   - icons/icon48.png (48x48 pixels)"
    Write-Host "   - icons/icon128.png (128x128 pixels)"
    Write-Host ""
    Write-Host "💡 You can run: python generate_icons.py" -ForegroundColor Cyan
    Write-Host "   to create placeholder icons automatically"
    Write-Host ""
}

# Check if Python is available for icon generation
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "🐍 Python detected. You can generate icons by running:" -ForegroundColor Green
    Write-Host "   python generate_icons.py"
    Write-Host ""
}

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Generate icons (optional):"
Write-Host "   python generate_icons.py"
Write-Host ""
Write-Host "2. Load the extension in your browser:"
Write-Host "   - Open chrome://extensions/ (or edge://extensions/)"
Write-Host "   - Enable 'Developer mode'"
Write-Host "   - Click 'Load unpacked'"
Write-Host "   - Select this directory"
Write-Host ""
Write-Host "3. Configure the extension:"
Write-Host "   - Click the extension icon"
Write-Host "   - Enter your Student ID"
Write-Host "   - Set the API URL (default: http://localhost:8000)"
Write-Host "   - Enable tracking"
Write-Host ""
Write-Host "4. Start your FastAPI backend:"
Write-Host "   cd ..\backend"
Write-Host "   uvicorn main:app --reload"
Write-Host ""
Write-Host "5. Visit a course platform and start learning!"
Write-Host "   - Coursera, Udemy, edX, Khan Academy, etc."
Write-Host ""
Write-Host "📚 For more details, read README.md" -ForegroundColor Cyan
Write-Host "🔧 For backend setup, read BACKEND_INTEGRATION.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy learning! 🚀" -ForegroundColor Green
