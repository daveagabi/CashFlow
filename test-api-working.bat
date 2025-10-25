@echo off
echo Testing ServiceNow u_cashflow table API...

echo.
echo 1. Testing GET request (read records)...
curl -u "admin:7WXg$8eQoo@W" "https://dev192269.service-now.com/api/now/table/u_cashflow?sysparm_limit=5"

echo.
echo.
echo 2. Testing POST request (create record)...
curl -u "admin:7WXg$8eQoo@W" -X POST "https://dev192269.service-now.com/api/now/table/u_cashflow" -H "Content-Type: application/json" -d "{\"u_business\":\"Test Trader\",\"u_date\":\"2025-10-24\",\"u_income\":50000,\"u_expense\":20000,\"u_profit\":30000,\"u_debts\":\"[{\\\"name\\\":\\\"John\\\",\\\"amount\\\":5000}]\",\"u_synced\":false}"

echo.
echo.
echo API tests complete!
pause