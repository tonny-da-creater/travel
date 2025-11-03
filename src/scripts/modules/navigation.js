/**
 * Navigation Module
 * Управление мобильным меню и навигацией
 */

export function initNavigation() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-menu__link');
  const currentPath = window.location.hash;
  const body = document.body;

  if (navToggle && navMenu && navLinks.length) {
    // Переключение мобильного меню
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
      body.classList.toggle('menu-open');
    });

    // Установка активной ссылки
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      
      // Если это главная страница (нет хэша или хэш пустой)
      if (href === '#home' && (!currentPath || currentPath === '' || currentPath === '#')) {
        link.classList.add('active');
      }
      // Для других страниц проверяем соответствие хэша
      else if (href === currentPath) {
        link.classList.add('active');
      }
      
      // Обработчик клика для переключения активной ссылки
      link.addEventListener('click', () => {
        // Убираем активный класс со всех ссылок
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        // Добавляем активный класс к кликнутой ссылке
        link.classList.add('active');
      });
    });
  }
}