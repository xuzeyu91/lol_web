# tools/

镜像构建与验收脚本。仅用于记录从 https://lol.hanyue.io 复刻的实现路径，运行后产物落在
`../static/r20260915-miss-fortune-1/`。普通使用项目时**只需要跑 `mirror.py`**。

## 主要脚本

| 脚本 | 作用 |
| --- | --- |
| `mirror.py` | **一键抓取全部静态资源**（~2820 个 / 178MB），自给自足，无需前置步骤 |
| `fetch.py` | 单点补抓（用法：`python fetch.py <url>...` 或 `python fetch.py list.txt`）|
| `build_html.py` | 把原站 `raw.html` 改写为本地路径的 `index.html` |
| `decode.py` | 把 bundle 里的 `\uXXXX` 转回中文，便于阅读 |
| `allheroes.js` | Playwright：16 位英雄逐一起局，收集失败资源 |
| `deep_audit.js` | Playwright：全技能 / 物品 / 信号 / 计分板 / 成就徽章 + 外链检查 |
| `audit404.js` | Playwright：单人一局的所有 4xx / 失败请求 |
| `net_audit.js` / `offline_test.js` | 是否有任何对外网域的请求 |

审计脚本统一读取 `PORT` 环境变量（默认 5173），并需要能解析 `playwright`：

```bash
PORT=5175 node tools/audit404.js
```

## mirror.py 工作流程

```
1. 下载 game bundle（tools/game.js）→ 解码 \uXXXX（tools/game.decoded.js）
2. 下载 audio / vfx / 模型缩放清单
3. 从 bundle 字面量里正则出 assets/... 路径
4. 解析地图清单 map12-fast.gltf 的 buffers / images
   + grass-material.json 的 texture（ha-brush.png）
   + 运行时拼接的 health-relic-glow.png
5. 下载 7 个样式表，解析其中的 url()（字体、ui/panel.png …）
6. 解析 index.html 的内联 src/href（ui/victory.png …）
7. 探测「运行时拼接」的路径：血条、小地图图标、技能指示器、鼠标光标、
   地图几何 .bin/.bin.gz、防御塔碎片 …
8. 24 线程并发下载
```

第 3–6 步得到的是**确定引用**，404 会计入 `missing.txt`；
第 7 步是**猜测路径**，原站没有属正常情况，单独列出不计入失败。

所有中间产物（bundle、解码文件、清单、`missing.txt`）都写在 `tools/` 下，已被
`.gitignore` 排除。

## 复刻步骤

```bash
# 1. 下载原站 HTML 和 bundle
curl -sL https://lol.hanyue.io/ > raw.html
curl -sL https://lol.hanyue.io/static/bootstrap/game-r20260915-close-guard-1.js > game.js

# 2. 抓全资源
python mirror.py                       # 一条命令搞定

# 3. 生成 index.html
python build_html.py

# 4. 启动
cd .. && python serve.py
```

## 复刻原理

不重写任何游戏逻辑。原站是 SPA：

- HTML 用 `<base href="…/static/r…/">`，bundle 内全部 `fetch('assets/…')`
  借助 `document.baseURI` 解析。
- 把 `<base>` 和所有 CDN 资源改写为本地相对路径 `static/...`，bundle
  就能在本地正确加载资源（相对路径同时也让 `file://` 下大厅可见）。
- 原 `cdn-auto` bootstrap 强制走 https + 443，与 localhost 不兼容；用
  `../static/bootstrap/local-bootstrap.js`（~60 行）替换，动态写 `<base>` 后
  加载 bundle。

详见 `../README.md`。
