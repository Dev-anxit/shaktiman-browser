delete process.env.ELECTRON_RUN_AS_NODE;

const { app, BrowserWindow, ipcMain, session, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');

let mainWindow = null;
let blocker = null;
const disabledShieldsHosts = new Set();

function getCreditsFile() {
  return path.join(app.getPath('userData'), 'credits.json');
}

function getApiKeysFile() {
  return path.join(app.getPath('userData'), 'secure_keys.json');
}
const INTEGRITY_SALT = 'shaktiman_devxanxit_security_salt_2026';

const VALID_VOUCHERS = new Set([
  'DX-SHAKTI-TOPUP-100',
  'DEVXANXIT-PRO-2026',
  'SHAKTI-BOOST-500',
  'DEVXANXIT-SUPERCHARGE',
  'SHAKTIMAN-PREVIEW-2026'
]);

function calculateHash(balance, updated) {
  return crypto.createHmac('sha256', INTEGRITY_SALT)
    .update(`${balance}:${updated}`)
    .digest('hex');
}

function loadCreditsStore() {
  const filePath = getCreditsFile();
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const expected = calculateHash(data.balance, data.updated);
      if (data.hash === expected && typeof data.balance === 'number' && data.balance >= 0) {
        if (!Array.isArray(data.redeemedTokens)) data.redeemedTokens = [];
        return data;
      }
    }
  } catch (e) {}

  const initial = {
    balance: 10,
    updated: Date.now(),
    redeemedTokens: []
  };
  initial.hash = calculateHash(initial.balance, initial.updated);
  saveCreditsStore(initial);
  return initial;
}

function saveCreditsStore(store) {
  store.updated = Date.now();
  store.hash = calculateHash(store.balance, store.updated);
  try {
    fs.writeFileSync(getCreditsFile(), JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {}
}

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

async function setupAdBlocker() {
  try {
    blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    blocker.enableBlockingInSession(session.defaultSession);
    blocker.on('request-blocked', (request) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tracker-blocked', {
          url: request.url
        });
      }
    });
  } catch (e) {}

  try {
    session.defaultSession.setWebRTCIPHandlingPolicy('disable_non_proxied_udp');
  } catch (e) {}

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = details.requestHeaders;
    if (headers['Referer'] && details.referrer) {
      try {
        const reqOrigin = new URL(details.url).origin;
        const refOrigin = new URL(details.referrer).origin;
        if (reqOrigin !== refOrigin) {
          headers['Referer'] = reqOrigin + '/';
        }
      } catch (e) {}
    }
    callback({ cancel: false, requestHeaders: headers });
  });

  session.defaultSession.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    try {
      const host = new URL(details.url).hostname.toLowerCase();
      if (disabledShieldsHosts.has(host)) {
        callback({ cancel: false });
        return;
      }
    } catch (e) {}

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
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: true,
      preload: path.join(__dirname, 'main-preload.js')
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
  if (contents.getType() === 'webview') {
    contents.on('will-navigate', (e, navigationUrl) => {
      try {
        const u = new URL(navigationUrl);
        if (u.protocol !== 'http:' && u.protocol !== 'https:' && navigationUrl !== 'about:blank') {
          e.preventDefault();
        }
      } catch (err) {
        e.preventDefault();
      }
    });

    contents.on('will-redirect', (e, navigationUrl) => {
      try {
        const u = new URL(navigationUrl);
        if (u.protocol !== 'http:' && u.protocol !== 'https:' && navigationUrl !== 'about:blank') {
          e.preventDefault();
        }
      } catch (err) {
        e.preventDefault();
      }
    });

    contents.setWindowOpenHandler((details) => {
      try {
        const u = new URL(details.url);
        if ((u.protocol === 'http:' || u.protocol === 'https:') && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('open-new-tab', details.url);
        }
      } catch (e) {}
      return { action: 'deny' };
    });
  }
});

ipcMain.handle('get-credits', () => {
  const store = loadCreditsStore();
  return { balance: store.balance };
});

ipcMain.handle('consume-credit', () => {
  const store = loadCreditsStore();
  if (store.balance <= 0) {
    return { success: false, balance: 0 };
  }
  store.balance -= 1;
  saveCreditsStore(store);
  return { success: true, balance: store.balance };
});

ipcMain.handle('redeem-code', (event, rawCode) => {
  const cleanCode = (rawCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'Please enter a valid voucher or activation code.' };
  }

  const store = loadCreditsStore();
  if (store.redeemedTokens.includes(cleanCode)) {
    return { success: false, message: 'This voucher code has already been redeemed.' };
  }

  if (VALID_VOUCHERS.has(cleanCode)) {
    store.balance += 100;
    store.redeemedTokens.push(cleanCode);
    saveCreditsStore(store);
    return { success: true, balance: store.balance, message: 'Voucher verified! 100 energy credits added.' };
  }

  return { success: false, message: 'Invalid voucher code. Please check your activation pass.' };
});

ipcMain.handle('encrypt-api-key', async (event, { service, apiKey }) => {
  try {
    if (!apiKey) return { success: false, error: 'Empty key' };
    const filePath = getApiKeysFile();
    let keys = {};
    if (fs.existsSync(filePath)) {
      try { keys = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) {}
    }
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(apiKey);
      keys[service] = encrypted.toString('base64');
    } else {
      const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(INTEGRITY_SALT, 'salt', 32), Buffer.alloc(16, 0));
      let enc = cipher.update(apiKey, 'utf8', 'base64');
      enc += cipher.final('base64');
      keys[service] = enc;
    }
    fs.writeFileSync(filePath, JSON.stringify(keys, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('decrypt-api-key', async (event, { service }) => {
  try {
    const filePath = getApiKeysFile();
    if (!fs.existsSync(filePath)) return { success: true, apiKey: '' };
    const keys = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const encVal = keys[service];
    if (!encVal) return { success: true, apiKey: '' };
    if (safeStorage.isEncryptionAvailable()) {
      const buf = Buffer.from(encVal, 'base64');
      const decrypted = safeStorage.decryptString(buf);
      return { success: true, apiKey: decrypted };
    } else {
      const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(INTEGRITY_SALT, 'salt', 32), Buffer.alloc(16, 0));
      let dec = decipher.update(encVal, 'base64', 'utf8');
      dec += decipher.final('utf8');
      return { success: true, apiKey: dec };
    }
  } catch (err) {
    return { success: false, error: err.message, apiKey: '' };
  }
});

ipcMain.handle('get-preload-path', () => {
  return path.join(__dirname, 'preload.js');
});

ipcMain.handle('toggle-shield', (event, { host, enabled }) => {
  if (!host) return { success: false, enabled: true };
  const h = host.toLowerCase();
  if (enabled) {
    disabledShieldsHosts.delete(h);
  } else {
    disabledShieldsHosts.add(h);
  }
  return { success: true, enabled: !disabledShieldsHosts.has(h) };
});

ipcMain.handle('save-screenshot', async (event, { dataUrl, filename }) => {
  try {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const downloadsDir = app.getPath('downloads');
    const safeName = (filename || 'shaktiman-screenshot').replace(/[^a-z0-9_-]/gi, '_').slice(0, 40) + '-' + Date.now() + '.png';
    const filePath = path.join(downloadsDir, safeName);
    fs.writeFileSync(filePath, base64Data, 'base64');
    return { success: true, filePath, filename: safeName };
  } catch (err) {
    return { success: false, error: err.message };
  }
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

let backendProcess = null;

function startBackend() {
  const isPackaged = app.isPackaged;
  const binName = process.platform === 'win32' ? 'shaktiman-engine.exe' : 'shaktiman-engine';
  const binPath = isPackaged
    ? path.join(process.resourcesPath, 'bin', binName)
    : path.join(__dirname, 'resources', 'bin', binName);

  if (fs.existsSync(binPath)) {
    const { spawn } = require('child_process');
    backendProcess = spawn(binPath, [], {
      detached: false,
      stdio: 'ignore'
    });
    backendProcess.unref();
  }
}

function stopBackend() {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {}
    backendProcess = null;
  }
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  stopBackend();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
