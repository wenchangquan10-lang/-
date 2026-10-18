$secureKey = Read-Host '请输入 API Key（隐藏输入，仅用于本服务）' -AsSecureString
$env:CREDIT_MEDIA_API_KEY = [System.Net.NetworkCredential]::new('', $secureKey).Password
try { node "$PSScriptRoot/server.mjs" } finally { Remove-Item Env:CREDIT_MEDIA_API_KEY -ErrorAction SilentlyContinue }
