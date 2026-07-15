/* ==========================================
   FOODHUB - MAIN JAVASCRIPT
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initMenuFilter();
    initWishlistButtons();
    initAddToCart();
    initContactForm();
    initScrollAnimations();
});

/* ---------- Mobile Menu ---------- */
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });
}

/* ---------- Menu Filter ---------- */
function initMenuFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const foodCards = document.querySelectorAll('.food-card[data-category]');

    if (!filterBtns.length || !foodCards.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;

            foodCards.forEach((card, index) => {
                const category = card.dataset.category;

                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    card.style.animation = `fadeInUp 0.4s ease ${index * 0.05}s forwards`;
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/* ---------- Wishlist Buttons ---------- */
function initWishlistButtons() {
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');

    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const icon = this.querySelector('i');

            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                this.style.background = '#ff4757';
                this.style.color = 'white';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                this.style.background = 'white';
                this.style.color = '';
            }
        });
    });
}

/* ---------- Add to Cart ---------- */
function initAddToCart() {
    const addCartBtns = document.querySelectorAll('.add-cart-btn');
    const cartCount = document.querySelector('.cart-count');
    let count = 0;

    addCartBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            count++;
            if (cartCount) {
                cartCount.textContent = count;
                cartCount.style.animation = 'pulse 0.3s ease';
                setTimeout(() => {
                    cartCount.style.animation = '';
                }, 300);
            }

            // Animation
            this.innerHTML = '<i class="fas fa-check"></i>';
            this.style.background = '#2ec4b6';

            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-plus"></i>';
                this.style.background = '';
            }, 1000);
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
            alert('Mohon isi semua field yang diperlukan');
            return;
        }

        if (!isValidEmail(email)) {
            alert('Mohon masukkan email yang valid');
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        setTimeout(() => {
            alert('Terima kasih! Kami akan segera menghubungi Anda.');
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
        '.category-card, .food-card, .step-card, .testimonial-card, .value-card'
    );

    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
        observer.observe(el);
    });
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
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
    }
    
    .nav-menu.active {
        position: fixed;
        top: 0;
        right: 0;
        width: 75%;
        max-width: 300px;
        height: 100vh;
        background: white;
        flex-direction: column;
        justify-content: center;
        padding: 2rem;
        gap: 2rem;
        box-shadow: -10px 0 30px rgba(0,0,0,0.1);
        z-index: 1000;
    }
`;
document.head.appendChild(style);
