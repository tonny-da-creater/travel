import '../styles/style.scss';

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-menu__link');
const currentPath = window.location.hash;
const body = document.body;

if (navToggle && navMenu && navLinks.length) {
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
}

// Глобальная функция для YouTube API
window.onYouTubeIframeAPIReady = function() {
  console.log('YouTube IFrame API is ready');
  const slides = document.querySelectorAll('.swiper-slide');
  const modal = document.getElementById('video-modal');
  const iframe = document.getElementById('video-frame');
  const closeButton = document.querySelector('.modal-close');

  if (!slides.length || !modal || !iframe || !closeButton) {
    console.error('Required elements not found:', { slides: slides.length, modal, iframe, closeButton });
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');

    slides.forEach(slide => {
      const poster = slide.querySelector('.video-poster-item');
      const playButton = slide.querySelector('.play');
      if (!poster || !playButton) {
        console.error('poster or play button not found in slide', slide);
        return;
      }

      const videoId = slide.dataset.videoId;
      console.log(`Setting up play button and poster for video ID: ${videoId}`);

      poster.addEventListener('click', (e) => {
        openVideo(videoId);
      });

      playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        openVideo(videoId);
      });
    });

    closeButton.addEventListener('click', () => {
      console.log('Close button clicked');
      modal.classList.remove('active');
      iframe.classList.remove('active');
      iframe.src = '';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('Clicked outside, closing modal');
        modal.classList.remove('active');
        iframe.classList.remove('active');
        iframe.src = '';
      }
    });
  });
};

// Загрузка API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
tag.async = true;
tag.onload = () => console.log('YouTube IFrame API script loaded');
tag.onerror = () => console.error('Failed to load YouTube IFrame API');
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Функция открытия видео
function openVideo(videoId) {
  console.log(`Opening video for video ID: ${videoId}`);
  const iframe = document.getElementById('video-frame');
  const modal = document.getElementById('video-modal');
  iframe.src = `https://www.youtube.com/embed/${videoId === 'ytplayer1' ? 'c9DIoSNoQNs' : 'kmpHl6NRjmE'}?enablejsapi=1&autoplay=1&mute=1`;
  modal.classList.add('active');
  iframe.classList.add('active');
}