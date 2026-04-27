const slides = Array.from(document.querySelectorAll('.slide'));
const hudValue = document.querySelector('.slider-hud__value');
const pageSlider = document.querySelector('.page-slider');
const materialCards = Array.from(document.querySelectorAll('.material-card'));
const materialGroups = Array.from(document.querySelectorAll('.slide-materials'));
const slideCounterFace = document.getElementById('slide-counter-face');

const SCROLL_DISTANCE = 600;
const SNAP_THRESHOLD = 0.38;
const IDLE_DELAY = 90;

const slideParts = slides.map((slide) => ({
    slide,
    visual: slide.querySelector('.slide-visual'),
    overlay: slide.querySelector('.slide-overlay'),
    title: slide.querySelector('.slide-title'),
    rule: slide.querySelector('.slide-rule'),
    direction: slide.querySelector('.slide-direction'),
    kicker: slide.querySelector('.slide-kicker'),
    copy: slide.querySelector('.slide-copy'),
    materials: slide.querySelector('.slide-materials')
}));

let activeIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));
let transition = null;
let settleTimer = null;
let isSettling = false;
let previewHideTimer = null;
let materialPreviewImage = '';
let isMaterialPreviewVisible = false;

const materialPreview = pageSlider ? document.createElement('div') : null;

if (materialPreview && pageSlider) {
    materialPreview.className = 'material-preview';
    pageSlider.prepend(materialPreview);
    gsap.set(materialPreview, { autoAlpha: 0, opacity: 0 });
}

if (activeIndex < 0) activeIndex = 0;

function updateHud(index) {
    if (!hudValue) return;
    hudValue.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
}

function flipCounter(index, animate) {
    const newDigit = String(index + 1);
    if (!slideCounterFace) return;
    if (!animate) {
        slideCounterFace.textContent = newDigit;
        return;
    }
    gsap.to(slideCounterFace, {
        rotateX: -90,
        opacity: 0,
        duration: 0.16,
        ease: 'power1.in',
        overwrite: true,
        onComplete: () => {
            slideCounterFace.textContent = newDigit;
            gsap.fromTo(slideCounterFace,
                { rotateX: 90, opacity: 0 },
                { rotateX: 0, opacity: 1, duration: 0.2, ease: 'power1.out' }
            );
        }
    });
}

function resolveMaterialImage(materialCard) {
    const swatch = materialCard.querySelector('.material-card__swatch');
    if (!swatch) return '';
    const inlineMaterialImage = swatch.style.getPropertyValue('--material-image').trim();
    if (inlineMaterialImage) return inlineMaterialImage;
    const swatchStyles = getComputedStyle(swatch);
    return swatchStyles.getPropertyValue('--material-image').trim() || swatchStyles.backgroundImage;
}

function setActiveSlidePreviewState(isVisible) {
    const current = slideParts[activeIndex];
    if (!current) return;
    isMaterialPreviewVisible = isVisible;
}

function hideMaterialPreview(delay = 0) {
    if (!materialPreview) return;
    clearTimeout(previewHideTimer);
    const hide = () => {
        setActiveSlidePreviewState(false);
        gsap.to(materialPreview, {
            opacity: 0, duration: 0.28, ease: 'power2.out', overwrite: true,
            onComplete: () => { materialPreviewImage = ''; gsap.set(materialPreview, { autoAlpha: 0 }); }
        });
    };
    if (delay > 0) { previewHideTimer = window.setTimeout(hide, delay); return; }
    hide();
}

function showMaterialPreview(image) {
    if (!materialPreview || !image) return;
    clearTimeout(previewHideTimer);
    const reveal = () => {
        materialPreviewImage = image;
        materialPreview.style.backgroundImage = image;
        gsap.set(materialPreview, { autoAlpha: 1 });
        setActiveSlidePreviewState(true);
        gsap.to(materialPreview, { opacity: 0.1, duration: 0.32, ease: 'power2.out', overwrite: true });
    };
    if (!materialPreviewImage || materialPreviewImage === image) { reveal(); return; }
    gsap.to(materialPreview, { opacity: 0, duration: 0.18, ease: 'power1.out', overwrite: true, onComplete: reveal });
}

function resetSlide(parts) {
    parts.slide.classList.remove('is-active');
    gsap.set(parts.slide, { autoAlpha: 0, zIndex: 0 });
    gsap.set(parts.visual, { scale: 1, opacity: 1 });
    gsap.set(parts.overlay, { opacity: 0.92 });
    gsap.set(parts.title, { y: 0, autoAlpha: 1 });
    gsap.set(parts.rule, { y: 0, autoAlpha: 1, scaleX: 1, transformOrigin: 'left center' });
    gsap.set(parts.direction, { y: 0, autoAlpha: 1 });
    gsap.set(parts.kicker, { y: 0, autoAlpha: 1 });
    gsap.set(parts.copy, { y: 0, autoAlpha: 1 });
    gsap.set(parts.materials, { y: 0, autoAlpha: 1 });
}

function animateInSlide(parts) {
    gsap.set(parts.title, { y: 56, autoAlpha: 0 });
    gsap.set(parts.rule, { y: 22, autoAlpha: 0, scaleX: 0.7, transformOrigin: 'left center' });
    gsap.set(parts.direction, { y: 28, autoAlpha: 0 });
    gsap.set(parts.kicker, { y: 20, autoAlpha: 0 });
    gsap.set(parts.copy, { y: 28, autoAlpha: 0 });
    gsap.set(parts.materials, { y: 32, autoAlpha: 0 });

    const tl = gsap.timeline();
    tl.to(parts.title,     { y: 0, autoAlpha: 1, duration: 0.72, ease: 'power3.out' }, 0)
      .to(parts.rule,      { y: 0, autoAlpha: 1, scaleX: 1, duration: 0.58, ease: 'power3.out' }, 0.08)
      .to(parts.direction, { y: 0, autoAlpha: 1, duration: 0.48, ease: 'power2.out' }, 0.18)
      .to(parts.kicker,    { y: 0, autoAlpha: 1, duration: 0.44, ease: 'power2.out' }, 0.16)
      .to(parts.copy,      { y: 0, autoAlpha: 1, duration: 0.5,  ease: 'power2.out' }, 0.22)
      .to(parts.materials, { y: 0, autoAlpha: 1, duration: 0.56, ease: 'power2.out' }, 0.3);
}

function showActiveSlide(index, animateContent) {
    hideMaterialPreview();
    slideParts.forEach((parts, i) => { if (i !== index) resetSlide(parts); });

    const current = slideParts[index];
    current.slide.classList.add('is-active');
    gsap.set(current.slide, { autoAlpha: 1, zIndex: 1 });
    gsap.set(current.visual, { scale: 1, opacity: 1 });
    gsap.set(current.overlay, { opacity: 0.92 });

    if (materialPreview) {
        current.visual.after(materialPreview);
    }

    if (animateContent) {
        animateInSlide(current);
    } else {
        gsap.set(current.title,     { y: 0, autoAlpha: 1 });
        gsap.set(current.rule,      { y: 0, autoAlpha: 1, scaleX: 1, transformOrigin: 'left center' });
        gsap.set(current.direction, { y: 0, autoAlpha: 1 });
        gsap.set(current.kicker,    { y: 0, autoAlpha: 1 });
        gsap.set(current.copy,      { y: 0, autoAlpha: 1 });
        gsap.set(current.materials, { y: 0, autoAlpha: 1 });
    }
    updateHud(index);
    flipCounter(index, animateContent);
}

function buildTransition(direction) {
    const toIndex = activeIndex + direction;
    if (toIndex < 0 || toIndex >= slides.length) return null;

    const current = slideParts[activeIndex];
    const target = slideParts[toIndex];

    current.slide.classList.add('is-active');
    target.slide.classList.add('is-active');

    gsap.set(current.slide, { autoAlpha: 1, zIndex: 2 });
    gsap.set(target.slide,  { autoAlpha: 1, zIndex: 1 });
    gsap.set(target.visual,    { scale: direction > 0 ? 1.06 : 0.97, opacity: 0.18 });
    gsap.set(target.overlay,   { opacity: 0.98 });
    gsap.set(target.title,     { autoAlpha: 0 });
    gsap.set(target.rule,      { autoAlpha: 0 });
    gsap.set(target.direction, { autoAlpha: 0 });
    gsap.set(target.kicker,    { autoAlpha: 0 });
    gsap.set(target.copy,      { autoAlpha: 0 });
    gsap.set(target.materials, { autoAlpha: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(current.visual,    { scale: direction > 0 ? 1.1 : 0.96, opacity: 0, duration: 0.8, ease: 'none' }, 0);
    tl.to(current.overlay,   { opacity: 0.15,                                  duration: 0.8, ease: 'none' }, 0);
    tl.to(current.title,     { y: direction > 0 ? -78 : 78, autoAlpha: 0,      duration: 0.45, ease: 'none' }, 0);
    tl.to(current.rule,      { scaleX: 0.45, autoAlpha: 0,                     duration: 0.35, ease: 'none', transformOrigin: 'left center' }, 0.06);
    tl.to(current.direction, { y: direction > 0 ? 36 : -36, autoAlpha: 0,      duration: 0.32, ease: 'none' }, 0.08);
    tl.to(current.kicker,    { y: direction > 0 ? 28 : -28, autoAlpha: 0,      duration: 0.28, ease: 'none' }, 0.04);
    tl.to(current.copy,      { y: direction > 0 ? 44 : -44, autoAlpha: 0,      duration: 0.34, ease: 'none' }, 0.06);
    tl.to(current.materials, { y: direction > 0 ? 56 : -56, autoAlpha: 0,      duration: 0.32, ease: 'none' }, 0.1);
    tl.to(target.visual,     { scale: 1, opacity: 1,                            duration: 0.8, ease: 'none' }, 0);
    tl.to(target.overlay,    { opacity: 0.92,                                   duration: 0.8, ease: 'none' }, 0);

    return { direction, toIndex, timeline: tl, distance: 0 };
}

function finishTransition(commit) {
    const activeTransition = transition;
    if (!activeTransition) return;

    clearTimeout(settleTimer);
    isSettling = true;

    gsap.to(activeTransition.timeline, {
        progress: commit ? 1 : 0,
        duration: commit ? 0.2 : 0.25,
        ease: commit ? 'power2.out' : 'power2.inOut',
        overwrite: true,
        onComplete: () => {
            activeTransition.timeline.kill();
            if (commit) activeIndex = activeTransition.toIndex;
            showActiveSlide(activeIndex, commit);
            transition = null;
            isSettling = false;
        }
    });
}

function scheduleSettle() {
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
        if (!transition) return;
        const progress = transition.distance / SCROLL_DISTANCE;
        finishTransition(progress >= SNAP_THRESHOLD);
    }, IDLE_DELAY);
}

function onWheel(event) {
    event.preventDefault();
    if (isMaterialPreviewVisible) hideMaterialPreview();
    if (isSettling || slides.length < 2) return;

    const delta = event.deltaY;
    if (Math.abs(delta) < 2) return;

    if (!transition) {
        transition = buildTransition(delta > 0 ? 1 : -1);
        if (!transition) return;
    }

    transition.distance = gsap.utils.clamp(0, SCROLL_DISTANCE, transition.distance + (delta * transition.direction));
    transition.timeline.progress(transition.distance / SCROLL_DISTANCE);
    scheduleSettle();
}

materialCards.forEach((card) => {
    card.addEventListener('mouseenter', () => { showMaterialPreview(resolveMaterialImage(card)); });
    card.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showMaterialPreview(resolveMaterialImage(card));
    }, { passive: false });
});

materialGroups.forEach((group) => {
    group.addEventListener('mouseleave', () => { hideMaterialPreview(40); });
});

document.addEventListener('touchstart', (e) => {
    if (!isMaterialPreviewVisible) return;
    const insideGroup = materialGroups.some(g => g.contains(e.target));
    if (!insideGroup) hideMaterialPreview();
}, { passive: true });

showActiveSlide(activeIndex, false);
window.addEventListener('wheel', onWheel, { passive: false });