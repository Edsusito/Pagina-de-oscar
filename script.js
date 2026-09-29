const menuToggle = document.querySelector('.menu-toggle');
const primaryNavigation = document.querySelector('.primary-nav');

if (menuToggle && primaryNavigation) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
    primaryNavigation.classList.toggle('is-open', !isOpen);
  });

  primaryNavigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menú');
      primaryNavigation.classList.remove('is-open');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menú');
      primaryNavigation.classList.remove('is-open');
      menuToggle.focus();
    }
  });
}

const siteHeader = document.querySelector('.site-header');
let scrollUpdatePending = false;

function updateScrollDecor() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
  document.documentElement.style.setProperty('--scroll-progress', `${progress}%`);
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 12);
  scrollUpdatePending = false;
}

window.addEventListener('scroll', () => {
  if (!scrollUpdatePending) {
    window.requestAnimationFrame(updateScrollDecor);
    scrollUpdatePending = true;
  }
}, { passive: true });
updateScrollDecor();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !prefersReducedMotion.matches) {
  const revealTargets = document.querySelectorAll(
    '.section-heading, .resource-card, .media-copy, .video-frame, .about-lead, .about-content, .carousel, .quick-card, .footer-inner'
  );
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

  revealTargets.forEach((target) => {
    target.dataset.reveal = '';
    revealObserver.observe(target);
  });
  document.documentElement.classList.add('has-reveal');
}

const searchInput = document.querySelector('#resource-search');
const resourceSearchForm = document.querySelector('#resource-search-form');
const resourceCards = [...document.querySelectorAll('.resource-card')];
const filterButtons = [...document.querySelectorAll('.filter-pill')];
const emptyState = document.querySelector('.empty-state');
const searchStatus = document.querySelector('.search-status');
let activeCategory = 'all';

function filterResources() {
  const normalizeSearch = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const query = normalizeSearch(searchInput.value.trim());
  let visibleCount = 0;

  resourceCards.forEach((card) => {
    const searchableText = normalizeSearch(`${card.dataset.search} ${card.textContent}`);
    const matchesQuery = !query || searchableText.includes(query);
    const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
    const isVisible = matchesQuery && matchesCategory;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  emptyState.hidden = visibleCount > 0;
  searchStatus.textContent = query || activeCategory !== 'all'
    ? `${visibleCount} ${visibleCount === 1 ? 'recurso encontrado' : 'recursos encontrados'}`
    : '';
}

searchInput?.addEventListener('input', filterResources);
resourceSearchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  filterResources();
  document.querySelector('#herramientas')?.scrollIntoView({
    behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
    block: 'start'
  });
});
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      filterButton.classList.toggle('is-active', filterButton === button);
    });
    filterResources();
  });
});

const carousel = document.querySelector('.carousel');
const carouselTrack = document.querySelector('.carousel-track');
const slides = [...document.querySelectorAll('.action-slide')];
const dotsContainer = document.querySelector('.carousel-dots');
const carouselCount = document.querySelector('.carousel-count');
let currentSlide = 0;
let autoplayTimer;

if (carousel && carouselTrack && slides.length && dotsContainer) {
  const dots = slides.map((slide, index) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Mostrar acción ${index + 1}`);
    dot.addEventListener('click', () => showSlide(index));
    dotsContainer.append(dot);
    return dot;
  });

  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    slides.forEach((slide, slideIndex) => {
      slide.setAttribute('aria-hidden', String(slideIndex !== currentSlide));
    });
    dots.forEach((dot, dotIndex) => {
      const isCurrent = dotIndex === currentSlide;
      dot.classList.toggle('is-active', isCurrent);
      dot.setAttribute('aria-current', String(isCurrent));
    });
    carouselCount.textContent = `${String(currentSlide + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  }

  function stopAutoplay() {
    window.clearInterval(autoplayTimer);
  }

  function startAutoplay() {
    stopAutoplay();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      autoplayTimer = window.setInterval(() => showSlide(currentSlide + 1), 4000);
    }
  }

  document.querySelector('[data-carousel-prev]')?.addEventListener('click', () => showSlide(currentSlide - 1));
  document.querySelector('[data-carousel-next]')?.addEventListener('click', () => showSlide(currentSlide + 1));
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) startAutoplay();
  });
  carousel.addEventListener('touchstart', stopAutoplay, { passive: true });
  carousel.addEventListener('touchend', startAutoplay, { passive: true });
  showSlide(0);
  startAutoplay();
}
