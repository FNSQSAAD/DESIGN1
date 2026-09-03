/* ==========================================================================
   FINANCE SQUARE GROUP - CONCEPT 1 "ESTABLISHED"
   Site behaviour. Vanilla JS, no dependencies, no build step.
   Every module is guarded so a page that omits an element still runs clean.
   --------------------------------------------------------------------------
   MODULES
   1. header        sticky shadow + mega menu + mobile drawer
   2. reveal        scroll-in animation
   3. money         formatting + parsing helpers
   4. calculators   repayments / borrowing power / stamp duty (VIC)
   5. hero mini     hero borrowing-range estimator
   6. slider        testimonial carousel
   7. forms         validation + inline success (no network - prototype)
   8. mobilebar     sticky call/book bar
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- 1 */
  function header() {
    var hdr = $('.site-header');
    if (hdr) {
      var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Mega menu (click + hover, keyboard accessible)
    $$('[data-mega-trigger]').forEach(function (btn) {
      var menu = document.getElementById(btn.getAttribute('aria-controls'));
      if (!menu) return;
      var host = btn.closest('li');
      var open = function (state) {
        btn.setAttribute('aria-expanded', String(state));
        menu.setAttribute('data-open', String(state));
      };
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        open(btn.getAttribute('aria-expanded') !== 'true');
      });
      if (host) {
        var t;
        host.addEventListener('mouseenter', function () { clearTimeout(t); open(true); });
        host.addEventListener('mouseleave', function () { t = setTimeout(function () { open(false); }, 120); });
      }
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
      document.addEventListener('click', function (e) {
        if (host && !host.contains(e.target)) open(false);
      });
    });

    // Mobile drawer
    var burger = $('#burger'), drawer = $('#drawer'), scrim = $('#scrim'), close = $('#drawerClose');
    if (burger && drawer && scrim) {
      var setDrawer = function (state) {
        burger.setAttribute('aria-expanded', String(state));
        drawer.setAttribute('data-open', String(state));
        scrim.setAttribute('data-open', String(state));
        document.documentElement.style.overflow = state ? 'hidden' : '';
        if (state) { var f = drawer.querySelector('a,button'); if (f) f.focus(); }
      };
      burger.addEventListener('click', function () { setDrawer(burger.getAttribute('aria-expanded') !== 'true'); });
      scrim.addEventListener('click', function () { setDrawer(false); });
      if (close) close.addEventListener('click', function () { setDrawer(false); burger.focus(); });
      drawer.addEventListener('click', function (e) { if (e.target.tagName === 'A') setDrawer(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.getAttribute('data-open') === 'true') { setDrawer(false); burger.focus(); }
      });
    }
  }

  /* ---------------------------------------------------------------- 2 */
  function reveal() {
    var els = $$('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el, i) { el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + 'ms'; io.observe(el); });
  }

  /* ---------------------------------------------------------------- 3 */
  var num = function (v) {
    var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  };
  var money = function (n, dp) {
    dp = dp || 0;
    if (!isFinite(n)) n = 0;
    return '$' + n.toLocaleString('en-AU', { maximumFractionDigits: dp, minimumFractionDigits: dp });
  };
  var round = function (n, to) { return Math.round(n / to) * to; };

  // Live thousands-separator on money inputs
  function moneyInputs() {
    $$('input[data-money]').forEach(function (el) {
      var fmt = function () {
        var v = num(el.value);
        el.value = v ? v.toLocaleString('en-AU', { maximumFractionDigits: 0 }) : '';
      };
      el.addEventListener('blur', fmt);
      el.addEventListener('focus', function () { el.value = String(num(el.value) || ''); });
    });
  }

  /* ---------------------------------------------------------------- 4 */
  // Monthly principal-and-interest repayment
  function repayment(P, annualRatePc, years) {
    var r = (annualRatePc / 100) / 12, n = years * 12;
    if (P <= 0 || n <= 0) return 0;
    if (r <= 0) return P / n;
    return P * r / (1 - Math.pow(1 + r, -n));
  }

  // Victorian land transfer duty (general rates). Government charge, not a lender rate.
  // Source structure: SRO Victoria general rate table. Figures are indicative only.
  function vicDuty(value, isPPR, isFHB) {
    var d;
    if (isFHB && value <= 600000) return 0;
    if (isPPR && value > 130000 && value <= 550000) {
      d = 2870 + (value - 130000) * 0.05;
    } else if (value <= 25000) {
      d = value * 0.014;
    } else if (value <= 130000) {
      d = 350 + (value - 25000) * 0.024;
    } else if (value <= 960000) {
      d = 2870 + (value - 130000) * 0.06;
    } else if (value <= 2000000) {
      d = value * 0.055;
    } else {
      d = 110000 + (value - 2000000) * 0.065;
    }
    if (isFHB && value > 600000 && value <= 750000) {
      // Sliding first-home concession between 600k and 750k.
      d = d * ((value - 600000) / 150000);
    }
    return Math.max(0, d);
  }

  // Indicative borrowing range. All assumptions are placeholders shown on the page
  // and MUST be replaced with the licensee's published serviceability policy.
  var ASSUMPTIONS = {
    assessRate: 8.75,   // % p.a. assessment rate (lender rate + buffer)
    termYears: 30,
    hemSingle: 2650,    // $/month living expense floor, single, no dependants
    hemPerDependant: 520,
    coupleUplift: 1.55, // household expense multiplier for a couple
    incomeFactor: 0.72, // net-of-tax and shading factor applied to gross income
    selfEmployedShade: 0.90
  };

  function borrowingRange(o) {
    var monthlyIncome = (num(o.income) * (o.selfEmployed ? ASSUMPTIONS.selfEmployedShade : 1)) * ASSUMPTIONS.incomeFactor / 12;
    var expenses = ASSUMPTIONS.hemSingle * (o.couple ? ASSUMPTIONS.coupleUplift : 1)
      + ASSUMPTIONS.hemPerDependant * num(o.dependants);
    var surplus = monthlyIncome - expenses - num(o.commitments);
    if (surplus <= 0) return { low: 0, high: 0, surplus: surplus };
    var r = (ASSUMPTIONS.assessRate / 100) / 12, n = ASSUMPTIONS.termYears * 12;
    var capacity = surplus * (1 - Math.pow(1 + r, -n)) / r;
    return {
      low: Math.max(0, round(capacity * 0.9, 5000)),
      high: Math.max(0, round(capacity * 1.05, 5000)),
      surplus: surplus
    };
  }

  function calculators() {
    var root = $('#calc');
    if (!root) return;

    // ---- tabs
    var tabs = $$('.calc-tab', root);
    var panels = $$('.calc-panel', root);
    function select(id) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('aria-controls') === id;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) { p.hidden = p.id !== id; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t.getAttribute('aria-controls')); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var next = tabs[(i + d + tabs.length) % tabs.length];
        next.focus(); select(next.getAttribute('aria-controls'));
      });
    });
    if (tabs.length) select(tabs[0].getAttribute('aria-controls'));

    // ---- repayments
    var rpAmount = $('#rpAmount'), rpRate = $('#rpRate'), rpTerm = $('#rpTerm'),
      rpTermOut = $('#rpTermOut'), rpFreqBar = $('#rpFreq'),
      rpVal = $('#rpVal'), rpFreqLbl = $('#rpFreqLbl'),
      rpTotalInt = $('#rpTotalInt'), rpTotalPaid = $('#rpTotalPaid'), rpMonthly = $('#rpMonthly');
    var freq = 'monthly';

    function calcRepay() {
      if (!rpAmount) return;
      var P = num(rpAmount.value), rate = num(rpRate.value), yrs = num(rpTerm.value);
      if (rpTermOut) rpTermOut.textContent = yrs + ' years';
      var m = repayment(P, rate, yrs);
      var per = freq === 'monthly' ? m : freq === 'fortnightly' ? m * 12 / 26 : m * 12 / 52;
      if (rpVal) rpVal.textContent = money(per, 0);
      if (rpFreqLbl) rpFreqLbl.textContent = 'per ' + (freq === 'monthly' ? 'month' : freq === 'fortnightly' ? 'fortnight' : 'week');
      var total = m * yrs * 12;
      if (rpMonthly) rpMonthly.textContent = money(m, 0);
      if (rpTotalPaid) rpTotalPaid.textContent = money(total, 0);
      if (rpTotalInt) rpTotalInt.textContent = money(Math.max(0, total - P), 0);
    }
    [rpAmount, rpRate, rpTerm].forEach(function (el) {
      if (el) { el.addEventListener('input', calcRepay); el.addEventListener('change', calcRepay); }
    });
    if (rpFreqBar) {
      $$('.seg', rpFreqBar).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('.seg', rpFreqBar).forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
          b.setAttribute('aria-checked', 'true');
          freq = b.dataset.freq;
          calcRepay();
        });
      });
    }
    calcRepay();

    // ---- borrowing power
    var bpIncome = $('#bpIncome'), bpCommit = $('#bpCommit'), bpDeps = $('#bpDeps'),
      bpSelf = $('#bpSelf'), bpHouse = $('#bpHouse'),
      bpLow = $('#bpLow'), bpHigh = $('#bpHigh'), bpNote = $('#bpNote'), bpSurplus = $('#bpSurplus');
    var couple = false;

    function calcBorrow() {
      if (!bpIncome) return;
      var res = borrowingRange({
        income: bpIncome.value,
        commitments: bpCommit ? bpCommit.value : 0,
        dependants: bpDeps ? bpDeps.value : 0,
        selfEmployed: bpSelf ? bpSelf.checked : false,
        couple: couple
      });
      if (res.high <= 0) {
        if (bpLow) bpLow.textContent = '—';
        if (bpHigh) bpHigh.textContent = '';
        if (bpNote) bpNote.textContent = 'On these figures the assessment leaves no monthly surplus. That is common and fixable — it is exactly the conversation to have with a broker.';
      } else {
        if (bpLow) bpLow.textContent = money(res.low, 0);
        if (bpHigh) bpHigh.textContent = ' – ' + money(res.high, 0);
        if (bpNote) bpNote.textContent = 'An indicative range only. Lenders assess income, expenses and credit history differently, so your real figure may sit outside this range.';
      }
      if (bpSurplus) bpSurplus.textContent = money(Math.max(0, res.surplus), 0);
    }
    [bpIncome, bpCommit, bpDeps].forEach(function (el) { if (el) el.addEventListener('input', calcBorrow); });
    if (bpSelf) bpSelf.addEventListener('change', calcBorrow);
    if (bpHouse) {
      $$('.seg', bpHouse).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('.seg', bpHouse).forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
          b.setAttribute('aria-checked', 'true');
          couple = b.dataset.house === 'couple';
          calcBorrow();
        });
      });
    }
    calcBorrow();

    // ---- stamp duty (VIC)
    var sdValue = $('#sdValue'), sdPPR = $('#sdPPR'), sdFHB = $('#sdFHB'),
      sdVal = $('#sdVal'), sdTransfer = $('#sdTransfer'), sdMortgage = $('#sdMortgage'), sdTotal = $('#sdTotal'), sdNote = $('#sdNote');

    function calcDuty() {
      if (!sdValue) return;
      var v = num(sdValue.value);
      var ppr = sdPPR ? sdPPR.checked : false;
      var fhb = sdFHB ? sdFHB.checked : false;
      var duty = vicDuty(v, ppr, fhb);
      var transfer = v <= 1000000 ? 110 : 130;   // indicative land registry transfer fee
      var mortgageFee = 130;                      // indicative mortgage registration fee
      if (sdVal) sdVal.textContent = money(duty, 0);
      if (sdTransfer) sdTransfer.textContent = money(transfer, 0);
      if (sdMortgage) sdMortgage.textContent = money(mortgageFee, 0);
      if (sdTotal) sdTotal.textContent = money(duty + transfer + mortgageFee, 0);
      if (sdNote) {
        sdNote.textContent = fhb && v <= 600000
          ? 'On these figures a first-home buyer exemption would apply to the duty.'
          : fhb && v <= 750000
            ? 'On these figures a partial first-home buyer concession would apply.'
            : ppr
              ? 'Principal place of residence rates applied where eligible.'
              : 'General rates applied.';
      }
    }
    if (sdValue) sdValue.addEventListener('input', calcDuty);
    [sdPPR, sdFHB].forEach(function (el) { if (el) el.addEventListener('change', calcDuty); });
    calcDuty();

    // ---- extra repayments
    var xrAmount = $('#xrAmount'), xrRate = $('#xrRate'), xrTerm = $('#xrTerm'), xrTermOut = $('#xrTermOut'),
      xrExtra = $('#xrExtra'), xrSaved = $('#xrSaved'), xrYears = $('#xrYears'),
      xrBase = $('#xrBase'), xrNew = $('#xrNew'), xrNote = $('#xrNote');

    function calcExtra() {
      if (!xrAmount) return;
      var P = num(xrAmount.value), rate = num(xrRate.value), yrs = num(xrTerm.value), extra = num(xrExtra.value);
      if (xrTermOut) xrTermOut.textContent = yrs + ' years';
      var base = repayment(P, rate, yrs);
      var pay = base + extra;
      var r = (rate / 100) / 12;
      var months = 0, bal = P, interest = 0;
      var baseInterest = base * yrs * 12 - P;
      while (bal > 0 && months < 1200) {
        var i = bal * r;
        interest += i;
        bal = bal + i - pay;
        months++;
      }
      var yearsNew = months / 12;
      if (xrBase) xrBase.textContent = money(base, 0);
      if (xrNew) xrNew.textContent = money(pay, 0);
      if (xrYears) xrYears.textContent = extra > 0 ? (Math.floor(yrs - yearsNew) + ' yr ' + Math.round(((yrs - yearsNew) % 1) * 12) + ' mo') : '—';
      if (xrSaved) xrSaved.textContent = extra > 0 ? money(Math.max(0, baseInterest - interest), 0) : '—';
      if (xrNote) {
        xrNote.textContent = extra > 0
          ? 'Paying ' + money(extra, 0) + ' extra each month would clear the loan in about ' + yearsNew.toFixed(1) + ' years on these assumptions.'
          : 'Add an extra monthly amount to see the effect.';
      }
    }
    [xrAmount, xrRate, xrTerm, xrExtra].forEach(function (el) {
      if (el) { el.addEventListener('input', calcExtra); el.addEventListener('change', calcExtra); }
    });
    calcExtra();
  }

  /* ---------------------------------------------------------------- 5 */
  function heroMini() {
    var inc = $('#hmIncome'), dep = $('#hmDeposit'), out = $('#hmOut'), sub = $('#hmSub');
    if (!inc || !out) return;
    var run = function () {
      var res = borrowingRange({ income: inc.value, commitments: 0, dependants: 0, selfEmployed: false, couple: false });
      var deposit = num(dep && dep.value);
      if (res.high <= 0) {
        out.textContent = '—';
        if (sub) sub.textContent = 'Add a household income to see a range.';
        return;
      }
      out.textContent = money(res.low, 0) + ' – ' + money(res.high, 0);
      if (sub) {
        sub.textContent = deposit > 0
          ? 'With your deposit, a purchase price of roughly ' + money(res.low + deposit, 0) + ' – ' + money(res.high + deposit, 0) + ' before costs.'
          : 'Indicative borrowing range. Add a deposit to see a purchase price.';
      }
    };
    [inc, dep].forEach(function (el) { if (el) el.addEventListener('input', run); });
    run();
  }

  /* ---------------------------------------------------------------- 6 */
  function slider() {
    var root = $('#tslider');
    if (!root) return;
    var track = $('.ttrack', root);
    var slides = $$('.tslide', root);
    var dotsWrap = $('.tdots', root);
    var prev = $('[data-tprev]', root), next = $('[data-tnext]', root);
    if (!track || slides.length < 2) return;
    var i = 0, timer = null;

    var dots = slides.map(function (_, n) {
      var b = document.createElement('button');
      b.className = 'tdot';
      b.type = 'button';
      b.setAttribute('aria-label', 'Show story ' + (n + 1));
      b.addEventListener('click', function () { go(n); });
      if (dotsWrap) dotsWrap.appendChild(b);
      return b;
    });

    function go(n) {
      i = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-100 * i) + '%)';
      dots.forEach(function (d, k) { d.setAttribute('aria-current', String(k === i)); });
      slides.forEach(function (s, k) { s.setAttribute('aria-hidden', String(k !== i)); });
    }
    if (prev) prev.addEventListener('click', function () { go(i - 1); restart(); });
    if (next) next.addEventListener('click', function () { go(i + 1); restart(); });

    function start() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = setInterval(function () { go(i + 1); }, 7000);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);

    // touch swipe
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) go(i + (dx < 0 ? 1 : -1));
      x0 = null; start();
    });

    go(0); start();
  }

  /* ---------------------------------------------------------------- 7 */
  function forms() {
    $$('form[data-validate]').forEach(function (form) {
      var done = document.getElementById(form.dataset.done || '');
      form.setAttribute('novalidate', 'novalidate');

      function fieldError(el, msg) {
        var slot = form.querySelector('[data-err="' + el.name + '"]');
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (slot) slot.textContent = msg || '';
        return !msg;
      }

      function validateField(el) {
        var v = (el.value || '').trim();
        if (el.type === 'checkbox') return fieldError(el, el.checked ? '' : 'Please tick to continue.');
        if (el.required && !v) return fieldError(el, 'This one is required.');
        if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return fieldError(el, 'That email does not look right.');
        if (el.dataset.tel === 'au' && v) {
          var digits = v.replace(/\D/g, '');
          if (!/^0?4\d{8}$/.test(digits) && !/^614\d{8}$/.test(digits)) {
            return fieldError(el, 'Please use an Australian mobile, e.g. 0412 345 678.');
          }
        }
        return fieldError(el, '');
      }

      $$('input,select,textarea', form).forEach(function (el) {
        el.addEventListener('blur', function () { validateField(el); });
        el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') validateField(el); });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true, first = null;
        $$('input,select,textarea', form).forEach(function (el) {
          if (el.type === 'hidden' || el.disabled) return;
          if (!validateField(el)) { ok = false; if (!first) first = el; }
        });
        if (!ok) { if (first) first.focus(); return; }

        // PROTOTYPE ONLY - nothing is transmitted.
        // In production this posts to the GoHighLevel inbound webhook as a
        // JSON body (never a query string) with: firstName, mobile, email,
        // goal, timing, consent, and the calculator range if one was shown.
        var payload = {};
        new FormData(form).forEach(function (v, k) { payload[k] = v; });
        if (window.console) console.log('[FNSQ prototype] would POST:', payload);

        form.hidden = true;
        if (done) {
          done.hidden = false;
          done.setAttribute('tabindex', '-1');
          done.focus();
          done.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      });
    });
  }

  /* ---------------------------------------------------------------- 8 */
  function mobilebar() {
    var bar = $('#mobilebar');
    if (!bar) return;
    var anchor = $('[data-hero]') || $('.hero') || $('.pagehead');
    var show = function (s) { bar.setAttribute('data-show', String(s)); };
    if (!anchor || !('IntersectionObserver' in window)) { show(true); return; }
    new IntersectionObserver(function (en) { show(!en[0].isIntersecting); }, { threshold: 0 }).observe(anchor);
    // Hide while typing so the bar never covers a field on a phone.
    document.addEventListener('focusin', function (e) {
      if (e.target.matches('input,select,textarea')) show(false);
    });
    document.addEventListener('focusout', function () {
      setTimeout(function () {
        if (!document.activeElement || !document.activeElement.matches('input,select,textarea')) {
          if (anchor.getBoundingClientRect().bottom < 0) show(true);
        }
      }, 60);
    });
  }

  /* ---------------------------------------------------------------- go */
  function init() {
    header(); reveal(); moneyInputs(); calculators(); heroMini(); slider(); forms(); mobilebar();
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
