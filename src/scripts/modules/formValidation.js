/**
 * Form Validation Module
 * Валидация формы обратной связи
 */

export function initFormValidation() {
    const form = document.querySelector('.form-section__form');
    if (!form) return;

    const nameInput = form.querySelector('#name');
    const phoneInput = form.querySelector('#phone');
    const emailInput = form.querySelector('#email');
    const submitBtn = form.querySelector('.form-section__btn');

    // Создаем модальное окно для сообщений
    createModal();

    // Функция для показа ошибки в поле
    function showFieldError(input, errorMessage) {
        // Убираем класс error если он уже есть, чтобы анимация сработала заново
        input.classList.remove('error');
        
        // Принудительный reflow для перезапуска анимации
        void input.offsetWidth;
        
        input.classList.add('error');
        const originalPlaceholder = input.getAttribute('data-original-placeholder') || input.placeholder;
        if (!input.hasAttribute('data-original-placeholder')) {
            input.setAttribute('data-original-placeholder', originalPlaceholder);
        }
        input.placeholder = errorMessage;
        input.value = '';
    }

    // Функция для очистки ошибки
    function clearFieldError(input) {
        input.classList.remove('error');
        const originalPlaceholder = input.getAttribute('data-original-placeholder');
        if (originalPlaceholder) {
            input.placeholder = originalPlaceholder;
        }
    }

    // Валидация имени - только буквы, автокапитализация
    nameInput.addEventListener('input', (e) => {
        clearFieldError(e.target);
        let value = e.target.value;
        
        // Убираем все кроме букв (кириллица и латиница) и пробелов
        value = value.replace(/[^а-яА-ЯёЁa-zA-Z\s]/g, '');
        
        // Капитализация каждого слова
        value = value.split(' ').map(word => {
            if (word.length === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
        
        e.target.value = value;
    });

    // Валидация телефона - автоматически +7, только цифры
    phoneInput.addEventListener('focus', (e) => {
        if (!e.target.value) {
            e.target.value = '+7';
        }
    });

    phoneInput.addEventListener('input', (e) => {
        clearFieldError(e.target);
        let value = e.target.value;
        
        // Если пользователь удалил +7, возвращаем
        if (!value.startsWith('+7')) {
            value = '+7' + value.replace(/\D/g, '');
        }
        
        // Удаляем все кроме цифр после +7
        const digits = value.slice(2).replace(/\D/g, '');
        
        // Форматирование: +7 (XXX) XXX-XX-XX
        let formatted = '+7';
        if (digits.length > 0) {
            formatted += ' (' + digits.substring(0, 3);
        }
        if (digits.length >= 4) {
            formatted += ') ' + digits.substring(3, 6);
        }
        if (digits.length >= 7) {
            formatted += '-' + digits.substring(6, 8);
        }
        if (digits.length >= 9) {
            formatted += '-' + digits.substring(8, 10);
        }
        
        e.target.value = formatted;
    });

    phoneInput.addEventListener('keydown', (e) => {
        // Запрещаем удаление +7
        if (e.target.value === '+7' && (e.key === 'Backspace' || e.key === 'Delete')) {
            e.preventDefault();
        }
    });

    phoneInput.addEventListener('blur', (e) => {
        // Если осталось только +7, очищаем поле
        if (e.target.value === '+7' || e.target.value === '+7 (') {
            e.target.value = '';
        }
    });

    // Валидация email - проверка доменного имени
    const allowedDomains = [
        'mail.ru',
        'gmail.com',
        'yandex.ru',
        'ya.ru',
        'inbox.ru',
        'list.ru',
        'bk.ru',
        'outlook.com',
        'hotmail.com',
        'icloud.com',
        'yahoo.com',
        'rambler.ru'
    ];

    function validateEmail(email) {
        // Проверяем базовую структуру email
        const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!basicPattern.test(email)) {
            return { valid: false, error: 'Введите корректный email' };
        }

        // Извлекаем домен
        const domain = email.split('@')[1]?.toLowerCase();
        
        // Проверяем, есть ли домен в списке разрешенных
        if (!allowedDomains.includes(domain)) {
            return { 
                valid: false, 
                error: 'Введите корректный email' 
            };
        }

        return { valid: true };
    }

    emailInput.addEventListener('blur', (e) => {
        const value = e.target.value.trim();
        if (value) {
            const result = validateEmail(value);
            if (!result.valid) {
                e.target.setCustomValidity(result.error);
                e.target.reportValidity();
            } else {
                e.target.setCustomValidity('');
            }
        }
    });

    emailInput.addEventListener('input', (e) => {
        clearFieldError(e.target);
        e.target.setCustomValidity('');
    });

    // Обработка отправки формы
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // Очищаем все предыдущие ошибки
        clearFieldError(nameInput);
        clearFieldError(phoneInput);
        clearFieldError(emailInput);

        // Проверка всех полей
        const name = nameInput.value.trim();
        const phone = phoneInput.value;
        const email = emailInput.value.trim();

        let hasErrors = false;

        // Валидация имени
        if (!name || name.length < 2) {
            showFieldError(nameInput, 'Введите имя');
            hasErrors = true;
        }

        // Валидация телефона (должно быть 10 цифр после +7)
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length !== 11) {
            showFieldError(phoneInput, 'Введите номер');
            hasErrors = true;
        }

        // Валидация email
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            showFieldError(emailInput, 'Введите почту');
            hasErrors = true;
        }

        // Если есть ошибки, останавливаем отправку
        if (hasErrors) {
            return;
        }

        // Отправка формы
        submitBtn.classList.add('loading');
        submitBtn.style.pointerEvents = 'none';

        try {
            // Имитация отправки на сервер (замените на реальный запрос)
            const response = await sendFormData({ name, phone, email });
            
            if (response.success) {
                showModal('success', 'Успешно!', 'Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.');
                form.reset();
                phoneInput.value = ''; // Очищаем телефон полностью
            } else {
                throw new Error('Ошибка отправки');
            }
        } catch (error) {
            // В случае ошибки сервера показываем модалку
            showModal('error', 'Ошибка', 'Не удалось отправить заявку. Пожалуйста, попробуйте позже.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.style.pointerEvents = '';
        }
    });
}

// Имитация отправки данных (замените на реальный API запрос)
async function sendFormData(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Отправка данных:', data);
            // Имитация успешной отправки (90% успех, 10% ошибка)
            resolve({ success: Math.random() > 0.1 });
        }, 1500);
    });
}

// Создание модального окна
function createModal() {
    if (document.querySelector('.form-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'form-modal';
    modal.innerHTML = `
        <div class="form-modal__overlay"></div>
        <div class="form-modal__content">
            <button class="form-modal__close" aria-label="Закрыть">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <div class="form-modal__icon"></div>
            <h3 class="form-modal__title"></h3>
            <p class="form-modal__message"></p>
        </div>
    `;
    document.body.appendChild(modal);

    // Закрытие по клику на overlay или кнопку
    modal.querySelector('.form-modal__overlay').addEventListener('click', closeModal);
    modal.querySelector('.form-modal__close').addEventListener('click', closeModal);
}

// Показ модального окна
function showModal(type, title, message) {
    const modal = document.querySelector('.form-modal');
    if (!modal) return;

    const icon = modal.querySelector('.form-modal__icon');
    const titleEl = modal.querySelector('.form-modal__title');
    const messageEl = modal.querySelector('.form-modal__message');

    // Устанавливаем тип (success/error)
    modal.setAttribute('data-type', type);

    // Иконки SVG
    if (type === 'success') {
        icon.innerHTML = `
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="#4CAF50" stroke-width="4"/>
                <path d="M20 32L28 40L44 24" stroke="#4CAF50" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    } else {
        icon.innerHTML = `
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke="#F44336" stroke-width="4"/>
                <path d="M32 20V36M32 44V44.1" stroke="#F44336" stroke-width="4" stroke-linecap="round"/>
            </svg>
        `;
    }

    titleEl.textContent = title;
    messageEl.textContent = message;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закрытие модального окна
function closeModal() {
    const modal = document.querySelector('.form-modal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
}

