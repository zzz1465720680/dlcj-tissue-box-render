# PR 草稿（尚未提交）

标题：Fix locale continuity and mobile preset access; improve homepage hierarchy

## 内容

基于 2026-09-24 上传备份修改原 Home/Studio。统一中英文路径与界面；重排原照片首页；为手机公开三个真实预设；添加返回、草稿保护、深链接消耗和失败回退；保留原模型资源、Schema、预设与联系信息。

## 已完成的检查

- 30 项逻辑/语法检查通过。
- 51 项嵌入 Chromium 页面检查通过（模拟导航/浏览器存储边界）。
- 8 项文件导入导出与异常检查通过。
- 5 项本地 HTTP 响应检查通过。

## 合并前仍需

标准 `npm ci && npm run build`、真实浏览器持久化/导航、真机 WebGL 和多角度 PNG、HTTPS 预览及缓存回归。随附离线运行时复用产物不是标准 Vite 构建证明。

本文件只是供维护者提交 PR 时使用的描述，没有代表用户实际创建远端分支或 PR，也没有发布线上站点。
