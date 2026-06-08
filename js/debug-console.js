/**
 * FIFA Mobile - Debug Console
 * Consola de logs para debugging con interface visual
 */

class DebugConsole {
    constructor() {
        this.logs = [];
        this.maxLogs = 200;
        this.isVisible = false;
        this.isMinimized = false;
        this.errorCount = 0;
        
        this.injectStyles();
        this.createElements();
        this.bindEvents();
        
        this.log('Debug Console initialized', 'success');
        this.log('Press F2 or click button to toggle', 'info');
    }

    injectStyles() {
        // Load external CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/debug-console.css';
        document.head.appendChild(link);
    }

    createElements() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'debug-console';
        this.container.innerHTML = `
            <div class="debug-header" id="debug-header">
                <span class="debug-title">FIFA Mobile Debug Console</span>
                <div class="debug-controls">
                    <button class="debug-btn minimize" id="btn-minimize">−</button>
                    <button class="debug-btn copy" id="btn-copy-logs">📋 Copy</button>
                    <button class="debug-btn clear" id="btn-clear-logs">🗑️ Clear</button>
                </div>
            </div>
            <div class="debug-stats">
                <div class="stat-item">
                    <div class="stat-label">FPS</div>
                    <div class="stat-value" id="debug-fps">60</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Errors</div>
                    <div class="stat-value" id="debug-errors">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Logs</div>
                    <div class="stat-value" id="debug-log-count">0</div>
                </div>
            </div>
            <div class="debug-logs" id="debug-logs"></div>
        `;
        document.body.appendChild(this.container);

        // Create toggle button
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.id = 'debug-toggle';
        this.toggleBtn.innerHTML = 'Debug<span class="badge" style="display:none">0</span>';
        document.body.appendChild(this.toggleBtn);

        // Cache elements
        this.logsContainer = document.getElementById('debug-logs');
        this.fpsDisplay = document.getElementById('debug-fps');
        this.errorsDisplay = document.getElementById('debug-errors');
        this.logCountDisplay = document.getElementById('debug-log-count');
        this.badge = this.toggleBtn.querySelector('.badge');
    }

    bindEvents() {
        // Toggle button
        this.toggleBtn.addEventListener('click', () => this.toggle());

        // Header click to minimize
        document.getElementById('debug-header').addEventListener('click', (e) => {
            if (!e.target.closest('.debug-btn')) {
                this.toggleMinimize();
            }
        });

        // Minimize button
        document.getElementById('btn-minimize').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        });

        // Copy button
        document.getElementById('btn-copy-logs').addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyLogs();
        });

        // Clear button
        document.getElementById('btn-clear-logs').addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearLogs();
        });

        // Keyboard shortcut (F2)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'F12') {
                e.preventDefault();
                this.toggle();
            }
        });

        // Auto-catch console errors
        this.setupGlobalErrorHandler();
    }

    setupGlobalErrorHandler() {
        // Catch JavaScript errors
        window.onerror = (message, source, lineno, colno, error) => {
            this.error(message, `Line ${lineno}:${colno} in ${source}`, error?.stack);
            return false;
        };

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled Promise Rejection', event.reason?.message || event.reason, event.reason?.stack);
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.container.classList.toggle('visible', this.isVisible);
        this.toggleBtn.style.display = this.isVisible ? 'none' : 'block';
        
        if (this.isVisible) {
            this.container.classList.remove('minimized');
            this.isMinimized = false;
        }
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.container.classList.toggle('minimized', this.isMinimized);
        
        const btn = document.getElementById('btn-minimize');
        btn.textContent = this.isMinimized ? '+' : '−';
    }

    log(message, type = 'info', source = 'System') {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        
        const entry = {
            timestamp,
            message,
            type,
            source
        };

        this.logs.push(entry);
        
        // Limit logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.renderLog(entry);
        this.updateStats();
    }

    info(message, source = 'Info') {
        this.log(message, 'info', source);
        console.info(`[${source}]`, message);
    }

    success(message, source = 'Success') {
        this.log(message, 'success', source);
        console.success?.(`[${source}]`, message) || console.log(`✅ [${source}]`, message);
    }

    warn(message, source = 'Warning') {
        this.log(message, 'warning', source);
        console.warn(`⚠️ [${source}]`, message);
    }

    error(message, details = null, stack = null) {
        this.errorCount++;
        this.log(message, 'error', 'ERROR');
        
        let fullMessage = message;
        if (details) fullMessage += `\nDetails: ${details}`;
        if (stack) fullMessage += `\nStack: ${stack}`;
        
        console.error('❌ [ERROR]', fullMessage);
        
        this.updateBadge();
    }

    debug(message, source = 'Debug') {
        this.log(message, 'debug', source);
        console.debug(`[${source}]`, message);
    }

    renderLog(entry) {
        const logEl = document.createElement('div');
        logEl.className = `log-entry ${entry.type}`;
        
        const timeEl = document.createElement('span');
        timeEl.className = 'log-time';
        timeEl.textContent = entry.timestamp;
        
        const sourceEl = document.createElement('span');
        sourceEl.className = 'log-source';
        sourceEl.textContent = entry.source;
        
        const messageEl = document.createElement('span');
        messageEl.className = 'log-message';
        messageEl.textContent = entry.message;
        
        logEl.appendChild(timeEl);
        logEl.appendChild(sourceEl);
        logEl.appendChild(messageEl);
        
        this.logsContainer.appendChild(logEl);
        
        // Auto-scroll to bottom
        this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
    }

    updateStats() {
        this.fpsDisplay.textContent = window.game?.fps || 60;
        this.errorsDisplay.textContent = this.errorCount;
        this.logCountDisplay.textContent = this.logs.length;
    }

    updateBadge() {
        if (this.errorCount > 0) {
            this.badge.style.display = 'flex';
            this.badge.textContent = this.errorCount;
        }
    }

    clearBadge() {
        this.errorCount = 0;
        this.badge.style.display = 'none';
    }

    clearLogs() {
        this.logs = [];
        this.logsContainer.innerHTML = '';
        this.clearBadge();
        this.updateStats();
        this.log('Logs cleared', 'info');
    }

    copyLogs() {
        const text = this.logs.map(log => 
            `[${log.timestamp}] [${log.type.toUpperCase()}] [${log.source}] ${log.message}`
        ).join('\n');

        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Logs copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showNotification('Logs copied to clipboard!');
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }

    // Method to attach to game for real-time stats
    startStatsMonitoring() {
        setInterval(() => {
            this.updateStats();
        }, 500);
    }
}

// Create global instance
window.debugConsole = new DebugConsole();

// Also expose a simple global log function
const _originalConsoleLog = console.log.bind(console);
window.log = (...args) => {
    const [message, type, source] = args;
    window.debugConsole.log(message, type || 'info', source || 'Game');
};