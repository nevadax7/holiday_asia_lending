(function () {
  'use strict';

  function testImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = src;
    });
  }

  function resolveLogo() {
    var imgEl = document.getElementById('brand-logo-img');
    var fallbackEl = document.getElementById('brand-logo-fallback');
    if (!imgEl || !fallbackEl) return;
    testImage(imgEl.getAttribute('data-src')).then(function (ok) {
      if (ok) {
        imgEl.src = imgEl.getAttribute('data-src');
        imgEl.hidden = false;
        fallbackEl.hidden = true;
      } else {
        imgEl.hidden = true;
        fallbackEl.hidden = false;
      }
    });
  }

    // Простой полноэкранный просмотр одной картинки — переиспользует те же
  // CSS-классы, что и лайтбокс фото отелей в resorts-render.js, но без
  // стрелок/счётчика (тут всего одно изображение). Картинка открывается
  // как обычный <img>, поэтому на телефоне доступно "нажать и удерживать →
  // Сохранить изображение", а на компьютере — клик правой кнопкой мыши.
  function openSimpleLightbox(src, alt) {
    var overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Закрыть просмотр');
    closeBtn.innerHTML = '&times;';

    var inner = document.createElement('div');
    inner.className = 'lightbox-inner';

    var img = document.createElement('img');
    img.className = 'lightbox-image';
    img.src = src;
    img.alt = alt || '';
    inner.appendChild(img);

    overlay.appendChild(closeBtn);
    overlay.appendChild(inner);

    function close() {
      overlay.classList.remove('is-visible');
      document.body.classList.remove('lightbox-open');
      document.removeEventListener('keydown', onKeydown);
      setTimeout(function () { overlay.remove(); }, 200);
    }
    function onKeydown(e) {
      if (e.key === 'Escape') close();
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', onKeydown);

    document.body.classList.add('lightbox-open');
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('is-visible'); });
  }

  function resolveInviteImage() {
    var wrap = document.getElementById('invite-media');
    if (!wrap) return;
    var src = wrap.getAttribute('data-src');
    testImage(src).then(function (ok) {
      if (ok) {
        wrap.innerHTML = '<img src="' + src + '" alt="Приглашение Naman Retreat">';
        wrap.classList.add('invite-media--clickable');
        wrap.setAttribute('role', 'button');
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('aria-label', 'Открыть изображение приглашения на весь экран');
        var openThis = function () { openSimpleLightbox(src, 'Приглашение Naman Retreat'); };
        wrap.addEventListener('click', openThis);
        wrap.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThis(); }
        });
      }
    });
  }

  function resolveBackground() {
    var el = document.getElementById('bg-layer');
    if (!el) return;
    var src = el.getAttribute('data-src');
    testImage(src).then(function (ok) {
      if (ok) el.style.backgroundImage = 'url("' + src + '")';
      else el.classList.add('bg-layer--placeholder');
    });
  }

  // ---------- invitation page: participation number + save-to-gallery ----------

  // Готовый дизайн карточки (фото приглашения + брендированный блок с номером
  // и описанием) — цельная картинка, которую готовит сам заказчик и кладёт
  // в корень репозитория под этим именем. Код только "впечатывает" сгенерированный
  // номер поверх неё в нужном месте — саму карточку кодом больше не рисуем.
  var TICKET_TEMPLATE_SRC = 'ticket-template.png';

  // Координаты места под номер заданы в ДОЛЯХ от ширины/высоты картинки
  // (0..1), чтобы работать на любом реальном размере файла. Если после
  // сохранения номер окажется не совсем на своём месте — присылайте
  // скриншот результата, эти четыре числа поправляются за одну правку.
  var TICKET_NUMBER_X_FRAC = 0.30;   // по горизонтали: центр под "ВАШ НОМЕР УЧАСТНИКА"
  var TICKET_NUMBER_Y_FRAC = 0.805;  // по вертикали
  var TICKET_NUMBER_MAX_WIDTH_FRAC = 0.36; // не шире левой колонки
  var TICKET_NUMBER_FONT_SIZE_FRAC = 0.078; // крупнее прежнего (было 0.062)
  var TICKET_NUMBER_COLOR = '#0c4a4d'; // тот же цвет, что и "HOLIDAY ASIA" на карточке

  function generateTicketNumber() {
    var length = 5 + Math.floor(Math.random() * 3); // 5, 6 or 7 digits
    var digits = '';
    for (var i = 0; i < length; i++) {
      digits += Math.floor(Math.random() * 10);
    }
    return digits;
  }

  // Шаблон грузим ЗАРАНЕЕ (как только открылась страница), а не в момент
  // клика по "Сохранить" — иначе пока грузится картинка 1-2МБ, браузер может
  // решить, что клик пользователя "устарел", и молча заблокировать окно
  // "Поделиться/Сохранить" без единой ошибки на экране.
  var preloadedTemplateImg = null;
  var preloadedTemplateFailed = false;

  function preloadTicketTemplate() {
    var img = new Image();
    img.onload = function () { preloadedTemplateImg = img; };
    img.onerror = function () { preloadedTemplateFailed = true; };
    img.src = TICKET_TEMPLATE_SRC;
  }

  function paintTicketImage(canvas, ctx, img, number, callback) {
    try {
      var W = img.naturalWidth;
      var H = img.naturalHeight;
      canvas.width = W;
      canvas.height = H;
      ctx.drawImage(img, 0, 0, W, H);

      var centerX = W * TICKET_NUMBER_X_FRAC;
      var centerY = H * TICKET_NUMBER_Y_FRAC;
      var maxWidth = W * TICKET_NUMBER_MAX_WIDTH_FRAC;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = TICKET_NUMBER_COLOR;

      var fontSize = Math.round(W * TICKET_NUMBER_FONT_SIZE_FRAC);
      var fits = false;
      while (!fits && fontSize > 20) {
        ctx.font = '800 ' + fontSize + 'px Inter, Arial, sans-serif';
        if (ctx.measureText(number).width <= maxWidth) fits = true;
        else fontSize -= 2;
      }

      ctx.fillText(number, centerX, centerY);

      canvas.toBlob(function (blob) {
        if (!blob) { callback({ error: 'toblob-failed' }); return; }
        callback({ blob: blob });
      }, 'image/png');
    } catch (err) {
      callback({ error: 'draw-exception' });
    }
  }

  function drawTicketCanvas(number, callback) {
    var canvas = document.getElementById('ticket-canvas');
    if (!canvas) { callback({ error: 'no-canvas' }); return; }
    var ctx = canvas.getContext('2d');

    if (preloadedTemplateImg) {
      paintTicketImage(canvas, ctx, preloadedTemplateImg, number, callback);
      return;
    }
    if (preloadedTemplateFailed) {
      callback({ error: 'template-missing' });
      return;
    }
    // Заранее загрузить не успело — пробуем ещё раз прямо сейчас.
    var img = new Image();
    img.onload = function () {
      preloadedTemplateImg = img;
      paintTicketImage(canvas, ctx, img, number, callback);
    };
    img.onerror = function () {
      preloadedTemplateFailed = true;
      callback({ error: 'template-missing' });
    };
    img.src = TICKET_TEMPLATE_SRC;
  }

  function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  // На iPhone скачивание файла (<a download>) в любом браузере (Safari,
  // Chrome, что угодно — на iOS все они работают на одном движке WebKit)
  // кладёт файл в приложение "Файлы", а не в "Фото" — именно это и было
  // жалобой. Открытие картинки напрямую во весь экран + "нажать и
  // удерживать → Добавить в Фото" — единственный способ, который надёжно
  // и одинаково работает на iPhone независимо от браузера и версии iOS.
  function openImageFullScreen(blob, statusEl) {
    try {
      var url = URL.createObjectURL(blob);
      window.location.href = url;
      statusEl.textContent = 'Сейчас откроется картинка на весь экран — нажмите и удерживайте её → «Добавить в Фото».';
    } catch (err) {
      statusEl.textContent = 'Не удалось открыть картинку. Сделайте скриншот экрана.';
    }
  }

  function downloadBlob(blob, fileName, statusEl) {
    try {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      statusEl.textContent = isAndroid()
        ? 'Изображение скачано. Найдите его в уведомлениях или в галерее/загрузках.'
        : 'Изображение сохранено в папку «Загрузки».';
    } catch (err) {
      statusEl.textContent = 'Не удалось сохранить картинку в этом браузере. Сделайте скриншот экрана.';
    }
  }

  function setupInvitationTicket() {
    var participateBtn = document.getElementById('participate-btn');
    if (!participateBtn) return;

    preloadTicketTemplate();

    var ctaBlock = document.getElementById('ticket-cta');
    var resultBlock = document.getElementById('ticket-result');
    var numberEl = document.getElementById('ticket-number');
    var saveBtn = document.getElementById('save-btn');
    var statusEl = document.getElementById('ticket-save-status');
    var currentNumber = null;

    participateBtn.addEventListener('click', function () {
      currentNumber = generateTicketNumber();
      numberEl.textContent = currentNumber;
      ctaBlock.hidden = true;
      resultBlock.hidden = false;
      statusEl.textContent = '';
    });

    saveBtn.addEventListener('click', function () {
      if (!currentNumber) return;
      statusEl.textContent = 'Готовим изображение…';

      var settled = false;
      var timeoutId = setTimeout(function () {
        if (settled) return;
        settled = true;
        statusEl.textContent = 'Не получилось подготовить картинку (слишком долго). Проверьте интернет и нажмите «Сохранить» ещё раз.';
      }, 10000);

      drawTicketCanvas(currentNumber, function (result) {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);

        if (result.error) {
          if (result.error === 'template-missing') {
            statusEl.textContent = 'Не найден файл ticket-template.png в папке сайта — загрузите его и попробуйте снова.';
          } else {
            statusEl.textContent = 'Не удалось подготовить картинку. Попробуйте ещё раз.';
          }
          return;
        }

        var blob = result.blob;
        var fileName = 'holiday-asia-' + currentNumber + '.png';

        if (isIOS()) {
          // На iPhone — всегда напрямую, без скачивания файла (см. пояснение выше).
          openImageFullScreen(blob, statusEl);
          return;
        }

        var file = null;
        try { file = new File([blob], fileName, { type: 'image/png' }); } catch (err) { file = null; }

        var canUseShare = false;
        if (isAndroid()) {
          try { canUseShare = !!(file && navigator.canShare && navigator.canShare({ files: [file] })); } catch (err) { canUseShare = false; }
        }

        if (canUseShare) {
          navigator.share({ files: [file], title: 'Holiday Asia' })
            .then(function () { statusEl.textContent = 'Готово!'; })
            .catch(function (err) {
              if (err && err.name === 'AbortError') { statusEl.textContent = ''; return; }
              downloadBlob(blob, fileName, statusEl);
            });
        } else {
          downloadBlob(blob, fileName, statusEl);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    resolveLogo();
    resolveInviteImage();
    resolveBackground();
    setupInvitationTicket();
  });
})();
