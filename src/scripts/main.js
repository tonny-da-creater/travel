import '../styles/style.scss';


let navToggle = document.querySelector('.nav-toggle');
let navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});