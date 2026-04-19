/* ─── CUSTOM CURSOR ─── */
(function() {
  if (window.matchMedia('(hover: none)').matches || 'ontouchstart' in window) return;
  
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });

  function animateRing() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.addEventListener('mouseover', function(e) {
    const t = e.target;
    if (t.closest('a, button, .plan-frame, .masonry-item, .tab-btn, .filter-pill, .pdf-download, .nav-link')) {
      document.body.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', function(e) {
    const t = e.target;
    if (t.closest('a, button, .plan-frame, .masonry-item, .tab-btn, .filter-pill, .pdf-download, .nav-link')) {
      document.body.classList.remove('cursor-hover');
    }
  });
})();

/* ─── NAVIGATION SCROLL ─── */
(function() {
  const nav = document.getElementById('mainNav');
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        nav.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  });
})();

/* ─── MOBILE MENU ─── */
function toggleMobileMenu() {
  document.getElementById('hamburger').classList.toggle('open');
  document.getElementById('mobileMenu').classList.toggle('open');
}
function closeMobileMenu() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('mobileMenu').classList.remove('open');
}

/* ─── TAB SWITCHING ─── */
function switchTab(prefix, index, btn) {
  const container = btn.parentElement;
  container.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  
  var i = 0;
  while (document.getElementById(prefix + '-' + i)) {
    document.getElementById(prefix + '-' + i).classList.remove('active');
    i++;
  }
  var target = document.getElementById(prefix + '-' + index);
  if (target) target.classList.add('active');
}

/* ─── LIGHTBOX ─── */
var lightboxItems = [];
var lightboxIndex = 0;

function openLightbox(src, type) {
  var lb = document.getElementById('lightbox');
  var content = document.getElementById('lightboxContent');
  
  lightboxItems = [{ src: src, type: type }];
  lightboxIndex = 0;
  
  renderLightboxItem(src, type, content);
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderLightboxItem(src, type, container) {
  if (type === 'video') {
    container.innerHTML = '<video class="lightbox-media" controls autoplay><source src="' + src + '"></video>';
  } else {
    container.innerHTML = '<img class="lightbox-media" src="' + src + '" alt="">';
  }
}

function closeLightbox() {
  var lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('lightboxContent').innerHTML = '';
}

function navigateLightbox(dir) {
  if (lightboxItems.length <= 1) return;
  lightboxIndex = (lightboxIndex + dir + lightboxItems.length) % lightboxItems.length;
  var item = lightboxItems[lightboxIndex];
  renderLightboxItem(item.src, item.type, document.getElementById('lightboxContent'));
}

document.addEventListener('keydown', function(e) {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});

/* Touch swipe for lightbox */
(function() {
  var startX = 0;
  var lb = document.getElementById('lightbox');
  lb.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; });
  lb.addEventListener('touchend', function(e) {
    var diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) navigateLightbox(diff > 0 ? -1 : 1);
  });
})();


/* ─── TILTED CARD (reactbits-style mouse tilt) ─── */
(function() {
  if (window.matchMedia('(hover: none)').matches) return;
  var MAX = 6;
  var SCALE = 1.015;
  document.querySelectorAll('.plan-frame, .masonry-item').forEach(function(el) {
    el.classList.add('rb-tilt');
    var glare = document.createElement('div');
    glare.className = 'rb-tilt-glare';
    el.appendChild(glare);
    el.addEventListener('mousemove', function(e) {
      var rect = el.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      var rx = (py - 0.5) * -MAX;
      var ry = (px - 0.5) * MAX;
      el.style.transform = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(' + SCALE + ')';
      el.style.setProperty('--rb-mx', (px * 100) + '%');
      el.style.setProperty('--rb-my', (py * 100) + '%');
    });
    el.addEventListener('mouseleave', function() {
      el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
  });
})();

/* ─── SCROLL REVEAL ─── */
(function() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        
        var children = entry.target.querySelectorAll('.room-row, .masonry-item, .spec-item');
        children.forEach(function(child, i) {
          child.style.opacity = '0';
          child.style.transform = 'translateY(12px)';
          child.style.transition = 'opacity 0.4s ease ' + (i * 0.06) + 's, transform 0.4s ease ' + (i * 0.06) + 's';
          setTimeout(function() {
            child.style.opacity = '1';
            child.style.transform = 'translateY(0)';
          }, 50);
        });
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-slow').forEach(function(el) {
    observer.observe(el);
  });
})();
