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

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const faDigits = (v) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
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

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const to = +el.dataset.to;
      countIO.unobserve(el);
      if (reduceMotion) { el.textContent = faDigits(to); return; }
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 1200, 1);
        el.textContent = faDigits(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('.count').forEach((el) => countIO.observe(el));

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

  // birthday selects (Jalali)
  const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const thisJYear = parseInt(new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric' }).format(new Date()), 10) || 1405;
  const addOpt = (sel, value, label) => sel.add(new Option(label, value));
  for (let d = 1; d <= 31; d++) addOpt(F.b_day, d, faDigits(d));
  MONTHS.forEach((m, i) => addOpt(F.b_month, i + 1, m));
  for (let y = thisJYear - 10; y >= thisJYear - 80; y--) addOpt(F.b_year, y, faDigits(y));

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

  // 'YYYY-MM-DD' (Gregorian), '' when left empty, or null when invalid/incomplete
  const birthday = () => {
    const parts = [F.b_year.value, F.b_month.value, F.b_day.value];
    if (parts.every((p) => !p)) return '';
    if (parts.some((p) => !p)) return null;
    const [jy, jm, jd] = parts.map(Number);
    if (jd > jalaliMonthLength(jy, jm)) return null;
    const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
    return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
  };

  const validate = () => {
    let ok = true;
    const check = (input, msg) => { setErr(input, msg); if (msg) ok = false; };
    check(F.phone_number, normalizePhone(F.phone_number.value) ? '' : 'شماره موبایل معتبر نیست (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).');
    check(F.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(F.email.value.trim()) ? '' : 'ایمیل معتبر نیست.');
    check(F.b_day, birthday() === null ? 'تاریخ تولد رو کامل و درست انتخاب کن، یا خالی بذار.' : '');
    return ok;
  };

  const buildPayload = () => {
    const payload = { email: F.email.value.trim(), phone_number: normalizePhone(F.phone_number.value) };
    const first = F.first_name.value.trim();
    const last = F.last_name.value.trim();
    const bday = birthday();
    if (first) payload.first_name = first;
    if (last) payload.last_name = last;
    if (bday) payload.birthday = bday;
    return payload;
  };

  const FIELD_OF = { email: F.email, phone_number: F.phone_number, birthday: F.b_day, first_name: F.first_name, last_name: F.last_name };
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
  form.addEventListener('change', (e) => { if (e.target.closest('#birthdayField')) setErr(F.b_day, ''); });

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

/* ---------- Jalali calendar helpers ---------- */
function jalaliToGregorian(jy, jm, jd) {
  jy += 1595;
  let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd
    + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let gd = days + 1;
  const ml = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && gd > ml[gm]) gd -= ml[gm++];
  return [gy, gm, gd];
}

function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Esfand has 30 days only in leap years: 30 Esfand ≠ 1 Farvardin of next year
  return jalaliToGregorian(jy, 12, 30).join() === jalaliToGregorian(jy + 1, 1, 1).join() ? 29 : 30;
}
