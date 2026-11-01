/* =========================================================
   هم‌ساز — اسکریپت لندپیج
   ========================================================= */

/* ---------- لینک‌ها ----------
   هر عنصری با data-link="کلید" به لینک متناظر اینجا وصل می‌شه.
   پارامترهای UTM زیر خودکار به لینک ثبت‌نام اضافه می‌شن. */
const LINKS = {
  register: 'https://quera.org/events/hamsaz1/register',  // صفحه‌ی ثبت‌نام رویداد در کوئرا
  teamBot: 'https://t.me/HamsazTeamBot',                   // بات تلگرام تیم‌سازی
  supportTelegram: 'https://t.me/quera_info',              // پشتیبانی تلگرام
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
  if (burger && links) {
    const closeMenu = () => { links.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('a', links).forEach((a) => a.addEventListener('click', closeMenu));
  }

  /* ---------- scroll: nav state + timeline progress ---------- */
  const timeline = $('#timelineList');
  const steps = timeline ? $$('.step', timeline) : [];
  const onScroll = () => {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 20);
    if (!timeline) return;
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

  /* ---------- راهنمای کارت‌های کشیدنی در موبایل ---------- */
  $$('.swipe').forEach((el) => el.insertAdjacentHTML('afterend', '<p class="swipe-hint" aria-hidden="true">برای دیدن بقیه، کارت‌ها را بکش</p>'));

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
  const faqs = $$('.faq .qa');
  faqs.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* بخش‌های بازشونده ارتفاع صفحه را عوض می‌کنند؛ نوار پیشرفت زمان‌بندی دوباره حساب شود */
  $$('details').forEach((d) => d.addEventListener('toggle', onScroll));

  /* ---------- دکمه‌ی ثابت ثبت‌نام در موبایل ---------- */
  const sticky = $('#stickyCta');
  if (sticky && LINKS.register) {
    sticky.hidden = false;
    document.body.classList.add('has-sticky');
  }
})();
