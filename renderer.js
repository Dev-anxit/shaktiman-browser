const { ipcRenderer } = require('electron');

let tabs = [];
let activeTabId = null;
let tabIdCounter = 1;
let isFetchingWallpaper = false;
let currentWallpaper = {
  url: '',
  badge: 'Mixed Chaos',
  title: 'Funny Animals & Memes'
};

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
const shieldBtn = document.getElementById('shieldBtn');
const trackerCountText = document.getElementById('trackerCountText');
const fireBtn = document.getElementById('fireBtn');
const aiToggleBtn = document.getElementById('aiToggleBtn');
const aiSidebar = document.getElementById('aiSidebar');
const themeMenuBtn = document.getElementById('themeMenuBtn');
const themeMenu = document.getElementById('themeMenu');
const activeThemeLabel = document.getElementById('activeThemeLabel');
const viewContainer = document.getElementById('viewContainer');
const startPage = document.getElementById('startPage');
const startSearchForm = document.getElementById('startSearchForm');
const startSearchInput = document.getElementById('startSearchInput');
const tilesGrid = document.getElementById('tilesGrid');
const sidebarChat = document.getElementById('sidebarChat');
const sidebarInput = document.getElementById('sidebarInput');
const toast = document.getElementById('toast');
const burnOverlay = document.getElementById('burnOverlay');

const wallpaperCaptionPill = document.getElementById('wallpaperCaptionPill');
const captionToggleBtn = document.getElementById('captionToggleBtn');
const captionBadge = document.getElementById('captionBadge');
const captionTitle = document.getElementById('captionTitle');
const downloadWpBtn = document.getElementById('downloadWpBtn');
const captionShuffleBtn = document.getElementById('captionShuffleBtn');
const floatingShuffleBtn = document.getElementById('floatingShuffleBtn');

function setWallpaperMode(mode) {
  localStorage.setItem('shaktiman_wallpaper_mode', mode);
  themeMenu.classList.remove('open');

  const modeLabels = {
    mixed: 'Mixed Chaos',
    cats: 'Funny Cats',
    dogs: 'Funny Dogs',
    memes: 'Programmer Memes',
    aurora: 'Aurora Gradient',
    custom: 'Custom Image'
  };
  activeThemeLabel.textContent = modeLabels[mode] || 'Wallpaper';

  fetchNextWallpaper();
}

function initWallpaperMode() {
  const mode = localStorage.getItem('shaktiman_wallpaper_mode') || 'mixed';
  const modeLabels = {
    mixed: 'Mixed Chaos',
    cats: 'Funny Cats',
    dogs: 'Funny Dogs',
    memes: 'Programmer Memes',
    aurora: 'Aurora Gradient',
    custom: 'Custom Image'
  };
  activeThemeLabel.textContent = modeLabels[mode] || 'Wallpaper';
  fetchNextWallpaper();
}

themeMenuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  themeMenu.classList.toggle('open');
});

document.addEventListener('click', () => {
  themeMenu.classList.remove('open');
});

function openCustomWpDialog() {
  themeMenu.classList.remove('open');
  const url = prompt('Enter custom wallpaper image URL:');
  if (url && url.trim()) {
    localStorage.setItem('shaktiman_custom_bg', url.trim());
    setWallpaperMode('custom');
  }
}

function setShuffleLoadingState(isLoading) {
  if (isLoading) {
    if (floatingShuffleBtn) floatingShuffleBtn.classList.add('loading');
    if (captionShuffleBtn) captionShuffleBtn.classList.add('loading');
  } else {
    if (floatingShuffleBtn) floatingShuffleBtn.classList.remove('loading');
    if (captionShuffleBtn) captionShuffleBtn.classList.remove('loading');
  }
}

async function fetchNextWallpaper() {
  if (isFetchingWallpaper) return;
  const mode = localStorage.getItem('shaktiman_wallpaper_mode') || 'mixed';

  if (mode === 'aurora') {
    applyAuroraWallpaper();
    return;
  }

  if (mode === 'custom') {
    const customUrl = localStorage.getItem('shaktiman_custom_bg');
    if (customUrl) {
      applyCustomWallpaper(customUrl);
    } else {
      openCustomWpDialog();
    }
    return;
  }

  isFetchingWallpaper = true;
  setShuffleLoadingState(true);

  let targetMode = mode;
  if (mode === 'mixed') {
    const pool = ['cats', 'dogs', 'memes', 'memes'];
    targetMode = pool[Math.floor(Math.random() * pool.length)];
  }

  try {
    if (targetMode === 'cats') {
      await fetchCatWallpaper();
    } else if (targetMode === 'dogs') {
      await fetchDogWallpaper();
    } else if (targetMode === 'memes') {
      await fetchMemeWallpaper();
    }
  } catch (err) {
    applyFallbackWallpaper();
  } finally {
    isFetchingWallpaper = false;
    setShuffleLoadingState(false);
  }
}

async function fetchCatWallpaper() {
  let imgUrl = '';
  let title = 'Hilarious Cat Stare';
  try {
    const res = await fetch('https://cataas.com/cat?json=true');
    if (res.ok) {
      const data = await res.json();
      if (data.url && data.url.startsWith('http')) {
        imgUrl = data.url;
      } else if (data.url && data.url.startsWith('/')) {
        imgUrl = 'https://cataas.com' + data.url;
      } else if (data.id || data._id) {
        imgUrl = 'https://cataas.com/cat/' + (data.id || data._id);
      }
      if (data.tags && data.tags.length > 0) {
        title = 'Funny Cat: ' + data.tags.slice(0, 3).join(', ');
      }
    }
  } catch (e) {}

  if (!imgUrl) {
    imgUrl = 'https://cataas.com/cat/funny?t=' + Date.now();
  }

  await loadAndApplyImage(imgUrl, '🐱 Funny Cat', title);
}

async function fetchDogWallpaper() {
  const res = await fetch('https://dog.ceo/api/breeds/image/random');
  const data = await res.json();
  if (data && data.message) {
    const parts = data.message.split('/');
    const breedIdx = parts.indexOf('breeds');
    let breedName = 'Good Doggo';
    if (breedIdx !== -1 && parts[breedIdx + 1]) {
      breedName = parts[breedIdx + 1].replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    await loadAndApplyImage(data.message, '🐶 Funny Dog', 'Hilarious ' + breedName);
  } else {
    throw new Error('Dog API failed');
  }
}

async function fetchMemeWallpaper() {
  const subreddits = ['ProgrammerHumor', 'wholesomememes'];
  const chosenSub = subreddits[Math.floor(Math.random() * subreddits.length)];
  const res = await fetch('https://meme-api.com/gimme/' + chosenSub);
  const data = await res.json();
  if (data && data.url && !data.nsfw) {
    const badge = chosenSub === 'ProgrammerHumor' ? '💻 Programmer Meme' : '✨ Wholesome Meme';
    await loadAndApplyImage(data.url, badge, data.title || 'Meme from r/' + chosenSub);
  } else {
    await fetchCatWallpaper();
  }
}

function loadAndApplyImage(url, badge, title) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      renderWallpaper(url, badge, title);
      resolve();
    };
    img.onerror = () => {
      applyFallbackWallpaper();
      resolve();
    };
    img.src = url;
  });
}

function renderWallpaper(url, badge, title) {
  const bgFixedLayer = document.getElementById('bg-fixed-layer');
  const bgVignetteOverlay = document.getElementById('bgVignetteOverlay');
  const orbs = document.querySelectorAll('.aurora-orb');

  orbs.forEach(orb => orb.style.display = 'none');
  if (bgVignetteOverlay) bgVignetteOverlay.style.display = 'block';

  bgFixedLayer.style.backgroundImage = `url("${url}")`;
  bgFixedLayer.style.backgroundSize = 'cover';
  bgFixedLayer.style.backgroundPosition = 'center';

  currentWallpaper = { url, badge, title };

  if (captionBadge) captionBadge.textContent = badge;
  if (captionTitle) captionTitle.textContent = title;
  if (downloadWpBtn) downloadWpBtn.href = url;
}

function applyAuroraWallpaper() {
  const bgFixedLayer = document.getElementById('bg-fixed-layer');
  const bgVignetteOverlay = document.getElementById('bgVignetteOverlay');
  const orbs = document.querySelectorAll('.aurora-orb');

  bgFixedLayer.style.backgroundImage = '';
  if (bgVignetteOverlay) bgVignetteOverlay.style.display = 'none';
  orbs.forEach(orb => orb.style.display = 'block');

  if (captionBadge) captionBadge.textContent = '✦ Aurora Mode';
  if (captionTitle) captionTitle.textContent = 'Dynamic Aurora mesh gradient';
  if (downloadWpBtn) downloadWpBtn.href = '#';
}

function applyCustomWallpaper(url) {
  loadAndApplyImage(url, '🖼 Custom Backdrop', 'User custom image');
}

function applyFallbackWallpaper() {
  const fallbackUrl = 'https://images.dog.ceo/breeds/shiba/shiba-13.jpg';
  renderWallpaper(fallbackUrl, '🐶 Funny Dog', 'Classic Shiba Doge');
}

if (floatingShuffleBtn) {
  floatingShuffleBtn.addEventListener('click', () => {
    fetchNextWallpaper();
  });
}

if (captionShuffleBtn) {
  captionShuffleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fetchNextWallpaper();
  });
}

if (captionToggleBtn && wallpaperCaptionPill) {
  captionToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    wallpaperCaptionPill.classList.toggle('collapsed');
  });
}

function renderFavorites() {
  tilesGrid.innerHTML = FAVORITES.map(fav => `
    <div class="tile" data-url="${fav.url}">
      <div class="tile-icon">${fav.glyph}</div>
      <div class="tile-title">${fav.title}</div>
    </div>
  `).join('');

  tilesGrid.querySelectorAll('.tile').forEach(el => {
    el.addEventListener('click', () => {
      const targetUrl = el.getAttribute('data-url');
      navigateTo(targetUrl);
    });
  });
}

function parseInputUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('file://')) {
    return trimmed;
  }

  const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
  const localhostRegex = /^localhost(:\d+)?(\/.*)?$/;
  const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/;

  if (localhostRegex.test(trimmed) || ipRegex.test(trimmed)) {
    return 'http://' + trimmed;
  }

  if (domainRegex.test(trimmed)) {
    return 'https://' + trimmed;
  }

  return 'http://localhost:8000/?q=' + encodeURIComponent(trimmed);
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
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    `;
  } else {
    omniboxIcon.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
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
    webContentsId: null
  };

  tabs.push(tab);

  const webview = document.createElement('webview');
  webview.id = `wv-${tabId}`;
  webview.className = 'webview-element';
  webview.setAttribute('allowpopups', 'true');
  webview.setAttribute('webpreferences', 'contextIsolation=false');

  viewContainer.appendChild(webview);

  setupWebviewEvents(tab, webview);

  if (initialUrl) {
    webview.src = initialUrl;
  } else {
    fetchNextWallpaper();
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

ipcRenderer.on('open-new-tab', (event, url) => {
  if (url) {
    createTab(url);
  }
});

function updateNavState(tab) {
  if (tab.url && tab.url !== 'about:blank') {
    omnibox.value = tab.url;
    omniboxClear.classList.add('show');
    startPage.classList.remove('active');
    const wv = document.getElementById(`wv-${tab.id}`);
    if (wv) wv.classList.add('active');
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
    wv.classList.add('active');
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
    if (tab.isLoading) wv.stop();
    else wv.reload();
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
    await ipcRenderer.invoke('clear-all-data');
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

ipcRenderer.on('tracker-blocked', (event, data) => {
  const matchingTab = tabs.find(t => t.webContentsId === data.webContentsId) || tabs.find(t => t.id === activeTabId);
  if (matchingTab) {
    matchingTab.blockedTrackers.push(data.url);
    if (matchingTab.id === activeTabId) {
      trackerCountText.textContent = matchingTab.blockedTrackers.length;
    }
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
  toggleSidebar();
  sidebarInput.value = 'What can you do as Shaktiman AI Assistant?';
  sendAiMessage();
}

async function runAiAction(action) {
  if (!aiSidebar.classList.contains('open')) {
    toggleSidebar();
  }

  const tab = tabs.find(t => t.id === activeTabId);
  let pageContext = null;
  if (tab && tab.webContentsId) {
    pageContext = await ipcRenderer.invoke('extract-page-context', tab.webContentsId);
  }

  if (action === 'summarize') {
    sidebarInput.value = 'Summarize this page in 3 clear bullet points.';
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
  if (!ctxData && currentTab && currentTab.webContentsId) {
    ctxData = await ipcRenderer.invoke('extract-page-context', currentTab.webContentsId);
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
  } else if (!isCmdOrCtrl && !isInputFocused && e.key.toLowerCase() === 's') {
    e.preventDefault();
    fetchNextWallpaper();
  }
});

initWallpaperMode();
renderFavorites();
createTab();
