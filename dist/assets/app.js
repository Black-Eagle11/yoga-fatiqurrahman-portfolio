(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  function setupNavigation() {
    const menuButton = $('#menu-toggle');
    const mobileMenu = $('#mobile-menu');
    if (menuButton && mobileMenu) {
      menuButton.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('hidden') === false;
        menuButton.setAttribute('aria-expanded', String(isOpen));
      });

      $$('.mobile-link', mobileMenu).forEach((link) => {
        link.addEventListener('click', () => {
          mobileMenu.classList.add('hidden');
          menuButton.setAttribute('aria-expanded', 'false');
        });
      });
    }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    $$('[data-nav]').forEach((link) => {
      const target = link.getAttribute('href').split('/').pop() || 'index.html';
      if (target === currentPage) {
        link.classList.add('text-white', 'bg-white/10');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function setupReveal() {
    const elements = $$('.reveal');
    if (!elements.length) return;
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
  }

  function setFooterYear() {
    $$('[data-year], [data-current-year]').forEach((element) => {
      element.textContent = new Date().getFullYear();
    });
  }

  setupNavigation();
  setupReveal();
  setFooterYear();
})();
