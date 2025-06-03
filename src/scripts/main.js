import '../styles/style.scss';

let navToggle = document.querySelector('.nav-toggle');
let navMenu = document.querySelector('.nav-menu');
let navLinks = document.querySelectorAll('.nav-menu__link');
let currentPath = window.location.hash;
let body = document.body;

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
  navToggle.classList.toggle('active');
  body.classList.toggle('menu-open');
});

navLinks.forEach(link => {
  if (link.getAttribute('href') === currentPath) {
    link.classList.add('active');
  }
});