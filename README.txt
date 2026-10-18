云映 AI 视频 / 图片 / 音乐工作台

需要 Node.js 20 或更新版本。无需安装依赖。

启动：在 PowerShell 中运行 ./start.ps1，按提示输入密钥（隐藏输入）。
浏览器打开 http://127.0.0.1:5173 。不要直接打开 dist/index.html 调用 API。
也可以先在当前终端设置 CREDIT_MEDIA_API_KEY 环境变量，再运行 node server.mjs。
密钥不写入文件、前端或作品历史；不要将密钥提交到 Git。

已连接的协议（来自用户提供的接口）：
视频 POST /seedance/api/v3/contents/generations/tasks
查询 GET /seedance/api/v3/contents/generations/tasks/{id}
图片 POST /v1/images/generations
音乐 POST /_open/suno/music/generate

音乐 getState 路径尚未提供，未猜测调用。
如文档确认为 GET 查询，将 SUNO_STATE_PATH 设置为路径（包含 {id}），重启服务。
如平台要求 POST 查询或返回格式不同，需要依据文档进一步适配。
其他视频厂商只提供了模型名，未提供协议，故未擅自通过 Seedance 接口调用。

轮询每 5 秒一次，20 分钟后暂停；刷新后可继续查询当前标签页任务。
生成成功的媒体支持预览及打开原始链接。远程地址可能过期，请及时保存。
图片默认 1024x1024；视频支持 4/5/10 秒，实际支持以平台模型为准。
作品历史保存在当前浏览器，可能受容量限制。

验证：node --test server.test.mjs
尚未使用真实密钥进行付费生成测试。
