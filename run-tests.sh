#!/bin/bash

# RSX Language Server Test Runner
# Usage: ./run-tests.sh [test-file-number]

set -e

cd "$(dirname "$0")"

# Build first
echo "📦 Building LSP server..."
npm run build

echo ""
echo "🧪 Running tests..."
echo ""

if [ -z "$1" ]; then
    # Run all tests
    node --test tests/*.test.js
else
    # Run specific test file
    if [ -f "tests/0${1}-*.test.js" ]; then
        node --test tests/0${1}-*.test.js
    else
        echo "❌ Test file not found: tests/0${1}-*.test.js"
        exit 1
    fi
fi
