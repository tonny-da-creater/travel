/**
 * Video Posters Module
 * Управление перетаскиванием постеров видео
 */

import { openModal } from './videoModal.js';

export function initVideoPosters() {
  const postersViewport = document.querySelector('.video-posters-container');
  if (!postersViewport) return;

  // Получаем существующий трек из HTML
  const track = postersViewport.querySelector('.posters-track');
  const slides = Array.from(track.children);

  let dragStartX = 0;
  let startTranslateX = 0;
  let currentTranslateX = 0;
  let isDragging = false;
  let dragStartTime = 0;
  let dragStartPosition = { x: 0, y: 0 };
  let hasDragMoved = false;

  // overscroll factors per breakpoint (mobile/tablet/desktop)
  function getOverscrollFactors() {
    const w = window.innerWidth;
    if (w < 768) return { left: 0.08, right: 0.45 };     // mobile
    if (w < 1440) return { left: 0.44, right: 0.44 };    // tablet
    return { left: 0.35, right: 0.35 };                   // desktop
  }

  function sumContentWidth() {
    if (!slides.length) return track.scrollWidth || 0;
    return slides.reduce((acc, el) => {
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const ml = parseFloat(cs.marginLeft) || 0;
      const mr = parseFloat(cs.marginRight) || 0;
      return acc + rect.width + ml + mr;
    }, 0);
  }

  function getBounds() {
    const visible = postersViewport.clientWidth;
    const content = sumContentWidth();
    const first = slides[0];
    const second = slides[1];
    const last = slides[slides.length - 1];
    const prevLast = slides[slides.length - 2];
    const secondW = second ? second.getBoundingClientRect().width : (first ? first.getBoundingClientRect().width : 0);
    const prevLastW = prevLast ? prevLast.getBoundingClientRect().width : (last ? last.getBoundingClientRect().width : 0);

    // Requirement: edge fully visible + part of neighbor (factor depends on breakpoint)
    const { left: kLeft, right: kRight } = getOverscrollFactors();
    const overscrollLeft = Math.round(secondW * kLeft);     // dragging right: allow +X
    const overscrollRight = Math.round(prevLastW * kRight); // dragging left: allow -X

    if (content <= visible) {
      const slack = visible - content;
      // Start aligned to right (content sticks to right edge by default)
      return { minX: -overscrollRight, maxX: slack + overscrollLeft, startX: slack };
    }

    const minX = visible - content - overscrollRight; // far left (show last fully + 40% prev)
    const maxX = overscrollLeft; // far right (show first fully + 40% next)
    const startX = Math.max(minX, Math.min(maxX, visible - content));
    return { minX, maxX, startX };
  }

  function applyTransform(x) {
    track.style.transform = `translateX(${x}px)`;
  }

  function clamp(x, min, max) {
    return x < min ? min : x > max ? max : x;
  }

  function recalcAndSetStart() {
    const { minX, maxX, startX } = getBounds();
    // Инициализация: максимально вправо (правый край + 40% соседа)
    currentTranslateX = typeof maxX === 'number' ? maxX : startX;
    if (currentTranslateX < minX) currentTranslateX = minX;
    if (currentTranslateX > maxX) currentTranslateX = maxX;
    applyTransform(currentTranslateX);
    // показать после выравнивания
    postersViewport.classList.add('show');
  }

  function onDragStart(e) {
    // Проверяем, что клик был на постере или его содержимом
    let target = e.target;
    let videoContainer = null;
    let depth = 0;
    
    // Ищем .video-container среди родителей
    while (target && depth < 10) {
      if (target.classList?.contains('video-container')) {
        videoContainer = target;
        break;
      }
      target = target.parentElement;
      depth++;
    }
    
    // Если клик не на постере - игнорируем
    if (!videoContainer) return;
    
    isDragging = true;
    dragStartTime = Date.now();
    hasDragMoved = false;
    
    // Добавляем класс grabbing на все постеры
    slides.forEach(slide => slide.classList.add('grabbing'));
    
    const isPointer = e.type && e.type.indexOf('pointer') === 0;
    const isTouchLike = isPointer ? e.pointerType === 'touch' : !!e.touches;
    const clientX = e.touches ? e.touches[0].clientX : (e.clientX ?? e.pageX);
    const clientY = e.touches ? e.touches[0].clientY : (e.clientY ?? e.pageY);
    
    dragStartX = clientX;
    dragStartPosition = { x: clientX, y: clientY };
    startTranslateX = currentTranslateX;
    
    // Сохраняем изначальный target при mousedown (до захвата pointer events)
    window.clickTarget = e.target;
    
    if (isTouchLike) postersViewport.style.touchAction = 'none';
    if (e.cancelable) e.preventDefault();
  }

  function onDragMove(e) {
    if (!isDragging) return;
    const x = e.touches ? e.touches[0].clientX : (e.clientX ?? e.pageX);
    const y = e.touches ? e.touches[0].clientY : (e.clientY ?? e.pageY);
    const delta = x - dragStartX;
    
    // Отмечаем движение если курсор сдвинулся больше чем на 5px
    const distance = Math.sqrt(
      Math.pow(x - dragStartPosition.x, 2) + 
      Math.pow(y - dragStartPosition.y, 2)
    );
    if (distance > 5) {
      hasDragMoved = true;
    }
    
    const { minX, maxX } = getBounds();
    currentTranslateX = clamp(startTranslateX + delta, minX, maxX);
    applyTransform(currentTranslateX);
    if (e.cancelable) e.preventDefault();
  }

  function onDragEnd(e) {
    if (!isDragging) return;
    
    const timeSinceStart = Date.now() - dragStartTime;
    const wasClick = !hasDragMoved && timeSinceStart < 300;
    
    // Если это был клик - открываем модалку
    if (wasClick) {
      if (window.clickTarget) {
        // Поднимаемся по DOM до .video-container от сохраненного элемента
        let target = window.clickTarget;
        let depth = 0;
        
        while (target && !target.classList?.contains('video-container') && depth < 10) {
          target = target.parentElement;
          depth++;
        }
        
        if (target && target.classList.contains('video-container')) {
          const videoId = target.getAttribute('data-video-id');
          openModal(videoId);
        }
      }
    }
    
    isDragging = false;
    
    // Убираем класс grabbing со всех постеров
    slides.forEach(slide => slide.classList.remove('grabbing'));
    
    postersViewport.style.touchAction = '';
    
    // Сбрасываем флаги после небольшой задержки
    setTimeout(() => {
      hasDragMoved = false;
    }, 50);
  }

  // Events: используем только один тип событий для избежания дублирования
  if (window.PointerEvent) {
    postersViewport.addEventListener('pointerdown', (e) => { 
      postersViewport.setPointerCapture(e.pointerId); 
      onDragStart(e); 
    }, { passive: false });
    postersViewport.addEventListener('pointermove', onDragMove, { passive: false });
    postersViewport.addEventListener('pointerup', (e) => { 
      try{ postersViewport.releasePointerCapture(e.pointerId);}catch(_){} 
      onDragEnd(e); 
    }, { passive: false });
    postersViewport.addEventListener('pointercancel', (e) => onDragEnd(e), { passive: false });
  } else {
    // Fallback для старых браузеров
    postersViewport.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    postersViewport.addEventListener('touchstart', onDragStart, { passive: false });
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
  }

  // Disable native image drag
  postersViewport.querySelectorAll('img').forEach((img) => img.setAttribute('draggable', 'false'));

  // Init
  if (document.readyState === 'complete') recalcAndSetStart();
  else window.addEventListener('load', recalcAndSetStart, { once: true });
  window.addEventListener('resize', recalcAndSetStart);
}