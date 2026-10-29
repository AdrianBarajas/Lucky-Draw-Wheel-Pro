
/**
 * Ruleta de Sorteos Pro - App Logic
 */
document.addEventListener('DOMContentLoaded', () => {

    const TRANSLATIONS = {
        es: {
            pageTitle: 'Ruleta de Sorteos Pro',
            appTitle: 'Ruleta de Sorteos',
            appTitleCompact: 'Ruleta',
            appSubtitle: 'Sorteos rápidos, aleatorios y divertidos',
            languageLabel: 'Idioma',
            soundToggle: 'Alternar sonido',
            themeToggle: 'Cambiar tema',
            participants: 'Participantes',
            inputHint: '1 por línea o por coma',
            namesPlaceholder: 'Ingresa nombres aquí... Ej:\nJuan Pérez\nMaría López\nCarlos Ruiz',
            update: 'Actualizar',
            shuffle: 'Mezclar',
            deduplicate: 'Sin duplicados',
            clear: 'Limpiar',
            settingsTitle: 'Ajustes de la ruleta',
            spinDuration: 'Duración del giro',
            secondsShort: 'seg',
            colorPalette: 'Paleta de colores',
            change: 'Cambiar',
            winnerHistory: 'Historial de ganadores',
            emptyHistory: 'Aún no hay ganadores registrados.',
            spin: '¡GIRAR!',
            winnerAnnouncement: '¡Tenemos un ganador!',
            removeWinner: 'Remover de la lista',
            keepWinner: 'Mantener en lista',
            emptyWheel: 'Añade participantes'
        },
        en: {
            pageTitle: 'Lucky Draw Wheel Pro',
            appTitle: 'Lucky Draw Wheel',
            appTitleCompact: 'Wheel',
            appSubtitle: 'Fast, random, and fun draws',
            languageLabel: 'Language',
            soundToggle: 'Toggle sound',
            themeToggle: 'Toggle theme',
            participants: 'Participants',
            inputHint: '1 per line or separated by commas',
            namesPlaceholder: 'Enter names here... E.g.:\nJohn Smith\nMary Jones\nAlex Brown',
            update: 'Update',
            shuffle: 'Shuffle',
            deduplicate: 'Remove duplicates',
            clear: 'Clear',
            settingsTitle: 'Wheel settings',
            spinDuration: 'Spin duration',
            secondsShort: 'sec',
            colorPalette: 'Color palette',
            change: 'Change',
            winnerHistory: 'Winner history',
            emptyHistory: 'No winners yet.',
            spin: 'SPIN!',
            winnerAnnouncement: 'We have a winner!',
            removeWinner: 'Remove from list',
            keepWinner: 'Keep in list',
            emptyWheel: 'Add participants'
        }
    };

    let language = localStorage.getItem('ruleta_language') === 'es' ? 'es' : 'en';

    // Pre-defined Color Palettes
    const PALETTES = [
        ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'],
        ['#6366F1', '#A855F7', '#EC4899', '#3B82F6', '#14B8A6', '#84CC16', '#EAB308', '#F97316'],
        ['#0284C7', '#0D9488', '#059669', '#65A30D', '#CA8A04', '#D97706', '#EA580C', '#E11D48'],
        ['#FF0055', '#7A00FF', '#00E5FF', '#00FF66', '#FFAA00', '#FF00AA', '#0099FF', '#CC00FF']
    ];

    // State Variables
    let items = [];
    let currentPaletteIndex = 0;
    let currentRotation = 0; // Cumulative angle in radians
    let isSpinning = false;
    let soundEnabled = true;
    let spinDurationSec = 5;
    let history = [];
    let lastWinningIndex = -1;

    // DOM Elements
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const namesInput = document.getElementById('namesInput');
    const participantCount = document.getElementById('participantCount');
    const spinBtn = document.getElementById('spinBtn');
    const updateBtn = document.getElementById('updateBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const dedupeBtn = document.getElementById('dedupeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const durationRange = document.getElementById('durationRange');
    const durationValue = document.getElementById('durationValue');
    const randomColorBtn = document.getElementById('randomColorBtn');
    const palettePreview = document.getElementById('palettePreview');
    const historyList = document.getElementById('historyList');
    const emptyHistoryMsg = document.getElementById('emptyHistoryMsg');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const languageSelect = document.getElementById('languageSelect');
    const soundIcon = document.getElementById('soundIcon');
    const wheelPointer = document.getElementById('wheelPointer');

    // Winner Modal Elements
    const winnerModal = document.getElementById('winnerModal');
    const winnerName = document.getElementById('winnerName');
    const removeWinnerBtn = document.getElementById('removeWinnerBtn');
    const keepWinnerBtn = document.getElementById('keepWinnerBtn');

    // Web Audio API Context for ticking sounds
    let audioCtx = null;

    function applyTranslations() {
        const translations = TRANSLATIONS[language];
        document.documentElement.lang = language;
        languageSelect.value = language;

        document.querySelectorAll('[data-i18n]').forEach(element => {
            element.textContent = translations[element.dataset.i18n];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            element.placeholder = translations[element.dataset.i18nPlaceholder];
        });
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            element.title = translations[element.dataset.i18nTitle];
        });
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            element.setAttribute('aria-label', translations[element.dataset.i18nAriaLabel]);
        });

        durationValue.textContent = `${spinDurationSec} ${translations.secondsShort}`;
    }

    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
    }

    function playTickSound() {
        if (!soundEnabled) return;
        try {
            initAudio();
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            if (!audioCtx) return;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.04);

            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.04);
        } catch (e) {
            // Audio fallback / ignore browser restrictions
        }
    }

    function playVictorySound() {
        if (!soundEnabled) return;
        try {
            initAudio();
            if (!audioCtx) return;

            const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
            notes.forEach((freq, index) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                const startTime = audioCtx.currentTime + (index * 0.08);
                gain.gain.setValueAtTime(0.2, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.3);
            });
        } catch (e) { }
    }

    // Init & Load Saved Data
    function init() {
        loadSettings();
        applyTranslations();
        renderPalettePreview();
        parseInputNames();
        drawWheel();
        updateHistoryUI();

        // Event Listeners
        namesInput.addEventListener('input', parseInputNames);
        updateBtn.addEventListener('click', () => { parseInputNames(); drawWheel(); });
        shuffleBtn.addEventListener('click', shuffleItems);
        dedupeBtn.addEventListener('click', deduplicateItems);
        clearBtn.addEventListener('click', clearItems);
        spinBtn.addEventListener('click', spinWheel);

        durationRange.addEventListener('input', (e) => {
            spinDurationSec = parseInt(e.target.value);
            durationValue.textContent = `${spinDurationSec} ${TRANSLATIONS[language].secondsShort}`;
            saveSettings();
        });

        randomColorBtn.addEventListener('click', () => {
            currentPaletteIndex = (currentPaletteIndex + 1) % PALETTES.length;
            renderPalettePreview();
            drawWheel();
            saveSettings();
        });

        clearHistoryBtn.addEventListener('click', () => {
            history = [];
            updateHistoryUI();
            saveSettings();
        });

        themeToggleBtn.addEventListener('click', toggleTheme);
        soundToggleBtn.addEventListener('click', toggleSound);
        languageSelect.addEventListener('change', () => {
            language = languageSelect.value;
            localStorage.setItem('ruleta_language', language);
            applyTranslations();
            drawWheel();
        });

        removeWinnerBtn.addEventListener('click', () => {
            if (lastWinningIndex >= 0 && lastWinningIndex < items.length) {
                items.splice(lastWinningIndex, 1);
                namesInput.value = items.join('\n');
                parseInputNames();
                drawWheel();
            }
            closeWinnerModal();
        });

        keepWinnerBtn.addEventListener('click', closeWinnerModal);
    }

    // Parse text area input
    function parseInputNames() {
        const rawText = namesInput.value;
        items = rawText
            .split(/[\n,]+/)
            .map(name => name.trim())
            .filter(name => name.length > 0);

        participantCount.textContent = items.length;
        saveSettings();
        drawWheel();
    }

    // Render Palette Preview
    function renderPalettePreview() {
        palettePreview.innerHTML = '';
        const colors = PALETTES[currentPaletteIndex];
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'flex-1 h-full';
            swatch.style.backgroundColor = color;
            palettePreview.appendChild(swatch);
        });
    }

    // Draw Wheel Canvas
    function drawWheel() {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = width / 2 - 20;

        ctx.clearRect(0, 0, width, height);

        const count = items.length;

        if (count === 0) {
            // Placeholder when no items
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#94a3b8';
            ctx.fill();
            ctx.lineWidth = 10;
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(TRANSLATIONS[language].emptyWheel, centerX, centerY);
            ctx.restore();
            return;
        }

        const arc = (2 * Math.PI) / count;
        const colors = PALETTES[currentPaletteIndex];

        ctx.save();
        // Move origin to center and rotate by current global rotation
        ctx.translate(centerX, centerY);
        ctx.rotate(currentRotation);

        for (let i = 0; i < count; i++) {
            const angle = i * arc;
            const color = colors[i % colors.length];

            // Draw Slice
            ctx.beginPath();
            ctx.arc(0, 0, radius, angle, angle + arc);
            ctx.lineTo(0, 0);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Draw Text
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 4;

            // Calculate text position
            const textAngle = angle + arc / 2;
            ctx.rotate(textAngle);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            // Adaptive font size
            let fontSize = Math.max(16, Math.min(32, 280 / count));
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;

            const name = items[i];
            const truncatedName = name.length > 18 ? name.substring(0, 16) + '...' : name;

            ctx.fillText(truncatedName, radius - 40, 0);
            ctx.restore();
        }

        // Outer border shadow effect
        ctx.restore();

        // Outer ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.lineWidth = 12;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.stroke();
    }

    // Spin Logic with Physics Ease-Out
    function spinWheel() {
        if (isSpinning || items.length === 0) return;

        isSpinning = true;
        spinBtn.disabled = true;

        // Random target slice selection
        const count = items.length;
        const selectedIndex = Math.floor(Math.random() * count);
        lastWinningIndex = selectedIndex;

        const arc = (2 * Math.PI) / count;

        // Canvas top pointer position is -Math.PI / 2 (-90 deg)
        // Slice angle range for index i when wheel rotated by R is: R + i*arc to R + (i+1)*arc
        // Pointer hits slice when (-PI/2 - R) mod 2PI falls within [i*arc, (i+1)*arc]

        // Choose target center angle within the chosen slice
        const sliceCenterAngle = selectedIndex * arc + arc / 2;

        // Desired global rotation such that -PI/2 - finalRotation = sliceCenterAngle (mod 2PI)
        // finalRotation = -PI/2 - sliceCenterAngle
        // Add random full turns (5 to 10 full spins)
        const fullSpins = 5 + Math.floor(Math.random() * 5);
        const targetRotationOffset = (2 * Math.PI * fullSpins) + (-Math.PI / 2 - sliceCenterAngle);

        // Align target rotation relative to current rotation
        // Normalize current rotation to [0, 2PI)
        const currentNorm = currentRotation % (2 * Math.PI);
        const startRotation = currentRotation;
        const totalRotationDelta = (2 * Math.PI * fullSpins) + ((-Math.PI / 2 - sliceCenterAngle) - currentNorm);
        const targetRotation = startRotation + (totalRotationDelta < (2 * Math.PI * fullSpins) ? totalRotationDelta + 2 * Math.PI : totalRotationDelta);

        const durationMs = spinDurationSec * 1000;
        const startTime = performance.now();

        let lastTickSlice = -1;

        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);

            // Ease out cubic cubic-bezier(0.15, 0.85, 0.35, 1)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            currentRotation = startRotation + (targetRotation - startRotation) * easeOut;
            drawWheel();

            // Calculate current slice under pointer for tick sound and pointer wiggle
            const normalizedAngle = ((-Math.PI / 2 - currentRotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
            const currentSlice = Math.floor(normalizedAngle / arc);

            if (currentSlice !== lastTickSlice) {
                lastTickSlice = currentSlice;
                playTickSound();

                // Pointer bounce animation
                wheelPointer.classList.add('scale-110', 'rotate-6');
                setTimeout(() => {
                    wheelPointer.classList.remove('scale-110', 'rotate-6');
                }, 50);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Spinning finished
                isSpinning = false;
                spinBtn.disabled = false;
                onSpinComplete(items[selectedIndex]);
            }
        }

        requestAnimationFrame(animate);
    }

    // Spin Finished Handler
    function onSpinComplete(winner) {
        playVictorySound();
        triggerConfetti();

        // Add to history
        const locale = language === 'en' ? 'en-US' : 'es-ES';
        const timestamp = new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        history.unshift({ name: winner, time: timestamp });
        updateHistoryUI();
        saveSettings();

        // Open Modal
        winnerName.textContent = winner;
        openWinnerModal();
    }

    // Confetti Burst Effect
    function triggerConfetti() {
        if (typeof confetti === 'function') {
            // Center burst
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Side cannons
            setTimeout(() => {
                confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
                confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
            }, 250);
        }
    }

    // Winner Modal Controls
    function openWinnerModal() {
        winnerModal.classList.remove('opacity-0', 'pointer-events-none');
        winnerModal.firstElementChild.classList.remove('scale-95');
        winnerModal.firstElementChild.classList.add('scale-100');
    }

    function closeWinnerModal() {
        winnerModal.classList.add('opacity-0', 'pointer-events-none');
        winnerModal.firstElementChild.classList.remove('scale-100');
        winnerModal.firstElementChild.classList.add('scale-95');
    }

    // Helper Quick Actions
    function shuffleItems() {
        if (items.length <= 1) return;
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        namesInput.value = items.join('\n');
        drawWheel();
        saveSettings();
    }

    function deduplicateItems() {
        const unique = [...new Set(items)];
        items = unique;
        namesInput.value = items.join('\n');
        participantCount.textContent = items.length;
        drawWheel();
        saveSettings();
    }

    function clearItems() {
        items = [];
        namesInput.value = '';
        participantCount.textContent = 0;
        drawWheel();
        saveSettings();
    }

    // History UI Update
    function updateHistoryUI() {
        historyList.innerHTML = '';
        if (history.length === 0) {
            emptyHistoryMsg.classList.remove('hidden');
        } else {
            emptyHistoryMsg.classList.add('hidden');
            history.forEach((entry, idx) => {
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center bg-slate-100/80 dark:bg-slate-700/60 p-2 rounded-lg border border-slate-200/50 dark:border-slate-600/50';
                li.innerHTML = `
                            <span class="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                                <i class="fa-solid fa-award text-amber-500 mr-1.5"></i>${escapeHtml(entry.name)}
                            </span>
                            <span class="text-[10px] text-slate-400 font-normal">${entry.time}</span>
                        `;
                historyList.appendChild(li);
            });
        }
    }

    // Utility HTML Sanitizer
    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Theme Toggle
    function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        const themeIcon = document.getElementById('themeIcon');
        themeIcon.className = isDark ? 'fa-solid fa-sun text-lg text-amber-400' : 'fa-solid fa-moon text-lg';
        localStorage.setItem('ruleta_theme', isDark ? 'dark' : 'light');
    }

    // Sound Toggle
    function toggleSound() {
        soundEnabled = !soundEnabled;
        soundIcon.className = soundEnabled ? 'fa-solid fa-volume-high text-lg text-sky-500' : 'fa-solid fa-volume-xmark text-lg text-rose-500';
        localStorage.setItem('ruleta_sound', soundEnabled ? 'true' : 'false');
    }

    // LocalStorage Persistence
    function saveSettings() {
        const state = {
            names: namesInput.value,
            spinDurationSec,
            currentPaletteIndex,
            history
        };
        localStorage.setItem('ruleta_app_state', JSON.stringify(state));
    }

    function loadSettings() {
        // Theme
        const savedTheme = localStorage.getItem('ruleta_theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            document.getElementById('themeIcon').className = 'fa-solid fa-sun text-lg text-amber-400';
        }

        // Sound
        const savedSound = localStorage.getItem('ruleta_sound');
        if (savedSound !== null) {
            soundEnabled = savedSound === 'true';
            soundIcon.className = soundEnabled ? 'fa-solid fa-volume-high text-lg text-sky-500' : 'fa-solid fa-volume-xmark text-lg text-rose-500';
        }

        // App State
        const savedState = localStorage.getItem('ruleta_app_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.names !== undefined) {
                    namesInput.value = parsed.names;
                } else {
                    namesInput.value = "Premio 1\nPremio 2\nPremio 3\nPremio 4\nPremio 5";
                }
                if (parsed.spinDurationSec) {
                    spinDurationSec = parsed.spinDurationSec;
                    durationRange.value = spinDurationSec;
                    durationValue.textContent = `${spinDurationSec} ${TRANSLATIONS[language].secondsShort}`;
                }
                if (parsed.currentPaletteIndex !== undefined) {
                    currentPaletteIndex = parsed.currentPaletteIndex;
                }
                if (parsed.history) {
                    history = parsed.history;
                }
            } catch (e) { }
        } else {
            // Default values
            namesInput.value = "Ana Gómez\nCarlos Ruiz\nMaría López\nJuan Pérez\nSofía Díaz\nLuis Torres";
        }
    }

    // Initialize app
    init();
});