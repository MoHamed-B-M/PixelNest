document.addEventListener("DOMContentLoaded", function () {
    // Add 'page-loaded' class to body for fade-in effect on initial load
    document.body.classList.add("page-loaded");

    // Scroll to Top Button Functionality
    const scrollTopBtn = document.querySelector('.scroll-top');
    if (scrollTopBtn) {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Select all links that should trigger a page transition
    const transitionLinks = document.querySelectorAll(".page-transition-link");

    transitionLinks.forEach((link) => {
        link.addEventListener("click", function (e) {
            const targetUrl = this.href;

            if (
                targetUrl &&
                targetUrl !== window.location.href + "#" &&
                targetUrl !== window.location.href &&
                !targetUrl.startsWith("#")
            ) {
                e.preventDefault();

                document.body.classList.remove("page-loaded");
                document.body.classList.add("page-leaving");

                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 500);
            }
        });
    });

    window.addEventListener("pageshow", function (event) {
        if (event.persisted) {
            document.body.classList.remove("page-leaving");
            document.body.classList.add("page-loaded");
        }
    });

    // Year
    var yearEl = document.getElementById("y");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Helpers
    function getCard(el) {
        return el ? el.closest(".card") : null;
    }
    function getPlayBtn(card) {
        return card ? card.querySelector(".btn.play") : null;
    }
    function getVideoElement(card) {
        return card ? card.querySelector(".video-container video") : null;
    }

    function resetOtherPlayers(currentAudio) {
        document.querySelectorAll("audio").forEach(function (a) {
            if (a !== currentAudio) {
                try {
                    a.pause();
                } catch (e) {}
                var c = getCard(a);
                if (c) {
                    c.classList.remove("playing");
                }
                var p = getPlayBtn(c);
                if (p) {
                    p.classList.remove("active");
                    p.textContent = "▶ Play";
                }
                const otherVideo = getVideoElement(c);
                if (otherVideo) {
                    otherVideo.pause();
                }
            }
        });
    }

    var cards = document.querySelectorAll(".card");
    cards.forEach(function (card) {
        var audio = card.querySelector("audio");
        var btn = getPlayBtn(card);
        var video = getVideoElement(card);
        if (!audio || !btn) return;

        btn.addEventListener("click", function () {
            resetOtherPlayers(audio);
            if (audio.paused) {
                audio.play().catch((error) => {
                    if (error.name === "AbortError") {
                        console.warn("Audio play was aborted:", error.message);
                    } else {
                        console.error("Error playing audio:", error);
                    }
                });
            } else {
                audio.pause();
            }
        });

        audio.addEventListener("play", function () {
            card.classList.add("playing");
            btn.textContent = "⏸ Pause";
            btn.classList.add("active");
            if (video) video.play();
        });
        audio.addEventListener("pause", function () {
            card.classList.remove("playing");
            btn.textContent = "▶ Play";
            btn.classList.remove("active");
            if (video) video.pause();
        });
        audio.addEventListener("ended", function () {
            card.classList.remove("playing");
            btn.textContent = "▶ Play";
            btn.classList.remove("active");
            if (!audio.loop && video) video.pause();
        });

        audio.addEventListener("loopchange", function () {
            if (video) {
                video.loop = audio.loop;
            }
        });
    });

    const loopButtons = document.querySelectorAll(".loop-toggle");

    loopButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const card = this.closest(".card");
            const audio = card.querySelector("audio");
            const video = getVideoElement(card);

            if (audio) {
                audio.loop = !audio.loop;

                if (video) {
                    video.loop = audio.loop;
                }

                if (audio.loop) {
                    this.classList.add("active");
                    this.textContent = "🔁 Looping";
                } else {
                    this.classList.remove("active");
                    this.textContent = "🔁 Loop";
                }
            }
        });
    });

    // --- Minimal self-tests (logged to console) ---
    function runSelfTests() {
        var results = [];
        try {
            var dummyCard = document.createElement("article");
            dummyCard.className = "card";
            var dummyAudio = document.createElement("audio");
            dummyCard.appendChild(dummyAudio);
            document.body.appendChild(dummyCard);
            try {
                resetOtherPlayers(dummyAudio);
                results.push("✓ Reset without play button does not throw");
            } catch (e) {
                results.push("✗ Reset threw: " + e.message);
            }

            var dummyCard2 = document.createElement("article");
            dummyCard2.className = "card";
            var dummyBtn = document.createElement("button");
            dummyBtn.className = "btn play";
            dummyCard2.appendChild(dummyBtn);
            document.body.appendChild(dummyCard2);
            var p = getPlayBtn(dummyCard2);
            if (p) {
                p.textContent = "▶ Play";
                p.classList.add("active");
                p.classList.remove("active");
                results.push("✓ Button label/class can be updated");
            } else {
                results.push("✗ Button not found in test 2");
            }

            dummyCard.remove();
            dummyCard2.remove();
        } catch (e) {
            results.push("✗ Self-tests error: " + e.message);
        }
        console.log("[Calm Music] Self-tests:", results.join(" | "));
    }

    runSelfTests();
});