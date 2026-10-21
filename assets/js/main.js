/* =========================================================
   هم‌ساز — اسکریپت لندپیج
   ========================================================= */

/* ---------- لینک‌ها ----------
   هر لینکی که اینجا خالی باشه، توی صفحه با برچسب «به‌زودی» و غیرفعال نشون داده می‌شه.
   register: صفحه‌ی ثبت‌نام رویداد در کوئرا (مثلاً https://quera.org/events/...).
   پارامترهای UTM زیر خودکار به لینک ثبت‌نام اضافه می‌شن. */
const LINKS = {
  register: '',         // صفحه‌ی ثبت‌نام رویداد در کوئرا
  teamBot: '',          // بات تلگرام تیم‌سازی
  template: '',         // فایل تمپلیت معرفی‌نامه
  rules: '',            // صفحه‌ی قوانین
  privacy: '',          // صفحه‌ی حریم خصوصی
  channel: '',          // کانال اطلاع‌رسانی رویداد
  supportTelegram: '',  // آیدی تلگرام پشتیبانی، مثلاً https://t.me/...
  supportEmail: '',     // ایمیل پشتیبانی، مثلاً mailto:support@...
};

const REGISTER_UTM = {
  utm_source: 'hamsaz-landing',
  utm_medium: 'landing',
  utm_campaign: 'hamsaz',
};

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const burger = $('#burger');
  const links = $('#navLinks');
  const closeMenu = () => { links.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a', links).forEach((a) => a.addEventListener('click', closeMenu));

  /* ---------- scroll: nav state + timeline progress ---------- */
  const timeline = $('#timelineList');
  const steps = $$('.step', timeline);
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 20);
    const r = timeline.getBoundingClientRect();
    const mid = window.innerHeight * 0.6;
    timeline.style.setProperty('--p', Math.max(0, Math.min(1, (mid - r.top) / r.height)).toFixed(3));
    steps.forEach((s) => {
      const b = s.querySelector('.step__num').getBoundingClientRect();
      s.classList.toggle('is-active', b.top + b.height / 2 < mid);
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const sibs = $$('.reveal', e.target.parentElement);
      e.target.style.transitionDelay = `${Math.min(sibs.indexOf(e.target), 5) * 70}ms`;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => revealIO.observe(el));

  /* ---------- links from LINKS ---------- */
  const withUtm = (url) => {
    try {
      const u = new URL(url);
      Object.entries(REGISTER_UTM).forEach(([k, v]) => { if (!u.searchParams.has(k)) u.searchParams.set(k, v); });
      return u.toString();
    } catch (_) {
      return url;
    }
  };

  $$('[data-link]').forEach((a) => {
    const key = a.dataset.link;
    const url = LINKS[key];
    if (url) {
      a.href = key === 'register' ? withUtm(url) : url;
      if (key !== 'register' && /^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener'; }
    } else {
      a.classList.add('is-pending');
      a.setAttribute('aria-disabled', 'true');
      a.addEventListener('click', (e) => e.preventDefault());
    }
  });

  /* ---------- FAQ: one open at a time ---------- */
  $$('.qa').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) $$('.qa').forEach((o) => { if (o !== d) o.open = false; });
  }));
})();
