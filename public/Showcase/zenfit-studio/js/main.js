/* ==========================================
   ZENFIT STUDIO - MAIN JAVASCRIPT
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initClassFilter();
    initContactForm();
    initScrollAnimations();
    initCounterAnimation();
});

/* ---------- Mobile Menu ---------- */
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });
}

/* ---------- Class Filter ---------- */
function initClassFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const classCards = document.querySelectorAll('.class-card[data-category]');

    if (!filterBtns.length || !classCards.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;

            classCards.forEach((card, index) => {
                const category = card.dataset.category;

                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    card.style.animation = `fadeInUp 0.5s ease ${index * 0.05}s forwards`;
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/* ---------- Contact Form ---------- */
function initContactForm() {
    const form = document.getElementById('contact-form');

    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('name')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const message = document.getElementById('message')?.value.trim();

        if (!name || !email || !message) {
            alert('Please fill in all required fields');
            return;
        }

        if (!isValidEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Simulate submission
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        setTimeout(() => {
            alert('Thank you! We will contact you soon.');
            form.reset();
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1500);
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------- Scroll Animations ---------- */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elements = document.querySelectorAll(
        '.feature-card, .class-card, .trainer-card, .pricing-card, .value-card, .facility-item'
    );

    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
        observer.observe(el);
    });
}

/* ---------- Counter Animation ---------- */
function initCounterAnimation() {
    const statValues = document.querySelectorAll('.stat-value');

    if (!statValues.length) return;

    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const value = target.textContent;
                const numericValue = parseInt(value.replace(/\D/g, ''));
                const suffix = value.replace(/[0-9]/g, '');

                animateValue(target, 0, numericValue, 2000, suffix);
                observer.unobserve(target);
            }
        });
    }, observerOptions);

    statValues.forEach(stat => observer.observe(stat));
}

function animateValue(element, start, end, duration, suffix) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

        const current = Math.floor(start + (end - start) * easeProgress);
        element.textContent = current + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Animation styles
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
