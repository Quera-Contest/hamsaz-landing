/* =========================================================
   هم‌ساز — اسکریپت لندپیج
   ========================================================= */

/* ---------- تنظیمات API ثبت‌نام کوئرا ----------
   ⚠️ هشدار: این کلید داخل کد سمت مرورگره و هر کسی می‌تونه از سورس صفحه
   ببینتش. طبق داک کوئرا کلید باید روی سرور بمونه؛ این حالت موقته.
   همچنین اگه کوئرا CORS رو برای دامنه‌ی سایت باز نکرده باشه، درخواست
   از مرورگر رد می‌شه.
   تا وقتی key خالیه، فرم در «حالت آزمایشی» کار می‌کنه و چیزی ارسال نمی‌شه. */
const QUERA_API = {
  url: 'https://quera.org/events/api/external_register',
  key: '', // ← کلید API رویداد
};

/* ---------- لینک‌هایی که هنوز نهایی نشده‌اند ----------
   هر لینکی که اینجا خالی باشه، توی صفحه با برچسب «به‌زودی» و غیرفعال نشون داده می‌شه. */
const LINKS = {
  teamBot: '',          // بات تلگرام تیم‌سازی
  template: '',         // فایل تمپلیت معرفی‌نامه
  rules: '',            // صفحه‌ی قوانین
  privacy: '',          // صفحه‌ی حریم خصوصی
  channel: '',          // کانال اطلاع‌رسانی رویداد
  supportTelegram: '',  // آیدی تلگرام پشتیبانی، مثلاً https://t.me/...
  supportEmail: '',     // ایمیل پشتیبانی، مثلاً mailto:support@...
};

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const enDigits = (v) => String(v)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

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
  $$('[data-link]').forEach((a) => {
    const url = LINKS[a.dataset.link];
    if (url) {
      a.href = url;
      if (/^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener'; }
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

  /* =======================================================
     REGISTRATION FORM
     ======================================================= */
  const form = $('#registerForm');
  const F = form.elements;
  const status = $('#formStatus');
  const submitBtn = $('#submitBtn');

  // normalize Persian/Arabic digits as the user types
  [F.phone_number, F.email].forEach((input) => input.addEventListener('input', () => {
    const v = enDigits(input.value);
    if (v !== input.value) input.value = v;
  }));

  const setErr = (input, msg) => {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.toggle('has-error', !!msg);
    const err = $('.err', field);
    if (err) err.textContent = msg || '';
  };

  const normalizePhone = (v) => {
    const d = enDigits(v).replace(/[\s()-]/g, '').replace(/^(\+98|0098|98|0)/, '');
    return /^9\d{9}$/.test(d) ? `+98${d}` : null;
  };

  const validate = () => {
    let ok = true;
    const check = (input, msg) => { setErr(input, msg); if (msg) ok = false; };
    check(F.first_name, F.first_name.value.trim() ? '' : 'نامت رو وارد کن.');
    check(F.last_name, F.last_name.value.trim() ? '' : 'نام خانوادگیت رو وارد کن.');
    check(F.phone_number, normalizePhone(F.phone_number.value) ? '' : 'شماره موبایل معتبر نیست (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).');
    check(F.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(F.email.value.trim()) ? '' : 'ایمیل معتبر نیست.');
    check(F.consent, F.consent.checked ? '' : 'برای ادامه باید قوانین و حریم خصوصی رو بپذیری.');
    return ok;
  };

  const buildPayload = () => ({
    email: F.email.value.trim(),
    phone_number: normalizePhone(F.phone_number.value),
    first_name: F.first_name.value.trim(),
    last_name: F.last_name.value.trim(),
  });

  const FIELD_OF = { email: F.email, phone_number: F.phone_number, first_name: F.first_name, last_name: F.last_name };
  const showServerErrors = (errors) => {
    if (!errors || typeof errors !== 'object') return;
    Object.entries(errors).forEach(([key, val]) => {
      const msg = Array.isArray(val) ? val[0] : val;
      if (FIELD_OF[key] && typeof msg === 'string') setErr(FIELD_OF[key], msg);
    });
  };

  async function register(payload) {
    if (!QUERA_API.key) {
      console.warn('[hamsaz] QUERA_API.key خالیه؛ حالت آزمایشی. payload:', payload);
      await sleep(700);
      return null;
    }
    let res;
    try {
      res = await fetch(QUERA_API.url, {
        method: 'POST',
        headers: { Authorization: `Api-Key ${QUERA_API.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (_) {
      throw new Error('ارتباط با کوئرا برقرار نشد؛ اتصال اینترنت رو بررسی کن و دوباره تلاش کن.');
    }
    let data = {};
    try { data = await res.json(); } catch (_) { /* non-JSON */ }
    if (res.status === 201 && typeof data.url === 'string') return data.url;
    if (res.status === 400) {
      showServerErrors(data);
      throw new Error('اطلاعات واردشده مورد قبول نبود؛ لطفاً بررسی کن.');
    }
    throw new Error('ثبت‌نام الان ممکن نیست؛ ممکنه مهلت ثبت‌نام تموم شده باشه یا هنوز باز نشده باشه.');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.classList.remove('is-info');
    if (!validate()) {
      const firstErr = $('.has-error input, .has-error select', form);
      if (firstErr) firstErr.focus();
      return;
    }
    submitBtn.classList.add('is-loading');
    try {
      const url = await register(buildPayload());
      await launch(url);
      if (!url) {
        status.classList.add('is-info');
        status.textContent = 'حالت آزمایشی: کلید API هنوز تنظیم نشده و اطلاعاتی ارسال نشد.';
      }
    } catch (err) {
      status.textContent = err.message || 'مشکلی پیش اومد؛ لطفاً دوباره تلاش کن.';
    } finally {
      submitBtn.classList.remove('is-loading');
    }
  });

  form.addEventListener('input', (e) => { if (e.target.closest('.has-error')) setErr(e.target, ''); });
  form.addEventListener('change', (e) => { if (e.target === F.consent) setErr(F.consent, ''); });

  /* =======================================================
     LAUNCH (rocket lifts off → redirect to Quera)
     ======================================================= */
  const overlay = $('#launch');
  const continueLink = $('#continueLink');
  $('#launchRocket').appendChild($('#rocketSvg').cloneNode(true)).removeAttribute('id');

  async function launch(url) {
    continueLink.hidden = !url;
    if (url) continueLink.href = url;
    overlay.classList.remove('is-flying');
    overlay.hidden = false;
    await sleep(reduceMotion ? 0 : 500);
    overlay.classList.add('is-flying');
    await sleep(reduceMotion ? 600 : 2000);
    if (url) {
      window.location.href = url;
      return;
    }
    overlay.hidden = true;
  }
})();
