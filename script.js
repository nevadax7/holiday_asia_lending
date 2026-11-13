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
        wrap.innerHTML = '<img src="' + src + '" alt="Приглашение The Hill Residence">';
        wrap.classList.add('invite-media--clickable');
        wrap.setAttribute('role', 'button');
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('aria-label', 'Открыть изображение приглашения на весь экран');
        var openThis = function () { openSimpleLightbox(src, 'Приглашение The Hill Residence'); };
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

  // Используем то же приглашение, что показано на странице.
  var TICKET_TEMPLATE_SRC = document.getElementById('invite-media')
    ? document.getElementById('invite-media').getAttribute('data-src')
    : 'invitation-hill-residence.png';

  function generateTicketNumber() {
    var bytes = new Uint32Array(1);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      bytes[0] = Math.floor(Math.random() * 0xffffffff);
    }
    return ('0000000' + (bytes[0] % 10000000)).slice(-7);
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
      var imageHeight = img.naturalHeight;
      var footerHeight = Math.round(W * 0.30);
      canvas.width = W;
      canvas.height = imageHeight + footerHeight;
      ctx.drawImage(img, 0, 0, W, imageHeight);

      ctx.fillStyle = '#f5efe5';
      ctx.fillRect(0, imageHeight, W, footerHeight);
      ctx.fillStyle = '#0c4a4d';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 ' + Math.round(W * 0.034) + 'px Arial, sans-serif';
      ctx.fillText('HOLIDAY ASIA', W * 0.5, imageHeight + W * 0.052);
      ctx.font = '700 ' + Math.round(W * 0.019) + 'px Arial, sans-serif';
      ctx.fillText('ВАШ НОМЕР УЧАСТНИКА', W * 0.28, imageHeight + W * 0.125);
      ctx.font = '800 ' + Math.round(W * 0.075) + 'px Arial, sans-serif';
      ctx.fillText(number, W * 0.28, imageHeight + W * 0.205, W * 0.46);

      ctx.fillStyle = '#b99b60';
      ctx.fillRect(W * 0.55, imageHeight + W * 0.09, Math.max(1, W * 0.001), W * 0.18);
      ctx.fillStyle = '#0c4a4d';
      ctx.font = '700 ' + Math.round(W * 0.019) + 'px Arial, sans-serif';
      ctx.fillText('ОПИСАНИЕ', W * 0.77, imageHeight + W * 0.125);
      ctx.font = '400 ' + Math.round(W * 0.018) + 'px Arial, sans-serif';
      ['Предъявите этот номер', 'в офисе для регистрации', 'и получения подарка'].forEach(function (line, i) {
        ctx.fillText(line, W * 0.77, imageHeight + W * (0.17 + i * 0.031));
      });

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
            statusEl.textContent = 'Не удалось загрузить изображение приглашения. Обновите страницу и попробуйте снова.';
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
