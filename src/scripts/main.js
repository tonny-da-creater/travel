/**
 * Main Application Entry Point
 * Импортирует стили и инициализирует все модули
 */

// Импорт стилей
import '../styles/style.scss';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Импорт модулей
import { initNavigation } from './modules/navigation.js';
import { initVideoModal } from './modules/videoModal.js';
import { initVideoPosters } from './modules/videoPosters.js';
import { initFormValidation } from './modules/formValidation.js';
import { initSwipers } from './modules/swiper.js';


// Инициализируем все модули
initNavigation();
initVideoModal();
initVideoPosters();
initFormValidation();
initSwipers();