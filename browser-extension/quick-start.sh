#!/bin/bash

# Quick Start Script for Learning Activity Tracker Extension
# This script helps you get started quickly

echo "🎓 Learning Activity Tracker - Quick Start"
echo "=========================================="
echo ""

# Check if icons directory exists
if [ ! -d "icons" ]; then
    echo "📁 Creating icons directory..."
    mkdir -p icons
    echo "✅ Icons directory created"
    echo ""
    echo "⚠️  Note: You need to add icon images before loading the extension:"
    echo "   - icons/icon16.png (16x16 pixels)"
    echo "   - icons/icon48.png (48x48 pixels)"
    echo "   - icons/icon128.png (128x128 pixels)"
    echo ""
    echo "💡 You can run: python generate_icons.py"
    echo "   to create placeholder icons automatically"
    echo ""
fi

# Check if Python is available for icon generation
if command -v python &> /dev/null; then
    echo "🐍 Python detected. You can generate icons by running:"
    echo "   python generate_icons.py"
    echo ""
elif command -v python3 &> /dev/null; then
    echo "🐍 Python 3 detected. You can generate icons by running:"
    echo "   python3 generate_icons.py"
    echo ""
fi

echo "📋 Next Steps:"
echo ""
echo "1. Generate icons (optional):"
echo "   python generate_icons.py"
echo ""
echo "2. Load the extension in your browser:"
echo "   - Open chrome://extensions/ (or edge://extensions/)"
echo "   - Enable 'Developer mode'"
echo "   - Click 'Load unpacked'"
echo "   - Select this directory"
echo ""
echo "3. Configure the extension:"
echo "   - Click the extension icon"
echo "   - Enter your Student ID"
echo "   - Set the API URL (default: http://localhost:8000)"
echo "   - Enable tracking"
echo ""
echo "4. Start your FastAPI backend:"
echo "   cd ../backend"
echo "   uvicorn main:app --reload"
echo ""
echo "5. Visit a course platform and start learning!"
echo "   - Coursera, Udemy, edX, Khan Academy, etc."
echo ""
echo "📚 For more details, read README.md"
echo "🔧 For backend setup, read BACKEND_INTEGRATION.md"
echo ""
echo "Happy learning! 🚀"
