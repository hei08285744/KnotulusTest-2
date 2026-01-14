(function () {
  'use strict';

  function refreshBellBadge() {
    try {
      const bell = document.getElementById('navbarLightDropdownMenuLink');
      if (!bell) return;
      const raw = localStorage.getItem('chatUnreadCount') || '0';
      const count = Math.max(0, parseInt(raw, 10) || 0);
      const badge = bell.querySelector && bell.querySelector('.bell-dot');
      if (count > 0) bell.classList.add('notification-dot'); else bell.classList.remove('notification-dot');
      if (badge) {
        const text = count > 99 ? '99+' : String(count);
        badge.textContent = count > 0 ? text : '';
        // toggle single-digit class for perfect circle
        if (count > 0 && count < 10) badge.classList.add('single'); else badge.classList.remove('single');
        badge.setAttribute('aria-label', count > 0 ? (badge.textContent + ' unread notifications') : 'No unread notifications');
        // reflect empty state for CSS hiding
        if (count === 0) badge.setAttribute('aria-hidden', 'true'); else badge.removeAttribute('aria-hidden');
      }
    } catch (e) {
      /* ignore */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshBellBadge);
  } else {
    refreshBellBadge();
  }

  try {
    window.addEventListener('storage', (e) => {
      if (e.key === 'chatUnreadCount') refreshBellBadge();
    });
  } catch (e) {}

  try {
    document.addEventListener('DOMContentLoaded', () => {
      const bell = document.getElementById('navbarLightDropdownMenuLink');
      if (!bell) return;
      bell.addEventListener('click', () => {
        try { localStorage.setItem('chatUnreadCount', '0'); } catch (e) {}
        refreshBellBadge();
      });
    });
  } catch (e) {}
})();
