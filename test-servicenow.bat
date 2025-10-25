@echo off
echo Testing ServiceNow API connection...

echo.
echo Checking if u_cashflow_logs table exists...
curl -u "admin:7WXg$8eQoo@W" -H "Accept: application/json" "https://dev192269.service-now.com/api/now/table/sys_db_object?sysparm_query=name=u_cashflow_logs"

echo.
echo.
echo Testing incident table access...
curl -u "admin:7WXg$8eQoo@W" -H "Accept: application/json" "https://dev192269.service-now.com/api/now/table/incident?sysparm_limit=1"

pause