// LIF concept 2: menu, header state, inline reels, gentle reveal and the 3-step apply flow.
(function () {
  var NL = String.fromCharCode(10);
  var d = document, root = d.documentElement;
  root.classList.add('js');

  // Menu
  var btn = d.querySelector('.menu-btn');
  if (btn) btn.addEventListener('click', function () {
    var open = root.classList.toggle('menu-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) { root.classList.remove('menu-open'); btn && btn.setAttribute('aria-expanded', 'false'); btn && btn.focus(); }
  });

  // Header border once the page scrolls
  var hdr = d.querySelector('.hdr');
  var onScroll = function () { hdr && hdr.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Reveal: single blocks, staggered groups, photo zoom and counting numbers
  function count(el) {
    var end = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '', t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / 1200, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * e).toLocaleString('en-GB') + suf;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var els = d.querySelectorAll('.rv,.stagger,.zoom,[data-count]');
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !calm) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        if (el.hasAttribute('data-count')) count(el); else el.classList.add('in');
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { root.classList.add('no-io'); els.forEach(function (el) { el.classList.add('in'); }); }

  // Reels play inline on tap; only one plays at a time
  d.querySelectorAll('.reel[data-src]').forEach(function (fig) {
    var b = fig.querySelector('button');
    if (!b) return;
    b.hidden = false;
    b.addEventListener('click', function () {
      d.querySelectorAll('.reel video').forEach(function (v) { v.pause(); });
      var v = fig.querySelector('video');
      if (!v) {
        v = d.createElement('video');
        v.src = fig.getAttribute('data-src');
        v.setAttribute('playsinline', ''); v.controls = true; v.preload = 'auto';
        v.poster = fig.querySelector('img').src;
        fig.insertBefore(v, b);
      }
      fig.classList.add('playing');
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      v.focus();
    });
  });

  // Counselling and application forms. Send to the Google Sheet when an endpoint is set,
  // otherwise open WhatsApp with every answer filled in.
  var LABELS = { name: 'Full name', email: 'Email', phone: 'Contact number', school: 'School or college', qual: 'Current qualification', grades: 'Latest grades', date: 'Preferred counselling date', pathway: 'Preferred pathway' };
  d.querySelectorAll('form.lead-form').forEach(function (form) {
    var dateEl = form.elements.date;
    if (dateEl) { var t = new Date(); t.setDate(t.getDate() + 1); dateEl.min = t.toISOString().slice(0, 10); }
    function val(n) { var el = form.elements[n]; return el ? (el.value || '').trim() : ''; }
    function radio(n) { var el = form.querySelector('input[name=' + n + ']:checked'); return el ? el.value : ''; }
    function node(name) { var el = form.elements[name]; return el.length && !el.tagName ? el[0] : el; }
    function mark(name, ok) { node(name).closest('.field').classList.toggle('invalid', !ok); return ok; }
    var all = {
      name: function () { return val('name').length >= 2; },
      email: function () { var v = val('email'), at = v.indexOf('@'), dot = v.lastIndexOf('.'); return v.indexOf(' ') < 0 && at > 0 && dot > at + 1 && dot < v.length - 2; },
      phone: function () { var n = val('phone').replace(/[^0-9]/g, ''); return n.length >= 10 && n.length <= 13; },
      school: function () { return val('school').length >= 2; },
      qual: function () { return !!radio('qual'); },
      grades: function () { return val('grades').length >= 1; },
      date: function () { return !!val('date') && (!dateEl.min || val('date') >= dateEl.min); },
      pathway: function () { return !!radio('pathway'); }
    };
    var keys = Object.keys(all).filter(function (k) { return !!form.elements[k]; });
    function get(k) { return (k === 'qual' || k === 'pathway') ? radio(k) : val(k); }
    function valid() {
      var bad = null;
      keys.forEach(function (k) { var ok = all[k](); mark(k, ok); if (!ok && !bad) bad = node(k); });
      if (bad) { bad.focus(); return false; }
      return true;
    }
    keys.forEach(function (k) {
      var el = form.elements[k], list = el.length && !el.tagName ? el : [el];
      Array.prototype.forEach.call(list, function (x) {
        var re = function () { if (node(k).closest('.field').classList.contains('invalid')) mark(k, all[k]()); };
        x.addEventListener('input', re); x.addEventListener('change', re);
      });
    });
    function whatsapp() {
      var msg = form.getAttribute('data-intro') || '';
      keys.forEach(function (k) { msg += NL + LABELS[k] + ': ' + get(k); });
      return 'https://wa.me/' + form.getAttribute('data-wa') + '?text=' + encodeURIComponent(msg);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.website && form.elements.website.value) return; // spam trap
      if (!valid()) return;
      var url = form.getAttribute('data-endpoint');
      if (!url) { window.location.href = whatsapp(); return; }
      var body = new URLSearchParams(); body.append('form', form.getAttribute('data-form')); body.append('page', location.pathname);
      keys.forEach(function (k) { body.append(LABELS[k], get(k)); });
      var btnS = form.querySelector('[type=submit]'); btnS.disabled = true;
      fetch(url, { method: 'POST', mode: 'no-cors', body: body }).then(function () {
        form.hidden = true; var s = d.getElementById('sent'); s.hidden = false; s.focus();
      }).catch(function () { window.location.href = whatsapp(); });
    });
  });

  // Readiness check: four taps, then an honest result with next steps
  d.querySelectorAll('.rc-card').forEach(function (card) {
    var dataEl = d.getElementById('rc-data'); if (!dataEl) return;
    var DATA = JSON.parse(dataEl.textContent);
    var qs = [].slice.call(card.querySelectorAll('.rc-q')), res = card.querySelector('.rc-result'),
        back = card.querySelector('.rc-back'), bar = card.querySelector('.rc-bar span'), cur = 0;
    function esc(t) { var x = d.createElement('div'); x.textContent = t; return x.innerHTML; }
    function pick(i) { var el = qs[i].querySelector('input:checked'); return el ? { v: el.value, l: el.getAttribute('data-label') } : null; }
    function show(i) {
      cur = i;
      qs.forEach(function (q, k) { q.hidden = k !== i; });
      res.hidden = i < qs.length;
      back.hidden = i === 0 || i >= qs.length;
      bar.style.width = (Math.min(i, qs.length) / qs.length * 100) + '%';
      if (i < qs.length) { var f = qs[i].querySelector('input:checked') || qs[i].querySelector('input'); if (f && card.contains(d.activeElement)) f.focus(); }
    }
    function verdict(now, grades) {
      if (now === 'a') return ['The foundation year could be your faster route', 'If AS or A Levels aren’t going the way you hoped, the foundation year takes you to Year 1 of a degree in 12 months. We’ll look at your completed qualifications together.'];
      if (now === 'wait') return ['You can start now, while you wait', 'Your place depends on your final results, but there’s no need to wait to plan. Talk to us now and we’ll be ready when your results arrive.'];
      if (grades === 'strong') return ['You look ready for the foundation year', 'With five or more Cs at O Level (including English and Maths), or 55% or above in Matric, you meet the usual entry requirements.'];
      if (grades === 'close') return ['You may well be ready. Let’s check together', 'You’re close to the usual entry requirements. A short counselling session will tell you exactly where you stand.'];
      return ['Let’s find out together', 'Not sure about your results yet? That’s fine. Bring what you have to a free counselling session and we’ll work it out with you.'];
    }
    function result() {
      var a = qs.map(function (q, i) { return pick(i); });
      var v = verdict(a[0].v, a[1].v), path = a[2].v, reg = a[3].v, h = '';
      h += '<span class="rc-tag">Your result</span><h3>' + esc(v[0]) + '</h3><p>' + esc(v[1]) + '</p>';
      var units = path === 'any' ? null : DATA.units[path];
      h += '<div class="rc-box"><b>What you’d study</b>';
      h += units ? '<p>Four core units in English, Maths and research skills, then the ' + esc(path) + ' pathway: ' + esc(units.join(', ')) + '.</p>'
                 : '<p>Four core units in English, Maths and research skills, then a pathway in Business, Computing, Law or Accounting. We’ll help you choose.</p>';
      h += '</div>';
      var r = DATA.regions[reg];
      h += '<div class="rc-box"><b>Where it could take you</b>';
      if (r) {
        h += '<p class="rc-fl">' + r.flags.map(function (c) { return '<img src="/assets/flags/' + c + '.svg" width="24" height="16" alt="">'; }).join('') + esc(r.name) + '</p><p>' + esc(r.unis) + ', and more.</p>';
      } else h += '<p>120+ universities and institutions in the UK, Australia, Canada, Malaysia, the UAE, Europe and beyond.</p>';
      h += '</div>';
      var msg = 'Hi LIF, I took the readiness check on your website.';
      ['Where I am now', 'My results', 'Area of interest', 'Where I would like to study'].forEach(function (k, i) { msg += String.fromCharCode(10) + k + ': ' + a[i].l; });
      h += '<div class="actions"><a class="btn btn-apply" href="/counselling">Book a counselling session</a></div>';
      h += '<p class="rc-alt"><a href="https://wa.me/' + card.getAttribute('data-wa') + '?text=' + encodeURIComponent(msg) + '" rel="noopener" target="_blank">Send my answers on WhatsApp</a> &middot; <button type="button" class="rc-again">Start again</button></p>';
      h += '<p class="rc-fine">A guide only. Every application is assessed individually.</p>';
      res.innerHTML = h;
      res.querySelector('.rc-again').addEventListener('click', function () { card.querySelector('form').reset(); show(0); qs[0].querySelector('input').focus(); });
    }
    qs.forEach(function (q, i) {
      q.addEventListener('change', function () {
        setTimeout(function () {
          if (i + 1 < qs.length) show(i + 1);
          else { result(); show(qs.length); res.focus(); }
        }, 220);
      });
    });
    back.addEventListener('click', function () { show(Math.max(cur - 1, 0)); });
    show(0);
  });

  // Apple-style scroll: photos open up and settle as they enter; hero text eases away
  var scs = [].slice.call(d.querySelectorAll('.sc')), fade = d.querySelector('[data-fade]'), tick = false;
  function upd() {
    tick = false; var h = innerHeight;
    scs.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.top > h || r.bottom < 0) return;
      var p = (h - r.top) / (h * 0.75); p = p < 0 ? 0 : p > 1 ? 1 : p;
      el.style.setProperty('--p', p.toFixed(3));
    });
    if (fade) { var k = Math.min(scrollY / (h * 0.7), 1); fade.style.setProperty('--o', (1 - k * 0.9).toFixed(3)); fade.style.setProperty('--y', (k * -50).toFixed(1) + 'px'); }
  }
  if (!calm) {
    scs.forEach(function (el) { el.style.setProperty('--p', 0); });
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }
})();
