/**
 * FIFA Mobile - Game Class (Enhanced)
 * Controlador principal del juego con todas las mejoras
 */

class Game {
    constructor() {
        try {
            // Canvas y contexto
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            window.debugConsole.log('Canvas initialized: ' + this.canvas.width + 'x' + this.canvas.height, 'success');
            
            // Estados del juego
            this.STATE = {
                MENU: 'menu',
                PLAYING: 'playing',
                PAUSED: 'paused',
                ENDED: 'ended',
                GOAL: 'goal',
                HALFTIME: 'halftime'
            };
            
            this.currentState = this.STATE.MENU;
            
            // Equipos
            window.debugConsole.log('Creating teams...', 'info');
            this.homeTeam = new Team('home', true);
            this.awayTeam = new Team('away', false);
            window.debugConsole.log('Teams created successfully', 'success');
            
            // Controlador de IA
            this.aiController = new AIController(this.awayTeam);
            
            // Balón
            this.ball = new Ball(600, 350);
            
            // Tiempo
            this.matchDuration = 180;
            this.timeRemaining = this.matchDuration;
            this.currentHalf = 1;
            this.halfDuration = 90;
            this.lastTime = 0;
            this.gameTime = 0;
            
            // Estadísticas
            this.stats = {
                home: { shots: 0, fouls: 0, passes: 0, possession: 0 },
                away: { shots: 0, fouls: 0, passes: 0, possession: 0 }
            };
            
            // Input
            this.keys = {};
            this.mouseX = 600;
            this.mouseY = 350;
            this.isMouseDown = false;
            
            // Android controls
            this.androidControls = null;
            
            // FPS
            this.fps = 60;
            this.frameCount = 0;
            this.lastFpsUpdate = 0;
            
            // UI Elements
            this.ui = {
                homeScore: document.getElementById('home-score'),
                awayScore: document.getElementById('away-score'),
                matchTime: document.getElementById('match-time'),
                ballPossession: document.getElementById('ball-possession'),
                gameStatus: document.getElementById('game-status'),
                possessionBar: document.querySelector('.home-poss'),
                halfIndicator: document.getElementById('half-indicator'),
                fpsCounter: document.getElementById('fps-counter')
            };
            
            // Screens
            this.screens = {
                start: document.getElementById('start-screen'),
                pause: document.getElementById('pause-screen'),
                end: document.getElementById('end-screen'),
                instructions: document.getElementById('instructions-screen')
            };
            
            // Event notification
            this.eventNotification = document.getElementById('event-notification');
            this.eventText = document.getElementById('event-text');
            
            window.debugConsole.log('All elements found, initializing...', 'info');
            this.init();
            
        } catch (error) {
            window.debugConsole.error('Game initialization failed', error.message, error.stack);
            console.error('Game initialization error:', error);
        }
    }

    init() {
        try {
            this.setupEventListeners();
            this.setupAndroidControls();
            this.startGameLoop();
            window.debugConsole.log('Game initialized successfully!', 'success');
        } catch (error) {
            window.debugConsole.error('Init method failed', error.message, error.stack);
        }
    }

    setupEventListeners() {
        try {
            // Keyboard
            document.addEventListener('keydown', (e) => {
                this.keys[e.code] = true;
                
                if (this.currentState === this.STATE.PLAYING) {
                    const player = this.homeTeam.controlledPlayer;
                    
                    if (e.code === 'Escape') this.togglePause();
                    if (e.code === 'KeyR') this.resetMatch();
                    
                    if (player && player.hasBall) {
                        if (e.code === 'KeyQ') {
                            const target = this.homeTeam.findBestPassTarget(player);
                            if (target) {
                                player.pass(target, this.ball);
                                this.showAction('PASE');
                                this.stats.home.passes++;
                            }
                        }
                        if (e.code === 'KeyE') {
                            const targetX = this.homeTeam.side === 'home' ? 1200 : 0;
                            if (player.shoot(targetX, 350, this.ball)) {
                                this.showAction('¡TIRO!');
                                this.stats.home.shots++;
                            }
                        }
                        if (e.code === 'KeyW' && !this.keys['ArrowUp']) {
                            const target = this.homeTeam.findBestPassTarget(player);
                            if (target) {
                                player.lobPass(target, this.ball);
                                this.showAction('GOLPE ALTO');
                                this.stats.home.passes++;
                            }
                        }
                    }
                }
            });

            document.addEventListener('keyup', (e) => {
                this.keys[e.code] = false;
            });

            // Mouse
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
                this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            });

            this.canvas.addEventListener('mousedown', (e) => {
                if (this.currentState === this.STATE.PLAYING) {
                    this.isMouseDown = true;
                    const player = this.homeTeam.controlledPlayer;
                    if (player && player.hasBall) {
                        if (player.shoot(this.mouseX, this.mouseY, this.ball)) {
                            this.showAction('¡DISPARO!');
                            this.stats.home.shots++;
                        }
                    }
                }
            });

            this.canvas.addEventListener('mouseup', () => {
                this.isMouseDown = false;
            });

            // UI buttons
            document.getElementById('start-match')?.addEventListener('click', () => {
                window.audioManager?.playSound('button');
                this.startMatch();
            });

            document.getElementById('instructions-btn')?.addEventListener('click', () => {
                window.audioManager?.playSound('button');
                this.showScreen('instructions');
            });

            document.getElementById('close-instructions')?.addEventListener('click', () => {
                this.hideScreen('instructions');
            });

            document.getElementById('resume-match')?.addEventListener('click', () => {
                window.audioManager?.playSound('button');
                this.togglePause();
            });

            document.getElementById('restart-match')?.addEventListener('click', () => {
                window.audioManager?.playSound('button');
                this.resetMatch();
                this.startMatch();
            });

            document.getElementById('quit-match')?.addEventListener('click', () => {
                window.audioManager?.playSound('button');
                this.resetMatch();
                this.showScreen('start');
                this.currentState = this.STATE.MENU;
            });

            document.getElementById('play-again')?.addEventListener('click', () => {
                window.audioManager?.playSound('button');
                this.resetMatch();
                this.startMatch();
            });

            document.getElementById('back-menu')?.addEventListener('click', () => {
                window.audioManager?.playSound('button');
                this.resetMatch();
                this.showScreen('start');
                this.currentState = this.STATE.MENU;
            });

            document.getElementById('game-mode')?.addEventListener('change', (e) => {
                switch (e.target.value) {
                    case 'quick': this.matchDuration = 180; break;
                    case 'full': this.matchDuration = 360; break;
                    case 'practice': this.matchDuration = 999; break;
                }
            });

            window.debugConsole.log('Event listeners set up', 'success');
        } catch (error) {
            window.debugConsole.error('setupEventListeners failed', error.message, error.stack);
        }
    }

    setupAndroidControls() {
        try {
            if (typeof AndroidControls !== 'undefined') {
                this.androidControls = new AndroidControls(this);
                window.debugConsole.log('Android controls initialized', 'success');
            }
        } catch (error) {
            window.debugConsole.warn('Android controls not available', error.message);
        }
    }

    startMatch() {
        try {
            this.hideAllScreens();
            this.currentState = this.STATE.PLAYING;
            this.updateStatus('¡Partido en juego!');
            window.audioManager?.playSound('whistle');
            
            const player = this.homeTeam.controlledPlayer;
            if (player) {
                this.ball.assignTo(player);
            }
            window.debugConsole.log('Match started!', 'success');
        } catch (error) {
            window.debugConsole.error('startMatch failed', error.message, error.stack);
        }
    }

    togglePause() {
        if (this.currentState === this.STATE.PLAYING) {
            this.currentState = this.STATE.PAUSED;
            this.showScreen('pause');
            this.updatePauseStats();
            this.updateStatus('Partido pausado');
        } else if (this.currentState === this.STATE.PAUSED) {
            this.currentState = this.STATE.PLAYING;
            this.hideScreen('pause');
            this.updateStatus('¡Partido en juego!');
        }
    }

    resetMatch() {
        this.timeRemaining = this.matchDuration;
        this.currentHalf = 1;
        this.homeTeam.resetScore();
        this.homeTeam.resetPositions();
        this.awayTeam.resetScore();
        this.awayTeam.resetPositions();
        this.ball.reset();
        
        this.stats = {
            home: { shots: 0, fouls: 0, passes: 0, possession: 0 },
            away: { shots: 0, fouls: 0, passes: 0, possession: 0 }
        };
        
        this.updateUI();
        this.updateHalfIndicator();
    }

    showScreen(screenName) {
        this.screens[screenName]?.classList.remove('hidden');
    }

    hideScreen(screenName) {
        this.screens[screenName]?.classList.add('hidden');
    }

    hideAllScreens() {
        Object.values(this.screens).forEach(screen => screen?.classList.add('hidden'));
    }

    showAction(text) {
        this.updateStatus(text);
    }

    showEvent(text) {
        if (this.eventText) this.eventText.textContent = text;
        if (this.eventNotification) {
            this.eventNotification.classList.remove('hidden');
            this.eventNotification.classList.add('show');
            setTimeout(() => {
                this.eventNotification.classList.remove('show');
                this.eventNotification.classList.add('hidden');
            }, 2000);
        }
    }

    updateStatus(text) {
        if (this.ui.gameStatus) this.ui.gameStatus.textContent = text;
    }

    updatePauseStats() {
        document.getElementById('pause-shots-home').textContent = this.stats.home.shots;
        document.getElementById('pause-shots-away').textContent = this.stats.away.shots;
        document.getElementById('pause-fouls-home').textContent = this.stats.home.fouls;
        document.getElementById('pause-fouls-away').textContent = this.stats.away.fouls;
    }

    updateHalfIndicator() {
        if (this.ui.halfIndicator) this.ui.halfIndicator.textContent = this.currentHalf + 'H';
    }

    startGameLoop() {
        const loop = (timestamp) => {
            try {
                // Skip first frame to avoid NaN deltaTime
                if (this.lastTime === 0) {
                    this.lastTime = timestamp;
                    requestAnimationFrame(loop);
                    return;
                }

                const deltaTime = Math.min(timestamp - this.lastTime, 100); // Cap at 100ms
                this.lastTime = timestamp;
                this.gameTime = timestamp;

                this.frameCount++;
                if (timestamp - this.lastFpsUpdate > 1000) {
                    this.fps = this.frameCount;
                    this.frameCount = 0;
                    this.lastFpsUpdate = timestamp;
                    if (this.ui.fpsCounter) this.ui.fpsCounter.textContent = this.fps + ' FPS';
                }

                this.update(deltaTime);
                this.render();
            } catch (error) {
                window.debugConsole.error('Game loop error', error.message, error.stack);
                console.error('Game loop error:', error);
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    update(deltaTime) {
        if (this.currentState !== this.STATE.PLAYING) return;
        
        this.timeRemaining -= deltaTime / 1000;
        
        if (this.timeRemaining <= 0) {
            if (this.currentHalf === 1 && this.matchDuration > 180) {
                this.startHalfTime();
            } else {
                this.endMatch();
            }
            return;
        }
        
        // Update controls
        if (this.androidControls) this.androidControls.update();
        
        // Update players
        this.homeTeam.players.forEach(player => {
            if (player === this.homeTeam.controlledPlayer) {
                player.update(this.ball, this.keys, deltaTime);
            } else {
                player.update(this.ball, {}, deltaTime);
            }
        });
        
        this.awayTeam.players.forEach(player => {
            player.update(this.ball, {}, deltaTime);
        });
        
        // Update AI
        this.aiController.update(this.ball, this.homeTeam, Date.now());
        
        // Update ball
        this.ball.update(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Check goals
        const goalResult = this.checkGoals();
        if (goalResult) this.handleGoal(goalResult);
        
        // Update possession
        this.updatePossession();
        this.updateUI();
    }

    checkCollisions() {
        this.homeTeam.players.forEach(player => this.checkPlayerBallCollision(player));
        this.awayTeam.players.forEach(player => this.checkPlayerBallCollision(player));
        this.checkBallSteal();
        this.checkPlayerCollisions();
    }

    checkPlayerBallCollision(player) {
        if (player.hasBall) return;
        
        const distance = player.distanceTo(this.ball);
        const ballSpeed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
        
        // Distancia de recogida aumentada para balón quieto
        // Más difícil recoger un balón que se mueve rápido
        const baseCatchDistance = player.radius + this.ball.radius + 5;
        const speedFactor = Math.max(0.5, 1 - ballSpeed * 0.08);
        const catchDistance = baseCatchDistance * speedFactor;
        
        if (distance < catchDistance && this.ball.isFree) {
            this.ball.assignTo(player);
            // Efecto visual
            player.addEffect('pickup');
        }
    }

    checkBallSteal() {
        if (!this.ball.owner) return;
        const ballOwner = this.ball.owner;
        const enemyTeam = ballOwner.team === 'home' ? this.awayTeam : this.homeTeam;
        
        enemyTeam.players.forEach(player => {
            if (player.isGoalkeeper) return;
            const distance = player.distanceTo(ballOwner);
            if (distance < 22 && Math.random() < 0.15) {
                this.ball.assignTo(player);
            }
        });
    }

    checkPlayerCollisions() {
        const allPlayers = [...this.homeTeam.players, ...this.awayTeam.players];
        for (let i = 0; i < allPlayers.length; i++) {
            for (let j = i + 1; j < allPlayers.length; j++) {
                const p1 = allPlayers[i], p2 = allPlayers[j];
                const dx = p2.x - p1.x, dy = p2.y - p1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = p1.radius + p2.radius;
                
                if (distance < minDist && distance > 0) {
                    const overlap = minDist - distance;
                    const nx = dx / distance, ny = dy / distance;
                    p1.x -= nx * overlap * 0.5;
                    p1.y -= ny * overlap * 0.5;
                    p2.x += nx * overlap * 0.5;
                    p2.y += ny * overlap * 0.5;
                }
            }
        }
    }

    checkGoals() {
        const goalWidth = 120;
        const goalTop = (700 - goalWidth) / 2;
        const goalBottom = (700 + goalWidth) / 2;
        
        if (this.ball.x < -30 && this.ball.y > goalTop && this.ball.y < goalBottom) return 'away';
        if (this.ball.x > 1230 && this.ball.y > goalTop && this.ball.y < goalBottom) return 'home';
        return null;
    }

    handleGoal(scorer) {
        if (scorer === 'home') {
            this.homeTeam.incrementScore();
            this.stats.home.shots++;
            this.showEvent('¡GOOOL!');
        } else {
            this.awayTeam.incrementScore();
            this.stats.away.shots++;
            this.showEvent('GOOL CPU');
        }
        
        window.audioManager?.playSound('goal');
        this.animateScore(scorer);
        
        setTimeout(() => {
            this.ball.reset();
            const player = scorer === 'home' ? this.awayTeam.players[9] : this.homeTeam.controlledPlayer;
            if (player) this.ball.assignTo(player);
        }, 2000);
    }

    animateScore(scorer) {
        const scoreEl = scorer === 'home' ? this.ui.homeScore : this.ui.awayScore;
        if (scoreEl) {
            scoreEl.classList.add('scored');
            setTimeout(() => scoreEl.classList.remove('scored'), 500);
        }
    }

    startHalfTime() {
        this.currentState = this.STATE.HALFTIME;
        window.audioManager?.playSound('halfTime');
        this.showEvent('FINAL DEL 1er TIEMPO');
        
        setTimeout(() => {
            this.currentHalf = 2;
            this.timeRemaining = this.halfDuration;
            this.currentState = this.STATE.PLAYING;
            this.updateHalfIndicator();
            this.homeTeam.resetPositions();
            this.awayTeam.resetPositions();
            this.ball.reset();
            this.ball.assignTo(this.awayTeam.controlledPlayer);
            window.audioManager?.playSound('whistle');
        }, 3000);
    }

    updatePossession() {
        let homePossession = 50;
        if (this.ball.owner) {
            homePossession = this.ball.owner.team === 'home' ? 75 : 25;
        }
        if (this.ui.possessionBar) this.ui.possessionBar.style.width = homePossession + '%';
        this.stats.home.possession = homePossession;
        this.stats.away.possession = 100 - homePossession;
        
        const possessor = this.ball.owner 
            ? (this.ball.owner.team === 'home' ? 'Tu Equipo' : 'CPU') 
            : 'Balón libre';
        if (this.ui.ballPossession) this.ui.ballPossession.textContent = `⚽ Posee: ${possessor}`;
    }

    updateUI() {
        if (this.ui.homeScore) this.ui.homeScore.textContent = this.homeTeam.score;
        if (this.ui.awayScore) this.ui.awayScore.textContent = this.awayTeam.score;
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        if (this.ui.matchTime) this.ui.matchTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    endMatch() {
        this.currentState = this.STATE.ENDED;
        window.audioManager?.playSound('finalWhistle');
        
        const homeScore = this.homeTeam.score;
        const awayScore = this.awayTeam.score;
        
        let resultTitle = homeScore > awayScore ? '🏆 ¡VICTORIA!' : homeScore < awayScore ? '😢 DERROTA' : '🤝 EMPATE';
        
        document.getElementById('result-title').textContent = resultTitle;
        document.getElementById('final-home-score').textContent = homeScore;
        document.getElementById('final-away-score').textContent = awayScore;
        document.getElementById('stat-goals-home').textContent = homeScore;
        document.getElementById('stat-goals-away').textContent = awayScore;
        document.getElementById('stat-shots-home').textContent = this.stats.home.shots;
        document.getElementById('stat-shots-away').textContent = this.stats.away.shots;
        document.getElementById('stat-fouls-home').textContent = this.stats.home.fouls;
        document.getElementById('stat-fouls-away').textContent = this.stats.away.fouls;
        
        this.showScreen('end');
        this.updateStatus(`Final: ${homeScore} - ${awayScore}`);
    }

    render() {
        try {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawField();
            
            const time = Date.now();
            this.homeTeam.draw(this.ctx, time);
            this.awayTeam.draw(this.ctx, time);
            this.ball.draw(this.ctx);
            
            if (this.currentState === this.STATE.PLAYING) this.drawGameUI();
        } catch (error) {
            window.debugConsole.error('Render error', error.message, error.stack);
        }
    }

    drawField() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#2d8a4e');
        gradient.addColorStop(0.5, '#228b22');
        gradient.addColorStop(1, '#2d8a4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'white';
        
        ctx.strokeRect(20, 20, width - 40, height - 40);
        
        ctx.beginPath();
        ctx.moveTo(width / 2, 20);
        ctx.lineTo(width / 2, height - 20);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 80, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeRect(20, 150, 140, 400);
        ctx.strokeRect(20, 250, 60, 200);
        ctx.beginPath();
        ctx.arc(110, height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeRect(width - 160, 150, 140, 400);
        ctx.strokeRect(width - 80, 250, 60, 200);
        ctx.beginPath();
        ctx.arc(width - 110, height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawGoal(ctx, 0, 290);
        this.drawGoal(ctx, width - 25, 290);
        
        this.drawCorner(ctx, 20, 20, 0);
        this.drawCorner(ctx, width - 20, 20, Math.PI / 2);
        this.drawCorner(ctx, 20, height - 20, -Math.PI / 2);
        this.drawCorner(ctx, width - 20, height - 20, Math.PI);
    }

    drawCorner(ctx, x, y, angle) {
        ctx.beginPath();
        ctx.arc(x, y, 15, angle, angle + Math.PI / 2);
        ctx.stroke();
    }

    drawGoal(ctx, x, y) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(x, y, 25, 120);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.strokeRect(x, y, 25, 120);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + i * 24);
            ctx.lineTo(x + 25, y + i * 24);
            ctx.stroke();
        }
    }

    drawGameUI() {
        const ctx = this.ctx;
        if (this.ball.owner && this.ball.owner.team === 'home') {
            const player = this.ball.owner;
            ctx.beginPath();
            ctx.setLineDash([8, 4]);
            ctx.strokeStyle = 'rgba(249, 199, 79, 0.4)';
            ctx.lineWidth = 2;
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(1200, player.y);
            ctx.lineTo(1200, 350);
            ctx.stroke();
            ctx.setLineDash([]);
            
            if (Math.abs(player.vx) < 0.5 && Math.abs(player.vy) < 0.5) {
                ctx.fillStyle = 'rgba(249, 199, 79, 0.9)';
                ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Click para disparar', player.x, player.y - 35);
            }
        }
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.debugConsole.log('DOM loaded, creating game...', 'info');
        window.game = new Game();
        window.debugConsole.log('Game created successfully!', 'success');
    } catch (error) {
        window.debugConsole.error('Failed to create game', error.message, error.stack);
        console.error('Game creation error:', error);
    }
});