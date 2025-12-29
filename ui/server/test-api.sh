#!/bin/bash

# CCEM UI Server API Test Script
# Tests all REST endpoints

BASE_URL="http://localhost:8638"

echo "================================"
echo "CCEM UI Server API Test"
echo "================================"
echo ""

# Health Check
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq .
echo ""

# List Agents
echo "2. Testing List Agents..."
curl -s "$BASE_URL/api/agents" | jq .
echo ""

# List Sessions (empty initially)
echo "3. Testing List Sessions..."
curl -s "$BASE_URL/api/sessions" | jq .
echo ""

# Create Session
echo "4. Testing Create Session..."
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Build Fix",
    "description": "Automated test session",
    "agents": ["task-analyzer", "build-fixer", "test-runner"],
    "auto_start": true
  }')
echo "$SESSION_RESPONSE" | jq .
SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.id')
echo ""

# Get Session Details
echo "5. Testing Get Session Details..."
curl -s "$BASE_URL/api/sessions/$SESSION_ID" | jq .
echo ""

# Assign Task to Agent
echo "6. Testing Assign Task to Agent..."
curl -s -X POST "$BASE_URL/api/agents/agent_001/task" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "test_task_001",
    "description": "Analyze TypeScript configuration",
    "priority": "high",
    "params": {
      "target": "tsconfig.json",
      "strict": true
    }
  }' | jq .
echo ""

# Get Agent Status
echo "7. Testing Get Agent Status..."
curl -s "$BASE_URL/api/agents/agent_001/status" | jq .
echo ""

# Test Error Handling - Not Found
echo "8. Testing Error Handling (404)..."
curl -s "$BASE_URL/api/sessions/invalid_id" | jq .
echo ""

# Test Error Handling - Invalid Request
echo "9. Testing Error Handling (400)..."
curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"name":"Missing Agents"}' | jq .
echo ""

echo "================================"
echo "All API Tests Complete!"
echo "================================"
echo ""
echo "WebSocket URL: ws://localhost:8638/ws/sessions/$SESSION_ID"
echo "SSE Stream URL: $BASE_URL/api/sessions/$SESSION_ID/stream"
