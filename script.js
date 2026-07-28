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

const onScroll = () => {
  setHeaderState();

  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateParallax();
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
  window.setTimeout(() => {
    loader?.classList.add("is-hidden");
  }, 2300);
});

window.addEventListener("scroll", onScroll, { passive: true });
setHeaderState();
updateParallax();

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
