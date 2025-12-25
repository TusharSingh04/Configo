# Test Instances for Feature Flag Platform

This document provides comprehensive test cases to validate all implemented functionalities.

---

## 🔧 Prerequisites

### Environment Setup
```bash
# Backend should be running on http://localhost:4000
# MongoDB and Redis should be running
# .env file configured with:
PORT=4000
MONGO_URI=mongodb://localhost:27017/featureflags
REDIS_URL=redis://localhost:6379
SERVICE_TOKEN=test-service-token-12345
JWT_SECRET=test-jwt-secret-67890
CACHE_TTL_SECONDS=60
```

### Test JWT Tokens

Generate JWT tokens for testing (use https://jwt.io or your own script):

**Admin Token**:
```json
{
  "sub": "admin-user-001",
  "role": "admin",
  "iat": 1703500000,
  "exp": 9999999999
}
```
Secret: `test-jwt-secret-67890`

**Viewer Token**:
```json
{
  "sub": "viewer-user-001",
  "role": "viewer",
  "iat": 1703500000,
  "exp": 9999999999
}
```
Secret: `test-jwt-secret-67890`

---

## 📝 Test Cases

### **Test Group 1: Health Check**

#### TC1.1: Server Health Check
```bash
curl -X GET http://localhost:4000/health
```

**Expected Response**:
```json
{
  "ok": true
}
```

**Validation**: 
- ✅ Status code: 200
- ✅ Response contains "ok": true

---

### **Test Group 2: Management APIs - Flag Creation**

#### TC2.1: Create Boolean Flag
```bash
curl -X POST http://localhost:4000/api/manage/flags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "key": "enable_dark_mode",
    "type": "boolean",
    "description": "Enable dark mode UI",
    "envs": [
      {
        "env": "dev",
        "defaultValue": true
      },
      {
        "env": "staging",
        "defaultValue": false
      },
      {
        "env": "prod",
        "defaultValue": false
      }
    ]
  }'
```

**Expected Response**:
```json
{
  "_id": "...",
  "key": "enable_dark_mode",
  "type": "boolean",
  "version": 1,
  "createdBy": "admin-user-001",
  "updatedBy": "admin-user-001",
  "updatedAt": 1703500000000,
  "description": "Enable dark mode UI",
  "envs": [...]
}
```

**Validation**:
- ✅ Status code: 200
- ✅ Flag created with version: 1
- ✅ createdBy and updatedBy match JWT sub

---

#### TC2.2: Create Multivariate Flag with Rollout
```bash
curl -X POST http://localhost:4000/api/manage/flags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "key": "button_color_experiment",
    "type": "multivariate",
    "description": "A/B/C test for button colors",
    "envs": [
      {
        "env": "prod",
        "defaultValue": "blue",
        "rollout": {
          "percentage": 50
        },
        "variants": [
          {
            "key": "blue",
            "value": "#0000FF",
            "weight": 1
          },
          {
            "key": "green",
            "value": "#00FF00",
            "weight": 1
          },
          {
            "key": "red",
            "value": "#FF0000",
            "weight": 1
          }
        ]
      }
    ]
  }'
```

**Expected Response**:
- ✅ Status code: 200
- ✅ Flag with multivariate type created
- ✅ Variants array has 3 items

---

#### TC2.3: Create JSON Flag with Targeting Rules
```bash
curl -X POST http://localhost:4000/api/manage/flags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "key": "pricing_config",
    "type": "json",
    "description": "Dynamic pricing configuration",
    "envs": [
      {
        "env": "prod",
        "defaultValue": {
          "basePrice": 9.99,
          "currency": "USD"
        },
        "rules": [
          {
            "attribute": "userRole",
            "op": "eq",
            "value": "premium"
          }
        ],
        "variants": [
          {
            "key": "premium_pricing",
            "value": {
              "basePrice": 7.99,
              "currency": "USD",
              "discount": 20
            }
          }
        ]
      }
    ]
  }'
```

**Expected Response**:
- ✅ Status code: 200
- ✅ JSON type flag created
- ✅ Rules array contains targeting rules

---

#### TC2.4: Create Flag with Multiple Targeting Rules
```bash
curl -X POST http://localhost:4000/api/manage/flags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "key": "beta_features",
    "type": "boolean",
    "description": "Beta features for specific users",
    "envs": [
      {
        "env": "prod",
        "defaultValue": false,
        "rules": [
          {
            "attribute": "userId",
            "op": "in",
            "value": ["user123", "user456", "user789"]
          },
          {
            "attribute": "betaTester",
            "op": "eq",
            "value": true
          }
        ]
      }
    ]
  }'
```

**Expected Response**:
- ✅ Status code: 200
- ✅ Multiple rules in rules array

---

### **Test Group 3: Management APIs - Flag Retrieval**

#### TC3.1: List All Flags
```bash
curl -X GET http://localhost:4000/api/manage/flags \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

**Expected Response**:
```json
{
  "flags": [
    {
      "key": "enable_dark_mode",
      ...
    },
    {
      "key": "button_color_experiment",
      ...
    },
    ...
  ]
}
```

**Validation**:
- ✅ Status code: 200
- ✅ Returns array of flags
- ✅ Works with viewer token too

---

#### TC3.2: Get Single Flag by Key
```bash
curl -X GET http://localhost:4000/api/manage/flags/enable_dark_mode \
  -H "Authorization: Bearer <VIEWER_JWT_TOKEN>"
```

**Expected Response**:
```json
{
  "_id": "...",
  "key": "enable_dark_mode",
  "type": "boolean",
  "version": 1,
  ...
}
```

**Validation**:
- ✅ Status code: 200
- ✅ Returns specific flag details

---

#### TC3.3: Get Non-Existent Flag
```bash
curl -X GET http://localhost:4000/api/manage/flags/nonexistent_flag \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

**Expected Response**:
```json
{
  "error": "flag-not-found"
}
```

**Validation**:
- ✅ Status code: 404
- ✅ Error message present

---

### **Test Group 4: Management APIs - Flag Updates**

#### TC4.1: Update Flag Configuration
```bash
curl -X PUT http://localhost:4000/api/manage/flags/enable_dark_mode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "key": "enable_dark_mode",
    "type": "boolean",
    "description": "Enable dark mode UI - Updated",
    "envs": [
      {
        "env": "dev",
        "defaultValue": true
      },
      {
        "env": "staging",
        "defaultValue": true
      },
      {
        "env": "prod",
        "defaultValue": true
      }
    ]
  }'
```

**Expected Response**:
- ✅ Status code: 200
- ✅ Version incremented to 2
- ✅ updatedBy reflects admin user
- ✅ updatedAt timestamp updated

---

#### TC4.2: Viewer Cannot Update Flag (Authorization Test)
```bash
curl -X PUT http://localhost:4000/api/manage/flags/enable_dark_mode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VIEWER_JWT_TOKEN>" \
  -d '{
    "key": "enable_dark_mode",
    "type": "boolean",
    "envs": []
  }'
```

**Expected Response**:
```json
{
  "error": "Forbidden"
}
```

**Validation**:
- ✅ Status code: 403
- ✅ Viewer role blocked from updates

---

### **Test Group 5: Flag Rollback**

#### TC5.1: Rollback to Previous Version
```bash
# First, update the flag multiple times to create version history
# Then rollback to version 1

curl -X POST http://localhost:4000/api/manage/flags/enable_dark_mode/rollback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "toVersion": 1
  }'
```

**Expected Response**:
- ✅ Status code: 200
- ✅ Flag restored to version 1 configuration
- ✅ New version created (e.g., version 3)
- ✅ Audit log contains rollback action

---

#### TC5.2: Rollback to Non-Existent Version
```bash
curl -X POST http://localhost:4000/api/manage/flags/enable_dark_mode/rollback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "toVersion": 999
  }'
```

**Expected Response**:
```json
{
  "error": "version-not-found"
}
```

**Validation**:
- ✅ Status code: 404

---

### **Test Group 6: Evaluation APIs - Single Flag Evaluation**

#### TC6.1: Evaluate Boolean Flag
```bash
curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "key": "enable_dark_mode",
    "env": "prod",
    "context": {
      "userId": "user123"
    }
  }'
```

**Expected Response**:
```json
{
  "key": "enable_dark_mode",
  "value": true,
  "reason": "default"
}
```

**Validation**:
- ✅ Status code: 200
- ✅ Returns boolean value
- ✅ Reason indicates evaluation path

---

#### TC6.2: Evaluate with Targeting Rules Match
```bash
curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "key": "beta_features",
    "env": "prod",
    "context": {
      "userId": "user123",
      "betaTester": true
    }
  }'
```

**Expected Response**:
```json
{
  "key": "beta_features",
  "value": true,
  "reason": "default"
}
```

**Validation**:
- ✅ Status code: 200
- ✅ Rules matched, returns enabled value

---

#### TC6.3: Evaluate with Targeting Rules No Match
```bash
curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "key": "beta_features",
    "env": "prod",
    "context": {
      "userId": "user999",
      "betaTester": false
    }
  }'
```

**Expected Response**:
```json
{
  "key": "beta_features",
  "value": false,
  "reason": "rules-no-match-fallback"
}
```

**Validation**:
- ✅ Status code: 200
- ✅ Falls back to default due to rule mismatch

---

#### TC6.4: Evaluate Multivariate Flag (Deterministic)
```bash
# Test with same userId multiple times - should get same variant

curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "key": "button_color_experiment",
    "env": "prod",
    "context": {
      "userId": "user123"
    }
  }'
```

**Expected Response**:
```json
{
  "key": "button_color_experiment",
  "value": "#0000FF",
  "variant": "blue",
  "reason": "variant-selected"
}
```

**Validation**:
- ✅ Status code: 200
- ✅ Returns variant key and value
- ✅ Same userId returns same variant consistently (run multiple times)

---

#### TC6.5: Evaluate JSON Flag with Rule Match
```bash
curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "key": "pricing_config",
    "env": "prod",
    "context": {
      "userId": "user123",
      "userRole": "premium"
    }
  }'
```

**Expected Response**:
```json
{
  "key": "pricing_config",
  "value": {
    "basePrice": 7.99,
    "currency": "USD",
    "discount": 20
  },
  "variant": "premium_pricing",
  "reason": "json-selected"
}
```

**Validation**:
- ✅ Status code: 200
- ✅ Returns complex JSON object
- ✅ Premium pricing applied due to rule match

---

#### TC6.6: Evaluate with Percentage Rollout (In Range)
```bash
# User in rollout range

curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "key": "button_color_experiment",
    "env": "prod",
    "context": {
      "userId": "user001"
    }
  }'
```

**Expected Response** (if user in rollout %):
```json
{
  "key": "button_color_experiment",
  "value": "#0000FF",
  "variant": "blue",
  "reason": "variant-selected"
}
```

**Validation**:
- ✅ Approximately 50% of different userIds should get variants
- ✅ 50% should get default value with reason "rollout-percentage-fallback"

---

#### TC6.7: Evaluate Non-Existent Flag
```bash
curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "key": "nonexistent_flag",
    "env": "prod",
    "context": {}
  }'
```

**Expected Response**:
```json
{
  "error": "flag-not-found"
}
```

**Validation**:
- ✅ Status code: 404

---

#### TC6.8: Evaluate with Invalid Service Token
```bash
curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{
    "key": "enable_dark_mode",
    "env": "prod",
    "context": {}
  }'
```

**Expected Response**:
```json
{
  "error": "Invalid service token"
}
```

**Validation**:
- ✅ Status code: 401

---

### **Test Group 7: Evaluation APIs - Batch Evaluation**

#### TC7.1: Batch Evaluate Multiple Flags
```bash
curl -X POST http://localhost:4000/api/eval/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "keys": ["enable_dark_mode", "button_color_experiment", "beta_features"],
    "env": "prod",
    "context": {
      "userId": "user123",
      "betaTester": true
    }
  }'
```

**Expected Response**:
```json
{
  "results": [
    {
      "key": "enable_dark_mode",
      "value": true,
      "reason": "default"
    },
    {
      "key": "button_color_experiment",
      "value": "#0000FF",
      "variant": "blue",
      "reason": "variant-selected"
    },
    {
      "key": "beta_features",
      "value": true,
      "reason": "default"
    }
  ]
}
```

**Validation**:
- ✅ Status code: 200
- ✅ Returns array with results for each flag
- ✅ Order matches request order

---

#### TC7.2: Batch Evaluate with Some Non-Existent Flags
```bash
curl -X POST http://localhost:4000/api/eval/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "keys": ["enable_dark_mode", "nonexistent_flag", "beta_features"],
    "env": "prod",
    "context": {
      "userId": "user123"
    }
  }'
```

**Expected Response**:
```json
{
  "results": [
    {
      "key": "enable_dark_mode",
      "value": true,
      "reason": "default"
    },
    {
      "key": "nonexistent_flag",
      "value": null,
      "reason": "flag-not-found"
    },
    {
      "key": "beta_features",
      "value": false,
      "reason": "rules-no-match-fallback"
    }
  ]
}
```

**Validation**:
- ✅ Status code: 200
- ✅ Non-existent flags return null with appropriate reason
- ✅ Other flags evaluated normally

---

### **Test Group 8: Cache Testing**

#### TC8.1: Test Cache Population
```bash
# First request - should hit DB and populate cache

curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "key": "enable_dark_mode",
    "env": "prod",
    "context": {"userId": "user123"}
  }'

# Check Redis cache
redis-cli GET "flags:prod"
```

**Expected**:
- ✅ First request populates cache
- ✅ Redis contains serialized flags for the environment

---

#### TC8.2: Test Cache Hit
```bash
# Multiple rapid requests should hit cache

for i in {1..10}; do
  curl -X POST http://localhost:4000/api/eval/eval \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-service-token-12345" \
    -d '{
      "key": "enable_dark_mode",
      "env": "prod",
      "context": {"userId": "user'$i'"}
    }'
done
```

**Expected**:
- ✅ All requests complete quickly (<10ms after first)
- ✅ Cache serves subsequent requests

---

#### TC8.3: Test Cache Invalidation on Update
```bash
# Update flag
curl -X PUT http://localhost:4000/api/manage/flags/enable_dark_mode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{...updated config...}'

# Evaluate flag - should reflect new value
curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "key": "enable_dark_mode",
    "env": "prod",
    "context": {}
  }'
```

**Expected**:
- ✅ Flag evaluation returns updated value
- ✅ Cache refreshed with new data

---

### **Test Group 9: Authentication & Authorization**

#### TC9.1: Management API Without Token
```bash
curl -X GET http://localhost:4000/api/manage/flags
```

**Expected Response**:
```json
{
  "error": "Invalid user token"
}
```

**Validation**:
- ✅ Status code: 401

---

#### TC9.2: Evaluation API Without Service Token
```bash
curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -d '{
    "key": "enable_dark_mode",
    "env": "prod",
    "context": {}
  }'
```

**Expected Response**:
```json
{
  "error": "Invalid service token"
}
```

**Validation**:
- ✅ Status code: 401

---

#### TC9.3: Admin Operations with Viewer Token
```bash
curl -X POST http://localhost:4000/api/manage/flags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VIEWER_JWT_TOKEN>" \
  -d '{
    "key": "test_flag",
    "type": "boolean",
    "envs": []
  }'
```

**Expected Response**:
```json
{
  "error": "Forbidden"
}
```

**Validation**:
- ✅ Status code: 403

---

### **Test Group 10: Edge Cases & Error Handling**

#### TC10.1: Create Flag with Invalid Type
```bash
curl -X POST http://localhost:4000/api/manage/flags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "key": "invalid_type_flag",
    "type": "invalid_type",
    "envs": []
  }'
```

**Expected**:
- ✅ Server handles gracefully (validation error or accepts and processes)

---

#### TC10.2: Evaluate Flag with Missing Environment
```bash
curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "key": "enable_dark_mode",
    "env": "nonexistent_env",
    "context": {}
  }'
```

**Expected Response**:
```json
{
  "key": "enable_dark_mode",
  "value": ...,
  "reason": "env-missing-fallback"
}
```

**Validation**:
- ✅ Falls back gracefully

---

#### TC10.3: Large Context Object
```bash
curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{
    "key": "enable_dark_mode",
    "env": "prod",
    "context": {
      "userId": "user123",
      "attr1": "value1",
      "attr2": "value2",
      ...100 more attributes...
    }
  }'
```

**Expected**:
- ✅ Handles large context objects
- ✅ Respects request size limits (256kb)

---

#### TC10.4: Extremely Large Payload (Should Fail)
```bash
# Generate payload > 256KB
curl -X POST http://localhost:4000/api/eval/eval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-service-token-12345" \
  -d '{"key": "test", "env": "prod", "context": {"data": "'$(python -c 'print("x" * 300000)')'"} }'
```

**Expected Response**:
```json
{
  "error": "request entity too large"
}
```

**Validation**:
- ✅ Status code: 413

---

### **Test Group 11: Deterministic Evaluation Testing**

#### TC11.1: Same User Gets Same Variant
```bash
# Run this 10 times with same userId

for i in {1..10}; do
  curl -X POST http://localhost:4000/api/eval/eval \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-service-token-12345" \
    -d '{
      "key": "button_color_experiment",
      "env": "prod",
      "context": {"userId": "consistent-user-001"}
    }'
done
```

**Expected**:
- ✅ All 10 requests return identical variant
- ✅ Same value and variant key every time

---

#### TC11.2: Different Users Get Different Variants
```bash
# Test 100 different user IDs

for i in {1..100}; do
  curl -X POST http://localhost:4000/api/eval/eval \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-service-token-12345" \
    -d '{
      "key": "button_color_experiment",
      "env": "prod",
      "context": {"userId": "user-'$i'"}
    }' >> results.json
done

# Analyze distribution - should be roughly equal across variants
```

**Expected**:
- ✅ Variants distributed according to weights
- ✅ Distribution is consistent (run multiple times)

---

### **Test Group 12: Frontend Testing**

#### TC12.1: Access Home Page
```
Open browser: http://localhost:3000
```

**Expected**:
- ✅ Home page loads
- ✅ Token input field visible
- ✅ Save/Clear buttons functional

---

#### TC12.2: Navigate to Flags Page
```
Navigate to: http://localhost:3000/flags
```

**Expected**:
- ✅ Flags list page loads
- ✅ If no token set, may show empty or error

---

#### TC12.3: Set JWT and View Flags
```
1. Paste admin JWT in home page
2. Click "Save Token"
3. Navigate to /flags
```

**Expected**:
- ✅ Flags list displays
- ✅ Can click on individual flags
- ✅ Flag details show on detail page

---

#### TC12.4: Create New Flag via UI
```
Navigate to: http://localhost:3000/flags/new
Fill form and submit
```

**Expected**:
- ✅ Form validation works
- ✅ Successfully creates flag
- ✅ Redirects or shows success

---

## 🎯 Test Coverage Summary

| Feature Area | Test Cases | Status |
|-------------|-----------|--------|
| Health Check | 1 | ✅ |
| Flag Creation | 4 | ✅ |
| Flag Retrieval | 3 | ✅ |
| Flag Updates | 2 | ✅ |
| Rollback | 2 | ✅ |
| Single Evaluation | 8 | ✅ |
| Batch Evaluation | 2 | ✅ |
| Caching | 3 | ✅ |
| Authentication | 3 | ✅ |
| Edge Cases | 4 | ✅ |
| Deterministic Logic | 2 | ✅ |
| Frontend | 4 | ✅ |
| **TOTAL** | **38** | ✅ |

---

## 🔄 Automated Test Script

Save this as `run_tests.ps1`:

```powershell
# Feature Flag Platform - Automated Test Runner

$BASE_URL = "http://localhost:4000"
$SERVICE_TOKEN = "test-service-token-12345"
$ADMIN_TOKEN = "<YOUR_ADMIN_JWT>"

Write-Host "Starting Feature Flag Platform Tests..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "`nTest 1: Health Check" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method GET
if ($response.ok) {
    Write-Host "✅ PASS" -ForegroundColor Green
} else {
    Write-Host "❌ FAIL" -ForegroundColor Red
}

# Test 2: Create Boolean Flag
Write-Host "`nTest 2: Create Boolean Flag" -ForegroundColor Yellow
$body = @{
    key = "test_flag_$(Get-Random)"
    type = "boolean"
    description = "Test flag"
    envs = @(
        @{ env = "prod"; defaultValue = $true }
    )
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/manage/flags" `
        -Method POST `
        -Headers @{ "Authorization" = "Bearer $ADMIN_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body
    
    if ($response.version -eq 1) {
        Write-Host "✅ PASS" -ForegroundColor Green
        $testFlagKey = $response.key
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: $_" -ForegroundColor Red
}

# Test 3: Evaluate Flag
Write-Host "`nTest 3: Evaluate Flag" -ForegroundColor Yellow
$body = @{
    key = $testFlagKey
    env = "prod"
    context = @{ userId = "test-user" }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/eval/eval" `
        -Method POST `
        -Headers @{ "Authorization" = "Bearer $SERVICE_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body
    
    if ($response.value -eq $true) {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: $_" -ForegroundColor Red
}

# Test 4: Deterministic Evaluation
Write-Host "`nTest 4: Deterministic Evaluation" -ForegroundColor Yellow
$userId = "consistent-user-123"
$results = @()

for ($i = 1; $i -le 5; $i++) {
    $body = @{
        key = $testFlagKey
        env = "prod"
        context = @{ userId = $userId }
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/eval/eval" `
        -Method POST `
        -Headers @{ "Authorization" = "Bearer $SERVICE_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body
    
    $results += $response.value
}

$allSame = ($results | Select-Object -Unique).Count -eq 1
if ($allSame) {
    Write-Host "✅ PASS - Deterministic" -ForegroundColor Green
} else {
    Write-Host "❌ FAIL - Not Deterministic" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Suite Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
```

Run with:
```powershell
.\run_tests.ps1
```

---

## 📊 Performance Benchmarks

### Expected Performance Metrics:

| Operation | Target Latency | Notes |
|-----------|---------------|-------|
| Single Eval (cached) | <5ms | Redis hit |
| Single Eval (uncached) | <50ms | MongoDB query |
| Batch Eval (10 flags) | <30ms | Cached |
| Flag Create/Update | <100ms | Write + audit |
| Flag List | <50ms | MongoDB query |
| Rollback | <100ms | Audit query + write |

---

## 🐛 Known Issues & Limitations

1. **Cache Invalidation**: Cache not automatically invalidated on flag updates (requires TTL expiry)
2. **No Rate Limiting**: Evaluation APIs can be hammered
3. **No Metrics**: No built-in analytics for flag evaluation
4. **Single Region**: No multi-region support
5. **No Flag Archiving**: Deleted flags are permanently deleted

---

## ✅ Test Execution Checklist

- [ ] All 38 test cases executed
- [ ] Health check passes
- [ ] Flag CRUD operations work
- [ ] Evaluation APIs return correct values
- [ ] Authentication/authorization enforced
- [ ] Rollback functionality verified
- [ ] Cache behavior validated
- [ ] Deterministic evaluation confirmed
- [ ] Batch evaluation works
- [ ] Frontend UI functional
- [ ] Edge cases handled gracefully
- [ ] Performance within acceptable ranges

---

**Last Updated**: December 25, 2025
**Test Suite Version**: 1.0.0
