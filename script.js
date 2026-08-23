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

  function drawTicketCanvas(number, invitationImgSrc, callback) {
    var canvas = document.getElementById('ticket-canvas');
    if (!canvas) { callback(null); return; }
    var ctx = canvas.getContext('2d');
    var W = 1080, H = 1080;
    canvas.width = W;
    canvas.height = H;

    function paint(bgImg) {
      if (bgImg) {
        var scale = Math.max(W / bgImg.width, H / bgImg.height);
        var sw = bgImg.width * scale, sh = bgImg.height * scale;
        ctx.drawImage(bgImg, (W - sw) / 2, (H - sh) / 2, sw, sh);
        var grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, 'rgba(12,74,77,0.38)');
        grad.addColorStop(1, 'rgba(12,74,77,0.86)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      } else {
        var grad2 = ctx.createLinearGradient(0, 0, W, H);
        grad2.addColorStop(0, '#4f9d97');
        grad2.addColorStop(1, '#0c4a4d');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.textAlign = 'center';

      ctx.fillStyle = '#e7d7a8';
      ctx.font = '700 40px Georgia, serif';
      ctx.fillText('HOLIDAY ASIA', W / 2, H * 0.30);

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '600 22px Arial, sans-serif';
      ctx.fillText('ВАШ НОМЕР УЧАСТНИКА', W / 2, H * 0.44);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 100px Arial, sans-serif';
      ctx.fillText(number, W / 2, H * 0.58);

      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.font = '400 26px Arial, sans-serif';
      wrapCanvasText(ctx, 'Предъявите этот номер в офисе для регистрации и получения подарка', W / 2, H * 0.72, W * 0.72, 34);

      canvas.toBlob(function (blob) { callback(blob); }, 'image/png');
    }

    if (invitationImgSrc) {
      var img = new Image();
      img.onload = function () { paint(img); };
      img.onerror = function () { paint(null); };
      img.src = invitationImgSrc;
    } else {
      paint(null);
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