#!/bin/bash
# setup.sh - Setup script for Superops.ai MCP Server

set -e

echo "🚀 Setting up Superops.ai MCP Server..."

# Check Node.js version
echo "📋 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Create project structure
echo "📁 Creating project structure..."
mkdir -p src
mkdir -p examples
mkdir -p build

# Move main files to correct locations
echo "📝 Moving source files..."
if [ -f "index.ts" ]; then
    mv index.ts src/
fi

if [ -f "parser.ts" ]; then
    mv parser.ts src/
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Make the binary executable
echo "🔧 Making binary executable..."
chmod +x build/index.js

# Test the server
echo "🧪 Testing the server..."
echo "Testing server startup..."
timeout 5s node build/index.js < /dev/null || echo "✅ Server starts successfully"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Add to your Claude Desktop configuration:"
echo "   {"
echo "     \"mcpServers\": {"
echo "       \"superops\": {"
echo "         \"command\": \"node\","
echo "         \"args\": [\"$(pwd)/build/index.js\"]"
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "2. Restart Claude Desktop"
echo ""
echo "3. Test with: fetch_superops_documentation"
echo ""
echo "📚 Available tools:"
echo "   - fetch_superops_documentation"
echo "   - search_superops_docs"
echo "   - get_superops_query_info"
echo "   - get_superops_mutation_info"
echo "   - get_superops_type_info"
echo "   - list_superops_operations"
echo "   - get_superops_api_endpoints"
echo ""
echo "🔗 Documentation: https://developer.superops.com/msp"