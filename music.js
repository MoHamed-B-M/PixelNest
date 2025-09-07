import {
    argbFromHex,
    themeFromSourceColor,
    applyTheme,
} from 'https://cdn.jsdelivr.net/npm/@material/material-color-utilities@0.2.1/+esm';

document.addEventListener('DOMContentLoaded', function () {
    // Add 'page-loaded' class for initial fade-in transition
    document.body.classList.add('page-loaded');

    const themePicker = document.getElementById('theme-picker');
    const themeToggleButton = document.getElementById('theme-toggle-button');

    let currentSourceColor = argbFromHex(themePicker.value);
    let isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const updateTheme = (sourceColor, isDark) => {
        const theme = themeFromSourceColor(sourceColor);
        const scheme = isDark ? theme.schemes.dark : theme.schemes.light;

        // Apply theme to the document body
        applyTheme(theme, { target: document.body, dark: isDark });

        // Update CSS custom properties for RGB values for shadows and gradients
        const primaryRgb = hexToRgb(scheme.primary);
        const secondaryRgb = hexToRgb(scheme.secondary);
        const tertiaryRgb = hexToRgb(scheme.tertiary);
        const onSurfaceRgb = hexToRgb(scheme.onSurface);
        const backgroundRgb = hexToRgb(scheme.background);

        document.body.style.setProperty(
            '--md-sys-color-primary-rgb',
            `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`
        );
        document.body.style.setProperty(
            '--md-sys-color-secondary-rgb',
            `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`
        );
        document.body.style.setProperty(
            '--md-sys-color-tertiary-rgb',
            `${tertiaryRgb.r}, ${tertiaryRgb.g}, ${tertiaryRgb.b}`
        );
        document.body.style.setProperty(
            '--md-sys-color-on-surface-rgb',
            `${onSurfaceRgb.r}, ${onSurfaceRgb.g}, ${onSurfaceRgb.b}`
        );
        document.body.style.setProperty(
            '--md-sys-color-background-rgb',
            `${backgroundRgb.r}, ${backgroundRgb.g}, ${backgroundRgb.b}`
        );

        // Update the button text
        themeToggleButton.textContent = isDark
            ? 'Switch to Light'
            : 'Switch to Dark';

        // Add/remove a class to the body for specific light/dark theme fallbacks if needed
        if (isDark) {
            document.body.classList.remove('light');
        } else {
            document.body.classList.add('light');
        }
    };

    // Helper function to convert hex to RGB object
    function hexToRgb(hex) {
        if (typeof hex === 'number') {
            hex = '#' + (hex & 0xffffff).toString(16).padStart(6, '0');
        }
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return { r, g, b };
    }

    themePicker.addEventListener('input', (e) => {
        const color = e.target.value;
        currentSourceColor = argbFromHex(color);
        updateTheme(currentSourceColor, isDarkTheme);
    });

    themeToggleButton.addEventListener('click', () => {
        isDarkTheme = !isDarkTheme;
        updateTheme(currentSourceColor, isDarkTheme);
    });

    // Initial theme setup on page load
    updateTheme(currentSourceColor, isDarkTheme);

    // Handle page transitions for internal links
    const transitionLinks = document.querySelectorAll('.page-transition-link');
    transitionLinks.forEach((link) => {
        link.addEventListener('click', function (e) {
            const targetUrl = this.href;
            if (
                targetUrl &&
                targetUrl !== window.location.href + '#' &&
                targetUrl !== window.location.href &&
                !targetUrl.startsWith('#')
            ) {
                e.preventDefault(); // Prevent default navigation
                document.body.classList.remove('page-loaded');
                document.body.classList.add('page-leaving'); // Add 'page-leaving' class for fade-out
                setTimeout(() => {
                    window.location.href = targetUrl; // Navigate after transition
                }, 500); // Match CSS transition duration
            }
        });
    });

    // Re-add 'page-loaded' if navigating back via browser history (persisted property)
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
            document.body.classList.remove('page-leaving');
            document.body.classList.add('page-loaded');
        }
    });

    // Update copyright year dynamically
    var yearEl = document.getElementById('y');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());


    // Helper function to format time (though not used for display anymore, might be useful for internal logic)
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // --- Audio Player Logic ---
    const cards = document.querySelectorAll('.card');
    cards.forEach(function (card) {
        const audio = card.querySelector('audio');
        const customPlayButton = card.querySelector('.custom-play-button');
        const progressBarContainer = card.querySelector('.progress-bar-container');
        const progressBarFilled = card.querySelector('.progress-bar-filled');
        const progressBarThumb = card.querySelector('.progress-bar-thumb');
        const loopToggle = card.querySelector('.loop-toggle');
        const downloadBtn = card.querySelector('.download-btn');
        const video = card.querySelector('.portfolio-video'); // Get the video element

        let isDraggingProgressBar = false; // Flag for drag interaction

        if (!audio || !customPlayButton || !progressBarContainer || !progressBarFilled || !progressBarThumb || !loopToggle || !downloadBtn || !video) {
            console.error("Missing audio or video player elements in card:", card);
            return;
        }

        // Initial setup for video
        video.pause();
        video.currentTime = 0; // Ensure video starts from beginning (shows poster)
        video.load(); // Ensures poster is shown correctly

        // --- Event Listeners ---

        // Play/Pause button
        customPlayButton.addEventListener('click', () => {
            resetOtherPlayers(audio); // Pause other players
            if (audio.paused) {
                audio.play().catch(error => {
                    if (error.name === 'AbortError') {
                        console.warn('Audio play was aborted:', error.message);
                    } else {
                        console.error('Error playing audio:', error);
                    }
                });
            } else {
                audio.pause();
            }
        });

        // Audio playing - Play video and update button
        audio.addEventListener('play', () => {
            customPlayButton.textContent = '⏸'; // Change to pause icon
            video.play().catch(e => console.warn("Video auto-play prevented:", e)); // Play the video
        });

        // Audio paused - Pause video and update button
        audio.addEventListener('pause', () => {
            customPlayButton.textContent = '▶'; // Change to play icon
            video.pause(); // Pause the video
        });

        // Audio time update - Update progress bar and sync video
        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressBarFilled.style.width = `${progress}%`;
            progressBarThumb.style.left = `${progress}%`;

            // Sync video current time with audio
            if (Math.abs(video.currentTime - audio.currentTime) > 0.1) { // Check for significant difference
                video.currentTime = audio.currentTime;
            }
        });

        // Audio ended - Reset button, progress bar, and video
        audio.addEventListener('ended', () => {
            customPlayButton.textContent = '▶';
            progressBarFilled.style.width = '0%';
            progressBarThumb.style.left = '0%';
            video.pause(); // Pause the video
            video.currentTime = 0; // Reset video to beginning
            if (!audio.loop) { // If not looping, ensure video poster is shown
                video.load(); // Reload video to show poster
            }
        });

        // Progress bar seeking functionality
        const seek = (e) => {
            const rect = progressBarContainer.getBoundingClientRect();
            let offsetX = e.clientX - rect.left;
            if (e.touches && e.touches.length > 0) {
                 offsetX = e.touches[0].clientX - rect.left;
            }
            let percent = (offsetX / rect.width);
            if (percent < 0) percent = 0;
            if (percent > 1) percent = 1;

            audio.currentTime = audio.duration * percent;
            video.currentTime = audio.duration * percent; // Sync video
        };

        progressBarContainer.addEventListener('mousedown', (e) => {
            isDraggingProgressBar = true;
            seek(e);
        });
        progressBarContainer.addEventListener('touchstart', (e) => {
            isDraggingProgressBar = true;
            seek(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDraggingProgressBar) {
                seek(e);
            }
        });
        document.addEventListener('touchmove', (e) => {
            if (isDraggingProgressBar) {
                e.preventDefault(); // Prevent scrolling while dragging
                seek(e);
            }
        });

        document.addEventListener('mouseup', () => {
            isDraggingProgressBar = false;
        });
        document.addEventListener('touchend', () => {
            isDraggingProgressBar = false;
        });


        // Loop toggle button
        loopToggle.addEventListener('click', function () {
            audio.loop = !audio.loop;
            video.loop = audio.loop; // Sync video loop state
            if (audio.loop) {
                this.classList.add('active');
                this.textContent = '🔁 Looping';
            } else {
                this.classList.remove('active');
                this.textContent = '🔁 Loop';
            }
        });

        // Download button
        downloadBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const audioUrl = this.href;
            const audioName = this.getAttribute('download');

            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = audioName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            const originalText = this.innerHTML;
            this.innerHTML = 'Downloaded!';
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    });

    function resetOtherPlayers(currentAudio) {
        document.querySelectorAll('audio').forEach(function (a) {
            if (a !== currentAudio) {
                try {
                    a.pause();
                    const card = a.closest('.card');
                    if (card) {
                        const video = card.querySelector('.portfolio-video');
                        const progressBarFilled = card.querySelector('.progress-bar-filled');
                        const progressBarThumb = card.querySelector('.progress-bar-thumb');
                        const playButton = card.querySelector('.custom-play-button');

                        if (video) {
                            video.pause();
                            video.currentTime = 0; // Reset video to beginning
                            video.load(); // Show poster
                        }
                        if (progressBarFilled) progressBarFilled.style.width = '0%';
                        if (progressBarThumb) progressBarThumb.style.left = '0%';
                        if (playButton) playButton.textContent = '▶';
                    }
                } catch (e) {
                    console.error('Error pausing other audio:', e);
                }
            }
        });
    }


    // --- Description Toggle ---
    const mainContent = document.getElementById('library');

    if (mainContent) {
        mainContent.addEventListener('click', function (e) {
            const descriptionToggle = e.target.closest('.description-toggle');
            if (descriptionToggle) {
                e.preventDefault();
                const container = descriptionToggle.previousElementSibling;
                container.classList.toggle('expanded');
                const span = descriptionToggle.querySelector('span');
                if (container.classList.contains('expanded')) {
                    span.textContent = 'Show Less';
                } else {
                    span.textContent = 'Show More';
                }
                return;
            }
        });
    }

    // Scroll-to-top button functionality
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

    // Item visibility and animation on scroll (without video autoplay)
    const portfolioItems = document.querySelectorAll('.card.fade-in');
    const isInViewport = (el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= window.innerHeight * 0.9 &&
            rect.bottom >= window.innerHeight * 0.1
        );
    };
    const itemVisibility = new Array(portfolioItems.length).fill(false);
    let isThrottled = false;
    const throttleDelay = 100;

    const throttledCheckAndAnimateItems = () => {
        if (!isThrottled) {
            isThrottled = true;
            requestAnimationFrame(() => {
                portfolioItems.forEach((item, index) => {
                    if (isInViewport(item) && !itemVisibility[index]) {
                        item.style.animationDelay = `${
                            index * 0.08 + 0.1
                        }s`;
                        item.style.animationName = 'fade-up-in';
                        item.style.opacity = '1';
                        item.style.transform = 'none';
                        itemVisibility[index] = true;
                    } else if (!isInViewport(item) && itemVisibility[index]) {
                        // No video interaction on scroll
                    }
                });
                setTimeout(() => {
                    isThrottled = false;
                }, throttleDelay);
            });
        }
    };
    throttledCheckAndAnimateItems(); // Initial check on load
    window.addEventListener('scroll', throttledCheckAndAnimateItems, {
        passive: true,
    });
});




