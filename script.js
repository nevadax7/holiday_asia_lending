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

  document.addEventListener('DOMContentLoaded', function () {
    resolveLogo();
    resolveInviteImage();
  });
})();