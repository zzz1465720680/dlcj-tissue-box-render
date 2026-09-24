# 鼎立车眷 · 原项目界面优化版

交付日期：2026-09-24。基于本次上传的 `dlcj-tissue-box-render_仓库备份_2026-09-24.zip` 修改，不是独立展示原型。

## 这次改了什么

首页重排为「产品与主入口 → 三款真实预设 → 深色工艺细节 → 三步咨询」。中英文贯通首页、定制和主要弹窗；定制页增加返回与草稿保护；手机首屏直接显示三个真实预设。

原 revision7 模型、产品图片、材质资源、三个预设定义、设计 JSON 结构和商家联系方式保留。图案、方案库、导入导出及询价流程仍在原应用内。本项目没有新增下单、支付、服务端收件或跨设备自动同步功能。

## 两种使用方式

### 1. 直接查看随附预览包

另一个交付文件 `dingli-netlify-preview.zip` 内含 `dist` 和 `preview.cjs`。安装 Node.js 后，解压并在该文件夹运行：

```sh
node preview.cjs
```

然后打开终端显示的本地地址。Windows 也可以双击 `启动本地预览.cmd`。不要直接双击 `dist/index.html`，因为模块、路由及原模型依赖 HTTP 资源路径。

### 2. 从本源码按正常流程开发、构建

使用项目声明的 Node.js 22.13 或更新版本，在有 npm 网络访问的环境运行：

```sh
npm ci
npm test
npm run build
npm run preview
```

`npm run build` 仍是原有 `tsc --noEmit && vite build`，产物为 `dist`。Astra 交付时受环境限制，未能验证标准构建；2026-09-24 在本机使用 Node.js 24.19.0 和现有锁定依赖运行 `npm test`、`npm run build`，均成功。此次没有重新运行 `npm ci`。

## 随附预览产物是如何生成的

这次实际运行的是 `npm run build:offline` 对应的脚本：它编译修改后的应用代码，并复用你上传的生产备份里已编译的 React / UI / Three.js 运行时，输出完整 `dist`。这不是占位页面，也没有替换成假模型，但也不是正常 Vite 构建。`dist/BUILD-INFO.json` 标明 `offline-runtime-reuse` 及 `standardViteBuildVerified: false`。

需要重新生成这个离线版本时，先提供可用的 TypeScript 安装，再运行：

```sh
npm run build:offline
npm run preview:offline
```

离线桥接只适配此次备份，受 SHA-256 清单保护。修改被保护的模型渲染、Schema、UI 封装或依赖文件后，应走标准构建，不要随意放宽校验。它是此次受限环境的预览交付手段，不应替代长期构建流程。

## 实际测试状态

| 检查 | 结果 | 边界 |
|---|---:|---|
| 逻辑与语法检查 | 30/30 | 独立模块测试；不是完整 TypeScript 类型检查 |
| Chromium 页面与交互检查 | 51/51 | 实际应用渲染；导航、localStorage、IndexedDB 边界模拟 |
| 导入导出与异常路径 | 8/8 | 含实际 JSON 文件下载；浏览器边界同上 |
| 本地预览服务器 HTTP 冒烟检查 | 5/5 | 首页、定制路由、JS、模型响应和不存在资源 |
| 后续本机标准构建 | 通过 | `npm test` 30/30；`tsc --noEmit && vite build` 成功 |
| 正式站浏览器检查 | 通过 | 首页、英文入口、定制页直接刷新、三款预设及 3D 模型加载 |

Astra 原测试环境没有可用 WebGL 上下文；后续在本机及正式站浏览器确认了模型加载。尚未逐项验收真实设备上的材质变化、多角度 PNG、iPhone Safari、Android Chrome 及长期浏览器存储。

## 文件导航

- `docs/CHANGES.md`：逐项修改说明。
- `docs/TEST-REPORT.md` / `docs/test-evidence/`：检查方法、结果与限制。
- `docs/ACCEPTANCE.md`：真实设备和发布前验收清单。
- `NETLIFY_DEPLOYMENT.md`：本地预览、临时预览与正式更新的区别。
- `docs/asset-integrity.json`：和本次原始 ZIP 对比的资源哈希。
- `tests/README.md`：自动检查复现说明。
- `vendor/offline-runtime/NOTICE.md`：复用运行时的来源及限制。

2026-09-24 已将标准 Vite 构建发布到 `dingli-tissue-box.netlify.app`。原来的两个说明文档存放在 `docs/*.original.md`，只作历史记录。旧版发布包仍在 `backups/netlify-production-2026-09-24.zip`，可用于回滚；新版发布记录见 `NETLIFY_DEPLOYMENT.md`。
