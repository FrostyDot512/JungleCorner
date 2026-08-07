const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const loader = document.querySelector(".loader");
const revealElements = document.querySelectorAll(".reveal");
const parallaxTarget = document.querySelector("[data-parallax]");
const gallery = document.querySelector("[data-horizontal-gallery]");
const testimonials = document.querySelectorAll(".testimonial");
const testimonialPrev = document.querySelector("[data-testimonial-prev]");
const testimonialNext = document.querySelector("[data-testimonial-next]");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const year = document.querySelector("[data-year]");

let activeTestimonial = 0;
let ticking = false;

const setHeaderState = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 18);
};

const closeNavigation = () => {
  if (!nav || !navToggle || !header) return;
  document.body.classList.remove("nav-open");
  nav.classList.remove("is-open");
  header.classList.remove("is-open");
  navToggle.classList.remove("is-active");
  navToggle.setAttribute("aria-expanded", "false");
};

const openNavigation = () => {
  if (!nav || !navToggle || !header) return;
  document.body.classList.add("nav-open");
  nav.classList.add("is-open");
  header.classList.add("is-open");
  navToggle.classList.add("is-active");
  navToggle.setAttribute("aria-expanded", "true");
};

const updateParallax = () => {
  if (!parallaxTarget) return;
  const offset = Math.min(window.scrollY * 0.16, 90);
  parallaxTarget.style.transform = `translate3d(0, ${offset}px, 0) scale(1.08)`;
};

const updateLeafParallax = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const leaves = document.querySelectorAll(".jungle-leaf-wrapper");
  const scrollY = window.scrollY;
  leaves.forEach((leaf) => {
    const speed = parseFloat(leaf.getAttribute("data-speed")) || 0.05;
    const yOffset = scrollY * speed;
    leaf.style.transform = `translate3d(0, ${yOffset}px, 0)`;
  });
};

const onScroll = () => {
  setHeaderState();

  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateParallax();
      updateLeafParallax();
      ticking = false;
    });
    ticking = true;
  }
};

const showTestimonial = (index) => {
  if (!testimonials.length) return;
  activeTestimonial = (index + testimonials.length) % testimonials.length;
  testimonials.forEach((item, itemIndex) => {
    item.classList.toggle("active", itemIndex === activeTestimonial);
  });
};

window.addEventListener("load", () => {
  // ── Juice-fill animation ──────────────────────────────────────────────────
  // All timing is in milliseconds from the moment "load" fires.
  const DELAY_START   =  300;   // pause before juice begins rising
  const DURATION_RISE = 1500;   // how long the rise takes
  const HOLD_AFTER    =  300;   // pause after letters are full before fade-out
  const FADE_DURATION =  500;   // CSS transition duration on .loader

  // SVG viewBox dimensions (must match the viewBox="0 0 800 200" in HTML)
  const VB_W = 800;
  const VB_H = 200;

  // Liquid starts this many viewBox units *below* the bottom of the canvas
  // so letters are fully empty at t=0.
  const LIQUID_START_Y = VB_H + 40;   // well below the canvas → invisible
  const LIQUID_END_Y   = -10;         // above the canvas → letters fully full

  // Wave parameters
  const WAVE_AMP    = 5;     // amplitude in viewBox units (keep subtle)
  const WAVE_FREQ   = 0.012; // spatial frequency
  const WAVE_SPEED  = 1.8;   // horizontal drift speed (viewBox units/ms)

  const fillEl    = document.getElementById("juice-fill");
  const waveEl    = document.getElementById("juice-wave");
  const rectEl    = document.getElementById("juice-rect");
  const outlineEl = document.getElementById("outline-text");

  // If SVG elements aren't found (e.g. page changed), fall back gracefully.
  if (!fillEl || !waveEl || !rectEl || !outlineEl) {
    setTimeout(() => loader?.classList.add("is-hidden"), 2300);
    return;
  }

  // Set the rect to start below the canvas (letters are empty).
  // The rect's y + the wave path together form the liquid body.
  // We'll update both every frame.
  let startTime = null;
  let outlineFaded = false;

  function easeInOut(t) {
    // Smooth cubic ease-in-out
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function buildWavePath(liquidY, waveOffset) {
    // Build a closed SVG path whose top edge is a sine wave.
    // The shape covers from the wave top all the way down past the canvas.
    const steps = 40;
    const step  = VB_W / steps;
    let d = "";

    // Move to start point on the left
    const y0 = liquidY + Math.sin(waveOffset * WAVE_SPEED * 0.001) * WAVE_AMP;
    d += `M -10 ${y0} `;

    // Draw sine wave across the top
    for (let i = 0; i <= steps; i++) {
      const x   = -10 + i * step;
      const ang = (x * WAVE_FREQ) + (waveOffset * WAVE_SPEED * 0.001);
      const y   = liquidY + Math.sin(ang) * WAVE_AMP;
      d += `L ${x} ${y} `;
    }

    // Close the path downward, covering the whole bottom
    d += `L ${VB_W + 10} ${VB_H + 20} L -10 ${VB_H + 20} Z`;
    return d;
  }

  function frame(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;

    // ── Phase 1: delay ───────────────────────────────────────────────────────
    if (elapsed < DELAY_START) {
      // Keep liquid completely below the canvas — letters stay empty
      const hiddenY = LIQUID_START_Y;
      waveEl.setAttribute("d", buildWavePath(hiddenY, elapsed));
      rectEl.setAttribute("y", hiddenY);
      requestAnimationFrame(frame);
      return;
    }

    // ── Phase 2: rise ────────────────────────────────────────────────────────
    const riseElapsed = elapsed - DELAY_START;

    if (riseElapsed < DURATION_RISE) {
      const progress  = easeInOut(Math.min(riseElapsed / DURATION_RISE, 1));
      const liquidY   = LIQUID_START_Y + (LIQUID_END_Y - LIQUID_START_Y) * progress;

      // Update wave path (top edge of liquid)
      waveEl.setAttribute("d", buildWavePath(liquidY, elapsed));
      // Update rect so the solid body fills from the wave down
      rectEl.setAttribute("y",      liquidY + WAVE_AMP);
      rectEl.setAttribute("height", VB_H + 40);

      requestAnimationFrame(frame);
      return;
    }

    // ── Phase 3: fully filled — fade outline ─────────────────────────────────
    // Ensure final state is locked
    waveEl.setAttribute("d", buildWavePath(LIQUID_END_Y, elapsed));
    rectEl.setAttribute("y",      LIQUID_END_Y + WAVE_AMP);
    rectEl.setAttribute("height", VB_H + 40);

    if (!outlineFaded) {
      outlineEl.style.opacity = "0";
      outlineFaded = true;
    }

    // ── Phase 4: hold → fade screen out ──────────────────────────────────────
    const holdElapsed = riseElapsed - DURATION_RISE;
    if (holdElapsed >= HOLD_AFTER) {
      loader?.classList.add("is-hidden");
      return; // stop the loop
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
});

window.addEventListener("scroll", onScroll, { passive: true });
setHeaderState();
updateParallax();
updateLeafParallax();

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

if (navToggle) {
  navToggle.addEventListener("click", () => {
    nav?.classList.contains("is-open") ? closeNavigation() : openNavigation();
  });
}

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeNavigation);
});

gallery?.addEventListener(
  "wheel",
  (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    gallery.scrollLeft += event.deltaY;
  },
  { passive: false }
);

testimonialPrev?.addEventListener("click", () => showTestimonial(activeTestimonial - 1));
testimonialNext?.addEventListener("click", () => showTestimonial(activeTestimonial + 1));

window.setInterval(() => {
  showTestimonial(activeTestimonial + 1);
}, 6500);

document.addEventListener("pointermove", (event) => {
  const x = (event.clientX / window.innerWidth) * 100;
  const y = (event.clientY / window.innerHeight) * 100;
  document.documentElement.style.setProperty("--pointer-x", `${x}%`);
  document.documentElement.style.setProperty("--pointer-y", `${y}%`);
});

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const name = data.get("name")?.toString().trim() || "there";
  const message = data.get("message")?.toString().trim() || "your message";

  if (formStatus) {
    formStatus.textContent = `Thanks, ${name}. Your inquiry is ready for the Jungle Corner team: "${message}"`;
  }

  contactForm.reset();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNavigation();
});

if (year) {
  year.textContent = new Date().getFullYear();
}

// ── Digital Menu Booklet & Flipbook System ─────────────────────────────────
const menuPagesData = [
  { title: "Jungle Signatures", src: "Menu/jungle SIGNATURE.png", catPage: 1 },
  { title: "Jungle Classics Vol. 1", src: "Menu/Jungle classics.png", catPage: 1 },
  { title: "Jungle Classics Vol. 2", src: "Menu/jungleClassics.png", catPage: 1 },
  { title: "Jungle Specials", src: "Menu/more Jungle.png", catPage: 1 },
  { title: "Ceremonial Matcha", src: "Menu/matcha.png", catPage: 5 },
  { title: "Fresh Milk Matcha", src: "Menu/matches (fresh milk).png", catPage: 5 },
  { title: "Matcha Additions", src: "Menu/matches (add).png", catPage: 5 },
  { title: "Artisan Lattes", src: "Menu/lattes.png", catPage: 8 },
  { title: "Specialty Lattes", src: "Menu/more lattes.png", catPage: 8 },
  { title: "Signature Iced Teas", src: "Menu/iced tea.png", catPage: 10 },
  { title: "Fresh Brewed Iced Teas", src: "Menu/iced tea (fresh).png", catPage: 10 },
  { title: "Jungle Frostys", src: "Menu/Frostys.png", catPage: 12 },
  { title: "Frosty Specials", src: "Menu/Frosty + specials.png", catPage: 12 },
  { title: "Icey Joys", src: "Menu/Icey joys.png", catPage: 14 },
  { title: "Icey Joys Deluxe", src: "Menu/more Icey joys.png", catPage: 14 },
  { title: "American Classics", src: "Menu/America.png", catPage: 16 },
  { title: "All-American Favorites", src: "Menu/more America .png", catPage: 16 }
];

const bookletPagesContainer = document.getElementById("booklet-pages");
const bookletStage = document.getElementById("booklet-stage");
const prevBtn = document.getElementById("booklet-prev-btn");
const nextBtn = document.getElementById("booklet-next-btn");
const pageTitleEl = document.getElementById("booklet-page-title");
const counterTextEl = document.getElementById("booklet-counter-text");
const viewFullMenuLink = document.getElementById("view-full-menu-link");
const pillBtns = document.querySelectorAll("#menu-category-pills .pill-btn");
const zoomBtn = document.getElementById("booklet-zoom-btn");

// Modal elements
const menuModal = document.getElementById("menu-modal");
const menuModalImg = document.getElementById("menu-modal-img");
const menuModalCaption = document.getElementById("menu-modal-caption");
const menuModalClose = document.getElementById("menu-modal-close");
const menuModalBackdrop = document.getElementById("menu-modal-backdrop");

let currentPageIndex = 0;
let isFlipping = false;

function initBooklet() {
  if (!bookletPagesContainer) return;

  bookletPagesContainer.innerHTML = "";
  menuPagesData.forEach((data, index) => {
    const pageDiv = document.createElement("div");
    pageDiv.className = `booklet-page ${index === 0 ? "active" : ""}`;
    pageDiv.setAttribute("data-index", index);

    const img = document.createElement("img");
    if (index === 0 || index <= 2) {
      img.src = data.src;
    } else {
      img.setAttribute("data-src", data.src);
    }
    img.alt = `Jungle Corner Menu - ${data.title}`;
    img.setAttribute("loading", index === 0 ? "eager" : "lazy");

    pageDiv.appendChild(img);
    bookletPagesContainer.appendChild(pageDiv);
  });

  updateBookletState();
}

function updateBookletState() {
  const total = menuPagesData.length;
  const current = menuPagesData[currentPageIndex];

  if (pageTitleEl) pageTitleEl.textContent = current.title;
  if (counterTextEl) counterTextEl.textContent = `Page ${currentPageIndex + 1} of ${total}`;
  if (viewFullMenuLink) viewFullMenuLink.href = current.src;

  if (prevBtn) prevBtn.disabled = currentPageIndex === 0;
  if (nextBtn) nextBtn.disabled = currentPageIndex === total - 1;

  pillBtns.forEach((pill) => {
    const targetPage = parseInt(pill.getAttribute("data-page"), 10) - 1;
    let isActive = false;
    if (currentPageIndex < 4 && targetPage === 0) isActive = true;
    else if (currentPageIndex >= 4 && currentPageIndex < 7 && targetPage === 4) isActive = true;
    else if (currentPageIndex >= 7 && currentPageIndex < 9 && targetPage === 7) isActive = true;
    else if (currentPageIndex >= 9 && currentPageIndex < 11 && targetPage === 9) isActive = true;
    else if (currentPageIndex >= 11 && currentPageIndex < 15 && targetPage === 11) isActive = true;
    else if (currentPageIndex >= 15 && targetPage === 15) isActive = true;

    pill.classList.toggle("active", isActive);
  });

  [currentPageIndex - 1, currentPageIndex, currentPageIndex + 1].forEach((idx) => {
    if (idx >= 0 && idx < total) {
      const pageEl = bookletPagesContainer.children[idx];
      if (pageEl) {
        const img = pageEl.querySelector("img");
        if (img && !img.src && img.getAttribute("data-src")) {
          img.src = img.getAttribute("data-src");
        }
      }
    }
  });
}

function flipToPage(targetIndex, direction = "next") {
  if (isFlipping || targetIndex === currentPageIndex) return;
  if (targetIndex < 0 || targetIndex >= menuPagesData.length) return;

  isFlipping = true;
  const oldIndex = currentPageIndex;
  currentPageIndex = targetIndex;

  const pages = bookletPagesContainer.children;
  const oldPage = pages[oldIndex];
  const newPage = pages[currentPageIndex];

  const newImg = newPage.querySelector("img");
  if (newImg && !newImg.src && newImg.getAttribute("data-src")) {
    newImg.src = newImg.getAttribute("data-src");
  }

  if (direction === "next") {
    oldPage.classList.add("flip-out-next");
  } else {
    oldPage.classList.add("flip-out-prev");
  }

  setTimeout(() => {
    oldPage.classList.remove("active", "flip-out-next", "flip-out-prev");
    newPage.classList.add("active");
    updateBookletState();
    isFlipping = false;
  }, 450);
}

nextBtn?.addEventListener("click", () => {
  if (currentPageIndex < menuPagesData.length - 1) {
    flipToPage(currentPageIndex + 1, "next");
  }
});

prevBtn?.addEventListener("click", () => {
  if (currentPageIndex > 0) {
    flipToPage(currentPageIndex - 1, "prev");
  }
});

pillBtns.forEach((pill) => {
  pill.addEventListener("click", () => {
    const targetPageNum = parseInt(pill.getAttribute("data-page"), 10) - 1;
    const dir = targetPageNum > currentPageIndex ? "next" : "prev";
    flipToPage(targetPageNum, dir);
  });
});

document.addEventListener("keydown", (e) => {
  if (menuModal?.getAttribute("aria-hidden") === "false") {
    if (e.key === "Escape") closeMenuModal();
    if (e.key === "ArrowRight" && currentPageIndex < menuPagesData.length - 1) {
      flipToPage(currentPageIndex + 1, "next");
      openMenuModal(currentPageIndex);
    }
    if (e.key === "ArrowLeft" && currentPageIndex > 0) {
      flipToPage(currentPageIndex - 1, "prev");
      openMenuModal(currentPageIndex);
    }
    return;
  }

  const rect = bookletStage?.getBoundingClientRect();
  const isVisible = rect && rect.top < window.innerHeight && rect.bottom > 0;

  if (isVisible) {
    if (e.key === "ArrowRight" && currentPageIndex < menuPagesData.length - 1) {
      flipToPage(currentPageIndex + 1, "next");
    } else if (e.key === "ArrowLeft" && currentPageIndex > 0) {
      flipToPage(currentPageIndex - 1, "prev");
    }
  }
});

let touchStartX = 0;
let touchStartY = 0;

bookletStage?.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

bookletStage?.addEventListener("touchend", (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
    if (deltaX < 0 && currentPageIndex < menuPagesData.length - 1) {
      flipToPage(currentPageIndex + 1, "next");
    } else if (deltaX > 0 && currentPageIndex > 0) {
      flipToPage(currentPageIndex - 1, "prev");
    }
  }
});

function openMenuModal(index) {
  const page = menuPagesData[index];
  if (!page || !menuModal || !menuModalImg) return;

  menuModalImg.src = page.src;
  if (menuModalCaption) menuModalCaption.textContent = `${page.title} (Page ${index + 1} of ${menuPagesData.length})`;
  menuModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeMenuModal() {
  if (!menuModal) return;
  menuModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

zoomBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  openMenuModal(currentPageIndex);
});

bookletStage?.addEventListener("dblclick", () => {
  openMenuModal(currentPageIndex);
});

menuModalClose?.addEventListener("click", closeMenuModal);
menuModalBackdrop?.addEventListener("click", closeMenuModal);

initBooklet();

// ── Gallery Lightbox Controller System ─────────────────────────────────────
const galleryItemsData = [
  { type: "video", title: "Evening Lounge Experience", src: "assets/images/Video-87941.mp4" },
  { type: "image", title: "Signature Artisanal Cake", src: "assets/images/Cake.png" },
  { type: "image", title: "Café Delights Spread", src: "assets/images/Everything.jpg" },
  { type: "image", title: "Craft Beverages & Brews", src: "assets/images/beer.jpg" },
  { type: "image", title: "Fresh Tropical Juices", src: "assets/images/Juice.png" },
  { type: "image", title: "Zesty Lemon Refreshers", src: "assets/images/lemon.jpg" },
  { type: "image", title: "Vinyl Records & Live Beats", src: "assets/images/records.jpg" },
  { type: "video", title: "Tropical Beats & Vibes", src: "assets/images/Jungle.mp4" }
];

const galleryCards = document.querySelectorAll(".gallery-card");
const lightboxModal = document.getElementById("lightbox-modal");
const lightboxBackdrop = document.getElementById("lightbox-backdrop");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxPrev = document.getElementById("lightbox-prev-btn");
const lightboxNext = document.getElementById("lightbox-next-btn");
const lightboxStage = document.getElementById("lightbox-stage");
const lightboxCaption = document.getElementById("lightbox-caption");
const lightboxCounter = document.getElementById("lightbox-counter");

let currentGalleryIndex = 0;
let lastFocusedElement = null;

function renderLightboxMedia(index) {
  if (!lightboxStage) return;

  // Teardown previous video playback if running
  const prevVideo = lightboxStage.querySelector("video");
  if (prevVideo) {
    prevVideo.pause();
    prevVideo.currentTime = 0;
  }

  lightboxStage.innerHTML = "";
  const item = galleryItemsData[index];
  if (!item) return;

  if (item.type === "image") {
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.title;
    lightboxStage.appendChild(img);
  } else if (item.type === "video") {
    const video = document.createElement("video");
    video.src = item.src;
    video.controls = true;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    lightboxStage.appendChild(video);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        video.muted = true;
        video.play();
      });
    }
  }

  if (lightboxCaption) lightboxCaption.textContent = item.title;
  if (lightboxCounter) lightboxCounter.textContent = `${index + 1} / ${galleryItemsData.length}`;
}

function openGalleryModal(index) {
  if (index < 0 || index >= galleryItemsData.length || !lightboxModal) return;

  lastFocusedElement = document.activeElement;
  currentGalleryIndex = index;
  renderLightboxMedia(currentGalleryIndex);

  lightboxModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  lightboxClose?.focus();
}

function closeGalleryModal() {
  if (!lightboxModal || lightboxModal.getAttribute("aria-hidden") === "true") return;

  const video = lightboxStage?.querySelector("video");
  if (video) {
    video.pause();
    video.currentTime = 0;
  }

  lightboxModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function navigateGallery(direction) {
  if (lightboxModal?.getAttribute("aria-hidden") === "true") return;
  const total = galleryItemsData.length;
  if (direction === "next") {
    currentGalleryIndex = (currentGalleryIndex + 1) % total;
  } else if (direction === "prev") {
    currentGalleryIndex = (currentGalleryIndex - 1 + total) % total;
  }
  renderLightboxMedia(currentGalleryIndex);
}

galleryCards.forEach((card) => {
  card.addEventListener("click", () => {
    const idx = parseInt(card.getAttribute("data-gallery-index"), 10);
    openGalleryModal(idx);
  });

  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const idx = parseInt(card.getAttribute("data-gallery-index"), 10);
      openGalleryModal(idx);
    }
  });
});

lightboxClose?.addEventListener("click", closeGalleryModal);
lightboxBackdrop?.addEventListener("click", closeGalleryModal);
lightboxModal?.addEventListener("click", (e) => {
  const isMediaClick = e.target.closest(".lightbox-stage img") || 
                       e.target.closest(".lightbox-stage video") || 
                       e.target.closest(".lightbox-nav") || 
                       e.target.closest(".lightbox-close");
  if (!isMediaClick) {
    closeGalleryModal();
  }
});
lightboxNext?.addEventListener("click", () => navigateGallery("next"));
lightboxPrev?.addEventListener("click", () => navigateGallery("prev"));

document.addEventListener("keydown", (e) => {
  if (!lightboxModal || lightboxModal.getAttribute("aria-hidden") === "true") return;

  if (e.key === "Escape") {
    closeGalleryModal();
  } else if (e.key === "ArrowRight") {
    navigateGallery("next");
  } else if (e.key === "ArrowLeft") {
    navigateGallery("prev");
  } else if (e.key === "Tab") {
    const focusables = lightboxModal.querySelectorAll("button, [tabindex]:not([tabindex='-1'])");
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

let galleryTouchStartX = 0;
let galleryTouchStartY = 0;

lightboxModal?.addEventListener("touchstart", (e) => {
  galleryTouchStartX = e.touches[0].clientX;
  galleryTouchStartY = e.touches[0].clientY;
}, { passive: true });

lightboxModal?.addEventListener("touchend", (e) => {
  if (lightboxModal.getAttribute("aria-hidden") === "true") return;
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const deltaX = touchEndX - galleryTouchStartX;
  const deltaY = touchEndY - galleryTouchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
    if (deltaX < 0) {
      navigateGallery("next");
    } else {
      navigateGallery("prev");
    }
  }
});
