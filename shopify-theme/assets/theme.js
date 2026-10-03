/* Vertex Theme — JavaScript principal (sem dependências) */
(function () {
  'use strict';

  var theme = window.theme || {};

  /* ---------- Utilidades ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function formatMoney(cents, format) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    format = format || theme.moneyFormat || 'R$ {{amount_with_comma_separator}}';
    var placeholder = /\{\{\s*(\w+)\s*\}\}/;

    function withDelimiters(number, precision, thousands, decimal) {
      precision = precision == null ? 2 : precision;
      thousands = thousands || ',';
      decimal = decimal || '.';
      if (isNaN(number) || number == null) return '0';
      number = (number / 100.0).toFixed(precision);
      var parts = number.split('.');
      var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      var centsPart = parts[1] ? decimal + parts[1] : '';
      return dollars + centsPart;
    }

    var match = format.match(placeholder);
    var value = '';
    switch (match ? match[1] : 'amount') {
      case 'amount': value = withDelimiters(cents, 2); break;
      case 'amount_no_decimals': value = withDelimiters(cents, 0); break;
      case 'amount_with_comma_separator': value = withDelimiters(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = withDelimiters(cents, 0, '.', ','); break;
      case 'amount_with_apostrophe_separator': value = withDelimiters(cents, 2, "'", '.'); break;
      case 'amount_with_space_separator': value = withDelimiters(cents, 2, ' ', ','); break;
      default: value = withDelimiters(cents, 2);
    }
    return format.replace(placeholder, value);
  }
  theme.formatMoney = formatMoney;

  /* ---------- Gavetas (menu e carrinho) ---------- */
  var lastFocus = null;

  function openDrawer(id) {
    var drawer = document.getElementById(id);
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('no-scroll');
    var close = $('[data-drawer-close].drawer__close', drawer);
    if (close) setTimeout(function () { close.focus(); }, 50);
  }

  function closeDrawers() {
    $$('.drawer.is-open').forEach(function (d) {
      d.classList.remove('is-open');
      d.setAttribute('aria-hidden', 'true');
    });
    document.documentElement.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-drawer-open]');
    if (opener) { e.preventDefault(); openDrawer(opener.getAttribute('data-drawer-open')); return; }
    if (e.target.closest('[data-drawer-close]')) { closeDrawers(); return; }

    var cartOpener = e.target.closest('[data-cart-open]');
    if (cartOpener && theme.cartType === 'drawer' && document.getElementById('cart-drawer')) {
      e.preventDefault();
      openDrawer('cart-drawer');
      return;
    }

    var searchToggle = e.target.closest('[data-search-toggle]');
    if (searchToggle) {
      var panel = $('[data-search-panel]');
      if (panel) {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) { var input = $('input[type="search"]', panel); if (input) input.focus(); }
      }
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawers();
  });

  /* ---------- Carrinho AJAX ---------- */
  var Cart = {
    sections: 'cart-drawer',

    render: function (sections) {
      if (!sections) return;
      var html = sections['cart-drawer'];
      if (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = $('[data-cart-drawer-inner]', doc);
        var current = $('[data-cart-drawer-inner]');
        if (fresh && current) current.innerHTML = fresh.innerHTML;
      }
    },

    updateCount: function () {
      return fetch(theme.routes.cart + '.js', { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          $$('[data-cart-count]').forEach(function (el) {
            el.textContent = cart.item_count;
            el.classList.toggle('is-empty', cart.item_count === 0);
          });
          return cart;
        });
    },

    add: function (form) {
      var formData = new FormData(form);
      formData.append('sections', Cart.sections);
      formData.append('sections_url', window.location.pathname);
      return fetch(theme.routes.cartAdd + '.js', {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
      }).then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || data.status) throw data;
          return data;
        });
      });
    },

    change: function (line, quantity) {
      return fetch(theme.routes.cartChange + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line: line, quantity: quantity, sections: Cart.sections, sections_url: window.location.pathname })
      }).then(function (r) { return r.json(); });
    }
  };
  theme.Cart = Cart;

  function showError(form, message) {
    var box = $('.form-error', form);
    if (!box) {
      box = document.createElement('p');
      box.className = 'form-error';
      form.appendChild(box);
    }
    box.textContent = message;
    setTimeout(function () { if (box) box.remove(); }, 5000);
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    var action = form.getAttribute('action') || '';
    if (action.indexOf('/cart/add') === -1) return;
    if (theme.cartType !== 'drawer' || !document.getElementById('cart-drawer')) return;
    e.preventDefault();

    var buttons = $$('[data-add-button]', form);
    var sticky = $('[data-sticky-atc-button]');
    if (sticky && form.id && sticky.closest('[data-sticky-atc]').getAttribute('data-form-id') === form.id) buttons.push(sticky);
    buttons.forEach(function (b) { b.classList.add('is-loading'); b.disabled = true; });

    Cart.add(form)
      .then(function (data) {
        Cart.render(data.sections);
        return Cart.updateCount();
      })
      .then(function () { openDrawer('cart-drawer'); })
      .catch(function (err) {
        showError(form, (err && (err.description || err.message)) || 'Erro ao adicionar ao carrinho.');
      })
      .then(function () {
        buttons.forEach(function (b) { b.classList.remove('is-loading'); b.disabled = false; });
      });
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-line-change]');
    if (!btn) return;
    e.preventDefault();
    var line = parseInt(btn.getAttribute('data-line-change'), 10);
    var qty = parseInt(btn.getAttribute('data-qty'), 10);
    var item = btn.closest('.cart-item');
    if (item) item.classList.add('is-loading');

    Cart.change(line, Math.max(qty, 0)).then(function (cart) {
      if ($('[data-main-cart]')) { window.location.reload(); return; }
      Cart.render(cart.sections);
      $$('[data-cart-count]').forEach(function (el) {
        el.textContent = cart.item_count;
        el.classList.toggle('is-empty', cart.item_count === 0);
      });
    });
  });

  document.addEventListener('change', function (e) {
    if (e.target.matches('[data-cart-note]')) {
      fetch(theme.routes.cart + '/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: e.target.value })
      });
    }
    if (e.target.matches('[data-auto-submit]')) {
      e.target.form.submit();
    }
  });

  /* ---------- Seletor de quantidade ---------- */
  document.addEventListener('click', function (e) {
    var minus = e.target.closest('[data-qty-minus]');
    var plus = e.target.closest('[data-qty-plus]');
    if (!minus && !plus) return;
    var input = $('[data-qty-input]', (minus || plus).closest('[data-qty]'));
    if (!input) return;
    var val = parseInt(input.value, 10) || 1;
    input.value = minus ? Math.max(1, val - 1) : val + 1;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------- Contador regressivo ---------- */
  if (!customElements.get('countdown-timer')) {
    customElements.define('countdown-timer', class extends HTMLElement {
      connectedCallback() {
        var raw = (this.getAttribute('data-end') || '').trim().replace(' ', 'T');
        this.end = new Date(raw).getTime();
        if (isNaN(this.end)) return;
        this.tick = this.tick.bind(this);
        this.tick();
        this.timer = setInterval(this.tick, 1000);
      }
      disconnectedCallback() { clearInterval(this.timer); }
      tick() {
        var diff = this.end - Date.now();
        if (diff <= 0) { this.hidden = true; clearInterval(this.timer); return; }
        this.hidden = false;
        var s = Math.floor(diff / 1000);
        var parts = {
          days: Math.floor(s / 86400),
          hours: Math.floor((s % 86400) / 3600),
          minutes: Math.floor((s % 3600) / 60),
          seconds: s % 60
        };
        for (var k in parts) {
          var el = this.querySelector('[data-' + k + ']');
          if (el) el.textContent = String(parts[k]).padStart(2, '0');
        }
      }
    });
  }

  /* ---------- Barra de avisos (modo rotativo) ---------- */
  if (!customElements.get('announcement-rotator')) {
    customElements.define('announcement-rotator', class extends HTMLElement {
      connectedCallback() {
        var slides = this.querySelectorAll('.announcement-bar__slide');
        if (slides.length < 2) return;
        var i = 0;
        this.timer = setInterval(function () {
          slides[i].classList.remove('is-active');
          i = (i + 1) % slides.length;
          slides[i].classList.add('is-active');
        }, 4000);
      }
      disconnectedCallback() { clearInterval(this.timer); }
    });
  }

  /* ---------- Previsão de entrega ---------- */
  function addBusinessDays(date, days) {
    var d = new Date(date);
    var added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      var day = d.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    return d;
  }

  function initDelivery(ctx) {
    $$('[data-delivery]', ctx).forEach(function (el) {
      var min = parseInt(el.getAttribute('data-min'), 10) || 7;
      var max = parseInt(el.getAttribute('data-max'), 10) || 15;
      var locale = document.documentElement.lang || 'pt-BR';
      var fmt = { day: '2-digit', month: 'short' };
      var from = $('[data-delivery-from]', el);
      var to = $('[data-delivery-to]', el);
      if (from) from.textContent = addBusinessDays(new Date(), min).toLocaleDateString(locale, fmt);
      if (to) to.textContent = addBusinessDays(new Date(), max).toLocaleDateString(locale, fmt);
    });
  }

  /* ---------- Página de produto ---------- */
  if (!customElements.get('product-page')) {
    customElements.define('product-page', class extends HTMLElement {
      connectedCallback() {
        var section = this.closest('[data-section]') || this.parentElement;
        var json = $('[data-product-json]', section);
        var inv = $('[data-inventory-json]', section);
        this.section = section;
        this.product = json ? JSON.parse(json.textContent) : null;
        this.inventory = inv ? JSON.parse(inv.textContent) : {};
        this.form = $('form.product-form', this);
        this.sticky = $('[data-sticky-atc]');

        this.initGallery();
        this.initOffers();
        this.initSticky();
        initDelivery(this);

        var picker = $('[data-variant-picker]', this);
        if (picker && this.product) {
          picker.addEventListener('change', this.onVariantChange.bind(this));
        }
      }

      /* Galeria */
      initGallery() {
        var track = $('[data-gallery-track]', this);
        if (!track) return;
        this.track = track;
        var thumbs = $$('[data-thumb]', this);
        var self = this;

        thumbs.forEach(function (t) {
          t.addEventListener('click', function () { self.goTo(parseInt(t.getAttribute('data-thumb'), 10)); });
        });
        var prev = $('[data-gallery-prev]', this);
        var next = $('[data-gallery-next]', this);
        if (prev) prev.addEventListener('click', function () { self.goTo(self.current() - 1); });
        if (next) next.addEventListener('click', function () { self.goTo(self.current() + 1); });

        var raf;
        track.addEventListener('scroll', function () {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(function () {
            var idx = self.current();
            thumbs.forEach(function (t, i) { t.classList.toggle('is-active', i === idx); });
            var active = thumbs[idx];
            if (active && active.parentElement) {
              var p = active.parentElement;
              var left = active.offsetLeft - p.clientWidth / 2 + active.clientWidth / 2;
              p.scrollTo({ left: left, behavior: 'smooth' });
            }
          });
        }, { passive: true });
      }

      current() {
        if (!this.track) return 0;
        return Math.round(this.track.scrollLeft / this.track.clientWidth);
      }

      goTo(index) {
        if (!this.track) return;
        var count = this.track.children.length;
        index = (index + count) % count;
        this.track.scrollTo({ left: index * this.track.clientWidth, behavior: 'smooth' });
      }

      goToMedia(mediaId) {
        if (!this.track || !mediaId) return;
        var slides = Array.prototype.slice.call(this.track.children);
        var idx = slides.findIndex(function (s) { return s.getAttribute('data-media-id') === String(mediaId); });
        if (idx > -1) this.goTo(idx);
      }

      /* Ofertas por quantidade */
      initOffers() {
        var offers = $('[data-offers]', this);
        if (!offers || !this.form) return;
        var qtyInput = $('[data-qty-input]', this.form);
        var sync = function () {
          var checked = $('input[type="radio"]:checked', offers);
          $$('.offer', offers).forEach(function (o) { o.classList.toggle('is-selected', o.contains(checked)); });
          if (checked && qtyInput) qtyInput.value = checked.value;
        };
        offers.addEventListener('change', sync);
        sync();
      }

      /* Barra fixa de compra */
      initSticky() {
        var sticky = this.sticky;
        var mainBtn = this.form ? $('[data-add-button]', this.form) : null;
        if (!sticky || !mainBtn) return;
        var form = this.form;
        var stickyBtn = $('[data-sticky-atc-button]', sticky);
        stickyBtn.addEventListener('click', function () {
          if (form.requestSubmit) form.requestSubmit(); else form.submit();
        });
        var io = new IntersectionObserver(function (entries) {
          var e = entries[0];
          var show = !e.isIntersecting && e.boundingClientRect.top < 0;
          sticky.classList.toggle('is-visible', show);
          sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
        });
        io.observe(mainBtn);
      }

      /* Troca de variante */
      onVariantChange() {
        var picker = $('[data-variant-picker]', this);
        var options = [];
        $$('fieldset', picker).forEach(function (fs, i) {
          var checked = $('input:checked', fs);
          options[i] = checked ? checked.value : null;
          var label = $('[data-option-label="' + i + '"]', picker);
          if (label && checked) label.textContent = checked.value;
        });

        var variant = this.product.variants.find(function (v) {
          return v.options.every(function (opt, i) { return opt === options[i]; });
        });

        this.updateButtons(variant);
        if (!variant) return;

        var idInput = $('[data-variant-id]', this.form);
        if (idInput) idInput.value = variant.id;

        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());

        this.updatePrices(variant);
        this.updateStock(variant);
        if (variant.featured_media) this.goToMedia(variant.featured_media.id);
      }

      updateButtons(variant) {
        var available = variant && variant.available;
        var buttons = $$('[data-add-button]', this.form);
        if (this.sticky) buttons.push($('[data-sticky-atc-button]', this.sticky));
        var mainBtn = $('[data-add-button]', this.form);
        var custom = mainBtn ? mainBtn.getAttribute('data-label') : '';
        buttons.forEach(function (b, i) {
          if (!b) return;
          b.disabled = !available;
          var text = $('[data-add-text]', b);
          if (!text) return;
          if (!variant) text.textContent = theme.strings.unavailable;
          else if (!available) text.textContent = theme.strings.soldOut;
          else text.textContent = (i === 0 && custom) ? custom : theme.strings.addToCart;
        });
      }

      updatePrices(variant) {
        var price = variant.price;
        var compare = variant.compare_at_price;
        var onSale = compare && compare > price;
        var scopes = [this];
        if (this.sticky) scopes.push(this.sticky);

        scopes.forEach(function (scope) {
          $$('[data-price]', scope).forEach(function (box) {
            box.classList.toggle('price--sale', !!onSale);
            var cur = $('[data-price-current]', box);
            var cmp = $('[data-price-compare]', box);
            var badge = $('[data-price-badge]', box);
            var savings = $('[data-price-savings]', box);
            if (cur) cur.textContent = formatMoney(price);
            if (cmp) { cmp.hidden = !onSale; if (onSale) cmp.textContent = formatMoney(compare); }
            if (badge) {
              badge.hidden = !onSale;
              if (onSale) badge.textContent = '-' + Math.round((compare - price) * 100 / compare) + '%';
            }
            if (savings) {
              savings.hidden = !onSale;
              var amt = $('[data-savings-amount]', savings);
              if (onSale && amt) amt.textContent = formatMoney(compare - price);
            }
          });
        });

        var inst = $('[data-installments]', this);
        if (inst) {
          var n = parseInt(inst.getAttribute('data-installments'), 10);
          var v = $('[data-installment-value]', inst);
          if (v) v.textContent = formatMoney(Math.floor(price / n));
        }
        var pix = $('[data-pix-discount]', this);
        if (pix) {
          var d = parseInt(pix.getAttribute('data-pix-discount'), 10);
          var pv = $('[data-pix-value]', pix);
          if (pv) pv.textContent = formatMoney(Math.floor(price * (100 - d) / 100));
        }
        $$('[data-offer-price]', this).forEach(function (el) {
          var q = parseInt(el.getAttribute('data-qty'), 10);
          var disc = parseInt(el.getAttribute('data-discount'), 10) || 0;
          el.textContent = formatMoney(Math.floor(price * q * (100 - disc) / 100));
        });
        $$('[data-offer-compare]', this).forEach(function (el) {
          var q = parseInt(el.getAttribute('data-qty'), 10);
          el.textContent = formatMoney(price * q);
        });
      }

      updateStock(variant) {
        var box = $('[data-stock]', this);
        if (!box) return;
        var threshold = parseInt(box.getAttribute('data-threshold'), 10) || 10;
        var info = this.inventory[variant.id] || { qty: 0, tracked: false };
        var low = info.tracked && info.qty > 0 && info.qty <= threshold;
        var lowEl = $('[data-stock-low]', box);
        var okEl = $('[data-stock-ok]', box);
        var barWrap = $('[data-stock-bar-wrap]', box);
        var bar = $('[data-stock-bar]', box);
        if (lowEl) {
          lowEl.hidden = !low;
          var t = $('[data-stock-low-text]', lowEl);
          if (t && low) t.textContent = t.textContent.replace(/\d+/, info.qty);
        }
        if (okEl) okEl.hidden = low || !variant.available;
        if (barWrap) barWrap.hidden = !low;
        if (bar && low) bar.style.width = Math.max(8, Math.round(info.qty * 100 / threshold)) + '%';
      }
    });
  }

  /* ---------- Animações ao rolar ---------- */
  function initAnimations() {
    if (!document.body.classList.contains('has-animations')) return;
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    $$('[data-animate]').forEach(function (el) {
      el.classList.add('will-animate');
      io.observe(el);
    });
  }

  /* ---------- Cabeçalho com sombra ao rolar ---------- */
  function initHeader() {
    var header = $('[data-header]');
    if (!header) return;
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function init() {
    initAnimations();
    initHeader();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* Editor de temas: reexecuta inicializações quando seções mudam */
  document.addEventListener('shopify:section:load', function (e) {
    initAnimations();
    initDelivery(e.target);
  });
})();
