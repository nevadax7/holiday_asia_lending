(function () {
  'use strict';

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function placeholderIconSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 12a8 8 0 0 1 16 0z"/><path d="M12 12v8"/><path d="M9 20c1-1 2-1 3 0s2 1 3 0"/></svg>';
  }

  var starIdCounter = 0;
  function starSVG() {
    var gid = 'starGrad' + (starIdCounter++);
    return '<svg class="hotel-star" viewBox="0 0 24 24" aria-hidden="true">' +
      '<defs><linearGradient id="' + gid + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#f7e6ba"/>' +
      '<stop offset="55%" stop-color="#c9a24a"/>' +
      '<stop offset="100%" stop-color="#96741f"/>' +
      '</linearGradient></defs>' +
      '<path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7L2 9.6l7.1-.6z" fill="url(#' + gid + ')" stroke="#8a6a24" stroke-width="0.5" stroke-linejoin="round"/>' +
      '</svg>';
  }
  function starsSVG(count) {
    var out = '';
    for (var i = 0; i < count; i++) out += starSVG();
    return out;
  }

  function withVersion(src) {
    var v = window.RESORTS_ASSET_VERSION;
    if (!v) return src;
    return src + (src.indexOf('?') === -1 ? '?' : '&') + 'v=' + encodeURIComponent(v);
  }

  function testImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = src;
    });
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderInline(text) {
    return escapeHTML(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function renderDescriptionBlocks(blocks, container) {
    blocks.forEach(function (block) {
      if (block.type === 'h2') {
        var h2 = document.createElement('h2');
        h2.innerHTML = renderInline(block.text);
        container.appendChild(h2);
      } else if (block.type === 'p') {
        var p = document.createElement('p');
        p.innerHTML = renderInline(block.text);
        container.appendChild(p);
      } else if (block.type === 'ul') {
        var ul = document.createElement('ul');
        block.items.forEach(function (item) {
          var li = document.createElement('li');
          li.innerHTML = renderInline(item);
          ul.appendChild(li);
        });
        container.appendChild(ul);
      }
    });
  }

  function renderDescription(hotel, container) {
    var blocks = (hotel.description && hotel.description.length) ? hotel.description : window.RESORTS_DEFAULT_DESCRIPTION;
    renderDescriptionBlocks(blocks, container);
  }

  // ---------- Lightbox: единый переиспользуемый компонент для всех отелей ----------
  var Lightbox = (function () {
    var overlay, imgEl, counterEl, closeBtn, prevBtn, nextBtn;
    var images = [];
    var altBase = '';
    var currentIndex = 0;
    var touchStartX = null;

    function build() {
      if (overlay) return;

      overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.hidden = true;

      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'lightbox-close';
      closeBtn.setAttribute('aria-label', 'Закрыть просмотр');
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', close);

      prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'lightbox-arrow lightbox-arrow--prev';
      prevBtn.setAttribute('aria-label', 'Предыдущая фотография');
      prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>';
      prevBtn.addEventListener('click', function (e) { e.stopPropagation(); show(currentIndex - 1); });

      nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'lightbox-arrow lightbox-arrow--next';
      nextBtn.setAttribute('aria-label', 'Следующая фотография');
      nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
      nextBtn.addEventListener('click', function (e) { e.stopPropagation(); show(currentIndex + 1); });

      var inner = document.createElement('div');
      inner.className = 'lightbox-inner';

      imgEl = document.createElement('img');
      imgEl.className = 'lightbox-image';
      inner.appendChild(imgEl);

      counterEl = document.createElement('div');
      counterEl.className = 'lightbox-counter';

      overlay.appendChild(closeBtn);
      overlay.appendChild(prevBtn);
      overlay.appendChild(inner);
      overlay.appendChild(nextBtn);
      overlay.appendChild(counterEl);

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
      });

      inner.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].clientX;
      }, { passive: true });

      inner.addEventListener('touchend', function (e) {
        if (touchStartX === null) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) < 40) return;
        if (dx < 0) show(currentIndex + 1); else show(currentIndex - 1);
      }, { passive: true });

      document.addEventListener('keydown', function (e) {
        if (!overlay || overlay.hidden) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') show(currentIndex - 1);
        else if (e.key === 'ArrowRight') show(currentIndex + 1);
      });

      document.body.appendChild(overlay);
    }

    function show(index) {
      var len = images.length;
      currentIndex = ((index % len) + len) % len;
      imgEl.src = withVersion(images[currentIndex]);
      imgEl.alt = altBase + ' — фотография ' + (currentIndex + 1);
      counterEl.textContent = (currentIndex + 1) + ' / ' + len;
    }

    function open(imgList, startIndex, name) {
      build();
      images = imgList;
      altBase = name || '';
      document.body.classList.add('lightbox-open');
      overlay.hidden = false;
      requestAnimationFrame(function () { overlay.classList.add('is-visible'); });
      show(startIndex);
    }

    function close() {
      if (!overlay) return;
      overlay.classList.remove('is-visible');
      document.body.classList.remove('lightbox-open');
      window.setTimeout(function () { if (overlay) overlay.hidden = true; }, 200);
    }

    return { open: open };
  })();

  // ---------- resorts.html: обложки стран в сетке направлений ----------
  function renderCountryCovers() {
    var medias = document.querySelectorAll('.country-card__media[data-cover]');
    medias.forEach(function (media) {
      var src = withVersion(media.getAttribute('data-cover'));
      testImage(src).then(function (ok) {
        if (!ok) return;
        var img = document.createElement('img');
        img.src = src;
        img.alt = media.getAttribute('aria-label') || '';
        img.loading = 'lazy';
        media.innerHTML = '';
        media.removeAttribute('role');
        media.removeAttribute('aria-label');
        media.appendChild(img);
      });
    });
  }

  // ---------- resort-country.html: список отелей выбранной страны ----------
  function renderCountryPage() {
    var gridEl = document.getElementById('hotel-grid');
    if (!gridEl) return;

    var data = window.RESORTS_DATA || {};
    var slug = getParam('c');
    var country = data[slug];
    var titleEl = document.getElementById('country-title');

    if (!country) {
      if (titleEl) titleEl.textContent = 'Направление не найдено';
      var msg = document.createElement('p');
      msg.style.textAlign = 'center';
      msg.style.color = 'var(--text-muted)';
      msg.textContent = 'Такого направления пока нет. Вернитесь к списку стран.';
      gridEl.appendChild(msg);
      return;
    }

    document.title = country.title + ' — курорты | IVC&HPA';
    if (titleEl) titleEl.textContent = country.title;

    country.hotels.forEach(function (hotel) {
      var a = document.createElement('a');
      a.className = 'hotel-card';
      a.href = 'resort-hotel.html?c=' + encodeURIComponent(slug) + '&h=' + encodeURIComponent(hotel.slug);

      var media = document.createElement('div');
      media.className = 'hotel-card__media';

      var body = document.createElement('div');
      body.className = 'hotel-card__body';

      var nameEl = document.createElement('p');
      nameEl.className = 'hotel-card__name';
      nameEl.textContent = hotel.name;

      var locEl = document.createElement('p');
      locEl.className = 'hotel-card__location';
      locEl.textContent = hotel.location;

      body.appendChild(nameEl);
      body.appendChild(locEl);
      a.appendChild(media);
      a.appendChild(body);
      gridEl.appendChild(a);

      var heroSrc = hotel.images && hotel.images[0];
      if (heroSrc) {
        var heroSrcVersioned = withVersion(heroSrc);
        testImage(heroSrcVersioned).then(function (ok) {
          if (ok) {
            var img = document.createElement('img');
            img.src = heroSrcVersioned;
            img.alt = hotel.name;
            img.loading = 'lazy';
            media.innerHTML = '';
            media.appendChild(img);
          } else {
            media.setAttribute('role', 'img');
            media.setAttribute('aria-label', 'Фотография ' + hotel.name + ' будет добавлена позже');
            media.innerHTML = placeholderIconSVG();
          }
        });
      } else {
        media.setAttribute('role', 'img');
        media.setAttribute('aria-label', 'Фотография ' + hotel.name + ' будет добавлена позже');
        media.innerHTML = placeholderIconSVG();
      }
    });
  }

  // ---------- resort-hotel.html: страница конкретного отеля ----------
  function renderHotelPage() {
    var galleryEl = document.getElementById('hotel-gallery');
    if (!galleryEl) return;

    var data = window.RESORTS_DATA || {};
    var countrySlug = getParam('c');
    var hotelSlug = getParam('h');
    var country = data[countrySlug];
    var hotel = country && country.hotels.filter(function (h) { return h.slug === hotelSlug; })[0];

    var nameEl = document.getElementById('hotel-name');
    var locEl = document.getElementById('hotel-location');
    var descEl = document.getElementById('hotel-description');
    var backEl = document.getElementById('back-to-hotels');

    if (!hotel) {
      if (nameEl) nameEl.textContent = 'Отель не найден';
      if (locEl) locEl.hidden = true;
      if (descEl) {
        var p = document.createElement('p');
        p.style.textAlign = 'center';
        p.style.color = 'var(--text-muted)';
        p.textContent = 'Такого объекта пока нет в списке. Вернитесь к странам.';
        descEl.appendChild(p);
      }
      if (backEl) { backEl.href = 'resorts.html'; backEl.textContent = '← Назад к странам'; }
      return;
    }

    document.title = hotel.name + ' — ' + hotel.location + ' | IVC&HPA';
    if (nameEl) nameEl.textContent = hotel.name;
    var starsEl = document.getElementById('hotel-stars');
    if (starsEl) starsEl.innerHTML = hotel.stars ? starsSVG(hotel.stars) : '';
    if (locEl) locEl.textContent = hotel.location;
    if (backEl) {
      backEl.href = 'resort-country.html?c=' + encodeURIComponent(countrySlug);
      backEl.textContent = '← Назад к отелям';
    }

    var images = (hotel.images && hotel.images.length) ? hotel.images : [];

    var mainMedia = document.createElement('div');
    mainMedia.className = 'hotel-gallery__main';
    galleryEl.appendChild(mainMedia);

    var thumbsWrap = document.createElement('div');
    thumbsWrap.className = 'hotel-gallery__thumbs';
    galleryEl.appendChild(thumbsWrap);

    function makePlaceholder(el) {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', 'Фотография ' + hotel.name + ' будет добавлена позже');
      el.innerHTML = placeholderIconSVG();
    }

    function makeSlot(el, index) {
      var src = images[index];
      if (!src) { makePlaceholder(el); return; }
      var srcVersioned = withVersion(src);
      testImage(srcVersioned).then(function (ok) {
        if (!ok) { makePlaceholder(el); return; }
        var img = document.createElement('img');
        img.src = srcVersioned;
        img.alt = hotel.name + ' — фотография ' + (index + 1);
        if (index > 0) img.loading = 'lazy';
        el.innerHTML = '';
        el.appendChild(img);
        el.classList.add('is-clickable');
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', 'Открыть фотографию ' + (index + 1) + ' из ' + images.length);
        var openThis = function () { Lightbox.open(images, index, hotel.name); };
        el.addEventListener('click', openThis);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThis(); }
        });
      });
    }

    makeSlot(mainMedia, 0);

    for (var i = 1; i < 5; i++) {
      var thumb = document.createElement('div');
      thumb.className = 'hotel-gallery__thumb';
      thumbsWrap.appendChild(thumb);
      makeSlot(thumb, i);
    }

    renderDescription(hotel, descEl);
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderCountryCovers();
    renderCountryPage();
    renderHotelPage();
  });
})();
