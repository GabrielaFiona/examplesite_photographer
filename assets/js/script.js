/*
  LUMINA — lightweight, 2-page single-file site.
*/

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// -------------------------------
// Page switching
// -------------------------------
function showPage(pageId, opts = {}) {
  const pages = $$('.page');
  pages.forEach(p => p.classList.remove('active'));

  const active = document.getElementById(pageId);
  if (!active) return;
  active.classList.add('active');

  // Update nav active state
  $$('.nav-link').forEach(a => a.classList.toggle('is-active', a.dataset.page === pageId));

  // Close mobile nav if open
  const navLinks = $('[data-nav-links]');
  const toggle = $('.nav-toggle');
  if (navLinks && toggle) {
    navLinks.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  // Optional scrolling
  if (opts.scrollTo) {
    const target = $(opts.scrollTo);
    if (target) {
      // allow paint before scrolling
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Nav link clicks
$$('[data-page]').forEach(el => {
  el.addEventListener('click', (e) => {
    if (el.tagName.toLowerCase() === 'a') e.preventDefault();
    const pageId = el.dataset.page;

    // FIX: Gallery link in nav now goes to the #work section on the home page
    if (pageId === 'gallery') {
      showPage('home', { scrollTo: '#work' });
    } else {
      showPage(pageId);
    }
  });
});

// Mobile nav toggle
(() => {
  const toggle = $('.nav-toggle');
  const navLinks = $('[data-nav-links]');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if (!navLinks.classList.contains('is-open')) return;
    const clickedInside = navLinks.contains(e.target) || toggle.contains(e.target);
    if (!clickedInside) {
      navLinks.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

// -------------------------------
// Reveal animations
// -------------------------------
(() => {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(el => el.classList.add('is-inview'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  els.forEach(el => io.observe(el));
})();

// -------------------------------
// Gallery filter chips
// -------------------------------
(() => {
  const chips = $$('.chip');
  const items = $$('.gallery-item');
  if (!chips.length || !items.length) return;

  const applyFilter = (filter) => {
    chips.forEach(c => c.classList.toggle('is-active', c.dataset.filter === filter));
    items.forEach(it => {
      const cat = (it.dataset.category || '').toLowerCase();
      const show = filter === 'all' || cat === filter;
      it.classList.toggle('is-hidden', !show);
    });
  };

  chips.forEach(chip => {
    chip.addEventListener('click', () => applyFilter(chip.dataset.filter));
  });
})();

// -------------------------------
// Lightbox (preserved original logic)
// -------------------------------
const lightbox = $('#lightbox');
const lightboxImg = $('#lightbox-img');
const lightboxCap = $('#lightbox-cap');
let lightboxList = [];
let lightboxIndex = 0;

function rebuildLightboxList() {
  const galleryImgs = $$('.gallery-item:not(.is-hidden) img').map(img => ({
    src: img.currentSrc || img.src,
    alt: img.alt || 'Gallery image'
  }));

  const feature = $$('[data-lightbox="open"]').map(el => ({
    src: el.dataset.img,
    alt: el.dataset.alt || 'Featured image'
  }));

  const seen = new Set();
  const combined = [...feature, ...galleryImgs].filter(i => {
    if (!i.src) return false;
    if (seen.has(i.src)) return false;
    seen.add(i.src);
    return true;
  });

  lightboxList = combined;
}

function openLightboxBySrc(src, alt = '') {
  rebuildLightboxList();
  const idx = lightboxList.findIndex(i => i.src === src);
  openLightbox(Math.max(0, idx), alt);
}

function openLightbox(index, altOverride = '') {
  if (!lightbox || !lightboxImg) return;
  rebuildLightboxList();
  if (!lightboxList.length) return;

  lightboxIndex = ((index % lightboxList.length) + lightboxList.length) % lightboxList.length;
  const item = lightboxList[lightboxIndex];

  lightboxImg.src = item.src;
  lightboxImg.alt = altOverride || item.alt || 'Large photo';
  if (lightboxCap) lightboxCap.textContent = (altOverride || item.alt || '').trim();

  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function stepLightbox(dir) {
  if (!lightboxList.length) rebuildLightboxList();
  if (!lightboxList.length) return;
  openLightbox(lightboxIndex + dir);
}

$$('.gallery-item img').forEach((img) => {
  img.addEventListener('click', () => {
    const visible = $$('.gallery-item:not(.is-hidden) img');
    const idx = visible.indexOf(img);
    openLightbox(idx, img.alt);
  });
});

// Click to open (feature)
$$('[data-lightbox="open"]').forEach((el) => {
  el.addEventListener('click', () => {
    const src = el.dataset.img;
    openLightboxBySrc(src, el.dataset.alt || '');
  });
});

(() => {
  if (!lightbox) return;
  $('.lightbox-close', lightbox)?.addEventListener('click', closeLightbox);
  $('.lightbox-prev', lightbox)?.addEventListener('click', () => stepLightbox(-1));
  $('.lightbox-next', lightbox)?.addEventListener('click', () => stepLightbox(1));

  lightbox.addEventListener('click', (e) => {
    const figure = $('.lightbox-figure', lightbox);
    if (figure && !figure.contains(e.target) && !e.target.closest('.lightbox-nav') && !e.target.closest('.lightbox-close')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });
})();

// -------------------------------
// Inquiry & CTA Handlers
// -------------------------------
function buildMailto({ name, email, phone, type, date, location, budget, message, preferred }) {
  const to = 'hello@yourdomain.com';
  const subject = `Inquiry: ${type || 'Photography'}${date ? ` (${date})` : ''}`;
  const lines = [
    `Name: ${name || ''}`,
    `Email: ${email || ''}`,
    phone ? `Phone: ${phone}` : null,
    `Session type: ${type || ''}`,
    date ? `Preferred date: ${date}` : null,
    location ? `Location: ${location}` : null,
    budget ? `Budget: ${budget}` : null,
    preferred ? `Preferred contact: ${preferred}` : null,
    '',
    (message || '').trim() ? `Notes:\n${message.trim()}` : 'Notes:'
  ].filter(Boolean);

  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('is-on'));
  setTimeout(() => {
    t.classList.remove('is-on');
    setTimeout(() => t.remove(), 350);
  }, 2400);
}

$$('[data-cta]').forEach((el) => {
  el.addEventListener('click', () => {
    const action = el.dataset.cta;

    // FIX: Both "Check Availability" and "Book a Session" point to the contact form
    if (action === 'open-inquiry' || action === 'go-services') {
      showPage('services', { scrollTo: '#contact-title' });
    }

    if (action === 'view-work') {
      showPage('home', { scrollTo: '#work' });
    }
  });
});

// -------------------------------
// Contact form submit (preserved)
// -------------------------------
(() => {
  const form = $('#contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      localStorage.setItem('lumina_last_inquiry', JSON.stringify({ ...payload, t: Date.now() }));
    } catch (_) {}

    window.location.href = buildMailto(payload);
    toast('Opening your email app…');
  });
})();

// Restore last inquiry draft
(() => {
  const form = $('#contact-form');
  if (!form) return;
  try {
    const raw = localStorage.getItem('lumina_last_inquiry');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data?.t || (Date.now() - data.t) > 7 * 24 * 60 * 60 * 1000) return;

    const fields = ['name', 'email', 'phone', 'date', 'location', 'budget', 'message'];
    fields.forEach(k => {
      const el = $(`#contact-form [name="${k}"]`);
      if (el && data[k] && !el.value) el.value = data[k];
    });
  } catch (_) {}
})();

window.addEventListener('DOMContentLoaded', () => {
  showPage('home');
});
