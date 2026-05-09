// Utilidades para navegación y estado
let currentLevel = 1;
let currentPage = 1;
/** Secciones jugables en el HTML de esta build */
const PLAYABLE_LEVELS = 10;
/** Fundamentos alineados con la referencia (Stephen Curtis / 33-js-concepts) */
const TOTAL_CONCEPTS = 33;

// Game State
let playerXP = 0;
let conceptsLearned = 0;
let completedLevels = new Set(); // Track completed levels

// Scroll state
let isScrolling = false;

const ROAD_NODE_LABELS = [
    'Vars', 'Fns', '[]', '{}', 'Scope', 'Hoist', 'Clos', 'CB', 'Prm', 'async'
];

const HUD_QUEST_LINES = [
    'La senda JS arde: ejecuta código y doma la consola.',
    'Lee el pergamino, luego golpea con ▶ Ejecutar.',
    'Cada nivel claro vale oro — no dejes mobs sin derrotar.'
];

function isWelcomeBlocking() {
    return (
        document.body.classList.contains('welcome-gate-active') ||
        document.body.classList.contains('welcome-deferred')
    );
}

function buildRoadStrip() {
    const strip = document.getElementById('road-strip');
    if (!strip || strip.children.length > 0) return;
    for (let i = 1; i <= PLAYABLE_LEVELS; i++) {
        const node = document.createElement('button');
        node.type = 'button';
        node.className = 'road-node';
        node.dataset.level = String(i);
        node.title = `Ir al nivel ${i}`;
        node.innerHTML = `<span class="road-node__ring"></span><span class="road-node__glyph">${ROAD_NODE_LABELS[i - 1]}</span>`;
        node.addEventListener('click', () => jumpToRoadLevel(i));
        strip.appendChild(node);
    }
}

function jumpToRoadLevel(level) {
    if (isWelcomeBlocking()) return;
    const allowed = level === 1 || completedLevels.has(level - 1);
    if (!allowed) {
        showNotification(`Nivel ${level} cerrado — completa el anterior.`, 'error');
        pulseGameFrame();
        return;
    }
    if (currentLevel !== level || currentPage !== 1) {
        const prev = document.getElementById(`level-${currentLevel}`);
        if (prev) prev.style.display = 'none';
        const next = document.getElementById(`level-${level}`);
        if (!next) return;
        next.style.display = 'flex';
        next.scrollLeft = 0;
        currentLevel = level;
        currentPage = 1;
        updatePageIndicator(1, 2);
        updateUI();
        pulseGameFrame();
    }
}

function updateRoadStrip() {
    document.querySelectorAll('.road-node').forEach((node) => {
        const n = Number(node.dataset.level);
        node.classList.remove('road-node--current', 'road-node--done', 'road-node--locked');
        if (completedLevels.has(n)) node.classList.add('road-node--done');
        if (n > 1 && !completedLevels.has(n - 1)) node.classList.add('road-node--locked');
        if (n === currentLevel) node.classList.add('road-node--current');
    });
    const caption = document.getElementById('road-strip-caption');
    if (caption) {
        caption.textContent = `tramo ${currentLevel} · ${completedLevels.size}/${TOTAL_CONCEPTS} sellos`;
    }
}

function pulseGameFrame() {
    document.body.classList.add('pulse-frame');
    setTimeout(() => document.body.classList.remove('pulse-frame'), 520);
}

function updateHudQuest() {
    const el = document.getElementById('hud-quest');
    if (!el) return;
    el.textContent = HUD_QUEST_LINES[(currentLevel + currentPage) % HUD_QUEST_LINES.length];
}

/** XP hasta el siguiente respiro narrativo (~ 13 ejecuciones + victorias) */
function updateXpMeter() {
    const cap = Math.max(260, playerXP + 40 + conceptsLearned * 30);
    const pct = Math.min(100, (playerXP / cap) * 100);
    const fill = document.getElementById('xp-fill');
    const bar = document.getElementById('xp-bar');
    const xc = document.getElementById('xp-current');
    const xn = document.getElementById('xp-next');
    if (fill) fill.style.width = `${pct}%`;
    if (bar) bar.setAttribute('aria-valuenow', String(Math.round(pct)));
    if (xc) xc.textContent = String(playerXP);
    if (xn) xn.textContent = String(cap);
}

const WELCOME_STORAGE_KEY = 'theRoadWelcomeAccepted';

function initWelcomeGate() {
    const overlay = document.getElementById('welcome-overlay');
    const btnAccept = document.getElementById('welcome-accept');
    const btnDefer = document.getElementById('welcome-defer');
    const btnReopen = document.getElementById('welcome-reopen');

    function syncWelcomeLayers() {
        const ready = document.body.classList.contains('welcome-ready');
        const deferred = document.body.classList.contains('welcome-deferred');
        const gate = document.body.classList.contains('welcome-gate-active');

        if (overlay) {
            const hideOverlay = ready || deferred;
            overlay.classList.toggle('welcome-overlay--hidden', hideOverlay);
            overlay.setAttribute('aria-hidden', hideOverlay ? 'true' : 'false');
        }
        if (btnReopen) btnReopen.hidden = ready || gate || !deferred;
    }

    function welcomeAccept() {
        try {
            localStorage.setItem(WELCOME_STORAGE_KEY, '1');
        } catch (e) {
            /* ignore */
        }
        document.body.classList.remove('welcome-gate-active', 'welcome-deferred');
        document.body.classList.add('welcome-ready');
        syncWelcomeLayers();
        const gameMain = document.querySelector('.game-container');
        if (gameMain) gameMain.removeAttribute('aria-hidden');
        requestAnimationFrame(() => {
            const stage = document.querySelector('.game-world');
            if (stage) {
                stage.setAttribute('tabindex', '-1');
                stage.focus({ preventScroll: true });
            }
        });
    }

    function welcomeDefer() {
        document.body.classList.remove('welcome-gate-active');
        document.body.classList.add('welcome-deferred');
        syncWelcomeLayers();
        btnReopen?.focus();
    }

    function welcomeReopenModal() {
        document.body.classList.remove('welcome-deferred');
        document.body.classList.add('welcome-gate-active');
        syncWelcomeLayers();
        btnAccept?.focus();
    }

    btnAccept?.addEventListener('click', welcomeAccept);
    btnDefer?.addEventListener('click', welcomeDefer);
    btnReopen?.addEventListener('click', welcomeReopenModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('welcome-gate-active')) {
            welcomeDefer();
        }
    });

    const gameMain = document.querySelector('.game-container');
    if (document.body.classList.contains('welcome-ready')) {
        if (gameMain) gameMain.removeAttribute('aria-hidden');
    } else if (gameMain) {
        gameMain.setAttribute('aria-hidden', 'true');
    }

    syncWelcomeLayers();
}

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    initWelcomeGate();
    buildRoadStrip();
    loadProgress();
    setupHorizontalScroll();
    updateUI();
    setupCodeEditors();
    loadTheme();
    setupKeyboardShortcuts();
    setupScrollDetection();
    bindThemeToggle();
    updateRoadStrip();
    updateHudQuest();
    updateXpMeter();
    initEmbers();
});

function bindThemeToggle() {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        btn.addEventListener('click', toggleTheme);
    });
}

// Update UI elements
function updateUI() {
    const displayLevel = currentLevel === 0 ? 'Intro' : currentLevel;
    
    // Update player stats if elements exist
    const currentLevelElement = document.getElementById('current-level');
    const currentXPElement = document.getElementById('current-xp');
    const conceptsLearnedElement = document.getElementById('concepts-learned');
    
    if (currentLevelElement) currentLevelElement.textContent = displayLevel;
    if (currentXPElement) currentXPElement.textContent = playerXP;
    if (conceptsLearnedElement) conceptsLearnedElement.textContent = conceptsLearned;
    
    syncPageIndicatorsForCurrentLevel();

    // Update navigation buttons based on completion status
    updateNavigationButtons();
    
    // Update level lock states
    updateLevelLockStates();
    updateRoadStrip();
    updateHudQuest();
    updateXpMeter();
}

/** Solo los indicadores del nivel visible (antes se pisaban todos con el nivel actual). */
function syncPageIndicatorsForCurrentLevel() {
    const lv = document.getElementById(`level-${currentLevel}`);
    if (!lv) return;
    lv.querySelectorAll('.page-indicator').forEach((indicator) => {
        indicator.textContent = `Página ${currentPage} de 2 | Nivel ${currentLevel}/${TOTAL_CONCEPTS}`;
    });
}

// Update navigation buttons based on level completion
function updateNavigationButtons() {
    const currentLevelElement = document.getElementById(`level-${currentLevel}`);
    if (!currentLevelElement) return;

    const buttons = currentLevelElement.querySelectorAll('.page-nav-btn');
    buttons.forEach(btn => {
        const isNextLevelBtn = btn.textContent.includes('Siguiente Nivel') || btn.onclick.toString().includes('navigateLevel(1)');
        const isExerciseBtn = btn.textContent.includes('Ejercicio') || btn.onclick.toString().includes('navigatePage(1)');
        const isPreviousBtn = btn.textContent.includes('Nivel Anterior') || btn.onclick.toString().includes('navigateLevel(-1)');
        const isTheoryBtn = btn.textContent.includes('Teoría') || btn.onclick.toString().includes('navigatePage(-1)');

        if (isNextLevelBtn) {
            // Botón "Siguiente Nivel" - solo habilitado en página 2 si el nivel está completado
            if (currentPage === 2) {
                const isCompleted = completedLevels.has(currentLevel);
                btn.disabled = !isCompleted;
                btn.textContent = isCompleted ? 'Siguiente Nivel ➡️' : 'Completa el ejercicio primero  ⚠️';
            } else {
                btn.disabled = true;
                btn.textContent = 'Siguiente Nivel ➡️';
            }
        } else if (isExerciseBtn) {
            // Botón "Ejercicio" - siempre habilitado en página 1
            btn.disabled = currentPage !== 1;
        } else if (isPreviousBtn) {
            // Botón "Nivel Anterior" - habilitado si no es el primer nivel
            btn.disabled = currentLevel <= 1;
        } else if (isTheoryBtn) {
            // Botón "Teoría" - siempre habilitado en página 2
            btn.disabled = currentPage !== 2;
        }
    });
}

// Get current page within the level
function getCurrentPage() {
    const currentLevelElement = document.getElementById(`level-${currentLevel}`);
    if (!currentLevelElement) return 1;
    
    const scrollLeft = currentLevelElement.scrollLeft;
    const pageWidth = currentLevelElement.clientWidth;
    const threshold = pageWidth / 2; // Use half page width as threshold
    
    // Determine page based on scroll position
    let calculatedPage;
    if (scrollLeft < threshold) {
        calculatedPage = 1;
    } else {
        calculatedPage = 2;
    }
    
    console.log(`Scroll: ${scrollLeft}px, Page width: ${pageWidth}px, Calculated page: ${calculatedPage}`);
    
    return calculatedPage;
}

// Navigate between pages within a level
function navigatePage(direction) {
    if (isWelcomeBlocking()) return;
    const currentLevelElement = document.getElementById(`level-${currentLevel}`);
    if (!currentLevelElement) {
        console.log('No level element found for navigation');
        return;
    }
    
    const targetPage = direction > 0 ? 2 : 1;
    const pageWidth = currentLevelElement.clientWidth;
    const targetScroll = (targetPage - 1) * pageWidth;
    
    console.log(`Navigating to page ${targetPage}, scroll to ${targetScroll}px`);
    console.log('Page width:', pageWidth, 'Current scroll:', currentLevelElement.scrollLeft);
    
    isScrolling = true;
    
    // Force scroll to target position
    currentLevelElement.scrollLeft = targetScroll;
    
    // Also use scrollTo for smooth behavior
    currentLevelElement.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
    });
    
    // Update state after scroll
    setTimeout(() => {
        currentPage = targetPage;
        updatePageIndicator(currentPage, 2);
        updateHudQuest();
        updateNavigationButtons();
        isScrolling = false;
        console.log(`Current page updated to ${currentPage}, final scroll position: ${currentLevelElement.scrollLeft}`);
    }, 600); // Increased timeout for smoother transition
}

// Navigate between levels
function navigateLevel(direction) {
    if (isWelcomeBlocking()) return;
    const newLevel = currentLevel + direction;
    if (newLevel < 1 || newLevel > PLAYABLE_LEVELS) return;
    
    // Check if we can navigate to next level
    if (direction > 0 && currentPage === 2 && !completedLevels.has(currentLevel)) {
        showNotification('Debes completar el ejercicio antes de continuar', 'error');
        return;
    }
    
    // Hide current level
    const currentLevelElement = document.getElementById(`level-${currentLevel}`);
    if (currentLevelElement) {
        currentLevelElement.style.display = 'none';
    }
    
    // Show new level
    const newLevelElement = document.getElementById(`level-${newLevel}`);
    if (newLevelElement) {
        newLevelElement.style.display = 'flex';
        // Reset horizontal scroll when changing levels
        newLevelElement.scrollLeft = 0;
        currentLevel = newLevel;
        currentPage = 1;
        updatePageIndicator(1, 2);
        updateUI();
        updateNavigationButtons();
        updateRoadStrip();
        updateHudQuest();
        pulseGameFrame();

        // Add completion indicator if level is completed
        if (completedLevels.has(newLevel)) {
            newLevelElement.classList.add('level-completed');
        } else {
            newLevelElement.classList.remove('level-completed');
        }
    }
}

// Update page indicator
function updatePageIndicator(currentPage, totalPages) {
    const indicators = document.querySelectorAll('.page-indicator');
    const displayLevel = currentLevel === 0 ? 'Intro' : currentLevel;
    indicators.forEach(indicator => {
        indicator.textContent = `Página ${currentPage} de ${totalPages} | Nivel ${displayLevel}/${TOTAL_CONCEPTS}`;
    });
    
    // Update scroll indicators
    updateScrollIndicators();
}

// Setup horizontal scroll functionality
function setupHorizontalScroll() {
    const levelsContainer = document.querySelector('.levels-container');
    if (!levelsContainer) return;
    
    // Show only the current level initially
    const levels = document.querySelectorAll('.level');
    levels.forEach((level, index) => {
        const ln = index + 1;
        level.style.display = ln === currentLevel ? 'flex' : 'none';
    });
    
    // Add scroll event listener for page detection
    levels.forEach(level => {
        level.addEventListener('scroll', function() {
            if (!isScrolling) {
                const newPage = getCurrentPage();
                console.log(`Scroll detected: page ${newPage}, current: ${currentPage}`);
                if (newPage !== currentPage) {
                    currentPage = newPage;
                    updatePageIndicator(currentPage, 2);
                    updateHudQuest();
                    updateNavigationButtons();
                    updateScrollIndicators();
                }
            }
        });
        
        // Add scroll end detection
        level.addEventListener('scrollend', function() {
            console.log('Scroll ended');
            isScrolling = false;
        });
    });
    
    // Create scroll indicators
    createScrollIndicators();
}

// Create visual scroll indicators
function createScrollIndicators() {
    const levelsContainer = document.querySelector('.levels-container');
    if (!levelsContainer) return;
    
    // Remove existing indicators
    const existingIndicator = document.querySelector('.scroll-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    
    // Create dots for each page
    for (let i = 1; i <= 2; i++) {
        const dot = document.createElement('div');
        dot.className = 'scroll-dot';
        dot.setAttribute('data-page', i);
        indicator.appendChild(dot);
    }
    
    document.body.appendChild(indicator);
    updateScrollIndicators();
}

// Update scroll indicators
function updateScrollIndicators() {
    const dots = document.querySelectorAll('.scroll-dot');
    dots.forEach((dot, index) => {
        if (index + 1 === currentPage) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
        
        // Add click event to navigate to page
        dot.onclick = function() {
            const targetPage = index + 1;
            if (targetPage !== currentPage) {
                const direction = targetPage > currentPage ? 1 : -1;
                navigatePage(direction);
            }
        };
    });
}

// Test scroll functionality
function testScroll() {
    const currentLevelElement = document.getElementById(`level-${currentLevel}`);
    if (!currentLevelElement) {
        console.log('No level element found');
        return;
    }
    
    console.log('Testing scroll...');
    console.log('Current scroll position:', currentLevelElement.scrollLeft);
    console.log('Scroll width:', currentLevelElement.scrollWidth);
    console.log('Client width:', currentLevelElement.clientWidth);
    console.log('Current page:', currentPage);
    
    // Test scroll to page 2
    const pageWidth = currentLevelElement.clientWidth;
    currentLevelElement.scrollTo({
        left: pageWidth,
        behavior: 'smooth'
    });
    
    setTimeout(() => {
        console.log('After scroll - position:', currentLevelElement.scrollLeft);
        console.log('Calculated page:', getCurrentPage());
    }, 1000);
}

// Update level lock states
function updateLevelLockStates() {
    const levels = document.querySelectorAll('.level');
    levels.forEach((level, index) => {
        const levelNumber = index + 1;
        
        // Remove existing classes
        level.classList.remove('level-locked', 'level-unlocked');
        
        // Check if level should be locked
        if (levelNumber > 1) {
            const previousLevelCompleted = completedLevels.has(levelNumber - 1);
            if (!previousLevelCompleted) {
                level.classList.add('level-locked');
            } else if (levelNumber === currentLevel) {
                level.classList.add('level-unlocked');
            }
        }
    });
}

// Setup code editors with syntax highlighting
function setupCodeEditors() {
    const textareas = document.querySelectorAll('.code-textarea');
    
    textareas.forEach(textarea => {
        // Add line numbers and syntax highlighting
        textarea.addEventListener('input', function() {
            // Auto-indent functionality
            if (this.value.includes('\n')) {
                const lines = this.value.split('\n');
                const cursorPos = this.selectionStart;
                const lineNumber = this.value.substr(0, cursorPos).split('\n').length - 1;
                
                // Basic auto-indent for common patterns
                if (lines[lineNumber] && lines[lineNumber].trim().endsWith('{')) {
                    const nextLine = lines[lineNumber + 1];
                    if (nextLine && !nextLine.startsWith('    ')) {
                        lines[lineNumber + 1] = '    ' + nextLine;
                        this.value = lines.join('\n');
                        this.setSelectionRange(cursorPos + 4, cursorPos + 4);
                    }
                }
            }
        });
        
        // Tab key support
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                
                this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 4;
            }
        });
    });
}

// Run code in the editor
function runCode(levelId) {
    if (isWelcomeBlocking()) return;
    const editor = document.getElementById(`editor-${levelId}`);
    const outputPanel = document.getElementById(`console-${levelId}`);

    if (!editor || !outputPanel) return;

    const code = editor.value;
    outputPanel.innerHTML = '';

    const logs = [];
    const stringify = (a) =>
        a.map((x) => {
            if (typeof x === 'object' && x !== null) {
                try {
                    return JSON.stringify(x);
                } catch {
                    return String(x);
                }
            }
            return String(x);
        }).join(' ');

    const orig = {
        log: console.log,
        error: console.error,
        warn: console.warn,
    };

    try {
        console.log = (...args) => logs.push({ type: 'log', content: stringify(args) });
        console.error = (...args) => logs.push({ type: 'error', content: stringify(args) });
        console.warn = (...args) => logs.push({ type: 'warn', content: stringify(args) });

        const result = eval(code);

        logs.forEach((log) => {
            const row = document.createElement('div');
            row.className = `log ${log.type}`;
            row.textContent = log.content;
            outputPanel.appendChild(row);
        });

        if (result !== undefined && result !== window) {
            const resultElement = document.createElement('div');
            resultElement.className = 'log success';
            resultElement.textContent = `Resultado: ${result}`;
            outputPanel.appendChild(resultElement);
        }

        if (logs.length > 0 || result !== undefined) {
            playerXP += 10;
            outputPanel.closest('.game-container')?.classList.add('xp-flash');
            setTimeout(() => outputPanel.closest('.game-container')?.classList.remove('xp-flash'), 400);
            updateUI();
        }

        const validateDelay = levelId >= 9 ? 2300 : 180;
        setTimeout(() => {
            if (validateExercise(levelId)) {
                completeLevel(levelId);
            }
        }, validateDelay);
    } catch (error) {
        const errorElement = document.createElement('div');
        errorElement.className = 'log error';
        errorElement.textContent = `Error: ${error.message}`;
        outputPanel.appendChild(errorElement);
    } finally {
        console.log = orig.log;
        console.error = orig.error;
        console.warn = orig.warn;
    }
}

// Clear console
function clearConsole(levelId) {
    const console = document.getElementById(`console-${levelId}`);
    if (console) {
        console.innerHTML = '';
    }
}

// Validate exercise completion
function validateExercise(levelId) {
    const editor = document.getElementById(`editor-${levelId}`);
    const consoleOutput = document.getElementById(`console-${levelId}`);
    
    if (!editor || !consoleOutput) {
        return false;
    }
    
    const code = editor.value.trim();
    const consoleText = consoleOutput.textContent;
    
    // More flexible validation for each level
    let isValid = false;
    switch(levelId) {
        case 1: // Variables
            isValid = code.includes('let') && code.includes('const') && 
                   code.includes('console.log') && consoleText.length > 0;
            break;
        case 2: // Functions
            isValid = (code.includes('function') || code.includes('=>')) && 
                   code.includes('console.log') && consoleText.length > 0;
            break;
        case 3: // Arrays
            isValid = code.includes('[') && (code.includes('push') || code.includes('pop')) && 
                   code.includes('console.log') && consoleText.length > 0;
            break;
        case 4: // Objects
            isValid = code.includes('{') && code.includes('console.log') && consoleText.length > 0;
            break;
        case 5:
            isValid =
                consoleText.length > 10 &&
                (code.includes('let') || code.includes('const')) &&
                code.includes('function') &&
                code.includes('console.log');
            break;
        case 6:
            isValid = code.includes('var') && code.includes('function') && consoleText.length > 5;
            break;
        case 7:
            isValid =
                code.includes('return') &&
                code.includes('function') &&
                consoleText.includes('XP') &&
                consoleText.length > 20;
            break;
        case 8:
            isValid =
                code.includes('function') &&
                (consoleText.includes('completado') || consoleText.includes('Cargando')) &&
                consoleText.length > 10;
            break;
        case 9:
            isValid = code.includes('Promise') && code.includes('.then') && consoleText.length > 10;
            break;
        case 10:
            isValid = code.includes('async') && code.includes('await') && consoleText.length > 15;
            break;
        default:
            isValid = code.length > 0 && consoleText.length > 0;
    }
    
    return isValid;
}

// Mark level as completed
function completeLevel(levelId) {
    
    if (!completedLevels.has(levelId)) {
        completedLevels.add(levelId);
        conceptsLearned++;
        playerXP += 100;
        
        // Save progress
        saveProgress();
        
        // Update UI
        updateUI();
        
        // Show completion notification
        showNotification(`¡Nivel ${levelId} completado! +100 XP`, 'success');

        const peaks = [3, 6, 9, 11, 22];
        if (peaks.includes(conceptsLearned)) {
            showNotification(`Ascenso · ${conceptsLearned}/${TOTAL_CONCEPTS} fundamentos`, 'success');
        }

        // Update navigation buttons
        updateNavigationButtons();
        
        // Add completion indicator to current level
        const currentLevelElement = document.getElementById(`level-${currentLevel}`);
        if (currentLevelElement) {
            currentLevelElement.classList.add('level-completed');
        }
        
        // Unlock next level if available
        if (currentLevel < PLAYABLE_LEVELS) {
            showNotification('¡Nivel siguiente desbloqueado!', 'success');
        }
    }
}

// Show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Keyboard navigation
// Solo navega si el foco NO está en un textarea ni input editable
// (para evitar conflicto con la edición de código)
document.addEventListener('keydown', function(e) {
    const active = document.activeElement;
    const isInput = active && (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && !active.readOnly) || active.isContentEditable);
    if (isInput) return;
    if (isWelcomeBlocking()) return;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        navigateLevel(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        navigateLevel(1);
    } else if (e.key === 'Enter' && e.ctrlKey) {
        // Ctrl+Enter to run code in current level
        const currentEditor = document.querySelector(`#level-${currentLevel} .code-textarea`);
        if (currentEditor) {
            const levelId = currentEditor.id.split('-')[1];
            runCode(levelId);
        }
    }
});

// Auto-save functionality
function autoSave() {
    const gameState = {
        currentLevel,
        playerXP,
        conceptsLearned,
        codeSnippets: {},
        completedLevels: Array.from(completedLevels) // Save completed levels
    };
    
    // Save code from all editors
    document.querySelectorAll('.code-textarea').forEach(textarea => {
        const levelId = textarea.id.split('-')[1];
        gameState.codeSnippets[levelId] = textarea.value;
    });
    
    localStorage.setItem('javascriptRPGState', JSON.stringify(gameState));
}

// Auto-load functionality
function autoLoad() {
    const savedState = localStorage.getItem('javascriptRPGState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        currentLevel = gameState.currentLevel || 1;
        playerXP = gameState.playerXP || 0;
        conceptsLearned = gameState.conceptsLearned || 0;
        completedLevels = new Set(gameState.completedLevels || []); // Load completed levels
        
        // Restore code snippets
        if (gameState.codeSnippets) {
            Object.keys(gameState.codeSnippets).forEach(levelId => {
                const textarea = document.getElementById(`editor-${levelId}`);
                if (textarea) {
                    textarea.value = gameState.codeSnippets[levelId];
                }
            });
        }
        
        // Restore completion indicators
        completedLevels.forEach(levelId => {
            const levelElement = document.getElementById(`level-${levelId}`);
            if (levelElement) {
                levelElement.classList.add('level-completed');
            }
        });
        
        updateUI();
    }
}

// Auto-save every 30 seconds
setInterval(autoSave, 30000);

// Save on page unload
window.addEventListener('beforeunload', autoSave);

// Call updateProgress whenever XP or concepts change
const originalUpdateUI = updateUI;
updateUI = function () {
    originalUpdateUI();
    updateProgressTrack();
};

// Theme Management
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    document.querySelectorAll('[data-theme-toggle]').forEach((themeBtn) => {
        themeBtn.textContent =
            newTheme === 'dark' ? '☀️ Tema claro' : '🌙 Tema oscuro';
    });
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    
    document.querySelectorAll('[data-theme-toggle]').forEach((themeBtn) => {
        themeBtn.textContent =
            savedTheme === 'dark' ? '☀️ Tema claro' : '🌙 Tema oscuro';
    });
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (isWelcomeBlocking()) return;
        // Ctrl/Cmd + Enter to run code
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const currentEditor = document.querySelector(`#level-${currentLevel} .code-textarea`);
            if (currentEditor) {
                const levelId = currentEditor.id.split('-')[1];
                runCode(levelId);
            }
        }
        
        // Ctrl/Cmd + S to save progress
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            autoSave();
            showNotification('Progreso guardado automáticamente', 'success');
        }
        
        // Space to pause/resume (for future audio features)
        if (e.key === ' ' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            // Future audio pause/resume functionality
        }
    });
}

function updateProgressTrack() {
    const pct = Math.min(100, (conceptsLearned / TOTAL_CONCEPTS) * 100);
    const progressBar = document.querySelector('.meta-progress-fill');
    if (progressBar) progressBar.style.width = `${pct}%`;

    const totalLbl = document.getElementById('concepts-total');
    if (totalLbl) totalLbl.textContent = String(TOTAL_CONCEPTS);

    if (
        conceptsLearned === PLAYABLE_LEVELS &&
        PLAYABLE_LEVELS < TOTAL_CONCEPTS &&
        !sessionStorage.getItem('road-playable-complete-toast')
    ) {
        sessionStorage.setItem('road-playable-complete-toast', '1');
        showNotification(
            '¡Has completado todos los niveles de esta versión! La referencia lista 33 fundamentos — el camino seguirá creciendo.',
            'success'
        );
        unlockAchievement('Heroe del Camino JS');
        document.body.classList.add('campaign-complete');
    }

    if (
        conceptsLearned === TOTAL_CONCEPTS &&
        TOTAL_CONCEPTS > 0 &&
        !sessionStorage.getItem('road-all-33-toast')
    ) {
        sessionStorage.setItem('road-all-33-toast', '1');
        showNotification('¡Los 33 fundamentos completados! 🏆', 'success');
        unlockAchievement('Maestro de los 33 fundamentos');
        document.body.classList.add('campaign-complete');
    }
}

// Achievement System
function unlockAchievement(achievementName) {
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    if (!achievements.includes(achievementName)) {
        achievements.push(achievementName);
        localStorage.setItem('achievements', JSON.stringify(achievements));
        showNotification(`¡Logro desbloqueado: ${achievementName}! 🏆`, 'success');
    }
}

// Save progress
function saveProgress() {
    autoSave();
}

// Load progress
function loadProgress() {
    autoLoad();
}

// Setup scroll detection for page navigation
function setupScrollDetection() {
    const levelContainer = document.querySelector('.levels-container');
    if (levelContainer) {
        levelContainer.addEventListener('scroll', function() {
            updateCurrentPageIndicator();
            // Update navigation buttons when scrolling
            setTimeout(() => {
                updateNavigationButtons();
            }, 100);
        });
    }
}

// Update current page indicator based on scroll position
function updateCurrentPageIndicator() {
    const levelContainer = document.querySelector('.levels-container');
    if (!levelContainer) return;
    
    const currentLevelElement = document.getElementById(`level-${currentLevel}`);
    if (!currentLevelElement) return;
    
    const containerWidth = levelContainer.clientWidth;
    const levelOffset = currentLevelElement.offsetLeft;
    const currentScroll = levelContainer.scrollLeft;
    const relativeScroll = currentScroll - levelOffset;
    const currentPageIndex = Math.round(relativeScroll / containerWidth);
    
    if (currentPageIndex >= 0 && currentPageIndex < 2) {
        updatePageIndicator(currentPageIndex + 1, 2);
    }
}

function initEmbers() {
    const canvas = document.getElementById('ember-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const P = 48;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    for (let i = 0; i < P; i++) {
        const vmHue = i % 3 === 0 ? [34, 211, 238] : i % 3 === 1 ? [139, 92, 246] : [37, 99, 235];
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: 0.5 + Math.random() * 2.2,
            vy: 0.3 + Math.random() * 1.2,
            vx: (Math.random() - 0.5) * 0.4,
            a: 0.15 + Math.random() * 0.45,
            rgb: vmHue,
        });
    }

    resize();
    window.addEventListener('resize', resize);

    function tick() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);
        particles.forEach((p) => {
            p.y -= p.vy;
            p.x += p.vx + Math.sin((p.y + Date.now() * 0.02) * 0.01) * 0.15;
            if (p.y < -4) {
                p.y = h + 4;
                p.x = Math.random() * w;
            }
            ctx.beginPath();
            const [cr, cg, cb] = p.rgb;
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${p.a})`;
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}
