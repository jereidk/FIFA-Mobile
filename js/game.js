/**
 * FIFA Mobile - Game Class (Enhanced)
 * Controlador principal del juego con todas las mejoras
 */

class Game {
    constructor() {
        // Canvas y contexto
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
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
        this.homeTeam = new Team('home', true);
        this.awayTeam = new Team('away', false);
        
        // Controlador de IA
        this.aiController = new AIController(this.awayTeam);
        
        // Balón
        this.ball = new Ball(600, 350);
        
        // Tiempo
        this.matchDuration = 180; // 3 minutos default
        this.timeRemaining = this.matchDuration;
        this.currentHalf = 1;
        this.halfDuration = 90; // segundos por tiempo
        this.lastTime = 0;
        this.gameTime = 0;
        
        // Estadísticas del partido
        this.stats = {
            home: { shots: 0, fouls: 0, passes: 0, possession: 0 },
            away: { shots: 0, fouls: 0, passes: 0, possession: 0 }
        };
        
        // Input
        this.keys = {};
        
        // Ratón
        this.mouseX = 600;
        this.mouseY = 350;
        this.isMouseDown = false;
        
        // Control táctil (Android)
        this.androidControls = null;
        
        // FPS counter
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
        
        // Pantallas
        this.screens = {
            start: document.getElementById('start-screen'),
            pause: document.getElementById('pause-screen'),
            end: document.getElementById('end-screen'),
            instructions: document.getElementById('instructions-screen')
        };
        
        // Notificación de eventos
        this.eventNotification = document.getElementById('event-notification');
        this.eventText = document.getElementById('event-text');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAndroidControls();
        this.startGameLoop();
        
        console.log('⚽ FIFA Mobile Enhanced Initialized');
    }

    setupEventListeners() {
        // Teclado
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (this.currentState === this.STATE.PLAYING) {
                const player = this.homeTeam.controlledPlayer;
                
                // Controles especiales
                if (e.code === 'Escape') {
                    this.togglePause();
                }
                if (e.code === 'KeyR') {
                    this.resetMatch();
                }
                
                if (player && player.hasBall) {
                    // Pasar (Q)
                    if (e.code === 'KeyQ') {
                        const target = this.homeTeam.findBestPassTarget(player);
                        if (target) {
                            player.pass(target, this.ball);
                            this.showAction('PASE');
                            this.stats.home.passes++;
                        }
                    }
                    
                    // Disparar (E)
                    if (e.code === 'KeyE') {
                        const targetX = this.homeTeam.side === 'home' ? 1200 : 0;
                        if (player.shoot(targetX, 350, this.ball)) {
                            this.showAction('¡TIRO!');
                            this.stats.home.shots++;
                        }
                    }
                    
                    // Lob pass (W)
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

        // Ratón
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (this.currentState === this.STATE.PLAYING) {
                this.isMouseDown = true;
                
                const player = this.homeTeam.controlledPlayer;
                if (player && player.hasBall) {
                    // Click para disparar hacia la posición del cursor
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

        // Botones de UI
        document.getElementById('start-match').addEventListener('click', () => {
            window.audioManager.playSound('button');
            this.startMatch();
        });

        document.getElementById('instructions-btn').addEventListener('click', () => {
            window.audioManager.playSound('button');
            this.showScreen('instructions');
        });

        document.getElementById('close-instructions').addEventListener('click', () => {
            this.hideScreen('instructions');
        });

        document.getElementById('resume-match').addEventListener('click', () => {
            window.audioManager.playSound('button');
            this.togglePause();
        });

        document.getElementById('restart-match').addEventListener('click', () => {
            window.audioManager.playSound('button');
            this.resetMatch();
            this.startMatch();
        });

        document.getElementById('quit-match').addEventListener('click', () => {
            window.audioManager.playSound('button');
            this.resetMatch();
            this.showScreen('start');
            this.currentState = this.STATE.MENU;
        });

        document.getElementById('play-again').addEventListener('click', () => {
            window.audioManager.playSound('button');
            this.resetMatch();
            this.startMatch();
        });

        document.getElementById('back-menu').addEventListener('click', () => {
            window.audioManager.playSound('button');
            this.resetMatch();
            this.showScreen('start');
            this.currentState = this.STATE.MENU;
        });

        // Selector de modo de juego
        document.getElementById('game-mode').addEventListener('change', (e) => {
            const mode = e.target.value;
            switch (mode) {
                case 'quick':
                    this.matchDuration = 180;
                    break;
                case 'full':
                    this.matchDuration = 360;
                    break;
                case 'practice':
                    this.matchDuration = 999; // Práctica sin tiempo
                    break;
            }
        });
    }

    setupAndroidControls() {
        if (typeof AndroidControls !== 'undefined') {
            this.androidControls = new AndroidControls(this);
        }
    }

    startMatch() {
        this.hideAllScreens();
        this.currentState = this.STATE.PLAYING;
        this.updateStatus('¡Partido en juego!');
        
        window.audioManager.playSound('whistle');
        
        const player = this.homeTeam.controlledPlayer;
        if (player) {
            this.ball.assignTo(player);
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
        this.screens[screenName].classList.remove('hidden');
    }

    hideScreen(screenName) {
        this.screens[screenName].classList.add('hidden');
    }

    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
    }

    showAction(text) {
        this.updateStatus(text);
    }

    showEvent(text) {
        this.eventText.textContent = text;
        this.eventNotification.classList.remove('hidden');
        this.eventNotification.classList.add('show');
        
        setTimeout(() => {
            this.eventNotification.classList.remove('show');
            this.eventNotification.classList.add('hidden');
        }, 2000);
    }

    updateStatus(text) {
        this.ui.gameStatus.textContent = text;
    }

    updatePauseStats() {
        document.getElementById('pause-shots-home').textContent = this.stats.home.shots;
        document.getElementById('pause-shots-away').textContent = this.stats.away.shots;
        document.getElementById('pause-fouls-home').textContent = this.stats.home.fouls;
        document.getElementById('pause-fouls-away').textContent = this.stats.away.fouls;
    }

    updateHalfIndicator() {
        this.ui.halfIndicator.textContent = this.currentHalf + 'H';
    }

    startGameLoop() {
        const loop = (timestamp) => {
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;
            this.gameTime = timestamp;
            
            // Calcular FPS
            this.frameCount++;
            if (timestamp - this.lastFpsUpdate > 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastFpsUpdate = timestamp;
                this.ui.fpsCounter.textContent = this.fps + ' FPS';
            }
            
            this.update(deltaTime);
            this.render();
            
            requestAnimationFrame(loop);
        };
        
        requestAnimationFrame(loop);
    }

    update(deltaTime) {
        if (this.currentState !== this.STATE.PLAYING) return;
        
        // Actualizar tiempo
        this.timeRemaining -= deltaTime / 1000;
        
        // Verificar fin de tiempo
        if (this.timeRemaining <= 0) {
            if (this.currentHalf === 1 && this.matchDuration > 180) {
                this.startHalfTime();
            } else {
                this.endMatch();
            }
            return;
        }
        
        // Actualizar controles Android
        if (this.androidControls) {
            this.androidControls.update();
        }
        
        // Actualizar jugadores con input
        this.homeTeam.players.forEach(player => {
            if (player === this.homeTeam.controlledPlayer) {
                player.update(this.ball, this.keys, deltaTime);
            } else {
                player.update(this.ball, {}, deltaTime);
            }
        });
        
        // Actualizar equipo CPU con IA
        this.awayTeam.players.forEach(player => {
            player.update(this.ball, {}, deltaTime);
        });
        
        // Actualizar IA
        this.aiController.update(this.ball, this.homeTeam, Date.now());
        
        // Actualizar balón
        this.ball.update(deltaTime);
        
        // Verificar colisiones
        this.checkCollisions();
        
        // Verificar goles
        const goalResult = this.checkGoals();
        if (goalResult) {
            this.handleGoal(goalResult);
        }
        
        // Verificar posesiones
        this.updatePossession();
        
        // Actualizar UI
        this.updateUI();
    }

    checkCollisions() {
        // Jugadores capturan balón
        this.homeTeam.players.forEach(player => {
            this.checkPlayerBallCollision(player);
        });
        
        this.awayTeam.players.forEach(player => {
            this.checkPlayerBallCollision(player);
        });
        
        // Verificar robos
        this.checkBallSteal();
        
        // Verificar colisiones entre jugadores
        this.checkPlayerCollisions();
    }

    checkPlayerBallCollision(player) {
        if (player.hasBall) return;
        
        const distance = player.distanceTo(this.ball);
        const catchDistance = player.radius + this.ball.radius + 3;
        
        if (distance < catchDistance && this.ball.isFree) {
            this.ball.assignTo(player);
        }
    }

    checkBallSteal() {
        if (!this.ball.owner) return;
        
        const ballOwner = this.ball.owner;
        const enemyTeam = ballOwner.team === 'home' ? this.awayTeam : this.homeTeam;
        
        enemyTeam.players.forEach(player => {
            if (player.isGoalkeeper) return;
            
            const distance = player.distanceTo(ballOwner);
            
            // Intento de robo
            if (distance < 22 && Math.random() < 0.15) {
                this.ball.assignTo(player);
                
                // Registrar falta si fue muy agresivo
                if (distance < 15) {
                    const foulingTeam = ballOwner.team;
                    if (foulingTeam === 'home') {
                        this.stats.away.fouls++;
                    } else {
                        this.stats.home.fouls++;
                    }
                    window.audioManager.playSound('foul');
                }
            }
        });
    }

    checkPlayerCollisions() {
        const allPlayers = [...this.homeTeam.players, ...this.awayTeam.players];
        
        for (let i = 0; i < allPlayers.length; i++) {
            for (let j = i + 1; j < allPlayers.length; j++) {
                const p1 = allPlayers[i];
                const p2 = allPlayers[j];
                
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = p1.radius + p2.radius;
                
                if (distance < minDist && distance > 0) {
                    // Separar jugadores
                    const overlap = minDist - distance;
                    const nx = dx / distance;
                    const ny = dy / distance;
                    
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
        
        // Gol en portería izquierda
        if (this.ball.x < -30 && this.ball.y > goalTop && this.ball.y < goalBottom) {
            return 'away';
        }
        
        // Gol en portería derecha
        if (this.ball.x > 1230 && this.ball.y > goalTop && this.ball.y < goalBottom) {
            return 'home';
        }
        
        return null;
    }

    handleGoal(scorer) {
        if (scorer === 'home') {
            this.homeTeam.incrementScore();
            this.stats.home.shots++; // Tiro al arco
            this.showEvent('¡GOOOL!');
        } else {
            this.awayTeam.incrementScore();
            this.stats.away.shots++;
            this.showEvent('GOOL CPU');
        }
        
        window.audioManager.playSound('goal');
        
        // Animación de gol
        this.animateScore(scorer);
        
        // Resetear después de delay
        setTimeout(() => {
            this.ball.reset();
            
            // Saque de centro para el equipo que recibió
            const player = scorer === 'home' 
                ? this.awayTeam.players[9] 
                : this.homeTeam.controlledPlayer;
            
            this.ball.assignTo(player);
        }, 2000);
    }

    animateScore(scorer) {
        const scoreEl = scorer === 'home' ? this.ui.homeScore : this.ui.awayScore;
        scoreEl.classList.add('scored');
        
        setTimeout(() => {
            scoreEl.classList.remove('scored');
        }, 500);
    }

    startHalfTime() {
        this.currentState = this.STATE.HALFTIME;
        window.audioManager.playSound('halfTime');
        this.showEvent('FINAL DEL 1er TIEMPO');
        
        setTimeout(() => {
            this.currentHalf = 2;
            this.timeRemaining = this.halfDuration;
            this.currentState = this.STATE.PLAYING;
            this.updateHalfIndicator();
            
            // Resetear posiciones
            this.homeTeam.resetPositions();
            this.awayTeam.resetPositions();
            this.ball.reset();
            
            // Asignar balón a un jugador CPU para saque
            this.ball.assignTo(this.awayTeam.controlledPlayer);
            
            window.audioManager.playSound('whistle');
        }, 3000);
    }

    updatePossession() {
        let homePossession = 50;
        
        if (this.ball.owner) {
            homePossession = this.ball.owner.team === 'home' ? 75 : 25;
        }
        
        this.ui.possessionBar.style.width = `${homePossession}%`;
        this.stats.home.possession = homePossession;
        this.stats.away.possession = 100 - homePossession;
        
        const possessor = this.ball.owner 
            ? (this.ball.owner.team === 'home' ? 'Tu Equipo' : 'CPU')
            : 'Balón libre';
        this.ui.ballPossession.textContent = `⚽ Posee: ${possessor}`;
    }

    updateUI() {
        this.ui.homeScore.textContent = this.homeTeam.score;
        this.ui.awayScore.textContent = this.awayTeam.score;
        
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        this.ui.matchTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    endMatch() {
        this.currentState = this.STATE.ENDED;
        window.audioManager.playSound('finalWhistle');
        
        const homeScore = this.homeTeam.score;
        const awayScore = this.awayTeam.score;
        
        let resultTitle;
        if (homeScore > awayScore) {
            resultTitle = '🏆 ¡VICTORIA!';
        } else if (homeScore < awayScore) {
            resultTitle = '😢 DERROTA';
        } else {
            resultTitle = '🤝 EMPATE';
        }
        
        document.getElementById('result-title').textContent = resultTitle;
        document.getElementById('final-home-score').textContent = homeScore;
        document.getElementById('final-away-score').textContent = awayScore;
        
        // Actualizar estadísticas finales
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawField();
        
        const time = Date.now();
        this.homeTeam.draw(this.ctx, time);
        this.awayTeam.draw(this.ctx, time);
        
        this.ball.draw(this.ctx);
        
        if (this.currentState === this.STATE.PLAYING) {
            this.drawGameUI();
        }
    }

    drawField() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Fondo con gradiente de césped
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#2d8a4e');
        gradient.addColorStop(0.5, '#228b22');
        gradient.addColorStop(1, '#2d8a4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Patrón de césped
        this.drawGrassPattern(ctx);
        
        // Líneas blancas
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        
        // Borde exterior
        ctx.strokeRect(20, 20, width - 40, height - 40);
        
        // Línea central
        ctx.beginPath();
        ctx.moveTo(width / 2, 20);
        ctx.lineTo(width / 2, height - 20);
        ctx.stroke();
        
        // Círculo central
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 80, 0, Math.PI * 2);
        ctx.stroke();
        
        // Punto central
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Área grande izquierda
        ctx.strokeRect(20, 150, 140, 400);
        
        // Área pequeña izquierda
        ctx.strokeRect(20, 250, 60, 200);
        
        // Punto de penalti izquierdo
        ctx.beginPath();
        ctx.arc(110, height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Área grande derecha
        ctx.strokeRect(width - 160, 150, 140, 400);
        
        // Área pequeña derecha
        ctx.strokeRect(width - 80, 250, 60, 200);
        
        // Punto de penalti derecho
        ctx.beginPath();
        ctx.arc(width - 110, height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Porterías
        this.drawGoal(ctx, 0, 290, true);
        this.drawGoal(ctx, width - 25, 290, false);
        
        // Esquinas
        this.drawCorner(ctx, 20, 20, 0);
        this.drawCorner(ctx, width - 20, 20, Math.PI / 2);
        this.drawCorner(ctx, 20, height - 20, -Math.PI / 2);
        this.drawCorner(ctx, width - 20, height - 20, Math.PI);
    }

    drawGrassPattern(ctx) {
        // Líneas de césped más sutiles
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        for (let y = 30; y < 670; y += 40) {
            ctx.beginPath();
            ctx.moveTo(20, y);
            ctx.lineTo(1180, y);
            ctx.stroke();
        }
    }

    drawCorner(ctx, x, y, angle) {
        ctx.beginPath();
        ctx.arc(x, y, 15, angle, angle + Math.PI / 2);
        ctx.stroke();
    }

    drawGoal(ctx, x, y, isLeft) {
        // Red de la portería (efecto de malla)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(x, y, 25, 120);
        
        // Marco
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.strokeRect(x, y, 25, 120);
        
        // Malla
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + i * 24);
            ctx.lineTo(x + 25, y + i * 24);
            ctx.stroke();
        }
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 8, y);
            ctx.lineTo(x + i * 8, y + 120);
            ctx.stroke();
        }
    }

    drawGameUI() {
        const ctx = this.ctx;
        
        // Indicador de objetivo
        if (this.ball.owner && this.ball.owner.team === 'home') {
            const player = this.ball.owner;
            const goalX = 1200;
            const goalY = 350;
            
            // Línea punteada hacia la portería
            ctx.beginPath();
            ctx.setLineDash([8, 4]);
            ctx.strokeStyle = 'rgba(249, 199, 79, 0.4)';
            ctx.lineWidth = 2;
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(goalX, player.y);
            ctx.lineTo(goalX, goalY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Indicador de acción
            if (Math.abs(player.vx) < 0.5 && Math.abs(player.vy) < 0.5) {
                ctx.fillStyle = 'rgba(249, 199, 79, 0.9)';
                ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Click para disparar', player.x, player.y - 35);
            }
        }
        
        // Indicador de zona deportería
        if (this.ball.x > 900) {
            ctx.fillStyle = 'rgba(249, 199, 79, 0.1)';
            ctx.fillRect(1150, 250, 50, 200);
        }
    }
}

// Inicializar juego
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});