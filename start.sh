#!/bin/bash

echo "🚀 Starting Local Shop Inventory Management System..."
echo ""
echo "📱 Default login credentials:"
echo "   Username: admin"
echo "   Password: 0000"
echo ""
echo "🌐 Opening browser in 3 seconds..."
echo "   URL: http://localhost:8000"
echo ""

# Wait 3 seconds
sleep 3

# Try to open browser (works on most systems)
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:8000
elif command -v open > /dev/null; then
    open http://localhost:8000
elif command -v start > /dev/null; then
    start http://localhost:8000
else
    echo "Please manually open: http://localhost:8000"
fi

# Start Python server
echo "🔧 Starting server on port 8000..."
echo "   Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2
if command -v python3 > /dev/null; then
    python3 -m http.server 8000
elif command -v python > /dev/null; then
    python -m SimpleHTTPServer 8000
else
    echo "❌ Error: Python not found!"
    echo "Please install Python and try again."
    exit 1
fi
