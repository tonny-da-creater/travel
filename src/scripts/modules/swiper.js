/**
 * Swiper Module
 * Инициализация всех слайдеров на странице
 */

import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';

export function initSwipers() {
  // Инициализация Swiper для секции "Популярные экскурсии"
  const excursionSwiper = new Swiper('.popular-excursions__slider', {
    modules: [Navigation, Pagination],
    slidesPerView: 1.41,
    spaceBetween: 20,
    navigation: {
      nextEl: '.swiper-navigation .my-swiper-button-next',
      prevEl: '.swiper-navigation .my-swiper-button-prev',
      disabledClass: 'disabled',
    },
    pagination: {
      el: '.my-swiper-pagination',
      type: 'progressbar',
    },
    breakpoints: {
      768: { 
        slidesPerView: 2.25,
      },
      1440: { 
        slidesPerView: 3.42,
      },
    },
  });

  // Инициализация Swiper для секции "Отзывы"
  const reviewsSwiper = new Swiper('.reviews__slider', {
    modules: [Navigation, Pagination],
    slidesPerView: 1.41,
    spaceBetween: 23,
    navigation: {
      nextEl: '.reviews .swiper-navigation .my-swiper-button-next',
      prevEl: '.reviews .swiper-navigation .my-swiper-button-prev',
      disabledClass: 'disabled',
    },
    pagination: {
      el: '.reviews .my-swiper-pagination',
      type: 'progressbar',
    },
    breakpoints: {
      768: { 
        slidesPerView: 1.35,
        spaceBetween: 20,
      },
      1440: { 
        slidesPerView: 1.71,
        spaceBetween: 20,
      },
    },
  });

  return {
    excursion: excursionSwiper,
    reviews: reviewsSwiper
  };
}