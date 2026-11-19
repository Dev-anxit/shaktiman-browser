delete process.env.ELECTRON_RUN_AS_NODE;

const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

const TRACKING_DOMAINS = [
  'doubleclick.net',
  'google-analytics.com',
  'googletagmanager.com',
  'googlesyndication.com',
  'googleadservices.com',
  'facebook.com/tr',
  'connect.facebook.net',
  'adnxs.com',
  'advertising.com',
  'scorecardresearch.com',
  'criteo.com',
  'criteo.net',
  'quantserve.com',
  'outbrain.com',
  'taboola.com',
  'amazon-adsystem.com',
  'analytics.twitter.com',
  'ads-twitter.com',
  'hotjar.com',
  'mixpanel.com',
  'clarity.ms',
  'branch.io',
  'segment.io',
  'segment.com',
  'newrelic.com'
];

function setupAdBlocker() {
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    const requestUrl = details.url.toLowerCase();
    const isTracker = TRACKING_DOMAINS.some(domain => requestUrl.includes(domain));

    if (isTracker) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tracker-blocked', {
          webContentsId: details.webContentsId,
          url: details.url
        });
      }
      callback({ cancel: true });
      return;
    }

    callback({ cancel: false });
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'logo.png');
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Shaktiman Browser',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    backgroundColor: '#090d16',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  });

  if (process.platform === 'darwin' && app.dock && fs.existsSync(iconPath)) {
    app.dock.setIcon(iconPath);
  }

  setupAdBlocker();
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler((details) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('open-new-tab', details.url);
    }
    return { action: 'deny' };
  });
});

ipcMain.handle('clear-all-data', async () => {
  try {
    await session.defaultSession.clearStorageData({
      storages: ['cookies', 'localstorage', 'caches', 'indexdb', 'websql', 'serviceworkers', 'cachestorage']
    });
    await session.defaultSession.clearCache();
    await session.defaultSession.clearHostResolverCache();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('execute-page-action', async (event, { webContentsId, action, selector, value }) => {
  try {
    const { webContents } = require('electron');
    const targetWc = webContents.fromId(webContentsId);
    if (!targetWc) {
      return { success: false, error: 'Target webview not found' };
    }

    const script = `(() => {
      try {
        const act = '${action}';
        const sel = '${selector || ''}';
        const val = '${value || ''}';

        if (act === 'click') {
          const el = document.querySelector(sel);
          if (!el) return { success: false, error: 'Element not found: ' + sel };
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.click();
          return { success: true, message: 'Clicked ' + sel };
        }
        if (act === 'fill') {
          const el = document.querySelector(sel);
          if (!el) return { success: false, error: 'Input not found: ' + sel };
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, message: 'Filled ' + sel + ' with ' + val };
        }
        if (act === 'scroll') {
          const dist = parseInt(val, 10) || 500;
          window.scrollBy({ top: dist, behavior: 'smooth' });
          return { success: true, message: 'Scrolled page by ' + dist + 'px' };
        }
        if (act === 'highlight') {
          const el = document.querySelector(sel);
          if (!el) return { success: false, error: 'Element not found: ' + sel };
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.outline = '3px solid #f59e0b';
          el.style.backgroundColor = 'rgba(245, 158, 11, 0.25)';
          return { success: true, message: 'Highlighted ' + sel };
        }
        return { success: false, error: 'Unknown action: ' + act };
      } catch (e) {
        return { success: false, error: e.message };
      }
    })()`;

    return await targetWc.executeJavaScript(script);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('extract-page-context', async (event, webContentsId) => {
  try {
    const { webContents } = require('electron');
    const targetWc = webContents.fromId(webContentsId);
    if (!targetWc) {
      return { title: '', url: '', selectedText: '', cleanText: '', links: [] };
    }

    const script = `(() => {
      const pageTitle = document.title || '';
      const currentUrl = window.location.href || '';
      const selected = window.getSelection().toString().trim();
      const bodyClone = document.body ? document.body.cloneNode(true) : null;
      if (bodyClone) {
        ['script', 'style', 'nav', 'footer', 'noscript', 'svg', 'header'].forEach(tag => {
          bodyClone.querySelectorAll(tag).forEach(el => el.remove());
        });
      }
      const raw = bodyClone ? (bodyClone.innerText || bodyClone.textContent || '') : '';
      const clean = raw.replace(/\\s+/g, ' ').trim().slice(0, 10000);
      const links = Array.from(document.querySelectorAll('a[href]')).slice(0, 20).map(a => ({
        text: a.innerText.trim(),
        href: a.href
      })).filter(l => l.text.length > 0);
      return {
        title: pageTitle,
        url: currentUrl,
        selectedText: selected,
        cleanText: clean,
        links: links
      };
    })()`;

    return await targetWc.executeJavaScript(script);
  } catch (err) {
    return { title: '', url: '', selectedText: '', cleanText: 'Extraction failed: ' + err.message, links: [] };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
