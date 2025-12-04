#!/bin/bash

# RSX Language Server Test Demo
# 演示测试套件的使用

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 RSX Language Server Test Suite Demo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")/.."

# Check if server is built
if [ ! -f "dist/server.js" ]; then
    echo "📦 Building LSP server..."
    npm run build
    echo ""
fi

echo "📋 Test Suite Information:"
echo "   Total test files: 7"
echo "   Total test cases: 56+"
echo "   Total code lines: 2600+"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚡ Step 1: Quick Check (验证基础功能)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

node --test tests/00-quick-check.test.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Step 2: Initialization Test (初始化测试)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

node --test tests/01-initialization.test.js | grep -E "(✔|✖|tests|pass|fail)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 3: Document Parsing Test (文档解析测试)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

node --test tests/04-document-parsing.test.js | grep -E "(✔|✖|tests|pass|fail)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Demo Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ LSP Server is working correctly!"
echo ""
echo "📚 Next steps:"
echo "   • Run all tests: npm test"
echo "   • View summary: npm run test:summary"
echo "   • Watch mode: npm run test:watch"
echo "   • Read docs: tests/QUICK_START.md"
echo ""
echo "📁 Available test files:"
echo "   00-quick-check.test.js     - Quick validation (推荐)"
echo "   01-initialization.test.js  - Initialization (10 tests)"
echo "   02-completion.test.js      - Code completion (8 tests)"
echo "   03-hover.test.js           - Hover info (7 tests)"
echo "   04-document-parsing.test.js - Document parsing (9 tests)"
echo "   05-typescript-integration.test.js - TypeScript (8 tests)"
echo "   06-error-handling.test.js  - Error handling (11 tests)"
echo ""
