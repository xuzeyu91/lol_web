/* Local mirror bootstrap.
 * Same contract as the upstream cdn-auto loader, minus the multi-origin probe:
 *  - resolve the asset base used by <base href>
 *  - expose __ARAM_GAME_API_ORIGIN__ for realtime commands
 *  - load the self-contained classic bundle and surface a fatal error panel
 */
(function (root) {
  'use strict';

  /* Chrome blocks fetch()/XHR on file:// origins, so the 3D scene and the
   * map/models/audio manifests cannot load when the page is opened by
   * double-click. Show an actionable hint instead of a silent stall. */
  function isFileProtocol() {
    return root.location.protocol === 'file:';
  }

  function warnFileProtocol() {
    var box = document.createElement('div');
    box.setAttribute('role', 'alert');
    Object.assign(box.style, {
      position: 'fixed', left: '0', right: '0', bottom: '0', zIndex: 19999,
      background: '#2a1c0c', borderTop: '2px solid #b8873a', color: '#f0dcae',
      padding: '14px 20px', font: '14px/1.6 system-ui, sans-serif', textAlign: 'center'
    });
    box.innerHTML =
      '<strong>检测到以 file:// 方式打开</strong> —— 浏览器会拦截本地文件读取，' +
      '大厅可以显示，但<b>进入对局（地图 / 模型 / 音效）会失败</b>。<br>' +
      '请在项目目录执行 <code style="background:#00000055;padding:2px 6px;border-radius:4px">' +
      'python serve.py</code> 后访问 ' +
      '<code style="background:#00000055;padding:2px 6px;border-radius:4px">http://127.0.0.1:5173/</code>' +
      '（或双击 <code style="background:#00000055;padding:2px 6px;border-radius:4px">start.bat</code>）。';
    document.body.append(box);
    console.warn('[ARAM] file:// detected — start serve.py for full gameplay');
  }

  function fatal(message) {
    var box = document.createElement('div');
    box.setAttribute('role', 'alert');
    var heading = document.createElement('strong');
    heading.textContent = '游戏启动失败';
    var detail = document.createElement('p');
    detail.textContent = message || '脚本未能加载，请检查网络连接。';
    Object.assign(box.style, {
      position: 'fixed', inset: '0', zIndex: 20000, background: '#07131e',
      color: '#e8d8a9', display: 'grid', placeContent: 'center', padding: '30px',
      overflowWrap: 'anywhere'
    });
    var retry = document.createElement('button');
    retry.textContent = '重新加载';
    retry.onclick = function () { root.location.reload(); };
    box.append(heading, detail, retry);
    document.body.append(box);
  }

  function load(url) {
    return new Promise(function (resolve, reject) {
      var failure = null;
      root.__ARAM_APP_READY__ = false;
      function capture(event) { if (event.error) failure = event.error; }
      root.addEventListener('error', capture);
      var script = document.createElement('script');
      script.setAttribute('data-cfasync', 'false');
      script.src = url;
      function cleanup() { root.removeEventListener('error', capture); }
      script.onload = function () {
        cleanup();
        if (root.__ARAM_APP_READY__) resolve();
        else reject(failure || new Error('启动脚本没有完成初始化。'));
      };
      script.onerror = function () {
        cleanup();
        script.remove && script.remove();
        var error = new Error('无法下载游戏启动脚本，请检查当前网络。');
        error.downloadFailed = true;
        reject(error);
      };
      document.body.append(script);
    });
  }

  /* Grey out the multiplayer panel and explain why, instead of letting the
   * client retry a WebSocket that will never connect. */
  function markOffline() {
    document.documentElement.dataset.onlineMode = 'offline';
    var status = document.getElementById('onlineStatus');
    if (status) status.textContent = '未配置联机服务（离线模式）· 单人练习可正常使用';
    ['onlineConnect', 'onlineCreate', 'onlineRefresh', 'onlineStart',
     'onlineLeave', 'onlineTeam', 'onlineBot', 'onlineRemoveBot'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.disabled = true; el.title = '离线模式：未配置联机服务'; }
    });
    var rooms = document.getElementById('onlineRooms');
    if (rooms) rooms.innerHTML = '<li class="online-room-empty">离线模式 · 未配置联机服务</li>';
    console.info('[ARAM] offline mode — apiOrigin empty, multiplayer disabled');
  }

  function boot(config) {
    if (isFileProtocol()) warnFileProtocol();
    var base = config.scriptBase || (config.routes && config.routes[0] && config.routes[0].base);
    if (!base) throw new Error('缺少资源目录配置');
    // capture BEFORE <base> is published: everything after that resolves
    // relative to the asset dir instead of this document
    var docBase = document.baseURI;

    /* Resolve the asset dir against this document's own URL, then publish an
     * absolute <base>. Doing it here (rather than a static <base> in the HTML)
     * keeps the page's own css/js/img paths relative to the document, so the
     * mirror works from any mount point — http:// root, a sub-directory, or
     * a plain file:// double-click. */
    var absoluteBase = new URL(base, document.baseURI).href;
    var baseEl = document.querySelector('base');
    if (!baseEl) {
      baseEl = document.createElement('base');
      baseEl.id = 'aramAssetBase';
      document.head.prepend(baseEl);
    }
    baseEl.href = absoluteBase;

    document.documentElement.dataset.assetRoute = 'local';
    document.documentElement.dataset.assetBase = absoluteBase;
    document.documentElement.dataset.assetProbeMs = '0';
    document.documentElement.dataset.scriptBase = absoluteBase;
    root.__ARAM_GAME_API_ORIGIN__ = config.apiOrigin;

    // The bundle lives outside the asset dir, so resolve it against the
    // document — not against the <base> we just published.
    var candidates = [config.bundleUrl].concat(config.bundleFallbackUrls || [])
      .filter(Boolean)
      .map(function (u) { return new URL(u, docBase).href; });

    var chain = Promise.reject();
    candidates.forEach(function (url, index) {
      chain = chain.catch(function (error) {
        document.documentElement.dataset.bootstrapAttempt = String(index + 1);
        if (error && !error.downloadFailed && error.message) throw error;
        return load(url).then(function () {
          document.documentElement.dataset.bootstrapUrl = url;
        });
      });
    });
    return chain.then(function () {
      document.documentElement.dataset.gameModule = 'ready';
      console.info('[ARAM assets] local', absoluteBase);
      // Offline mode: apiOrigin left empty -> the game would fall back to
      // location.origin and spam a dead local WebSocket. Disable the online
      // entry points instead so nothing tries to dial out.
      if (!config.apiOrigin) markOffline();
    }).catch(function (error) {
      document.documentElement.dataset.gameModule = 'failed';
      fatal(error && error.message);
      console.error('[ARAM startup]', error);
    });
  }

  root.AramAssetRouter = { boot: boot, load: load };
  if (root.__ARAM_ASSET_ROUTES__) boot(root.__ARAM_ASSET_ROUTES__);
})(globalThis);
