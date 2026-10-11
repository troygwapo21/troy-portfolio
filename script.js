/**
 * Troy P. Villaruel — Personal Portfolio Script
 * Handles smooth scroll fade-in animations, project filtering, and navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. Smooth Scroll Fade-In Observer (IntersectionObserver)
  const fadeElements = document.querySelectorAll('.fade-in');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.12
  };

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, observerOptions);

  fadeElements.forEach((el) => scrollObserver.observe(el));

  // 3. Navbar scroll state & Active section link highlight
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const handleScroll = () => {
    if (window.scrollY > 24) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Highlight active nav item
    let currentSection = 'home';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 140;
      if (window.scrollY >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 4. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinksContainer = document.getElementById('navLinks');

  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', () => {
      navLinksContainer.classList.toggle('open');
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navLinksContainer.classList.remove('open');
      });
    });
  }

  // 5. Projects Done Filter Tabs with Smooth Fade-In
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Update active button state
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach((card) => {
        const category = card.getAttribute('data-category');
        const matches = filterValue === 'all' || category === filterValue;

        if (matches) {
          card.classList.remove('hidden');
          // Trigger smooth fade-in reset
          card.classList.remove('is-visible');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              card.classList.add('is-visible');
            });
          });
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
});
