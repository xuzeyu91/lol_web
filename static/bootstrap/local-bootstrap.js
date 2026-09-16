/* Local mirror bootstrap.
 * Same contract as the upstream cdn-auto loader, minus the multi-origin probe:
 *  - resolve the asset base used by <base href>
 *  - expose __ARAM_GAME_API_ORIGIN__ for realtime commands
 *  - load the self-contained classic bundle and surface a fatal error panel
 */
(function (root) {
  'use strict';

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

  function boot(config) {
    var base = config.scriptBase || (config.routes && config.routes[0] && config.routes[0].base);
    if (!base) throw new Error('缺少资源目录配置');
    var baseEl = document.querySelector('base');
    if (baseEl) baseEl.href = base;
    document.documentElement.dataset.assetRoute = 'local';
    document.documentElement.dataset.assetBase = base;
    document.documentElement.dataset.assetProbeMs = '0';
    document.documentElement.dataset.scriptBase = base;
    root.__ARAM_GAME_API_ORIGIN__ = config.apiOrigin;

    var candidates = [config.bundleUrl].concat(config.bundleFallbackUrls || []).filter(Boolean);
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
      console.info('[ARAM assets] local', base);
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
