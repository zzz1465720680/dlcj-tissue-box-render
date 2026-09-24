# 自动检查复现

## 独立逻辑/语法

联网安装项目依赖后：

```sh
npm ci
npm test
```

如需使用已经安装的 TypeScript，可在运行 `node tests/logic.test.cjs` 或离线构建前设置 `TYPESCRIPT_PATH` 为 TypeScript 模块目录。该检查输出 JSON；失败返回非零。

## 页面及导入导出检查（边界模拟）

需要 Python 和 Playwright。页面测试默认针对 `npm run build:offline` 输出的 `dist` 目录，因为测试助手显式使用该输出路径的运行时资源。这不是标准 Vite 产物的通用端到端测试。

```sh
npm run build:offline
python -m pip install playwright
python -m playwright install chromium
python tests/browser_embedded.py
python tests/edge_embedded.py
```

可选环境变量：`CHROMIUM_BINARY` 指向系统 Chromium，`DINGLI_TEST_OUTPUT` 指定报告输出位置，默认 `test-results/`。

`harness.py` 用真实应用模块、图片和 DOM，但模拟 URL/History、localStorage、IndexedDB 边界。测试不改动生产源码和浏览器系统策略。`fake-idb.js` 仅为测试后端，绝不能部署。

浏览器环境有 WebGL 时，本测试里的「不可用 WebGL」分支预期不一定成立；该套检查特意记录此次无 WebGL 环境。真实模型需另外运行 `docs/ACCEPTANCE.md`。

最终统计分别保存在 `logic-results.json`（由调用者重定向）、`browser-results.json` 和 `edge-results.json`。要判断是否通过，应检查 JSON 的 `passed == total`，不能只看最后一个进程是否启动成功。
