# 鼎立车眷 · 车载纸巾盒网站备份

当前公开网站：https://dingli-tissue-box.netlify.app/

本仓库保存当前静态网站的源码、图片、3D 模型、依赖锁定文件和 Netlify 路由规则。`backups/netlify-production-2026-09-24.zip` 是 2026-09-24 手动上传至 Netlify 的完整发布包副本；它与源码分开保存，便于按原样恢复。

## 网站功能

- 中英文展示首页、推荐配色、DC 标志及商家电话和微信。
- revision7 3D 模型、材质和颜色编辑、图案、预设与轻量预览。
- 本机草稿和方案库、JSON 导入导出、多角度 PNG、询价文字、数量和备注。
- 客户无需登录；方案保存在各自浏览器中，换设备时可通过 JSON 文件转移。

## 恢复网站

**按原样恢复：**解压 `backups/netlify-production-2026-09-24.zip`，将解压后的全部文件（包括 `_redirects`）上传至 Netlify 站点的 Production deploys。发布包的 SHA-256 为 `A735ABF03679A54FF62208B6870D751E843CE98BB5F921D3DB080AD1A0A77295`。

**从源码重新构建：**在项目根目录运行 `npm ci` 和 `npm run build`，然后上传生成的 `dist` 目录内容。`public/_redirects` 会随构建进入 `dist`，让 `/customize` 页面在直接打开或刷新时正常显示。需要 Node.js 22.13 或更新版本。

这个 Netlify 站点目前由人工上传发布，**没有连接 GitHub 自动部署**。更新仓库不会自动更新线上网页。详细记录见 [NETLIFY_DEPLOYMENT.md](NETLIFY_DEPLOYMENT.md)。

## 备份范围

仓库和发布包只包含网站及其公开资源，不包含访客浏览器中的草稿或方案、Netlify 账号设置、原平台登录接口、R2 存储数据和站点凭据。`render.yaml` 保留为另一种静态托管配置；目前的公开网址使用 Netlify。
