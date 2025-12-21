// @ts-nocheck

(function ({ vidHost = 'http://vidsorcerer.ddns.net' }) {

  // if not on TMDB, open a new window to it
  if (!window.location.host.includes('themoviedb.org')) {
    window.open('https://www.themoviedb.org/');
    return;
  }

  // logging
  const log = (...msg) => console.log(' %cVidSorcerer🍿 %c' + msg.join(' '), 'color: red; font-size: x-large', '');

  // helpers
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const removeAll = (selector) => $$(selector).forEach(_ => _.remove());
  const stripOrigin = (url) => url.href.replace(url.origin, '');

  // default player params
  const DEFAULT_PARAMS = {
    autonext: true,
    autoplay: true,
    ds_lang: 'off', // TODO
  };

  // local storage
  const _namespace = 'vidsorcerer:';
  const setParam = (id, value, sessionOnly) => {
    sessionStorage.setItem(_namespace + id, value);
    !sessionOnly && localStorage.setItem(_namespace + id, value);
    return value;
  }
  const getParam = (id) => {
    const name = _namespace + id;
    const persisted = sessionStorage.getItem(name) || localStorage.getItem(name);
    return persisted ? JSON.parse(persisted) : DEFAULT_PARAMS[id];
  };

  const _namespace_feature = 'feature:';
  const featureEnabled = (feature, sessionOnly) => getParam(_namespace_feature + feature);
  const enableFeature = (feature, sessionOnly) => (setParam(_namespace_feature + feature, true, sessionOnly), vidsorcerer.init());
  const disableFeature = (feature, sessionOnly) => (setParam(_namespace_feature + feature, false, sessionOnly), vidsorcerer.init());

  const _namespace_watched = 'seen:';
  const getWatchCount = (id) => (getParam(_namespace_watched + id) || 0);
  const incrementWatchCount = (id) => setParam(_namespace_watched + id, getWatchCount(id) + 1);

  // player URL construction
  const _queryParam = (name, value = Number(getParam(name))) => name + '=' + value;
  const getPlayerUrl = (id, s, e) => {
    const origin = vidsorcerer.vidHost.replace(/\/$/, '');
    const pathname = origin + '/embed/' + id;

    const episodeQuery = (null == s ? '' : '&s=' + s + '&e=' + (null == e ? 1 : e));
    const search = `?${_queryParam('autonext')}&${_queryParam('autoplay')}${episodeQuery}`;

    return pathname + search;
  }

  // TMDB URI parsing
  const parseTmdbUri = (uri) =>
    uri
      .split('/')
      .slice(1)
      .filter((_, i) => i % 2 && _.length);
  const tmdbUriToPlayerUrl = (uri) => getPlayerUrl(...parseTmdbUri(uri));

  // watch tracking
  const watch = ({ href, dataset: { tmdbUri }, classList }) => {
    log('watch', tmdbUri, href);

    // TODO: analytics

    incrementWatchCount(tmdbUri);
    classList.add('stale');
  };

  // intercept links, convert site to SPA
  const interceptNavigation = () => vidsorcerer.features.spaMode &&
    $$('a[href]:not(.vidsorcerer_player, .vidsorcerer__intercepted)').forEach(a => {
      a.classList.add('vidsorcerer__intercepted');

      // using the DOM's onclick so it is carried through history navigation
      const ogClick = a.getAttribute('onclick') || '';
      a.setAttribute('onclick',
        // include any prior onclick, and respect if it returned false
        'return this.getAttribute("href") !== "#" && (false !== (function() {' + ogClick + '}).call(this) && vidsorcerer.navigate(this.href))');
    });

  // injectors
  const injectStyle = () => {
    log('style');
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.className = 'vidsorcerer vidsorcerer__style';
    style.href = 'https://dlh3.github.io/vidsorcerer/vidsorcerer.css?' + Date.now();
    document.head.appendChild(style);
  };

  const injectSorcerers = () =>
    log('scan') || $$(':is(:is(.card, .panel) .content, .title) *:not(.vidsorcerer, :has(.vidsorcerer)) > a:is([href^="/movie"], [href^="/tv"])')
      .forEach(a => {
        // if the uri is a season, append '/episode/1'
        const uri = a.pathname.replace(/(.+\/season\/[^/]+)$/, '$1/episode/1');
        log('inject', uri);

        // vidsorcerer container
        const container = document.createElement('span');
        container.className = 'vidsorcerer';
        a.parentElement.appendChild(container);

        // add episodes guide button
        if (uri.startsWith('/tv') && !uri.includes('/season')) {
          const episodes = document.createElement('a');
          episodes.className = 'vidsorcerer__episodes';
          episodes.href = uri + '/seasons';
          episodes.textContent = '📇';
          episodes.title = 'Episode Guide';
          container.appendChild(episodes);
        }

        // add player button
        const player = document.createElement('a');
        // using the DOM's onclick so it is carried through history navigation
        player.setAttribute('onclick', 'window.vidsorcerer.watch(this)');
        player.className = 'vidsorcerer_player ' + (getWatchCount(uri) ? 'stale' : '');
        player.dataset.tmdbUri = uri;
        player.href = tmdbUriToPlayerUrl(uri);
        player.target = "_blank"
        player.textContent = '🍿';
        container.appendChild(player);
      });

  // load the new (or old, from history) content into the current document
  const replaceDocument = ([url, newDoc]) => {
    // replace html, stripping out any scripts, since they are (hopefully) already loaded
    document.open();
    document.write(newDoc.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''));
    injectStyle();

    // handle history back/forward navigation
    window.addEventListener('popstate', ({ state }) => state && replaceDocument([null, state.html]));

    // push the state change
    url && history.pushState({ html: document.firstElementChild.outerHTML }, '', stripOrigin(url));
  };

  // SPA navigation
  const navigate = (uri) =>
    !vidsorcerer.features.spaMode
    || log('navigate', uri)
    || fetch(uri)
      .catch(() => (window.location = uri))
      .then(async _ => [new URL(uri), await _.text()])
      .then(replaceDocument)
    && false; // block click

  // update the stored state on any DOM changes
  const updateState = () => vidsorcerer.features.spaMode && (log('savestate', stripOrigin(location)), history.replaceState({ html: document.firstElementChild.outerHTML }, ''));

  const updateHandler = () => (injectSorcerers(), interceptNavigation(), updateState());

  // feature flags notice/confirmation
  const notifyFeatureFlags = () => false && vidsorcerer.features.spaMode
    ? (vidsorcerer.features.spaMode = confirm(`
SPA Mode is an experimental feature and is currently enabled.

To continue with SPA Mode enabled, click OK. 
To disable it for this session, click Cancel.

To disable it permanently, run:
vidsorcerer.disableSpaMode();
`)) || disableFeature('spaMode', true)
    : log(`

Did you know, there's an experimental SPA Mode feature? It will keep VidSorcerer loaded while navigating between pages.

It works about 80%, but known issues include the loss of the masthead, broken search, and homepage loading issues.

To enable it, run:
vidsorcerer.enableSpaMode();

`);

  // initialization
  const init = () => {
    // export, so DOM listeners (eg, `onclick="..."`) can access
    window.vidsorcerer = {
      features: { spaMode: featureEnabled('spaMode') || true },
      ...window.vidsorcerer,
      vidHost,
      init,
      navigate,
      watch,
      getParam,
      setParam,
      enableSpaMode: enableFeature.bind(this, 'spaMode'),
      disableSpaMode: disableFeature.bind(this, 'spaMode'),
    };

    // disconnect any existing observer and delete the reference
    vidsorcerer.observer?.disconnect();
    delete vidsorcerer.observer;

    // reset and inject
    removeAll('.vidsorcerer');
    injectStyle();
    updateHandler();

    // watch for changes
    vidsorcerer.observer = new MutationObserver(updateHandler);
    vidsorcerer.observer.observe(document, { childList: true, subtree: true });

    // notify the user of any experimental features
    notifyFeatureFlags();
  };

  // go
  init();
})(window.sideloader?.args || {});