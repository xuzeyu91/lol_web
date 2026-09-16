# tools/

镜像构建脚本。仅用于记录从 https://lol.hanyue.io 复刻的实现路径，运行后产物落在
`../static/r20260915-miss-fortune-1/`。普通使用项目时**无需运行**这些脚本。

## 主要脚本

| 脚本 | 作用 |
| --- | --- |
| `mirror.py` | 抓取 HTML/CSS/bundle 引用到的全部静态资源（~2700 个 / 119MB）|
| `fetch.py` | 单点补抓（用法：`python fetch.py <url>...` 或 `python fetch.py list.txt`）|
| `build_html.py` | 把原站 `raw.html` 改写为本地路径的 `index.html` |
| `extra*.py` | 不同阶段补抓遗漏的资源（地图、controls、模型等）|
| `decode.py` | 把 bundle 里的 `\uXXXX` 转回中文，便于阅读 |
| `find_*.py` | 调试用：在 bundle 里搜索关键字 |
| `verify.js / verify2.js / verify3.js / compare.js` | Playwright 自动化验证 |

## 复刻步骤

```bash
# 1. 下载原站 HTML 和 bundle
curl -sL https://lol.hanyue.io/ > raw.html
curl -sL https://lol.hanyue.io/static/bootstrap/game-r20260915-close-guard-1.js > game.js

# 2. 抓全资源
python decode.py                       # 生成 game.decoded.js（中文可读）
python mirror.py                       # 大批抓取
python extra.py  extra2.py  extra3.py  # 补漏（地图 / controls / TurretShatter）
python fetch.py <剩余缺失 URL...>      # 单点补抓

# 3. 生成 index.html
python build_html.py

# 4. 启动
cd .. && python serve.py
```

## 复刻原理

不重写任何游戏逻辑。原站是 SPA：

- HTML 用 `<base href="…/static/r…/">`，bundle 内全部 `fetch('assets/…')`
  借助 `document.baseURI` 解析。
- 把 `<base>` 和所有 CDN 资源改写为本地 `/static/...` 绝对路径，bundle
  就能在任意域名下正确加载资源。
- 原 `cdn-auto` bootstrap 强制走 https + 443，与 localhost 不兼容；用
  `../static/bootstrap/local-bootstrap.js`（~60 行）替换，写 `<base>` 后直接
  加载 bundle。

详见 `../README.md`。