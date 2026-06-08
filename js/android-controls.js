/**
 * FIFA Mobile - Android Controls
 * Sistema de joystick virtual y botones para dispositivos táctiles
 */

class AndroidControls {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.isMobile = this.detectMobile();
        
        this.joystick = {
            active: false,
            baseX: 0,
            baseY: 0,
            stickX: 0,
            stickY: 0,
            dx: 0,
            dy: 0,
            maxRadius: 50
        };
        
        this.buttons = {
            shoot: null,
            pass: null,
            dribble: null
        };
        
        this.init();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    init() {
        if (!this.isMobile) return;
        
        this.enableControls();
        this.setupJoystick();
        this.setupButtons();
        this.setupTouchDetection();
        
        console.log('📱 Android controls initialized');
    }

    enableControls() {
        const controls = document.getElementById('android-controls');
        if (controls) {
            controls.classList.remove('hidden');
            controls.classList.add('active');
            this.enabled = true;
        }
        
        // Ocultar controles de teclado en móvil
        const controlsHint = document.getElementById('controls-hint');
        if (controlsHint) {
            controlsHint.style.display = 'none';
        }
    }

    disableControls() {
        const controls = document.getElementById('android-controls');
        if (controls) {
            controls.classList.add('hidden');
            controls.classList.remove('active');
        }
        this.enabled = false;
    }

    setupJoystick() {
        const joystickBase = document.getElementById('joystick-base');
        const joystickStick = document.getElementById('joystick-stick');
        
        if (!joystickBase || !joystickStick) return;
        
        // Posición inicial del joystick
        const rect = joystickBase.getBoundingClientRect();
        this.joystick.baseX = rect.left + rect.width / 2;
        this.joystick.baseY = rect.top + rect.height / 2;
        
        // Touch start
        joystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startJoystick(e.touches[0]);
        }, { passive: false });
        
        // Touch move
        joystickBase.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.moveJoystick(e.touches[0]);
        }, { passive: false });
        
        // Touch end
        joystickBase.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endJoystick();
        }, { passive: false });
        
        // También para la zona completa del joystick
        const joystickZone = document.getElementById('joystick-zone');
        if (joystickZone) {
            joystickZone.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                this.startJoystick(touch);
            }, { passive: false });
            
            joystickZone.addEventListener('touchmove', (e) => {
                e.preventDefault();
                this.moveJoystick(e.touches[0]);
            }, { passive: false });
            
            joystickZone.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.endJoystick();
            }, { passive: false });
        }
    }

    startJoystick(touch) {
        this.joystick.active = true;
        this.updateJoystickPosition(touch.clientX, touch.clientY);
    }

    moveJoystick(touch) {
        if (!this.joystick.active) return;
        this.updateJoystickPosition(touch.clientX, touch.clientY);
    }

    updateJoystickPosition(touchX, touchY) {
        const dx = touchX - this.joystick.baseX;
        const dy = touchY - this.joystick.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Limitar al radio máximo
        if (distance > this.joystick.maxRadius) {
            const angle = Math.atan2(dy, dx);
            this.joystick.stickX = Math.cos(angle) * this.joystick.maxRadius;
            this.joystick.stickY = Math.sin(angle) * this.joystick.maxRadius;
        } else {
            this.joystick.stickX = dx;
            this.joystick.stickY = dy;
        }
        
        // Normalizar a -1 a 1
        this.joystick.dx = this.joystick.stickX / this.joystick.maxRadius;
        this.joystick.dy = this.joystick.stickY / this.joystick.maxRadius;
        
        // Actualizar posición visual del stick
        const stick = document.getElementById('joystick-stick');
        if (stick) {
            stick.style.transform = `translate(${this.joystick.stickX}px, ${this.joystick.stickY}px)`;
        }
    }

    endJoystick() {
        this.joystick.active = false;
        this.joystick.stickX = 0;
        this.joystick.stickY = 0;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
        
        // Resetear posición visual
        const stick = document.getElementById('joystick-stick');
        if (stick) {
            stick.style.transform = 'translate(0, 0)';
        }
    }

    setupButtons() {
        this.buttons.shoot = document.getElementById('btn-shoot');
        this.buttons.pass = document.getElementById('btn-pass');
        this.buttons.dribble = document.getElementById('btn-dribble');
        
        if (this.buttons.shoot) {
            this.buttons.shoot.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onShoot();
            }, { passive: false });
        }
        
        if (this.buttons.pass) {
            this.buttons.pass.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onPass();
            }, { passive: false });
        }
        
        if (this.buttons.dribble) {
            this.buttons.dribble.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onDribble();
            }, { passive: false });
        }
    }

    setupTouchDetection() {
        // Detectar si el usuario está usando touch
        document.addEventListener('touchstart', () => {
            if (!this.enabled && this.isMobile) {
                this.enableControls();
            }
        }, { once: true });
    }

    onShoot() {
        if (!this.game || this.game.currentState !== 'playing') return;
        
        const player = this.game.homeTeam.controlledPlayer;
        if (!player || !player.hasBall) return;
        
        // Shoot towards the goal
        const targetX = this.game.homeTeam.side === 'home' ? 1200 : 0;
        const targetY = 350;
        
        // Add offset based on joystick position
        const targetYWithOffset = targetY + (this.joystick.dy * 50);
        
        player.shoot(targetX, targetYWithOffset, this.game.ball);
        this.game.showAction('¡DISPARO!');
        
        // Efecto visual en el botón
        this.flashButton(this.buttons.shoot);
    }

    onPass() {
        if (!this.game || this.game.currentState !== 'playing') return;
        
        const player = this.game.homeTeam.controlledPlayer;
        if (!player || !player.hasBall) return;
        
        // Encontrar el mejor compañero para pasar
        const target = this.game.homeTeam.findBestPassTarget(player);
        if (target) {
            player.pass(target, this.game.ball);
            this.game.showAction('PASE');
            this.flashButton(this.buttons.pass);
        }
    }

    onDribble() {
        if (!this.game || this.game.currentState !== 'playing') return;
        
        const player = this.game.homeTeam.controlledPlayer;
        if (!player || !player.hasBall) return;
        
        player.dribble();
        this.game.showAction('REGATE');
        this.flashButton(this.buttons.dribble);
    }

    flashButton(button) {
        if (!button) return;
        
        const originalTransform = button.style.transform;
        button.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            button.style.transform = originalTransform;
        }, 100);
    }

    getMovementInput() {
        if (!this.enabled) {
            return { x: 0, y: 0 };
        }
        
        return {
            x: this.joystick.dx,
            y: this.joystick.dy
        };
    }

    update() {
        if (!this.enabled || !this.joystick.active) return;
        
        // Enviar input al juego
        const input = this.getMovementInput();
        
        if (this.game && this.game.homeTeam && this.game.homeTeam.controlledPlayer) {
            const player = this.game.homeTeam.controlledPlayer;
            
            // Convertir input del joystick a velocidad del jugador
            player.vx = input.x * player.speed * 1.5;
            player.vy = input.y * player.speed * 1.5;
            
            // Actualizar dirección
            if (Math.abs(input.x) > 0.1) {
                player.direction = input.x > 0 ? 1 : -1;
            }
        }
    }

    // Prevenir scroll en móvil durante el juego
    preventScroll() {
        document.body.addEventListener('touchmove', (e) => {
            if (this.enabled) {
                e.preventDefault();
            }
        }, { passive: false });
    }
}

// Exportar para uso global
window.AndroidControls = AndroidControls;