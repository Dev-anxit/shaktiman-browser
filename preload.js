(() => {
  try {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
      configurable: true
    });
  } catch (e) {}

  try {
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      try {
        const ctx = this.getContext('2d');
        if (ctx && this.width > 0 && this.height > 0) {
          const w = Math.min(this.width, 8);
          const h = Math.min(this.height, 8);
          const imgData = ctx.getImageData(0, 0, w, h);
          for (let i = 0; i < imgData.data.length; i += 4) {
            imgData.data[i] = (imgData.data[i] + (Math.random() < 0.5 ? 1 : 0)) % 256;
          }
          ctx.putImageData(imgData, 0, 0);
        }
      } catch (err) {}
      return origToDataURL.apply(this, args);
    };
  } catch (e) {}

  const COSMETIC_CSS = `
    .ad-showing, .ad-container, .ytp-ad-overlay-container,
    ytd-promoted-sparkles-web-renderer, ytd-banner-promo-renderer,
    #masthead-ad, .ytd-in-feed-ad-layout-renderer,
    .trc_related_container, .taboola, .outbrain,
    div[id^="google_ads_"], ins.adsbygoogle,
    .cookie-banner, #cookie-notice, .cmp-container,
    .advertisement, .sponsor-badge, [data-ad-unit] {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;

  function injectCosmetics() {
    if (!document.head || document.getElementById('shaktiman-cosmetic-shield')) return;
    const style = document.createElement('style');
    style.id = 'shaktiman-cosmetic-shield';
    style.textContent = COSMETIC_CSS;
    document.head.appendChild(style);
  }

  if (document.head) {
    injectCosmetics();
  } else {
    document.addEventListener('DOMContentLoaded', injectCosmetics, { once: true });
  }

  if (window.location.hostname.includes('youtube.com')) {
    let ticking = false;

    function handleYouTubeAds() {
      ticking = false;
      const adContainer = document.querySelector('.ad-showing, .ad-interrupting');
      const video = document.querySelector('video');
      if (adContainer && video) {
        video.muted = true;
        if (!isNaN(video.duration) && video.duration > 0) {
          video.currentTime = video.duration;
        }
      }
      const skipButtons = document.querySelectorAll(
        '.ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button, .ytp-ad-overlay-close-button, button.ytp-ad-skip-button'
      );
      skipButtons.forEach((btn) => {
        if (btn && typeof btn.click === 'function') {
          btn.click();
        }
      });
    }

    function scheduleAdCheck() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(handleYouTubeAds);
      }
    }

    function setupYouTubeObserver() {
      const target = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      if (target) {
        handleYouTubeAds();
        const obs = new MutationObserver(scheduleAdCheck);
        obs.observe(target, { childList: true, attributes: true, attributeFilter: ['class'] });
      } else {
        setTimeout(setupYouTubeObserver, 500);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupYouTubeObserver, { once: true });
    } else {
      setupYouTubeObserver();
    }
  }
})();
