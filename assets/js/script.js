/*
  LUMINA — lightweight, 2-page single-file site.
  Updates in this script:
  - Modern page switching with active link state
  - Mobile menu toggle
  - Gallery filters + upgraded lightbox (prev/next + keyboard)
  - Reveal animations (IntersectionObserver)
  - Quick inquiry modal + form presets
  - Contact form funnels to pre-filled email (mailto:)
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
    // buttons in nav also have data-page sometimes; treat all as page switches
    if (el.tagName.toLowerCase() === 'a') e.preventDefault();
    const pageId = el.dataset.page;
    showPage(pageId);
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

  // Close on outside click
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
// Lightbox (gallery + feature cards)
// -------------------------------
const lightbox = $('#lightbox');
const lightboxImg = $('#lightbox-img');
const lightboxCap = $('#lightbox-cap');
let lightboxList = [];
let lightboxIndex = 0;

function rebuildLightboxList() {
  // Use visible gallery items first
  const galleryImgs = $$('.gallery-item:not(.is-hidden) img').map(img => ({
    src: img.currentSrc || img.src,
    alt: img.alt || 'Gallery image'
  }));

  // Feature cards open high-res via data-img
  const feature = $$('[data-lightbox="open"]').map(el => ({
    src: el.dataset.img,
    alt: el.dataset.alt || 'Featured image'
  }));

  // Keep a stable list: feature first, then gallery (dedup by src)
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
  if (lightboxImg) {
    lightboxImg.src = '';
    lightboxImg.alt = '';
  }
}

function stepLightbox(dir) {
  if (!lightboxList.length) rebuildLightboxList();
  if (!lightboxList.length) return;
  openLightbox(lightboxIndex + dir);
}

// Click to open (gallery)
$$('.gallery-item img').forEach((img) => {
  img.addEventListener('click', () => {
    // Index among visible images
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

// Lightbox controls
(() => {
  if (!lightbox) return;
  const closeBtn = $('.lightbox-close', lightbox);
  const prevBtn = $('.lightbox-prev', lightbox);
  const nextBtn = $('.lightbox-next', lightbox);

  closeBtn?.addEventListener('click', closeLightbox);
  prevBtn?.addEventListener('click', () => stepLightbox(-1));
  nextBtn?.addEventListener('click', () => stepLightbox(1));

  // Click outside image closes
  lightbox.addEventListener('click', (e) => {
    const figure = $('.lightbox-figure', lightbox);
    if (figure && !figure.contains(e.target) && !e.target.closest('.lightbox-nav') && !e.target.closest('.lightbox-close')) {
      closeLightbox();
    }
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });
})();

// -------------------------------
// Inquiry funnel (modal + presets + mailto)
// -------------------------------
const modal = $('[data-modal]');

function openModal() {
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  // Focus first input for accessibility
  const first = $('input, select, textarea, button', modal);
  first?.focus({ preventScroll: true });
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function setPreset(preset) {
  const select = $('#contact-form select[name="type"]');
  const quickSelect = $('#quick-form select[name="type"]');

  const map = {
    wedding: 'Wedding',
    coastal: 'Coastal session',
    editorial: 'Editorial / brand'
  };

  const value = map[(preset || '').toLowerCase()] || null;
  if (value) {
    if (select) select.value = value;
    if (quickSelect) quickSelect.value = value;
  }
}

function buildMailto({ name, email, phone, type, date, location, budget, message, preferred }) {
  const to = 'hello@yourdomain.com'; // TODO: replace
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

  const body = lines.join('\n');
  const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return url;
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

// CTA handlers
$$('[data-cta]').forEach((el) => {
  el.addEventListener('click', () => {
    const action = el.dataset.cta;
    const preset = el.dataset.preset;
    if (preset) setPreset(preset);

    if (action === 'open-inquiry') {
      openModal();
    }

    if (action === 'go-services') {
      showPage('services');
      // scroll after page activation
      requestAnimationFrame(() => {
        const packages = $('.packages-grid');
        packages?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    if (action === 'view-work') {
      // ensure home is active, then scroll to gallery
      showPage('home', { scrollTo: '#work' });
    }
  });
});

// Modal close handlers
(() => {
  if (!modal) return;
  $$('[data-modal-close]', modal).forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();

// Quick form submit
(() => {
  const form = $('#quick-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const type = String(fd.get('type') || '').trim();
    const date = String(fd.get('date') || '').trim();
    const email = String(fd.get('email') || '').trim();

    // Pre-fill main form too
    setPreset(type);
    const mainEmail = $('#contact-form input[name="email"]');
    if (mainEmail && email) mainEmail.value = email;
    const mainDate = $('#contact-form input[name="date"]');
    if (mainDate && date) mainDate.value = date;

    closeModal();
    showPage('services', { scrollTo: '#contact-title' });
    toast('Scroll down to finish your inquiry.');
  });
})();

// Contact form submit (mailto funnel)
(() => {
  const form = $('#contact-form');
  if (!form) return;

  // Apply preset from any dataset preset buttons (best effort)
  const preset = new URLSearchParams(window.location.search).get('preset');
  if (preset) setPreset(preset);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const payload = {
      name: String(fd.get('name') || ''),
      email: String(fd.get('email') || ''),
      phone: String(fd.get('phone') || ''),
      type: String(fd.get('type') || ''),
      date: String(fd.get('date') || ''),
      location: String(fd.get('location') || ''),
      budget: String(fd.get('budget') || ''),
      preferred: String(fd.get('preferred') || ''),
      message: String(fd.get('message') || '')
    };

    // Optional: store a local copy so the user doesn't lose it
    try {
      localStorage.setItem('lumina_last_inquiry', JSON.stringify({ ...payload, t: Date.now() }));
    } catch (_) {}

    const mailto = buildMailto(payload);
    toast('Opening your email app…');
    window.location.href = mailto;
  });
})();

// Restore last inquiry draft (nice UX)
(() => {
  const form = $('#contact-form');
  if (!form) return;

  try {
    const raw = localStorage.getItem('lumina_last_inquiry');
    if (!raw) return;
    const data = JSON.parse(raw);
    // Only restore if recent (7 days)
    if (!data?.t || (Date.now() - data.t) > 7 * 24 * 60 * 60 * 1000) return;

    const fields = ['name', 'email', 'phone', 'date', 'location', 'budget', 'message'];
    fields.forEach(k => {
      const el = $(`#contact-form [name="${k}"]`);
      if (el && typeof data[k] === 'string' && !el.value) el.value = data[k];
    });

    if (data.type) setPreset(data.type);
  } catch (_) {}
})();

// Ensure correct initial state
window.addEventListener('DOMContentLoaded', () => {
  showPage('home');
});

if (action === 'view-work') {
  showPage('home', { scrollTo: '#work' });
}
