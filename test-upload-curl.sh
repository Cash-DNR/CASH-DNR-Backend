#!/bin/bash

# File Upload Test Script using curl
# Make sure your server is running on localhost:3000

API_BASE="http://localhost:3000/api/upload"

echo "🧪 Testing File Upload API with curl"
echo "📡 API Base URL: $API_BASE"
echo ""

# Create a test file
echo "📝 Creating test file..."
echo "This is a test document for file upload testing." > test-document.txt
echo "✅ Test file created: test-document.txt"
echo ""

# Test 1: Single file upload
echo "🚀 Test 1: Single File Upload"
echo "Uploading test-document.txt..."
curl -X POST \
  -F "file=@test-document.txt" \
  "$API_BASE/single" \
  -H "Accept: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo ""

# Test 2: List files
echo "🚀 Test 2: List Files"
echo "Getting list of uploaded files..."
curl -X GET \
  "$API_BASE/files" \
  -H "Accept: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo ""

# Test 3: Test with a larger file (create a 1MB file)
echo "🚀 Test 3: Large File Upload (1MB)"
echo "Creating 1MB test file..."
dd if=/dev/zero of=large-test-file.bin bs=1024 count=1024 2>/dev/null
echo "Uploading large-test-file.bin (1MB)..."
curl -X POST \
  -F "file=@large-test-file.bin" \
  "$API_BASE/single" \
  -H "Accept: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo ""

# Test 4: Multiple file upload
echo "🚀 Test 4: Multiple File Upload"
echo "Creating multiple test files..."
echo "File 1 content" > test-file-1.txt
echo "File 2 content" > test-file-2.txt
echo "Uploading multiple files..."
curl -X POST \
  -F "files=@test-file-1.txt" \
  -F "files=@test-file-2.txt" \
  "$API_BASE/multiple" \
  -H "Accept: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo ""

# Test 5: List files again
echo "🚀 Test 5: List Files (After Uploads)"
echo "Getting updated list of uploaded files..."
curl -X GET \
  "$API_BASE/files" \
  -H "Accept: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo ""

# Clean up test files
echo "🧹 Cleaning up test files..."
rm -f test-document.txt
rm -f large-test-file.bin
rm -f test-file-1.txt
rm -f test-file-2.txt
echo "✅ Test files cleaned up"

echo ""
echo "🎉 All curl tests completed!"
echo "📝 Check the server logs to see detailed upload tracking."
