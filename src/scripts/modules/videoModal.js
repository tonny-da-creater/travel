/**
 * Video Modal Module
 * Управление модальным окном с видео
 */

// Карта соответствия ID видео и YouTube ID
const videoMap = {
  'ytplayer1': 'c9DIoSNoQNs',
  'ytplayer2': 'kmpHl6NRjmE'
};

// Кэшируем часто используемые элементы модального окна
const modal = document.getElementById('video-modal');
const iframe = document.getElementById('video-frame');

export function initVideoModal() {
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close');
  
  // Закрытие по кнопке
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }
  
  // Закрытие по клику на фон (вне видео)
  modal.addEventListener('click', (e) => {
    // Если кликнули на сам modal (фон), а не на его содержимое
    // И модальное окно не было только что открыто
    if (e.target === modal && !window.modalJustOpened) {
      closeModal();
    }
  });
  
  // Закрытие по клавише Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal && modal.classList.contains('opened')) {
        closeModal();
      }
    }
  });
}

export function openModal(videoId) {
  if (!modal || !iframe) return;

  // Загружаем соответствующее видео
  const youtubeId = videoMap[videoId];
  if (youtubeId) {
    iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0`;
  }
  
  modal.classList.add('opened');
  document.body.classList.add('modal-open');
  
  // Устанавливаем флаг для предотвращения немедленного закрытия модального окна
  window.modalJustOpened = true;
  setTimeout(() => {
    window.modalJustOpened = false;
  }, 100);
}

function closeModal() {
  if (!modal) return;

  modal.classList.remove('opened');
  document.body.classList.remove('modal-open');
  
  if (iframe) {
    // Останавливаем видео, очищая src
    iframe.src = '';
  }
}