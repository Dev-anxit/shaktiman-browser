const api = window.shaktimanAPI || {};

let preloadPath = '';
let currentCredits = 10;
let tabs = [];
let activeTabId = null;
let tabIdCounter = 1;

const FAVORITES = [
  {
    title: 'Local Search',
    url: 'http://localhost:8000/',
    bg: 'rgba(245, 158, 11, 0.12)',
    iconHtml: '<img src="assets/logo.png" class="tile-brand-img" alt="Local Search">'
  },
  {
    title: 'Google',
    url: 'https://www.google.com',
    bg: '#ffffff',
    iconHtml: '<svg width="28" height="28" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>'
  },
  {
    title: 'YouTube',
    url: 'https://youtube.com',
    bg: 'rgba(255, 0, 0, 0.08)',
    iconHtml: '<svg width="30" height="30" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><polygon fill="#FFFFFF" points="9.545,15.568 15.818,12 9.545,8.432"/></svg>'
  },
  {
    title: 'GitHub',
    url: 'https://github.com',
    bg: '#18181b',
    iconHtml: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>'
  },
  {
    title: 'Reddit',
    url: 'https://reddit.com',
    bg: 'rgba(255, 69, 0, 0.12)',
    iconHtml: '<svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FF4500"/><path fill="#FFFFFF" d="M16.67 11.83a1.27 1.27 0 0 0-.87.35 6.33 6.33 0 0 0-3.8-1.15l.65-3.05 2.12.45a.94.94 0 1 0 .2-.62l-2.4-.5a.28.28 0 0 0-.33.22l-.76 3.55a6.45 6.45 0 0 0-3.9 1.15 1.28 1.28 0 0 0-1.78 1.48 2.6 2.6 0 0 0 .04 1.77c-.03.17-.04.34-.04.52 0 2.63 2.9 4.77 6.48 4.77s6.48-2.14 6.48-4.77c0-.18-.01-.35-.04-.52a2.6 2.6 0 0 0 .04-1.77 1.28 1.28 0 0 0-.9-1.89zm-7.42 1.42a.85.85 0 1 1-.85.85.85.85 0 0 1 .85-.85zm5.5 3.3a3.5 3.5 0 0 1-2.75.8 3.5 3.5 0 0 1-2.75-.8.25.25 0 0 1 .35-.35 3 3 0 0 0 2.4.67 3 3 0 0 0 2.4-.67.25.25 0 0 1 .35.35zm-.32-2.45a.85.85 0 1 1 .85-.85.85.85 0 0 1-.85.85z"/></svg>'
  },
  {
    title: 'Wikipedia',
    url: 'https://en.wikipedia.org',
    bg: 'rgba(255, 255, 255, 0.08)',
    iconHtml: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12.09 13.124l2.12-6.528h2.046l-3.328 8.84h-1.636l-2.124-6.386-2.124 6.386H5.408l-3.328-8.84h2.046l2.12 6.528 2.05-6.528h1.744l2.05 6.528zm6.502 2.312h1.83l-3.78-8.84h-1.83l3.78 8.84zm3.578 0h1.83l-3.78-8.84H18.39l3.78 8.84z"/></svg>'
  },
  {
    title: 'X',
    url: 'https://x.com',
    bg: '#000000',
    iconHtml: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
  },
  {
    title: 'DuckDuckGo',
    url: 'https://duckduckgo.com',
    bg: 'rgba(222, 88, 51, 0.12)',
    iconHtml: '<svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#DE5833"/><path fill="#FFFFFF" d="M12 4.5c-2.4 0-4.2 1.5-4.2 3.5 0 .8.3 1.5.8 2-.6.7-1.1 1.7-1.1 2.8 0 2.6 2.3 4.7 5.2 4.7 1.8 0 3.3-.8 4.2-2.1.8-.1 1.6-.5 2.1-1.1.8-.9.9-2.1.2-3.1 1-.5 1.6-1.5 1.6-2.6 0-2.3-2-4.1-4.8-4.1zm-1.8 2.8c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1zm3.8 0c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1z"/><ellipse cx="12" cy="12.5" rx="3.5" ry="1.8" fill="#F8A51D"/></svg>'
  },
  {
    title: 'Hacker News',
    url: 'https://news.ycombinator.com',
    bg: 'rgba(255, 102, 0, 0.12)',
    iconHtml: '<svg width="28" height="28" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FF6600"/><text x="12" y="16.5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle">Y</text></svg>'
  },
  {
    title: 'MDN Web',
    url: 'https://developer.mozilla.org',
    bg: 'rgba(33, 100, 243, 0.1)',
    iconHtml: '<svg width="28" height="28" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0c0d0e"/><path fill="#2164f3" d="M3 6h3v12H3z"/><path fill="#ffffff" d="M8 8h2v8H8zm4 0h2v8h-2zm4 0h2v8h-2z"/><path fill="#2164f3" d="M18 6h3v12h-3z"/></svg>'
  }
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
const paywallUserEmailBadge = document.getElementById('paywallUserEmailBadge');
const paywallAccountText = document.getElementById('paywallAccountText');

const authHeaderWrapper = document.getElementById('authHeaderWrapper');
const signInHeaderBtn = document.getElementById('signInHeaderBtn');
const profileHeaderPill = document.getElementById('profileHeaderPill');
const profileAvatar = document.getElementById('profileAvatar');
const profileEmailBadge = document.getElementById('profileEmailBadge');
const profileCreditsBadge = document.getElementById('profileCreditsBadge');
const signOutHeaderBtn = document.getElementById('signOutHeaderBtn');

const authModalOverlay = document.getElementById('authModalOverlay');
const authModalCard = document.getElementById('authModalCard');
const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
const authTabSignInBtn = document.getElementById('authTabSignInBtn');
const authTabSignUpBtn = document.getElementById('authTabSignUpBtn');
const oauthGoogleBtn = document.getElementById('oauthGoogleBtn');
const oauthGithubBtn = document.getElementById('oauthGithubBtn');
const oauthAppleBtn = document.getElementById('oauthAppleBtn');
const oauthMicrosoftBtn = document.getElementById('oauthMicrosoftBtn');

const authEmailForm = document.getElementById('authEmailForm');
const authNameFieldGroup = document.getElementById('authNameFieldGroup');
const authNameInput = document.getElementById('authNameInput');
const authEmailInput = document.getElementById('authEmailInput');
const authPasswordInput = document.getElementById('authPasswordInput');
const authErrorBanner = document.getElementById('authErrorBanner');
const authSubmitActionBtn = document.getElementById('authSubmitActionBtn');

const supabaseAccordionToggle = document.getElementById('supabaseAccordionToggle');
const supabaseAccordionContent = document.getElementById('supabaseAccordionContent');
const accordionArrow = document.getElementById('accordionArrow');
const supabaseUrlInput = document.getElementById('supabaseUrlInput');
const supabaseKeyInput = document.getElementById('supabaseKeyInput');
const saveSupabaseSettingsBtn = document.getElementById('saveSupabaseSettingsBtn');

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

const API_BASE = 'http://127.0.0.1:8000';
let SUPABASE_URL = localStorage.getItem('supabase_url') || '';
let SUPABASE_ANON_KEY = localStorage.getItem('supabase_key') || '';
let supabaseClient = null;

let authToken = localStorage.getItem('shaktiman_token') || '';
let currentUser = null;
let currentAuthMode = 'signin';

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  const url = localStorage.getItem('supabase_url') || SUPABASE_URL;
  const key = localStorage.getItem('supabase_key') || SUPABASE_ANON_KEY;
  if (url && key && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (err) {
      supabaseClient = null;
    }
  }
  return supabaseClient;
}

async function fetchUserCreditsFromSupabase(userId, email) {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('user_credits')
      .select('credits, is_pro, email')
      .eq('id', userId)
      .single();
    if (!error && data) {
      return data;
    }
  } catch (err) {}
  return null;
}

async function initSecurityAndCredits() {
  try {
    if (api.getPreloadPath) {
      preloadPath = await api.getPreloadPath();
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
  if (profileCreditsBadge) {
    profileCreditsBadge.textContent = `⚡ ${credits} Credits`;
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

function updateAuthUI(user) {
  currentUser = user;
  if (user) {
    if (signInHeaderBtn) signInHeaderBtn.classList.add('hidden');
    if (profileHeaderPill) profileHeaderPill.classList.remove('hidden');
    if (profileAvatar) {
      if (user.avatar_url) {
        profileAvatar.innerHTML = `<img src="${user.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      } else {
        const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
        profileAvatar.textContent = initial;
      }
    }
    if (profileEmailBadge) {
      profileEmailBadge.textContent = user.email;
      profileEmailBadge.title = user.email;
    }
    currentCredits = typeof user.credits === 'number' ? user.credits : 100;
    updateCreditUI(currentCredits);
  } else {
    if (signInHeaderBtn) signInHeaderBtn.classList.remove('hidden');
    if (profileHeaderPill) profileHeaderPill.classList.add('hidden');
    currentCredits = 0;
    updateCreditUI(0);
  }
}

async function checkAuthStatus() {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data } = await sb.auth.getSession();
      if (data && data.session && data.session.user) {
        const u = data.session.user;
        const userCredits = await fetchUserCreditsFromSupabase(u.id, u.email);
        const creds = userCredits ? userCredits.credits : 100;
        const userObj = {
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.email.split('@')[0],
          avatar_url: u.user_metadata?.avatar_url || '',
          provider: 'supabase',
          credits: creds,
          is_pro: Boolean(userCredits?.is_pro)
        };
        authToken = data.session.access_token;
        localStorage.setItem('shaktiman_token', authToken);
        localStorage.setItem('shaktiman_user', JSON.stringify(userObj));
        updateAuthUI(userObj);
        return;
      }
    } catch (err) {}
  }

  if (!authToken) {
    updateAuthUI(null);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('shaktiman_user', JSON.stringify(data.user));
      updateAuthUI(data.user);
      return;
    }
  } catch (err) {}

  const cached = localStorage.getItem('shaktiman_user');
  if (cached) {
    try {
      const user = JSON.parse(cached);
      updateAuthUI(user);
      return;
    } catch (e) {}
  }
  handleSignOut();
}

function openAuthModal(mode = 'signin') {
  setAuthMode(mode);
  if (authErrorBanner) {
    authErrorBanner.textContent = '';
    authErrorBanner.classList.add('hidden');
  }
  if (authModalOverlay) {
    authModalOverlay.classList.add('active');
    setTimeout(() => {
      if (authEmailInput) authEmailInput.focus();
    }, 100);
  }
}

function closeAuthModal() {
  if (authModalOverlay) {
    authModalOverlay.classList.remove('active');
  }
}

function setAuthMode(mode) {
  currentAuthMode = mode;
  if (authTabSignInBtn && authTabSignUpBtn) {
    if (mode === 'signup') {
      authTabSignUpBtn.classList.add('active');
      authTabSignInBtn.classList.remove('active');
      if (authNameFieldGroup) authNameFieldGroup.classList.remove('hidden');
      if (authSubmitActionBtn) authSubmitActionBtn.innerHTML = '<span>Sign Up — Get 100 Free Credits</span>';
    } else {
      authTabSignInBtn.classList.add('active');
      authTabSignUpBtn.classList.remove('active');
      if (authNameFieldGroup) authNameFieldGroup.classList.add('hidden');
      if (authSubmitActionBtn) authSubmitActionBtn.innerHTML = '<span>Sign In</span>';
    }
  }
}

async function handleAuthSubmit(e) {
  if (e) e.preventDefault();
  const email = authEmailInput ? authEmailInput.value.trim() : '';
  const password = authPasswordInput ? authPasswordInput.value : '';
  const name = authNameInput ? authNameInput.value.trim() : '';

  if (!email || !password) {
    showAuthError('Please fill in both email and password.');
    return;
  }

  const sb = getSupabaseClient();
  if (sb) {
    try {
      if (currentAuthMode === 'signup') {
        const { data, error } = await sb.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { full_name: name || email.split('@')[0] }
          }
        });
        if (error) {
          showAuthError(error.message);
          return;
        }
        if (data && data.user) {
          const userCredits = await fetchUserCreditsFromSupabase(data.user.id, data.user.email);
          const creds = userCredits ? userCredits.credits : 100;
          const userObj = {
            id: data.user.id,
            email: data.user.email,
            name: name || data.user.user_metadata?.full_name || email.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url || '',
            provider: 'supabase',
            credits: creds,
            is_pro: false
          };
          authToken = data.session ? data.session.access_token : data.user.id;
          localStorage.setItem('shaktiman_token', authToken);
          localStorage.setItem('shaktiman_user', JSON.stringify(userObj));
          updateAuthUI(userObj);
          closeAuthModal();
          showToast(`Welcome, ${userObj.name}! (⚡ ${creds} credits ready)`);
          return;
        }
      } else {
        const { data, error } = await sb.auth.signInWithPassword({
          email: email,
          password: password
        });
        if (error) {
          showAuthError(error.message);
          return;
        }
        if (data && data.user) {
          const userCredits = await fetchUserCreditsFromSupabase(data.user.id, data.user.email);
          const creds = userCredits ? userCredits.credits : 100;
          const userObj = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url || '',
            provider: 'supabase',
            credits: creds,
            is_pro: Boolean(userCredits?.is_pro)
          };
          authToken = data.session?.access_token || data.user.id;
          localStorage.setItem('shaktiman_token', authToken);
          localStorage.setItem('shaktiman_user', JSON.stringify(userObj));
          updateAuthUI(userObj);
          closeAuthModal();
          showToast(`Welcome back, ${userObj.name}! (⚡ ${creds} credits)`);
          return;
        }
      }
    } catch (sbErr) {}
  }

  const endpoint = currentAuthMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
  const body = currentAuthMode === 'signup' ? { email, password, name } : { email, password };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      showAuthError(data.detail || 'Authentication failed. Please try again.');
      return;
    }

    authToken = data.token;
    localStorage.setItem('shaktiman_token', authToken);
    localStorage.setItem('shaktiman_user', JSON.stringify(data.user));
    updateAuthUI(data.user);
    closeAuthModal();
    showToast(`Welcome, ${data.user.name || data.user.email}! (⚡ ${data.user.credits} credits ready)`);
  } catch (err) {
    showAuthError('Cannot connect to authentication server. Is the backend running?');
  }
}

function showAuthError(msg) {
  if (authErrorBanner) {
    authErrorBanner.textContent = msg;
    authErrorBanner.classList.remove('hidden');
  }
}

async function handleOAuth(provider) {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: 'http://127.0.0.1:8000/auth/callback'
        }
      });
      if (error) {
        showAuthError(error.message);
      } else if (data && data.url) {
        createTab(data.url);
        closeAuthModal();
        return;
      }
    } catch (e) {}
  }

  const defaultEmail = authEmailInput && authEmailInput.value.trim() ? authEmailInput.value.trim() : `user.${provider}@shaktiman.ai`;
  const email = window.prompt(`Continue with ${provider.charAt(0).toUpperCase() + provider.slice(1)} account:`, defaultEmail);
  if (!email) return;

  const name = email.split('@')[0].replace(/[._]/g, ' ');
  const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`;

  try {
    const res = await fetch(`${API_BASE}/api/auth/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: provider,
        email: email,
        name: name,
        avatar_url: avatar
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showAuthError(data.detail || 'OAuth sign-in failed.');
      return;
    }

    authToken = data.token;
    localStorage.setItem('shaktiman_token', authToken);
    localStorage.setItem('shaktiman_user', JSON.stringify(data.user));
    updateAuthUI(data.user);
    closeAuthModal();
    showToast(`Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}! (⚡ ${data.user.credits} credits)`);
  } catch (err) {
    showAuthError('OAuth authentication request failed: ' + err.message);
  }
}

async function handleSignOut() {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch (err) {}
  }
  authToken = '';
  currentUser = null;
  localStorage.removeItem('shaktiman_token');
  localStorage.removeItem('shaktiman_user');
  updateAuthUI(null);
  showToast('Signed out of Shaktiman Browser.');
}

function toggleSupabaseAccordion() {
  if (supabaseAccordionContent) {
    const isHidden = supabaseAccordionContent.classList.contains('hidden');
    if (isHidden) {
      supabaseAccordionContent.classList.remove('hidden');
      if (accordionArrow) accordionArrow.innerHTML = '&#9652;';
    } else {
      supabaseAccordionContent.classList.add('hidden');
      if (accordionArrow) accordionArrow.innerHTML = '&#9662;';
    }
  }
}

function saveSupabaseConfig() {
  const url = supabaseUrlInput ? supabaseUrlInput.value.trim() : '';
  const key = supabaseKeyInput ? supabaseKeyInput.value.trim() : '';
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);
  SUPABASE_URL = url;
  SUPABASE_ANON_KEY = key;
  supabaseClient = null;
  getSupabaseClient();
  showToast('Supabase configuration saved & connected.');
}

function initAuth() {
  if (signInHeaderBtn) {
    signInHeaderBtn.addEventListener('click', () => openAuthModal('signin'));
  }
  if (signOutHeaderBtn) {
    signOutHeaderBtn.addEventListener('click', handleSignOut);
  }
  if (closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener('click', closeAuthModal);
  }
  if (authTabSignInBtn) {
    authTabSignInBtn.addEventListener('click', () => setAuthMode('signin'));
  }
  if (authTabSignUpBtn) {
    authTabSignUpBtn.addEventListener('click', () => setAuthMode('signup'));
  }
  if (oauthGoogleBtn) {
    oauthGoogleBtn.addEventListener('click', () => handleOAuth('google'));
  }
  if (oauthGithubBtn) {
    oauthGithubBtn.addEventListener('click', () => handleOAuth('github'));
  }
  if (oauthAppleBtn) {
    oauthAppleBtn.addEventListener('click', () => handleOAuth('apple'));
  }
  if (oauthMicrosoftBtn) {
    oauthMicrosoftBtn.addEventListener('click', () => handleOAuth('microsoft'));
  }
  if (authEmailForm) {
    authEmailForm.addEventListener('submit', handleAuthSubmit);
  }
  if (supabaseAccordionToggle) {
    supabaseAccordionToggle.addEventListener('click', toggleSupabaseAccordion);
  }
  if (saveSupabaseSettingsBtn) {
    saveSupabaseSettingsBtn.addEventListener('click', saveSupabaseConfig);
  }
  if (supabaseUrlInput) {
    supabaseUrlInput.value = localStorage.getItem('supabase_url') || '';
  }
  if (supabaseKeyInput) {
    supabaseKeyInput.value = localStorage.getItem('supabase_key') || '';
  }
  if (authModalOverlay) {
    authModalOverlay.addEventListener('click', (e) => {
      if (e.target === authModalOverlay) closeAuthModal();
    });
  }
}

async function checkAndDeductCredit() {
  if (!currentUser) {
    showToast('Please sign in to access Shaktiman AI');
    openAuthModal('signin');
    return false;
  }

  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb.rpc('consume_shaktiman_credit');
      if (error) {
        if (error.message && (error.message.includes('Insufficient credits') || error.message.includes('exhausted') || error.code === 'P0001')) {
          currentCredits = 0;
          if (currentUser) currentUser.credits = 0;
          updateCreditUI(0);
          openPaywallModal();
          return false;
        }
      } else if (typeof data === 'number') {
        currentCredits = data;
        if (currentUser) currentUser.credits = data;
        updateCreditUI(currentCredits);
        return true;
      }
    } catch (sbErr) {}
  }

  if (authToken) {
    try {
      const res = await fetch(`${API_BASE}/api/credits/consume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (res.status === 402) {
        currentCredits = 0;
        updateCreditUI(0);
        if (currentUser) currentUser.credits = 0;
        openPaywallModal();
        return false;
      }

      if (res.status === 401) {
        handleSignOut();
        showToast('Session expired. Please sign in again.');
        openAuthModal('signin');
        return false;
      }

      if (res.ok) {
        const data = await res.json();
        currentCredits = data.remaining_credits;
        if (currentUser) currentUser.credits = currentCredits;
        updateCreditUI(currentCredits);
        return true;
      }
    } catch (err) {}
  }

  if (api.consumeCredit) {
    const localRes = await api.consumeCredit();
    if (localRes.success) {
      currentCredits = localRes.balance;
      updateCreditUI(currentCredits);
      return true;
    }
  }

  openPaywallModal();
  return false;
}

function openPaywallModal() {
  if (paywallModal) {
    paywallModal.classList.add('active');
    if (paywallUserEmailBadge) {
      const email = currentUser ? currentUser.email : '0';
      paywallUserEmailBadge.textContent = `${email.toUpperCase()} — 0 / 100 CREDITS REMAINING`;
    }
    if (paywallAccountText) {
      if (currentUser) {
        paywallAccountText.textContent = `Account (${currentUser.email}) has reached 0 credits. Recharge now to continue autonomous web searches and AI assistance.`;
      } else {
        paywallAccountText.textContent = `Your Shaktiman AI credit balance is 0. Sign in or top up to continue enjoying autonomous searches and AI features.`;
      }
    }
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

function openPaymentLink() {
  window.open('https://ankit-portfolio-ten-tawny.vercel.app/', '_blank');
}

function handleBuyCredits() {
  openPaymentLink();
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
      passFeedbackMsg.textContent = 'Please enter a valid activation voucher or transaction ID.';
      passFeedbackMsg.className = 'pass-feedback-msg error';
    }
    return;
  }

  if (!currentUser) {
    showToast('Please sign in first to redeem credits to your account');
    openAuthModal('signin');
    return;
  }

  const sb = getSupabaseClient();
  if (sb && (code === 'DEVXANXIT500' || code === 'SUPERCHARGE' || code.length >= 6)) {
    try {
      const { data, error } = await sb.rpc('topup_shaktiman_credit', { p_amount: 500 });
      if (!error && typeof data === 'number') {
        currentCredits = data;
        if (currentUser) currentUser.credits = currentCredits;
        updateCreditUI(currentCredits);
        if (passFeedbackMsg) {
          passFeedbackMsg.textContent = '⚡ 500 Credits added successfully!';
          passFeedbackMsg.className = 'pass-feedback-msg success';
        }
        setTimeout(() => {
          closePaywallModal();
          showToast('⚡ 500 Credits added successfully!');
        }, 500);
        return;
      }
    } catch (sbTopupErr) {}
  }

  if (authToken) {
    try {
      const res = await fetch(`${API_BASE}/api/credits/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ code: code, transaction_id: code })
      });

      if (res.ok) {
        const data = await res.json();
        currentCredits = data.credits;
        if (currentUser) currentUser.credits = currentCredits;
        updateCreditUI(currentCredits);
        if (passFeedbackMsg) {
          passFeedbackMsg.textContent = '⚡ ' + data.message;
          passFeedbackMsg.className = 'pass-feedback-msg success';
        }
        setTimeout(() => {
          closePaywallModal();
          showToast('⚡ ' + data.message);
        }, 500);
        return;
      } else {
        const errData = await res.json().catch(() => ({ detail: 'Verification failed' }));
        if (paywallCard) {
          paywallCard.classList.remove('shake');
          void paywallCard.offsetWidth;
          paywallCard.classList.add('shake');
        }
        if (passFeedbackMsg) {
          passFeedbackMsg.textContent = '💥 ' + (errData.detail || 'Invalid voucher or transaction ID');
          passFeedbackMsg.className = 'pass-feedback-msg error';
        }
        return;
      }
    } catch (err) {}
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
    <div class="tile-card" onclick="navigateTo('${fav.url}')" title="${fav.title}">
      <div class="tile-glyph" style="background:${fav.bg};">${fav.iconHtml}</div>
      <div class="tile-title">${fav.title}</div>
    </div>
  `).join('');

  FAVORITES.forEach(fav => {
    try {
      const u = new URL(fav.url);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = u.origin;
        document.head.appendChild(link);
      }
    } catch (e) {}
  });
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
  if (!currentUser) {
    openAuthModal('signin');
    return;
  }
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
initAuth();
checkAuthStatus();
initTheme();
renderFavorites();
createTab();
