(function () {
    var hamburger = document.getElementById('hamburger');
    var mobileNav = document.getElementById('mobile-nav');

    if (!hamburger || !mobileNav) return;

    function openMenu() {
        hamburger.classList.add('is-open');
        mobileNav.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        hamburger.setAttribute('aria-expanded', 'true');
        mobileNav.setAttribute('aria-hidden', 'false');
    }

    function closeMenu() {
        hamburger.classList.remove('is-open');
        mobileNav.classList.remove('is-open');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
    }

    hamburger.addEventListener('click', function () {
        if (hamburger.classList.contains('is-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    var links = mobileNav.querySelectorAll('.mobile-nav__item');
    links.forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });
})();
