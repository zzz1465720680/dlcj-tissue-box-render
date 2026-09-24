# 预览与部署说明 · 本次优化版

## 状态

2026-09-24 已将本机标准 Vite 构建手动发布到生产站：https://dingli-tissue-box.netlify.app/ 。Netlify 部署 ID：`6ab516306cad4227642c7db3`，来源为 Netlify Drop。该站点仍未连接 GitHub 自动部署；更新仓库不会自动更新网站。

本次上传包位于 `G:\DLCJ\output\dingli-tissue-box-production-vite-20260924.zip`，SHA-256：`24B0D62C6120261F6EECE150E85FCD978C0F9894FF731BCA68F0579F527AFE40`。旧版生产发布包仍在 `backups/netlify-production-2026-09-24.zip`，也可从 Netlify 的上一条部署回滚。

## 先在本机看

解压另附 `dingli-netlify-preview.zip`，安装 Node.js 后在其目录运行 `node preview.cjs`，打开终端显示的地址。它只监听本机，不上传任何文件。关闭终端或按 Ctrl+C 停止；端口冲突时改 `PORT` 环境变量。

随附 `dist` 是 `offline-runtime-reuse`：修改后的真实应用 + 上传备份原运行时 + 原模型资源。不是独立原型，也不是已经通过标准 Vite 的产物。

## 后续从源码生成正式候选版本

```sh
npm ci
npm test
npm run build
npm run preview
```

这里的 `npm run build` 包含完整 TypeScript 类型检查和 Vite 构建。Astra 原交付环境没有完成该流程；后续本机使用 Node.js 24.19.0 与现有锁定依赖运行 `npm test`、`npm run build` 均成功，生成的 `dist` 含完整资源、`_redirects` 与 `_headers`。本次没有重新运行 `npm ci`。

## 放到 Netlify 验证

将完整的输出 `dist` 文件夹用于独立测试站或草稿部署。`index.html` 必须位于所选发布文件夹根目录，不能只上传 HTML，也不要把包含源码、测试脚本的外层交付文件夹作为静态输出上传。

本次从项目管理页上传了标准构建的完整 `dist` ZIP，Netlify 将其标记为当前 Production 发布。上线后已在公网浏览器确认首页、英文入口、`/customize?lang=en` 及直接刷新、三款预设和模型加载。

原 `tissuebox-r7.glb` 约 18.2 MB，单文件超过 10 MB；Netlify 的拖放上传排错文档提示此类文件可能造成上传停滞。若拖放卡住，使用官方 Netlify CLI 的部署流程，不要删掉模型换取上传成功。选择关联项目、预览还是 production 前务必核对目标。

## 路由与缓存

`public/_redirects` 随构建复制到 `dist`，为静态站的客户端路由提供 `/index.html` 回退。`public/_headers` 为 HTML 和离线无哈希模块设置重新验证，并添加基础响应头。

仍需在真机上检查下载、材质变化、多角度 PNG、移动端键盘与触控，以及后续版本的缓存升级。

## 官方参考（查询日期 2026-09-24）

- Vite 静态部署：https://vite.dev/guide/static-deploy
- Netlify 创建部署：https://docs.netlify.com/deploy/create-deploys/
- Netlify 上传排错：https://docs.netlify.com/resources/troubleshooting/error-reference/

原 README 和旧部署记录已保留到 `docs/README.original.md`、`docs/NETLIFY_DEPLOYMENT.original.md`，不作为本次已发布或已验证的证明。
