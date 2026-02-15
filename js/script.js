document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("js-ready");

    const body = document.body;
    const header = document.querySelector(".site-header");
    const navToggle = document.querySelector(".nav-toggle");
    const navToggleLabel = navToggle?.querySelector(".nav-toggle-label");
    const siteNav = document.querySelector(".site-nav");
    const navBackdrop = document.querySelector(".nav-backdrop");
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));
    const sections = Array.from(document.querySelectorAll(".section-observe"));
    const revealItems = Array.from(document.querySelectorAll(".reveal"));
    const progressBar = document.querySelector(".scroll-progress-bar");
    const statValues = Array.from(document.querySelectorAll(".stat-value[data-count]"));
    const motionCards = Array.from(document.querySelectorAll(".service-card, .timeline-item, .stat-card"));

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const mobileNavQuery = window.matchMedia("(max-width: 760px)");

    const getHeaderOffset = () => (header ? header.offsetHeight + 12 : 82);

    const setActiveLink = (id) => {
        navLinks.forEach((link) => {
            const linkTarget = link.getAttribute("href")?.replace("#", "");
            const isActive = linkTarget === id;
            link.classList.toggle("active", isActive);
            if (isActive) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };

    const closeMobileNav = () => {
        if (!navToggle || !siteNav || !navBackdrop) {
            return;
        }

        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open navigation menu");
        if (navToggleLabel) {
            navToggleLabel.textContent = "Menu";
        }
        siteNav.classList.remove("open");
        navBackdrop.hidden = true;
        body.classList.remove("nav-open");
    };

    const openMobileNav = () => {
        if (!navToggle || !siteNav || !navBackdrop) {
            return;
        }

        navToggle.setAttribute("aria-expanded", "true");
        navToggle.setAttribute("aria-label", "Close navigation menu");
        if (navToggleLabel) {
            navToggleLabel.textContent = "Close";
        }
        siteNav.classList.add("open");
        navBackdrop.hidden = false;
        body.classList.add("nav-open");
    };

    if (navToggle && siteNav && navBackdrop) {
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open navigation menu");
        navBackdrop.hidden = true;

        navToggle.addEventListener("click", () => {
            const expanded = navToggle.getAttribute("aria-expanded") === "true";
            if (expanded) {
                closeMobileNav();
            } else {
                openMobileNav();
            }
        });

        navBackdrop.addEventListener("click", closeMobileNav);

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMobileNav();
            }
        });

        const onMobileQueryChange = (event) => {
            if (!event.matches) {
                closeMobileNav();
            }
        };

        if (typeof mobileNavQuery.addEventListener === "function") {
            mobileNavQuery.addEventListener("change", onMobileQueryChange);
        } else {
            mobileNavQuery.addListener(onMobileQueryChange);
        }
    }

    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetSelector = link.getAttribute("href");
            if (!targetSelector || !targetSelector.startsWith("#")) {
                return;
            }

            const target = document.querySelector(targetSelector);
            if (!target) {
                return;
            }

            event.preventDefault();
            const behavior = reduceMotion ? "auto" : "smooth";
            const targetTop = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
            window.scrollTo({
                top: Math.max(0, targetTop),
                behavior
            });

            if (history.replaceState) {
                history.replaceState(null, "", targetSelector);
            }

            setActiveLink(target.id || "home");
            closeMobileNav();
        });
    });

    revealItems.forEach((item, index) => {
        const staggerDelay = Math.min(index % 6, 5) * 70;
        item.style.transitionDelay = `${staggerDelay}ms`;
    });

    if (!reduceMotion && "IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in-view");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.18,
                rootMargin: "0px 0px -8% 0px"
            }
        );

        revealItems.forEach((item) => revealObserver.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add("in-view"));
    }

    if (sections.length && "IntersectionObserver" in window) {
        const sectionObserver = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (!visible.length) {
                    return;
                }

                const currentId = visible[0].target.id || "home";
                setActiveLink(currentId);
            },
            {
                threshold: [0.2, 0.45, 0.7],
                rootMargin: "-22% 0px -45% 0px"
            }
        );

        sections.forEach((section) => sectionObserver.observe(section));
        setActiveLink("home");
    } else {
        setActiveLink("home");
    }

    if (progressBar) {
        const updateProgress = () => {
            const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = pageHeight <= 0 ? 0 : window.scrollY / pageHeight;
            progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
        };

        updateProgress();
        window.addEventListener("scroll", updateProgress, { passive: true });
        window.addEventListener("resize", updateProgress);
    }

    const formatCount = (value, suffix) => `${Math.round(value).toLocaleString()}${suffix}`;

    const animateCount = (element) => {
        const target = Number.parseInt(element.dataset.count || "0", 10);
        const suffix = element.dataset.suffix || "";
        const duration = 1100;
        const startTime = performance.now();

        const tick = (timestamp) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = target * eased;
            element.textContent = formatCount(currentValue, suffix);

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    };

    if (statValues.length) {
        if (reduceMotion || !("IntersectionObserver" in window)) {
            statValues.forEach((element) => {
                const target = Number.parseInt(element.dataset.count || "0", 10);
                const suffix = element.dataset.suffix || "";
                element.textContent = formatCount(target, suffix);
            });
        } else {
            statValues.forEach((element) => {
                const suffix = element.dataset.suffix || "";
                element.textContent = formatCount(0, suffix);
            });

            const statsObserver = new IntersectionObserver(
                (entries, observer) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            animateCount(entry.target);
                            observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    threshold: 0.45
                }
            );

            statValues.forEach((element) => statsObserver.observe(element));
        }
    }

    if (!reduceMotion && finePointer) {
        motionCards.forEach((card) => {
            card.addEventListener("pointermove", (event) => {
                const bounds = card.getBoundingClientRect();
                const x = (event.clientX - bounds.left) / bounds.width;
                const y = (event.clientY - bounds.top) / bounds.height;
                const rotateY = (x - 0.5) * 8;
                const rotateX = (0.5 - y) * 7;

                card.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
                card.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
            });

            card.addEventListener("pointerleave", () => {
                card.style.removeProperty("--tilt-x");
                card.style.removeProperty("--tilt-y");
            });
        });
    }
});
