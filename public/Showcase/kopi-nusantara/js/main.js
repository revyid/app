/* ==========================================
   KOPI NUSANTARA - MAIN JAVASCRIPT
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all components
    initNavbar();
    initMobileMenu();
    initMenuFilter();
    initContactForm();
    initScrollAnimations();
});

/* ---------- Navbar Scroll Effect ---------- */
function initNavbar() {
    const navbar = document.querySelector('.navbar');

    if (!navbar || navbar.classList.contains('navbar-dark')) return;

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* ---------- Mobile Menu Toggle ---------- */
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', function () {
        navMenu.classList.toggle('active');

        // Animate hamburger
        const hamburger = this.querySelector('.hamburger');
        if (hamburger) {
            hamburger.classList.toggle('active');
        }
    });

    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });
}

/* ---------- Menu Filter ---------- */
function initMenuFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const menuCards = document.querySelectorAll('.menu-card[data-category]');

    if (!filterBtns.length || !menuCards.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Filter items
            const filter = this.dataset.filter;

            menuCards.forEach(card => {
                const category = card.dataset.category;

                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.5s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/* ---------- Contact Form Validation ---------- */
function initContactForm() {
    const form = document.getElementById('contact-form');
    const formSuccess = document.getElementById('form-success');

    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Reset errors
        clearErrors();

        // Get form values
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const message = document.getElementById('message');

        let isValid = true;

        // Validate name
        if (!name.value.trim()) {
            showError(name, 'name-error', 'Nama harus diisi');
            isValid = false;
        } else if (name.value.trim().length < 2) {
            showError(name, 'name-error', 'Nama minimal 2 karakter');
            isValid = false;
        }

        // Validate email
        if (!email.value.trim()) {
            showError(email, 'email-error', 'Email harus diisi');
            isValid = false;
        } else if (!isValidEmail(email.value)) {
            showError(email, 'email-error', 'Format email tidak valid');
            isValid = false;
        }

        // Validate message
        if (!message.value.trim()) {
            showError(message, 'message-error', 'Pesan harus diisi');
            isValid = false;
        } else if (message.value.trim().length < 10) {
            showError(message, 'message-error', 'Pesan minimal 10 karakter');
            isValid = false;
        }

        // If valid, show success
        if (isValid) {
            // Show loading state
            const btnText = form.querySelector('.btn-text');
            const btnLoading = form.querySelector('.btn-loading');

            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline';

            // Simulate form submission
            setTimeout(function () {
                form.style.display = 'none';
                if (formSuccess) {
                    formSuccess.style.display = 'block';
                }
            }, 1500);
        }
    });

    // Real-time validation feedback
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateField(this);
        });

        input.addEventListener('input', function () {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });
}

function showError(input, errorId, message) {
    input.classList.add('error');
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearErrors() {
    const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
    const errors = document.querySelectorAll('.error-message');

    inputs.forEach(input => input.classList.remove('error'));
    errors.forEach(error => error.textContent = '');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateField(field) {
    const errorId = field.id + '-error';
    const errorElement = document.getElementById(errorId);

    if (!errorElement) return;

    let isValid = true;
    let message = '';

    switch (field.id) {
        case 'name':
            if (!field.value.trim()) {
                message = 'Nama harus diisi';
                isValid = false;
            } else if (field.value.trim().length < 2) {
                message = 'Nama minimal 2 karakter';
                isValid = false;
            }
            break;
        case 'email':
            if (!field.value.trim()) {
                message = 'Email harus diisi';
                isValid = false;
            } else if (!isValidEmail(field.value)) {
                message = 'Format email tidak valid';
                isValid = false;
            }
            break;
        case 'message':
            if (!field.value.trim()) {
                message = 'Pesan harus diisi';
                isValid = false;
            } else if (field.value.trim().length < 10) {
                message = 'Pesan minimal 10 karakter';
                isValid = false;
            }
            break;
    }

    if (isValid) {
        field.classList.remove('error');
        errorElement.textContent = '';
    } else {
        field.classList.add('error');
        errorElement.textContent = message;
    }
}

// Reset form function (called from button)
function resetForm() {
    const form = document.getElementById('contact-form');
    const formSuccess = document.getElementById('form-success');
    const btnText = form?.querySelector('.btn-text');
    const btnLoading = form?.querySelector('.btn-loading');

    if (form) {
        form.reset();
        form.style.display = 'block';
        clearErrors();
    }
    if (formSuccess) {
        formSuccess.style.display = 'none';
    }
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
}

/* ---------- Scroll Animations ---------- */
function initScrollAnimations() {
    // Add fade-in animation on scroll
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

    // Observe elements
    const animatedElements = document.querySelectorAll(
        '.feature-card, .menu-card, .testimonial-card, .value-card, .team-card, .journey-step'
    );

    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });
}

// Add animate-in class styles dynamically
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
