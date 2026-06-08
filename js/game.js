/**
 * FIFA Mobile - Game Class
 * Controlador principal del juego
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
            ENDED: 'ended'
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
        this.matchDuration = 180; // 3 minutos en segundos
        this.timeRemaining = this.matchDuration;
        this.lastTime = 0;
        
        // Input
        this.keys = {};
        
        // Disparos dirigidos
        this.mouseX = 600;
        this.mouseY = 350;
        this.isMouseDown = false;
        
        // UI Elements
        this.ui = {
            homeScore: document.getElementById('home-score'),
            awayScore: document.getElementById('away-score'),
            matchTime: document.getElementById('match-time'),
            ballPossession: document.getElementById('ball-possession'),
            gameStatus: document.getElementById('game-status'),
            possessionBar: document.querySelector('.home-poss')
        };
        
        // Pantallas
        this.screens = {
            start: document.getElementById('start-screen'),
            pause: document.getElementById('pause-screen'),
            end: document.getElementById('end-screen'),
            instructions: document.getElementById('instructions-screen')
        };
        
        // Inicializar
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startGameLoop();
        
        console.log('⚽ FIFA Mobile Initialized');
    }

    setupEventListeners() {
        // Teclado
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Controles especiales
            if (e.code === 'Escape') {
                this.togglePause();
            }
            if (e.code === 'KeyR') {
                this.resetMatch();
            }
            
            // Acciones del jugador
            if (this.currentState === this.STATE.PLAYING) {
                const player = this.homeTeam.controlledPlayer;
                
                if (player && player.hasBall) {
                    // Pasar (Q)
                    if (e.code === 'KeyQ') {
                        const target = this.homeTeam.findBestPassTarget(player);
                        if (target) {
                            player.pass(target, this.ball);
                            this.showAction('PASE');
                        }
                    }
                    
                    // Disparar (E)
                    if (e.code === 'KeyE') {
                        // Disparar hacia portería contraria
                        const targetX = this.homeTeam.side === 'home' ? 1200 : 0;
                        const targetY = 350;
                        
                        if (player.shoot(targetX, targetY, this.ball)) {
                            this.showAction('¡TIRO!');
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
                    // Click para disparar o pasar
                    const goalCenterX = this.homeTeam.side === 'home' ? 1200 : 0;
                    const goalCenterY = 350;
                    
                    // Si click está cerca de la portería, disparar
                    if ((this.homeTeam.side === 'home' && this.mouseX > 900) ||
                        (this.homeTeam.side === 'away' && this.mouseX < 300)) {
                        player.shoot(this.mouseX, this.mouseY, this.ball);
                        this.showAction('¡DISPARO!');
                    }
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // Botones de UI
        document.getElementById('start-match').addEventListener('click', () => {
            this.startMatch();
        });

        document.getElementById('instructions-btn').addEventListener('click', () => {
            this.showScreen('instructions');
        });

        document.getElementById('close-instructions').addEventListener('click', () => {
            this.hideScreen('instructions');
        });

        document.getElementById('resume-match').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('restart-match').addEventListener('click', () => {
            this.resetMatch();
            this.startMatch();
        });

        document.getElementById('play-again').addEventListener('click', () => {
            this.resetMatch();
            this.startMatch();
        });

        document.getElementById('back-menu').addEventListener('click', () => {
            this.resetMatch();
            this.showScreen('start');
            this.currentState = this.STATE.MENU;
        });
    }

    startMatch() {
        this.hideAllScreens();
        this.currentState = this.STATE.PLAYING;
        this.updateStatus('¡Partido en juego!');
        
        // Asignar balón al jugador controlado
        const player = this.homeTeam.controlledPlayer;
        if (player) {
            this.ball.assignTo(player);
        }
    }

    togglePause() {
        if (this.currentState === this.STATE.PLAYING) {
            this.currentState = this.STATE.PAUSED;
            this.showScreen('pause');
            this.updateStatus('Partido pausado');
        } else if (this.currentState === this.STATE.PAUSED) {
            this.currentState = this.STATE.PLAYING;
            this.hideScreen('pause');
            this.updateStatus('¡Partido en juego!');
        }
    }

    resetMatch() {
        this.timeRemaining = this.matchDuration;
        this.homeTeam.resetScore();
        this.homeTeam.resetPositions();
        this.awayTeam.resetScore();
        this.awayTeam.resetPositions();
        this.ball.reset();
        
        this.updateUI();
        
        // Asignar balón al jugador controlado
        const player = this.homeTeam.controlledPlayer;
        if (player) {
            this.ball.assignTo(player);
        }
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

    updateStatus(text) {
        this.ui.gameStatus.textContent = text;
    }

    startGameLoop() {
        const loop = (timestamp) => {
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;
            
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
        if (this.timeRemaining <= 0) {
            this.endMatch();
            return;
        }
        
        // Actualizar equipos
        this.homeTeam.update(this.ball, this.keys);
        this.awayTeam.update(this.ball, {});
        
        // Actualizar IA
        this.aiController.update(this.ball, this.homeTeam, Date.now());
        
        // Actualizar balón
        this.ball.update();
        
        // Verificar colisiones
        this.checkCollisions();
        
        // Verificar goles
        this.checkGoals();
        
        // Verificar posesiones
        this.updatePossession();
        
        // Actualizar UI
        this.updateUI();
    }

    checkCollisions() {
        // Jugadores del equipo local
        this.homeTeam.players.forEach(player => {
            this.checkPlayerBallCollision(player);
        });
        
        // Jugadores del equipo CPU
        this.awayTeam.players.forEach(player => {
            this.checkPlayerBallCollision(player);
        });
        
        // Verificar robo de balón
        this.checkBallSteal();
    }

    checkPlayerBallCollision(player) {
        if (player.hasBall) return;
        
        const distance = player.distanceTo(this.ball);
        const catchDistance = player.radius + this.ball.radius + 5;
        
        if (distance < catchDistance && this.ball.isFree) {
            this.ball.assignTo(player);
        }
    }

    checkBallSteal() {
        // Si un jugador intenta robar el balón a otro
        const attackerTeam = this.homeTeam;
        const defenderTeam = this.awayTeam;
        
        if (this.ball.owner) {
            const ballOwner = this.ball.owner;
            const enemyTeam = ballOwner.team === 'home' ? this.awayTeam : this.homeTeam;
            
            // Verificar si algún jugador enemigo está muy cerca
            enemyTeam.players.forEach(player => {
                if (!player.isGoalkeeper) {
                    const distance = player.distanceTo(ballOwner);
                    if (distance < 20 && Math.random() < 0.1) {
                        // Robo exitoso (raro)
                        this.ball.assignTo(player);
                    }
                }
            });
        }
    }

    checkGoals() {
        const goalDepth = 30;
        const goalWidth = 120;
        const goalTop = (700 - goalWidth) / 2;
        const goalBottom = (700 + goalWidth) / 2;
        
        // Gol en portería izquierda (anotado por away)
        if (this.ball.x < -goalDepth && this.ball.y > goalTop && this.ball.y < goalBottom) {
            this.awayTeam.incrementScore();
            this.showGoal('away');
        }
        
        // Gol en portería derecha (anotado por home)
        if (this.ball.x > 1200 + goalDepth && this.ball.y > goalTop && this.ball.y < goalBottom) {
            this.homeTeam.incrementScore();
            this.showGoal('home');
        }
    }

    showGoal(scorer) {
        const teamName = scorer === 'home' ? '¡TU EQUIPO' : 'EQUIPO CPU';
        this.updateStatus(`${teamName} anota! ⚽`);
        
        // Resetear después de un delay
        setTimeout(() => {
            this.ball.reset();
            
            // Asignar al equipo que recibió el gol (saque de centro)
            const player = scorer === 'home' 
                ? this.awayTeam.players[9] // Delantero away
                : this.homeTeam.controlledPlayer;
            
            this.ball.assignTo(player);
        }, 1500);
    }

    updatePossession() {
        let homePossession = 50;
        
        if (this.ball.owner) {
            homePossession = this.ball.owner.team === 'home' ? 70 : 30;
        }
        
        this.ui.possessionBar.style.width = `${homePossession}%`;
        
        // Actualizar texto de posesión
        const possessor = this.ball.owner 
            ? (this.ball.owner.team === 'home' ? 'Tu Equipo' : 'CPU')
            : 'Balón libre';
        this.ui.ballPossession.textContent = `⚽ Posee: ${possessor}`;
    }

    updateUI() {
        // Marcador
        this.ui.homeScore.textContent = this.homeTeam.score;
        this.ui.awayScore.textContent = this.awayTeam.score;
        
        // Tiempo
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        this.ui.matchTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    endMatch() {
        this.currentState = this.STATE.ENDED;
        
        // Determinar resultado
        const homeScore = this.homeTeam.score;
        const awayScore = this.awayTeam.score;
        
        let resultTitle = '';
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
        
        this.showScreen('end');
        this.updateStatus(`Final: ${homeScore} - ${awayScore}`);
    }

    render() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar campo
        this.drawField();
        
        // Dibujar equipos
        const time = Date.now();
        this.homeTeam.draw(this.ctx, time);
        this.awayTeam.draw(this.ctx, time);
        
        // Dibujar balón
        this.ball.draw(this.ctx);
        
        // Dibujar UI del juego (si está jugando)
        if (this.currentState === this.STATE.PLAYING) {
            this.drawGameUI();
        }
    }

    drawField() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Fondo verde (césped)
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#2d8a4e');
        gradient.addColorStop(0.5, '#228b22');
        gradient.addColorStop(1, '#2d8a4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Líneas del campo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        
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
        ctx.arc(width / 2, height / 2, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Área grande izquierda
        ctx.strokeRect(20, 150, 120, 400);
        
        // Área pequeña izquierda
        ctx.strokeRect(20, 250, 50, 200);
        
        // Portería izquierda
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, 290, 25, 120);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 290, 25, 120);
        
        // Punto de penalti izquierdo
        ctx.beginPath();
        ctx.arc(100, height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Área grande derecha
        ctx.lineWidth = 2;
        ctx.strokeRect(width - 140, 150, 120, 400);
        
        // Área pequeña derecha
        ctx.strokeRect(width - 70, 250, 50, 200);
        
        // Portería derecha
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(width - 25, 290, 25, 120);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.strokeRect(width - 25, 290, 25, 120);
        
        // Punto de penalti derecho
        ctx.beginPath();
        ctx.arc(width - 100, height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Esquinas
        const cornerRadius = 15;
        ctx.beginPath();
        ctx.arc(20, 20, cornerRadius, 0, Math.PI / 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(width - 20, 20, cornerRadius, Math.PI / 2, Math.PI);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(20, height - 20, cornerRadius, -Math.PI / 2, 0);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(width - 20, height - 20, cornerRadius, Math.PI, Math.PI * 1.5);
        ctx.stroke();
    }

    drawGameUI() {
        const ctx = this.ctx;
        
        // Indicador de dirección del balón
        if (this.ball.owner && this.ball.owner.team === 'home') {
            const player = this.ball.owner;
            const goalX = 1200;
            const goalY = 350;
            
            // Línea punteada hacia la portería
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(249, 199, 79, 0.5)';
            ctx.lineWidth = 1;
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(goalX, goalY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Indicador de potencia (si está quieto)
            if (Math.abs(player.vx) < 0.5 && Math.abs(player.vy) < 0.5) {
                ctx.fillStyle = 'rgba(249, 199, 79, 0.8)';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Haz clic para disparar', player.x, player.y - 30);
            }
        }
    }
}

// Inicializar juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});