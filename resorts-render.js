(function () {
  'use strict';

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function placeholderIconSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 12a8 8 0 0 1 16 0z"/><path d="M12 12v8"/><path d="M9 20c1-1 2-1 3 0s2 1 3 0"/></svg>';
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
      media.setAttribute('role', 'img');
      media.setAttribute('aria-label', 'Фотография ' + hotel.name + ' будет добавлена позже');
      media.innerHTML = placeholderIconSVG();

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
    if (locEl) locEl.textContent = hotel.location;
    if (backEl) {
      backEl.href = 'resort-country.html?c=' + encodeURIComponent(countrySlug);
      backEl.textContent = '← Назад к отелям';
    }

    var mainMedia = document.createElement('div');
    mainMedia.className = 'hotel-gallery__main';
    mainMedia.setAttribute('role', 'img');
    mainMedia.setAttribute('aria-label', 'Фотография ' + hotel.name + ' будет добавлена позже');
    mainMedia.innerHTML = placeholderIconSVG();
    galleryEl.appendChild(mainMedia);

    var thumbsWrap = document.createElement('div');
    thumbsWrap.className = 'hotel-gallery__thumbs';
    for (var i = 0; i < 4; i++) {
      var thumb = document.createElement('div');
      thumb.className = 'hotel-gallery__thumb';
      thumb.setAttribute('role', 'img');
      thumb.setAttribute('aria-label', 'Фотография ' + hotel.name + ' будет добавлена позже');
      thumb.innerHTML = placeholderIconSVG();
      thumbsWrap.appendChild(thumb);
    }
    galleryEl.appendChild(thumbsWrap);

    var paragraphs = (hotel.description && hotel.description.length) ? hotel.description : window.RESORTS_DEFAULT_DESCRIPTION;
    paragraphs.forEach(function (text) {
      var para = document.createElement('p');
      para.textContent = text;
      descEl.appendChild(para);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderCountryPage();
    renderHotelPage();
  });
})();