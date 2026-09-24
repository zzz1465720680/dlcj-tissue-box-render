# Netlify 部署记录

- 公网网站：https://dingli-tissue-box.netlify.app/
- 管理页面：https://app.netlify.com/projects/dingli-tissue-box/overview
- 2026-09-24 从现有 Vite 构建结果手动上传至 Netlify Drop，已认领并设为公开。
- 此站点未连接 GitHub 自动部署。以后修改网站时，需要重新执行 `npm run build`，将 `dist` 内容连同 `_redirects` 一起上传到此 Netlify 项目的 Production deploys。
- `_redirects` 规则：`/customize /index.html 200` 和 `/customize/ /index.html 200`。
- 本机上传准备目录：`G:\DLCJ\13_纸巾盒定制网站_Netlify预备`；压缩包：`G:\DLCJ\13_纸巾盒定制网站_Netlify预备.zip`。
- GitHub 仓库内另存同一发布包：`backups/netlify-production-2026-09-24.zip`（SHA-256：`A735ABF03679A54FF62208B6870D751E843CE98BB5F921D3DB080AD1A0A77295`）。恢复时解压并上传全部内容，不要漏掉 `_redirects`。
- 源码恢复时运行 `npm ci`、`npm run build`；`public/_redirects` 会复制到 `dist`。上传 `dist` 的全部内容即可恢复静态站点。
- 桌面浏览器已验证：首页、DC 商标、电话及微信、定制页和刷新、3D 模型、轻量预览、本机保存及重新打开、JSON 下载、咨询面板。
- 手机关闭代理访问仍需在实际手机网络中确认。

原 Render 配置及原网站副本保持不变。Render 创建静态站点时要求绑定付款卡，本次未在 Render 创建站点。
