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

  function generateTicketNumber() {
    var length = 5 + Math.floor(Math.random() * 3); // 5, 6 or 7 digits
    var digits = '';
    for (var i = 0; i < length; i++) {
      digits += Math.floor(Math.random() * 10);
    }
    return digits;
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var lines = [];
    for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    var startY = y - ((lines.length - 1) * lineHeight) / 2;
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, startY + i * lineHeight);
    }
  }

  // Итоговая картинка = целая (без обрезки/затемнения) фотография приглашения
  // сверху + отдельная кремовая полоса с номером и описанием снизу — как в
  // макете: два блока не накладываются друг на друга.
  function drawTicketCanvas(number, invitationImgSrc, callback) {
    var canvas = document.getElementById('ticket-canvas');
    if (!canvas) { callback(null); return; }
    var ctx = canvas.getContext('2d');
    var W = 1080;
    var stripH = 340;

    function paintStrip(topH) {
      var padX = 60;
      var leftColStart = padX;
      var leftColEnd = W / 2 - 30;
      var rightColStart = W / 2 + 30;
      var rightColEnd = W - padX;
      var leftCenterX = (leftColStart + leftColEnd) / 2;

      ctx.fillStyle = '#efe3c9';
      ctx.fillRect(0, topH, W, stripH);

      ctx.strokeStyle = 'rgba(43,36,26,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, topH + 78);
      ctx.lineTo(W / 2, topH + stripH - 46);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#0c4a4d';
      ctx.font = '800 36px Inter, Arial, sans-serif';
      ctx.fillText('HOLIDAY ASIA', W / 2, topH + 56);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#136d6f';
      ctx.font = '700 21px Inter, Arial, sans-serif';
      ctx.fillText('ВАШ НОМЕР УЧАСТНИКА', leftCenterX, topH + 122);

      ctx.fillStyle = '#0c4a4d';
      ctx.font = '800 72px Inter, Arial, sans-serif';
      ctx.fillText(number, leftCenterX, topH + 208);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#136d6f';
      ctx.font = '700 21px Inter, Arial, sans-serif';
      ctx.fillText('ОПИСАНИЕ', rightColStart, topH + 122);

      ctx.fillStyle = '#241d14';
      ctx.font = '500 24px Inter, Arial, sans-serif';
      wrapCanvasText(ctx, 'Предъявите этот номер в офисе для регистрации и получения подарка', rightColStart, topH + 162, rightColEnd - rightColStart, 32);

      canvas.toBlob(function (blob) { callback(blob); }, 'image/png');
    }

    if (invitationImgSrc) {
      var img = new Image();
      img.onload = function () {
        var topH = Math.round(W * (img.height / img.width));
        canvas.width = W;
        canvas.height = topH + stripH;
        ctx.drawImage(img, 0, 0, W, topH);
        paintStrip(topH);
      };
      img.onerror = function () {
        canvas.width = W;
        canvas.height = stripH;
        paintStrip(0);
      };
      img.src = invitationImgSrc;
    } else {
      canvas.width = W;
      canvas.height = stripH;
      paintStrip(0);
    }
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

      testImage('invitation.jpg').then(function (ok) {
        drawTicketCanvas(currentNumber, ok ? 'invitation.jpg' : null, function (blob) {
          if (!blob) {
            statusEl.textContent = 'Не удалось создать изображение. Сфотографируйте номер на экране.';
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
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    resolveLogo();
    resolveInviteImage();
    resolveBackground();
    setupInvitationTicket();
  });
})();