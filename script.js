// Utilidades para navegación y estado
let currentLevel = 1;
let currentPage = 1;
const totalLevels = 10;

// Game State
let playerXP = 0;
let conceptsLearned = 0;
let completedLevels = new Set(); // Track completed levels

// Scroll state
let isScrolling = false;

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    setupCodeEditors();
    loadTheme();
    setupKeyboardShortcuts();
    setupScrollDetection();
    loadProgress(); // Load completed levels
    setupHorizontalScroll(); // Setup horizontal scroll functionality
    
    // Debug: Test scroll functionality
    setTimeout(() => {
        console.log('Testing scroll functionality...');
        const testLevel = document.getElementById('level-1');
        if (testLevel) {
            console.log('Level 1 found, scroll width:', testLevel.scrollWidth, 'client width:', testLevel.clientWidth);
        }
    }, 1000);
});

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
    
    // Update all page indicators with current level
    const pageIndicators = document.querySelectorAll('.page-indicator');
    pageIndicators.forEach(indicator => {
        const currentText = indicator.textContent;
        if (currentText.includes('Página')) {
            const pageInfo = currentText.split('|')[0].trim();
            indicator.textContent = `${pageInfo} | Nivel ${displayLevel}/${totalLevels}`;
        }
    });
    
    // Update navigation buttons based on completion status
    updateNavigationButtons();
    
    // Update level lock states
    updateLevelLockStates();
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
        updateNavigationButtons();
        isScrolling = false;
        console.log(`Current page updated to ${currentPage}, final scroll position: ${currentLevelElement.scrollLeft}`);
    }, 600); // Increased timeout for smoother transition
}

// Navigate between levels
function navigateLevel(direction) {
    const newLevel = currentLevel + direction;
    if (newLevel < 1 || newLevel > totalLevels) return;
    
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
        indicator.textContent = `Página ${currentPage} de ${totalPages} | Nivel ${displayLevel}/${totalLevels}`;
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
        if (index === 0) {
            level.style.display = 'flex';
        } else {
            level.style.display = 'none';
        }
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
    const editor = document.getElementById(`editor-${levelId}`);
    const console = document.getElementById(`console-${levelId}`);
    
    if (!editor || !console) return;
    
    const code = editor.value;
    
    // Clear console
    console.innerHTML = '';
    
    try {
        // Create a safe execution environment
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        
        const logs = [];
        
        // Override console methods to capture output
        console.log = function(...args) {
            logs.push({ type: 'log', content: args.join(' ') });
        };
        
        console.error = function(...args) {
            logs.push({ type: 'error', content: args.join(' ') });
        };
        
        console.warn = function(...args) {
            logs.push({ type: 'warn', content: args.join(' ') });
        };
        
        // Execute the code
        const result = eval(code);
        
        // Display logs
        logs.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = `log ${log.type}`;
            logElement.textContent = log.content;
            console.appendChild(logElement);
        });
        
        // Display return value if any
        if (result !== undefined) {
            const resultElement = document.createElement('div');
            resultElement.className = 'log success';
            resultElement.textContent = `Resultado: ${result}`;
            console.appendChild(resultElement);
        }
        
        // Award XP for successful execution
        if (logs.length > 0) {
            playerXP += 10;
            updateUI();
        }
        
        // Check if exercise is completed
        setTimeout(() => {
            if (validateExercise(levelId)) {
                completeLevel(levelId);
            }
        }, 500);
        
    } catch (error) {
        const errorElement = document.createElement('div');
        errorElement.className = 'log error';
        errorElement.textContent = `Error: ${error.message}`;
        console.appendChild(errorElement);
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
        
        // Update navigation buttons
        updateNavigationButtons();
        
        // Add completion indicator to current level
        const currentLevelElement = document.getElementById(`level-${currentLevel}`);
        if (currentLevelElement) {
            currentLevelElement.classList.add('level-completed');
        }
        
        // Unlock next level if available
        if (currentLevel < totalLevels) {
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

// Load saved state on page load
window.addEventListener('load', autoLoad);

// Save on page unload
window.addEventListener('beforeunload', autoSave);

// Progress tracking
function updateProgress() {
    const progress = (conceptsLearned / totalLevels) * 100;
    
    // Update progress bar if it exists
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    // Check for level completion
    if (conceptsLearned === totalLevels) {
        showNotification('¡Felicidades! Has completado todos los conceptos de JavaScript! 🎉', 'success');
    }
}

// Call updateProgress whenever XP or concepts change
const originalUpdateUI = updateUI;
updateUI = function() {
    originalUpdateUI();
    updateProgress();
};

// Theme Management
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme button text
    const themeBtn = document.querySelector('.nav-link[onclick="toggleTheme()"]');
    if (themeBtn) {
        themeBtn.innerHTML = newTheme === 'dark' ? '☀️ Tema Claro' : '🌙 Tema Oscuro';
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    
    const themeBtn = document.querySelector('.nav-link[onclick="toggleTheme()"]');
    if (themeBtn) {
        themeBtn.innerHTML = savedTheme === 'dark' ? '☀️ Tema Claro' : '🌙 Tema Oscuro';
    }
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
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

// Enhanced Progress Tracking
function updateProgress() {
    const progress = (conceptsLearned / totalLevels) * 100;
    
    // Update progress bar if it exists
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    // Check for level completion
    if (conceptsLearned === totalLevels) {
        showNotification('¡Felicidades! Has completado todos los conceptos de JavaScript! 🎉', 'success');
        unlockAchievement('Master JavaScript Developer');
    }
    
    // Check for milestones
    const milestones = [5, 10, 15, 20, 25, 30];
    if (milestones.includes(conceptsLearned)) {
        showNotification(`¡Milestone alcanzado! ${conceptsLearned} conceptos aprendidos`, 'success');
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
