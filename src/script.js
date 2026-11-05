document.addEventListener('DOMContentLoaded', () => {
    // 1. Логика мобильного меню (бургер)
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav');

    if (burger) {
        burger.addEventListener('click', () => {
            // Простая анимация или переключение класса
            nav.classList.toggle('active');
            burger.classList.toggle('active');
        });
    }

    // 2. Обработка формы обратной связи
    const form = document.getElementById('feedbackForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Отменяем перезагрузку страницы
            
            // Получаем данные
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            // В реальном проекте здесь был бы fetch запрос на сервер.
            // Пока просто имитируем успешную отправку:
            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = 'ОТПРАВЛЕНО! ✔';
            submitBtn.style.backgroundColor = '#4CAF50';
            submitBtn.style.color = '#fff';
            submitBtn.style.borderColor = '#4CAF50';
            
            form.reset();

            // Возвращаем кнопку в исходное состояние через 3 секунды
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.backgroundColor = 'transparent';
                submitBtn.style.color = 'var(--primary-red)';
                submitBtn.style.borderColor = 'var(--primary-red)';
            }, 3000);
        });
    }

    // 3. Плавный скролл к секциям при клике на меню
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                // Учитываем высоту фиксированной шапки
                const headerHeight = document.querySelector('.header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
});