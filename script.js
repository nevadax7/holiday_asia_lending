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

  function resolveInviteImage() {
    var wrap = document.getElementById('invite-media');
    if (!wrap) return;
    var src = wrap.getAttribute('data-src');
    testImage(src).then(function (ok) {
      if (ok) {
        wrap.innerHTML = '<img src="' + src + '" alt="Приглашение Naman Retreat">';
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
  var TICKET_NUMBER_X_FRAC = 0.28;   // по горизонтали: центр под "ВАШ НОМЕР УЧАСТНИКА"
  var TICKET_NUMBER_Y_FRAC = 0.80;   // по вертикали
  var TICKET_NUMBER_MAX_WIDTH_FRAC = 0.34; // не шире левой колонки
  var TICKET_NUMBER_COLOR = '#0c4a4d'; // тот же цвет, что и "HOLIDAY ASIA" на карточке

  function generateTicketNumber() {
    var length = 5 + Math.floor(Math.random() * 3); // 5, 6 or 7 digits
    var digits = '';
    for (var i = 0; i < length; i++) {
      digits += Math.floor(Math.random() * 10);
    }
    return digits;
  }

  function drawTicketCanvas(number, callback) {
    var canvas = document.getElementById('ticket-canvas');
    if (!canvas) { callback(null); return; }
    var ctx = canvas.getContext('2d');

    var img = new Image();
    img.onload = function () {
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

      var fontSize = Math.round(W * 0.062);
      var fits = false;
      while (!fits && fontSize > 20) {
        ctx.font = '800 ' + fontSize + 'px Inter, Arial, sans-serif';
        if (ctx.measureText(number).width <= maxWidth) fits = true;
        else fontSize -= 2;
      }

      ctx.fillText(number, centerX, centerY);

      canvas.toBlob(function (blob) { callback(blob); }, 'image/png');
    };
    img.onerror = function () { callback(null); };
    img.src = TICKET_TEMPLATE_SRC;
  }

  function setupInvitationTicket() {
    var participateBtn = document.getElementById('participate-btn');
    if (!participateBtn) return;

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

      drawTicketCanvas(currentNumber, function (blob) {
        if (!blob) {
          statusEl.textContent = 'Не найден файл ticket-template.png в папке сайта — загрузите его и попробуйте снова.';
          return;
        }
        var fileName = 'holiday-asia-' + currentNumber + '.png';
        var file = null;
        try { file = new File([blob], fileName, { type: 'image/png' }); } catch (err) { file = null; }

        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: 'Holiday Asia' })
            .then(function () { statusEl.textContent = 'Готово!'; })
            .catch(function () { statusEl.textContent = ''; });
        } else {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
          statusEl.textContent = 'Изображение скачано. На iPhone: нажмите и удерживайте картинку → «Добавить в Фото».';
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
