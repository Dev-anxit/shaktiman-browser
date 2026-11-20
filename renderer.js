const api = window.shaktimanAPI || {};

let preloadPath = '';
let currentCredits = 10;
let tabs = [];
let activeTabId = null;
let tabIdCounter = 1;

const FAVORITES = [
  { title: 'Local Search', url: 'http://localhost:8000/', glyph: '&#10022;' },
  { title: 'GitHub', url: 'https://github.com', glyph: 'GH' },
  { title: 'Wikipedia', url: 'https://en.wikipedia.org', glyph: 'W' },
  { title: 'Hacker News', url: 'https://news.ycombinator.com', glyph: 'Y' },
  { title: 'Reddit', url: 'https://reddit.com', glyph: 'R' },
  { title: 'DuckDuckGo', url: 'https://duckduckgo.com', glyph: 'DDG' },
  { title: 'YouTube', url: 'https://youtube.com', glyph: 'YT' },
  { title: 'MDN Web', url: 'https://developer.mozilla.org', glyph: 'MDN' }
];

const tabsListEl = document.getElementById('tabsList');
const newTabBtn = document.getElementById('newTabBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const reloadBtn = document.getElementById('reloadBtn');
const omnibox = document.getElementById('omnibox');
const omniboxClear = document.getElementById('omniboxClear');
const omniboxIcon = document.getElementById('omniboxIcon');
const readerBtn = document.getElementById('readerBtn');
const splitBtn = document.getElementById('splitBtn');
const pipBtn = document.getElementById('pipBtn');
const screenshotBtn = document.getElementById('screenshotBtn');
const scratchpadBtn = document.getElementById('scratchpadBtn');

const shieldWrapper = document.getElementById('shieldWrapper');
const shieldBtn = document.getElementById('shieldBtn');
const trackerCountText = document.getElementById('trackerCountText');
const shieldPopover = document.getElementById('shieldPopover');
const shieldToggleSwitch = document.getElementById('shieldToggleSwitch');
const shieldSiteHost = document.getElementById('shieldSiteHost');
const shieldStatusLabel = document.getElementById('shieldStatusLabel');
const shieldStatNumber = document.getElementById('shieldStatNumber');
const shieldBlockedList = document.getElementById('shieldBlockedList');
const shieldResetBtn = document.getElementById('shieldResetBtn');

const fireBtn = document.getElementById('fireBtn');
const aiToggleBtn = document.getElementById('aiToggleBtn');
const aiSidebar = document.getElementById('aiSidebar');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const viewContainer = document.getElementById('viewContainer');
const startPage = document.getElementById('startPage');
const startSearchForm = document.getElementById('startSearchForm');
const startSearchInput = document.getElementById('startSearchInput');
const tilesGrid = document.getElementById('tilesGrid');
const sidebarChat = document.getElementById('sidebarChat');
const sidebarInput = document.getElementById('sidebarInput');
const toast = document.getElementById('toast');
const burnOverlay = document.getElementById('burnOverlay');

const aiCreditLabel = document.getElementById('aiCreditLabel');
const creditCountBadge = document.getElementById('creditCountBadge');
const drawerCreditCounter = document.getElementById('drawerCreditCounter');
const drawerCreditMeter = document.getElementById('drawerCreditMeter');
const paywallModal = document.getElementById('paywallModal');
const paywallCard = document.getElementById('paywallCard');
const passCodeInput = document.getElementById('passCodeInput');
const passFeedbackMsg = document.getElementById('passFeedbackMsg');

const readerOverlay = document.getElementById('readerOverlay');
const readerTitle = document.getElementById('readerTitle');
const readerByline = document.getElementById('readerByline');
const readerBody = document.getElementById('readerBody');
const readerFontSizeDown = document.getElementById('readerFontSizeDown');
const readerFontSizeUp = document.getElementById('readerFontSizeUp');
const readerThemeLight = document.getElementById('readerThemeLight');
const readerThemeSepia = document.getElementById('readerThemeSepia');
const readerThemeDark = document.getElementById('readerThemeDark');
const readerTtsBtn = document.getElementById('readerTtsBtn');
const readerCloseBtn = document.getElementById('readerCloseBtn');

const scratchpadDrawer = document.getElementById('scratchpadDrawer');
const closeScratchpadBtn = document.getElementById('closeScratchpadBtn');
const scratchpadTextarea = document.getElementById('scratchpadTextarea');
const clipUrlBtn = document.getElementById('clipUrlBtn');
const clipSelectionBtn = document.getElementById('clipSelectionBtn');
const exportNotesBtn = document.getElementById('exportNotesBtn');
const clearNotesBtn = document.getElementById('clearNotesBtn');
const scratchpadSavedStatus = document.getElementById('scratchpadSavedStatus');

let currentFontSize = 1.15;
let currentTtsUtterance = null;

async function initSecurityAndCredits() {
  try {
    if (api.getPreloadPath) {
      preloadPath = await api.getPreloadPath();
    }
    if (api.getCredits) {
      const res = await api.getCredits();
      currentCredits = res.balance;
      updateCreditUI(currentCredits);
    }
  } catch (err) {}
}

function updateCreditUI(credits) {
  if (creditCountBadge) creditCountBadge.textContent = credits;
  if (aiCreditLabel) {
    aiCreditLabel.innerHTML = `⚡ Shaktiman AI (${credits} ${credits === 1 ? 'credit' : 'credits'})`;
  }
  if (drawerCreditCounter) {
    drawerCreditCounter.textContent = `⚡ ${credits} ${credits === 1 ? 'credit' : 'credits'} left`;
  }
  if (drawerCreditMeter) {
    drawerCreditMeter.textContent = `${credits} / 100 Credits Remaining`;
  }

  if (aiToggleBtn) {
    if (credits <= 0) {
      aiToggleBtn.classList.add('exhausted');
      aiToggleBtn.classList.remove('pulsing');
    } else {
      aiToggleBtn.classList.remove('exhausted');
      aiToggleBtn.classList.add('pulsing');
    }
  }
}

async function checkAndDeductCredit() {
  try {
    if (api.consumeCredit) {
      const res = await api.consumeCredit();
      if (!res.success) {
        openPaywallModal();
        return false;
      }
      currentCredits = res.balance;
      updateCreditUI(currentCredits);
      return true;
    }
  } catch (err) {}
  openPaywallModal();
  return false;
}

function openPaywallModal() {
  if (paywallModal) {
    paywallModal.classList.add('active');
    if (passCodeInput) {
      passCodeInput.value = '';
      setTimeout(() => passCodeInput.focus(), 150);
    }
    if (passFeedbackMsg) {
      passFeedbackMsg.textContent = '';
      passFeedbackMsg.className = 'pass-feedback-msg';
    }
  }
}

function closePaywallModal() {
  if (paywallModal) {
    paywallModal.classList.remove('active');
  }
}

function handleBuyCredits() {
  window.open('https://your-payment-link.com/topup', '_blank');
}

async function handleRedeemPass() {
  const code = passCodeInput ? passCodeInput.value.trim() : '';
  if (!code) {
    if (paywallCard) {
      paywallCard.classList.remove('shake');
      void paywallCard.offsetWidth;
      paywallCard.classList.add('shake');
    }
    if (passFeedbackMsg) {
      passFeedbackMsg.textContent = 'Please enter a valid activation voucher or pass code.';
      passFeedbackMsg.className = 'pass-feedback-msg error';
    }
    return;
  }

  if (api.redeemCode) {
    const res = await api.redeemCode(code);
    if (res.success) {
      currentCredits = res.balance;
      updateCreditUI(currentCredits);
      if (passFeedbackMsg) {
        passFeedbackMsg.textContent = '⚡ ' + res.message;
        passFeedbackMsg.className = 'pass-feedback-msg success';
      }
      setTimeout(() => {
        closePaywallModal();
        showToast('⚡ ' + res.message);
      }, 400);
    } else {
      if (paywallCard) {
        paywallCard.classList.remove('shake');
        void paywallCard.offsetWidth;
        paywallCard.classList.add('shake');
      }
      if (passFeedbackMsg) {
        passFeedbackMsg.textContent = '💥 ' + res.message;
        passFeedbackMsg.className = 'pass-feedback-msg error';
      }
    }
  }
}

if (passCodeInput) {
  passCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRedeemPass();
    }
  });
}

function initTheme() {
  const saved = localStorage.getItem('shaktiman_theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('shaktiman_theme', theme);
  const bgFixedLayer = document.getElementById('bg-fixed-layer');
  if (bgFixedLayer) {
    bgFixedLayer.style.backgroundImage = 'none';
  }
  syncThemeToWebviews(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const target = current === 'dark' ? 'light' : 'dark';
  applyTheme(target);
}

function syncThemeToWebviews(theme) {
  tabs.forEach(tab => {
    const wv = document.getElementById(`wv-${tab.id}`);
    if (wv) {
      try {
        wv.executeJavaScript(`
          document.documentElement.setAttribute('data-theme', '${theme}');
          try { localStorage.setItem('shaktiman_theme', '${theme}'); } catch(e){}
        `).catch(() => {});
      } catch (e) {}
    }
  });
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    toggleTheme();
  });
}

document.addEventListener('click', (e) => {
  if (shieldPopover && !shieldPopover.contains(e.target) && !shieldBtn.contains(e.target)) {
    shieldPopover.classList.remove('active');
  }
});

function renderFavorites() {
  tilesGrid.innerHTML = FAVORITES.map(fav => `
    <div class="tile-card" onclick="navigateTo('${fav.url}')">
      <div class="tile-glyph">${fav.glyph}</div>
      <div class="tile-title">${fav.title}</div>
    </div>
  `).join('');
}

function parseInputUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
  if (domainRegex.test(trimmed)) {
    if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) {
      return 'http://' + trimmed;
    }
    return 'https://' + trimmed;
  }

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  return 'http://localhost:8000/?q=' + encodeURIComponent(trimmed) + '&theme=' + currentTheme;
}

function updateOmniboxIcon(url) {
  if (!url || url === 'about:blank') {
    omniboxIcon.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;
    return;
  }

  if (url.startsWith('https://')) {
    omniboxIcon.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    `;
  } else {
    omniboxIcon.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
  }
}

function createTab(initialUrl = null) {
  const tabId = tabIdCounter++;
  const tab = {
    id: tabId,
    title: initialUrl ? 'Loading...' : 'Start Page',
    url: initialUrl || 'about:blank',
    favicon: null,
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    blockedTrackers: [],
    webContentsId: null,
    isSplit: false
  };

  tabs.push(tab);

  const webview = document.createElement('webview');
  webview.id = `wv-${tabId}`;
  webview.className = 'webview-element';
  webview.setAttribute('allowpopups', 'true');
  webview.setAttribute('webpreferences', 'contextIsolation=true, nodeIntegration=false, webSecurity=true, allowRunningInsecureContent=false');
  if (preloadPath) {
    webview.setAttribute('preload', preloadPath);
  }

  viewContainer.appendChild(webview);

  setupWebviewEvents(tab, webview);

  if (initialUrl) {
    webview.src = initialUrl;
  }

  switchTab(tabId);
  renderTabs();
  return tab;
}

function setupWebviewEvents(tab, webview) {
  webview.addEventListener('dom-ready', () => {
    try {
      tab.webContentsId = webview.getWebContentsId();
    } catch (err) {}
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    try {
      webview.executeJavaScript(`
        document.documentElement.setAttribute('data-theme', '${currentTheme}');
        try { localStorage.setItem('shaktiman_theme', '${currentTheme}'); } catch(e){}
      `).catch(() => {});
    } catch (e) {}
  });

  webview.addEventListener('did-start-loading', () => {
    tab.isLoading = true;
  });

  webview.addEventListener('did-stop-loading', () => {
    tab.isLoading = false;
    tab.canGoBack = webview.canGoBack();
    tab.canGoForward = webview.canGoForward();

    if (tab.id === activeTabId) {
      backBtn.disabled = !tab.canGoBack;
      forwardBtn.disabled = !tab.canGoForward;
    }
  });

  webview.addEventListener('page-title-updated', (e) => {
    tab.title = e.title || 'Untitled';
    renderTabs();
  });

  webview.addEventListener('page-favicon-updated', (e) => {
    if (e.favicons && e.favicons.length > 0) {
      tab.favicon = e.favicons[0];
      renderTabs();
    }
  });

  webview.addEventListener('did-navigate', (e) => {
    tab.url = e.url;
    tab.blockedTrackers = [];
    if (tab.id === activeTabId) {
      updateNavState(tab);
      updateShieldPopover();
    }
  });

  webview.addEventListener('did-navigate-in-page', (e) => {
    tab.url = e.url;
    if (tab.id === activeTabId) {
      updateNavState(tab);
    }
  });

  webview.addEventListener('new-window', (e) => {
    e.preventDefault();
    if (e.url) {
      createTab(e.url);
    }
  });
}

if (api.on) {
  api.on('open-new-tab', (url) => {
    if (url) createTab(url);
  });

  api.on('tracker-blocked', (data) => {
    const matchingTab = tabs.find(t => t.webContentsId === data.webContentsId) || tabs.find(t => t.id === activeTabId);
    if (matchingTab) {
      matchingTab.blockedTrackers.push(data.url);
      if (matchingTab.id === activeTabId) {
        trackerCountText.textContent = matchingTab.blockedTrackers.length;
        if (shieldPopover && shieldPopover.classList.contains('active')) {
          updateShieldPopover();
        }
      }
    }
  });
}

function updateNavState(tab) {
  if (tab.url && tab.url !== 'about:blank') {
    omnibox.value = tab.url;
    omniboxClear.classList.add('show');
    startPage.classList.remove('active');
    const wv = document.getElementById(`wv-${tab.id}`);
    if (wv && !tab.isSplit) wv.classList.add('active');
  } else {
    omnibox.value = '';
    omniboxClear.classList.remove('show');
    startPage.classList.add('active');
    const wv = document.getElementById(`wv-${tab.id}`);
    if (wv) wv.classList.remove('active');
  }

  updateOmniboxIcon(tab.url);
  trackerCountText.textContent = tab.blockedTrackers.length;
  backBtn.disabled = !tab.canGoBack;
  forwardBtn.disabled = !tab.canGoForward;
}

function switchTab(tabId) {
  activeTabId = tabId;
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  document.querySelectorAll('.webview-element').forEach(wv => {
    wv.classList.remove('active');
  });

  document.querySelectorAll('.split-wrapper').forEach(sw => {
    sw.style.display = 'none';
  });

  if (tab.isSplit) {
    const sw = document.getElementById(`split-wrap-${tab.id}`);
    if (sw) sw.style.display = 'flex';
  }

  updateNavState(tab);
  renderTabs();
}

function closeTab(tabId) {
  if (tabs.length === 1) {
    const onlyTab = tabs[0];
    onlyTab.url = 'about:blank';
    onlyTab.title = 'Start Page';
    onlyTab.favicon = null;
    onlyTab.blockedTrackers = [];
    const wv = document.getElementById(`wv-${onlyTab.id}`);
    if (wv) wv.src = 'about:blank';
    updateNavState(onlyTab);
    renderTabs();
    return;
  }

  const targetIdx = tabs.findIndex(t => t.id === tabId);
  if (targetIdx === -1) return;

  const splitWrap = document.getElementById(`split-wrap-${tabId}`);
  if (splitWrap) splitWrap.remove();

  const wv = document.getElementById(`wv-${tabId}`);
  if (wv) wv.remove();

  tabs.splice(targetIdx, 1);

  if (activeTabId === tabId) {
    const nextTab = tabs[Math.max(0, targetIdx - 1)];
    switchTab(nextTab.id);
  } else {
    renderTabs();
  }
}

function renderTabs() {
  tabsListEl.innerHTML = tabs.map(tab => {
    const isActive = tab.id === activeTabId;
    const faviconContent = tab.favicon
      ? `<img src="${tab.favicon}" onerror="this.remove()">`
      : '&#9673;';

    return `
      <div class="tab ${isActive ? 'active' : ''}" data-id="${tab.id}">
        <span class="tab-favicon">${faviconContent}</span>
        <span class="tab-title" title="${tab.title}">${tab.title}</span>
        <button class="tab-close" data-close-id="${tab.id}">&times;</button>
      </div>
    `;
  }).join('');

  tabsListEl.querySelectorAll('.tab').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.tab-close')) return;
      const tid = parseInt(el.getAttribute('data-id'), 10);
      switchTab(tid);
    });
  });

  tabsListEl.querySelectorAll('.tab-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = parseInt(btn.getAttribute('data-close-id'), 10);
      closeTab(tid);
    });
  });
}

function navigateTo(rawInput) {
  const parsed = parseInputUrl(rawInput);
  if (!parsed) return;

  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;

  tab.url = parsed;
  tab.title = 'Loading...';
  const wv = document.getElementById(`wv-${tab.id}`);
  if (wv) {
    wv.src = parsed;
    if (!tab.isSplit) wv.classList.add('active');
  }

  startPage.classList.remove('active');
  updateNavState(tab);
  renderTabs();
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

startSearchForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const query = startSearchInput.value.trim();
  if (query) {
    navigateTo(query);
    startSearchInput.value = '';
  }
});

omnibox.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    navigateTo(omnibox.value);
    omnibox.blur();
  }
});

omnibox.addEventListener('input', () => {
  if (omnibox.value.length > 0) {
    omniboxClear.classList.add('show');
  } else {
    omniboxClear.classList.remove('show');
  }
});

omniboxClear.addEventListener('click', () => {
  omnibox.value = '';
  omniboxClear.classList.remove('show');
  omnibox.focus();
});

backBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const wv = document.getElementById(`wv-${tab.id}`);
  if (wv && wv.canGoBack()) {
    wv.goBack();
  }
});

forwardBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const wv = document.getElementById(`wv-${tab.id}`);
  if (wv && wv.canGoForward()) {
    wv.goForward();
  }
});

reloadBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const wv = document.getElementById(`wv-${tab.id}`);
  if (wv) {
    wv.reload();
  }
});

newTabBtn.addEventListener('click', () => {
  createTab();
});

aiToggleBtn.addEventListener('click', toggleSidebar);

function toggleSidebar() {
  aiSidebar.classList.toggle('open');
}

fireBtn.addEventListener('click', async () => {
  burnOverlay.classList.add('active');
  try {
    if (api.clearAllData) {
      await api.clearAllData();
    }
    showToast('Session burned: Cookies, cache & storage wiped!');

    tabs.forEach(tab => {
      tab.blockedTrackers = [];
      const wv = document.getElementById(`wv-${tab.id}`);
      if (wv) wv.src = 'about:blank';
      tab.url = 'about:blank';
      tab.title = 'Start Page';
      tab.favicon = null;
    });

    renderTabs();
    const current = tabs.find(t => t.id === activeTabId);
    if (current) updateNavState(current);
  } finally {
    setTimeout(() => {
      burnOverlay.classList.remove('active');
    }, 700);
  }
});

function updateShieldPopover() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  let host = 'Local Start Page';
  try {
    if (tab.url && tab.url.startsWith('http')) {
      host = new URL(tab.url).hostname;
    }
  } catch (e) {}

  shieldSiteHost.textContent = host;
  const isShieldDisabled = localStorage.getItem('shaktiman_shield_disabled_' + host) === 'true';
  shieldToggleSwitch.checked = !isShieldDisabled;
  shieldStatusLabel.textContent = !isShieldDisabled ? 'PROTECTION ACTIVE' : 'SHIELDS PAUSED';
  shieldStatusLabel.style.color = !isShieldDisabled ? '#10b981' : '#f87171';
  shieldStatNumber.textContent = tab.blockedTrackers.length;

  if (tab.blockedTrackers.length === 0) {
    shieldBlockedList.innerHTML = '<div class="shield-empty-msg">No trackers detected yet. Clean session!</div>';
  } else {
    shieldBlockedList.innerHTML = tab.blockedTrackers.map(url => {
      let d = url;
      try { d = new URL(url).hostname; } catch (e) {}
      return `<div class="shield-blocked-item" title="${url}">${d}</div>`;
    }).join('');
  }
}

shieldBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  updateShieldPopover();
  shieldPopover.classList.toggle('active');
});

shieldToggleSwitch.addEventListener('change', async () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  let host = '';
  try {
    host = new URL(tab.url).hostname;
  } catch (e) {}
  if (!host) return;

  const enabled = shieldToggleSwitch.checked;
  if (!enabled) {
    localStorage.setItem('shaktiman_shield_disabled_' + host, 'true');
  } else {
    localStorage.removeItem('shaktiman_shield_disabled_' + host);
  }
  if (api.toggleShield) {
    await api.toggleShield(host, enabled);
  }
  updateShieldPopover();
  showToast(enabled ? `⚡ Shields active for ${host}` : `⚠️ Shields paused for ${host}`);
});

shieldResetBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) {
    tab.blockedTrackers = [];
    trackerCountText.textContent = '0';
    updateShieldPopover();
    const wv = document.getElementById(`wv-${tab.id}`);
    if (wv) wv.reload();
  }
});

function toggleSplitScreen() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;

  let splitWrapper = document.getElementById(`split-wrap-${tab.id}`);
  const primaryWv = document.getElementById(`wv-${tab.id}`);

  if (tab.isSplit) {
    tab.isSplit = false;
    if (splitWrapper) {
      primaryWv.classList.remove('split-child');
      viewContainer.appendChild(primaryWv);
      splitWrapper.remove();
      primaryWv.classList.add('active');
    }
    showToast('Split-Screen View Closed');
    return;
  }

  tab.isSplit = true;
  splitWrapper = document.createElement('div');
  splitWrapper.id = `split-wrap-${tab.id}`;
  splitWrapper.className = 'split-wrapper active';

  const leftPane = document.createElement('div');
  leftPane.className = 'split-pane-left';
  primaryWv.classList.add('split-child');
  leftPane.appendChild(primaryWv);

  const divider = document.createElement('div');
  divider.className = 'split-divider';

  let isDragging = false;
  divider.addEventListener('mousedown', () => {
    isDragging = true;
    divider.classList.add('dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = splitWrapper.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    if (pct > 20 && pct < 80) {
      leftPane.style.width = pct + '%';
      rightPane.style.width = (100 - pct) + '%';
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      divider.classList.remove('dragging');
    }
  });

  const rightPane = document.createElement('div');
  rightPane.className = 'split-pane-right';

  const miniBar = document.createElement('div');
  miniBar.className = 'split-mini-bar';
  const miniInput = document.createElement('input');
  miniInput.className = 'split-mini-input';
  miniInput.placeholder = 'Secondary URL or search...';
  miniInput.value = 'http://localhost:8000/';

  const miniCloseBtn = document.createElement('button');
  miniCloseBtn.className = 'nav-btn';
  miniCloseBtn.innerHTML = '&times;';
  miniCloseBtn.title = 'Close Split View';
  miniCloseBtn.addEventListener('click', toggleSplitScreen);

  miniBar.appendChild(miniInput);
  miniBar.appendChild(miniCloseBtn);

  const secondaryWv = document.createElement('webview');
  secondaryWv.id = `wv-sec-${tab.id}`;
  secondaryWv.setAttribute('allowpopups', 'true');
  secondaryWv.setAttribute('webpreferences', 'contextIsolation=true, nodeIntegration=false, webSecurity=true, allowRunningInsecureContent=false');
  if (preloadPath) {
    secondaryWv.setAttribute('preload', preloadPath);
  }
  secondaryWv.src = 'http://localhost:8000/';

  miniInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      secondaryWv.src = parseInputUrl(miniInput.value);
    }
  });

  rightPane.appendChild(miniBar);
  rightPane.appendChild(secondaryWv);

  splitWrapper.appendChild(leftPane);
  splitWrapper.appendChild(divider);
  splitWrapper.appendChild(rightPane);

  viewContainer.appendChild(splitWrapper);
  showToast('Split-Screen Dual View Active (Cmd/Ctrl + \\ to toggle)');
}

splitBtn.addEventListener('click', toggleSplitScreen);

pipBtn.addEventListener('click', async () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const wv = document.getElementById(`wv-${tab.id}`);
  if (!wv) {
    showToast('No active video on Start Page');
    return;
  }

  const script = `(() => {
    try {
      const v = document.querySelector('video');
      if (!v) return { ok: false, msg: 'No video element found on this page' };
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
        return { ok: true, msg: 'Exited Picture-in-Picture' };
      } else {
        v.requestPictureInPicture();
        return { ok: true, msg: 'Floating Picture-in-Picture Activated!' };
      }
    } catch (err) {
      return { ok: false, msg: err.message };
    }
  })()`;

  try {
    const res = await wv.executeJavaScript(script);
    showToast(res.msg);
  } catch (err) {
    showToast('PiP error: ' + err.message);
  }
});

screenshotBtn.addEventListener('click', async () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const wv = document.getElementById(`wv-${tab.id}`);
  if (!wv || !tab.url || tab.url === 'about:blank') {
    showToast('Cannot capture blank Start Page');
    return;
  }

  showToast('📸 Capturing screenshot...');
  try {
    const image = await wv.capturePage();
    const dataUrl = image.toDataURL();
    if (api.saveScreenshot) {
      const res = await api.saveScreenshot(dataUrl, (tab.title || 'page').slice(0, 30));
      if (res.success) {
        showToast('📸 Screenshot saved to Downloads: ' + res.filename);
      } else {
        showToast('Screenshot save failed: ' + res.error);
      }
    }
  } catch (err) {
    showToast('Capture error: ' + err.message);
  }
});

async function openReaderMode() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const wv = document.getElementById(`wv-${tab.id}`);
  if (!wv || !tab.url || tab.url === 'about:blank') {
    showToast('Open an article or webpage first for Reader Mode');
    return;
  }

  const script = `(() => {
    const article = document.querySelector('article') || document.querySelector('main') || document.querySelector('.post-content') || document.body;
    const title = document.querySelector('h1')?.innerText || document.title || 'Article';
    const author = document.querySelector('[rel="author"], .byline, .author, meta[name="author"]')?.innerText || '';
    const paragraphs = Array.from(article.querySelectorAll('p, h2, h3, blockquote, img')).map(el => {
      if (el.tagName === 'IMG' && el.src) {
        return '<img src="' + el.src + '" style="max-width:100%; border-radius:12px; margin:16px 0;">';
      }
      if (el.tagName.startsWith('H')) {
        return '<' + el.tagName.toLowerCase() + '>' + el.innerText.trim() + '</' + el.tagName.toLowerCase() + '>';
      }
      if (el.tagName === 'BLOCKQUOTE') {
        return '<blockquote>' + el.innerText.trim() + '</blockquote>';
      }
      const t = el.innerText.trim();
      return t.length > 20 ? '<p>' + t + '</p>' : '';
    }).filter(Boolean).join('');

    return { title, author, content: paragraphs };
  })()`;

  try {
    const data = await wv.executeJavaScript(script);
    readerTitle.textContent = data.title;
    readerByline.textContent = data.author ? `By ${data.author} • Shaktiman Reader Mode` : `Source: ${tab.url} • Shaktiman Reader Mode`;
    readerBody.innerHTML = data.content || '<p>No structured article paragraphs could be extracted from this page.</p>';
    readerOverlay.classList.add('active');
  } catch (err) {
    showToast('Reader Mode extraction failed: ' + err.message);
  }
}

function closeReaderMode() {
  readerOverlay.classList.remove('active');
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  readerTtsBtn.innerHTML = '<span>🔊 Read Aloud</span>';
}

readerBtn.addEventListener('click', openReaderMode);
readerCloseBtn.addEventListener('click', closeReaderMode);

readerFontSizeUp.addEventListener('click', () => {
  currentFontSize = Math.min(2.0, currentFontSize + 0.1);
  readerBody.style.fontSize = currentFontSize + 'rem';
});

readerFontSizeDown.addEventListener('click', () => {
  currentFontSize = Math.max(0.9, currentFontSize - 0.1);
  readerBody.style.fontSize = currentFontSize + 'rem';
});

readerThemeLight.addEventListener('click', () => readerOverlay.setAttribute('data-reader-theme', 'light'));
readerThemeSepia.addEventListener('click', () => readerOverlay.setAttribute('data-reader-theme', 'sepia'));
readerThemeDark.addEventListener('click', () => readerOverlay.setAttribute('data-reader-theme', 'dark'));

readerTtsBtn.addEventListener('click', () => {
  if (!window.speechSynthesis) return;
  if (window.speechSynthesis.speaking) {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      readerTtsBtn.innerHTML = '<span>⏸️ Pause</span>';
    } else {
      window.speechSynthesis.pause();
      readerTtsBtn.innerHTML = '<span>▶️ Resume</span>';
    }
    return;
  }

  const textToRead = (readerTitle.textContent + '. ' + readerBody.innerText).slice(0, 15000);
  currentTtsUtterance = new SpeechSynthesisUtterance(textToRead);
  currentTtsUtterance.rate = 1.0;
  currentTtsUtterance.onend = () => {
    readerTtsBtn.innerHTML = '<span>🔊 Read Aloud</span>';
  };
  window.speechSynthesis.speak(currentTtsUtterance);
  readerTtsBtn.innerHTML = '<span>⏸️ Pause</span>';
});

function toggleScratchpad() {
  scratchpadDrawer.classList.toggle('open');
  if (scratchpadDrawer.classList.contains('open')) {
    const saved = localStorage.getItem('shaktiman_scratchpad') || '';
    scratchpadTextarea.value = saved;
    scratchpadTextarea.focus();
  }
}

scratchpadBtn.addEventListener('click', toggleScratchpad);
closeScratchpadBtn.addEventListener('click', toggleScratchpad);

scratchpadTextarea.addEventListener('input', () => {
  localStorage.setItem('shaktiman_scratchpad', scratchpadTextarea.value);
  scratchpadSavedStatus.textContent = 'Saved at ' + new Date().toLocaleTimeString();
});

clipUrlBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab || !tab.url) return;
  const line = `\n- [${tab.title}](${tab.url})\n`;
  scratchpadTextarea.value += line;
  localStorage.setItem('shaktiman_scratchpad', scratchpadTextarea.value);
  showToast('Page URL clipped to Scratchpad!');
});

clipSelectionBtn.addEventListener('click', async () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab || !tab.webContentsId) return;
  if (api.extractPageContext) {
    const ctx = await api.extractPageContext(tab.webContentsId);
    if (ctx && ctx.selectedText) {
      const quote = `\n> ${ctx.selectedText}\n— *${ctx.title}*\n`;
      scratchpadTextarea.value += quote;
      localStorage.setItem('shaktiman_scratchpad', scratchpadTextarea.value);
      showToast('Page selection clipped to Scratchpad!');
    } else {
      showToast('No text selected on page to clip');
    }
  }
});

exportNotesBtn.addEventListener('click', () => {
  const blob = new Blob([scratchpadTextarea.value], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'shaktiman-notes.md';
  a.click();
  showToast('Exported shaktiman-notes.md');
});

clearNotesBtn.addEventListener('click', () => {
  if (confirm('Clear all Scratchpad notes?')) {
    scratchpadTextarea.value = '';
    localStorage.removeItem('shaktiman_scratchpad');
    showToast('Scratchpad cleared');
  }
});

async function seedSampleIndex() {
  try {
    const res = await fetch('http://localhost:8000/api/seed', { method: 'POST' });
    const data = await res.json();
    showToast(`Indexed ${data.total_docs} sample articles!`);
    navigateTo('http://localhost:8000/?q=BM25');
  } catch (err) {
    showToast('Error connecting to local search engine on port 8000.');
  }
}

function openAiOverviewQuick() {
  if (currentCredits <= 0) {
    openPaywallModal();
    return;
  }
  if (!aiSidebar.classList.contains('open')) {
    toggleSidebar();
  }
  sidebarInput.value = 'What can you do as Shaktiman Autonomous Agent?';
  sendAiMessage();
}

async function runAiAction(action) {
  if (currentCredits <= 0) {
    openPaywallModal();
    return;
  }

  if (!aiSidebar.classList.contains('open')) {
    toggleSidebar();
  }

  const tab = tabs.find(t => t.id === activeTabId);
  let pageContext = null;
  if (tab && tab.webContentsId && api.extractPageContext) {
    pageContext = await api.extractPageContext(tab.webContentsId);
  }

  if (action === 'chat-page') {
    sidebarInput.value = 'Chat with Page: Analyze this active webpage and provide an executive briefing of its key arguments and data.';
  } else if (action === 'draft-response') {
    sidebarInput.value = 'Draft Response: Synthesize this webpage content into an articulate, professional response and action plan.';
  } else if (action === 'autofill-data') {
    sidebarInput.value = 'Autofill Page Data: Inspect the page structure and interactive form inputs to prepare structured autofill data.';
  } else if (action === 'scan-tasks') {
    sidebarInput.value = 'Scan for Navigation Tasks: Parse page links, action triggers, and primary workflows to recommend next steps.';
  } else if (action === 'summarize') {
    sidebarInput.value = 'Summarize Tab: Provide 3 clear bullet points capturing the core insights of this page.';
  } else if (action === 'takeaways') {
    sidebarInput.value = 'Extract the key takeaways and insights from this page.';
  } else if (action === 'translate') {
    sidebarInput.value = 'Translate the essential content into English.';
  } else if (action === 'explain') {
    sidebarInput.value = 'Explain the core topic of this page with examples.';
  }
  sendAiMessage(pageContext);
}

async function sendAiMessage(context = null) {
  const text = sidebarInput.value.trim();
  if (!text) return;

  const allowed = await checkAndDeductCredit();
  if (!allowed) {
    return;
  }

  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = text;
  sidebarChat.appendChild(userBubble);
  sidebarInput.value = '';

  const aiBubble = document.createElement('div');
  aiBubble.className = 'chat-bubble assistant';
  aiBubble.textContent = 'Thinking...';
  sidebarChat.appendChild(aiBubble);
  sidebarChat.scrollTop = sidebarChat.scrollHeight;

  const currentTab = tabs.find(t => t.id === activeTabId);
  let ctxData = context;
  if (!ctxData && currentTab && currentTab.webContentsId && api.extractPageContext) {
    ctxData = await api.extractPageContext(currentTab.webContentsId);
  }

  try {
    const aiRes = await fetch('http://localhost:8000/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: text,
        page_title: ctxData ? ctxData.title : '',
        page_url: ctxData ? ctxData.url : '',
        page_text: ctxData ? ctxData.cleanText : ''
      })
    });
    if (aiRes.ok) {
      const data = await aiRes.json();
      aiBubble.textContent = data.reply;
      sidebarChat.scrollTop = sidebarChat.scrollHeight;
      return;
    }
  } catch (e) {}

  setTimeout(() => {
    let reply = `Shaktiman AI: I analyzed your request "${text}". `;
    if (ctxData && ctxData.title) {
      reply += `Currently active on "${ctxData.title}". Key content highlights: ${(ctxData.cleanText || '').slice(0, 180)}...`;
    } else {
      reply += 'You are on the New Tab Dashboard. Type any topic or question to explore!';
    }
    aiBubble.textContent = reply;
    sidebarChat.scrollTop = sidebarChat.scrollHeight;
  }, 400);
}

sidebarInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAiMessage();
  }
});

window.addEventListener('keydown', (e) => {
  const isCmdOrCtrl = e.metaKey || e.ctrlKey;
  const isInputFocused = document.activeElement && (
    document.activeElement.tagName === 'INPUT' ||
    document.activeElement.tagName === 'TEXTAREA'
  );

  if (e.key === 'Escape') {
    if (readerOverlay && readerOverlay.classList.contains('active')) {
      closeReaderMode();
      return;
    }
    if (scratchpadDrawer && scratchpadDrawer.classList.contains('open')) {
      toggleScratchpad();
      return;
    }
    if (shieldPopover && shieldPopover.classList.contains('active')) {
      shieldPopover.classList.remove('active');
      return;
    }
    if (paywallModal && paywallModal.classList.contains('active')) {
      if (currentCredits <= 0) {
        if (paywallCard) {
          paywallCard.classList.remove('shake');
          void paywallCard.offsetWidth;
          paywallCard.classList.add('shake');
        }
        return;
      } else {
        closePaywallModal();
        return;
      }
    }
  }

  if (isCmdOrCtrl && e.key === '\\') {
    e.preventDefault();
    toggleSplitScreen();
    return;
  }

  if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    openReaderMode();
    return;
  }

  if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    toggleScratchpad();
    return;
  }

  if (isCmdOrCtrl && e.key.toLowerCase() === 't') {
    e.preventDefault();
    createTab();
  } else if (isCmdOrCtrl && e.key.toLowerCase() === 'w') {
    e.preventDefault();
    if (activeTabId) closeTab(activeTabId);
  } else if (isCmdOrCtrl && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    omnibox.focus();
    omnibox.select();
  } else if (isCmdOrCtrl && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) {
      const wv = document.getElementById(`wv-${tab.id}`);
      if (wv) wv.reload();
    }
  } else if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    toggleSidebar();
  }
});

initSecurityAndCredits();
initTheme();
renderFavorites();
createTab();
