/**
 * FIFA Mobile - Player Class (Enhanced)
 * Jugador con mecánicas avanzadas de fútbol
 */

class Player {
    constructor(x, y, team, number, isGoalkeeper = false) {
        this.x = x;
        this.y = y;
        this.team = team;
        this.number = number;
        this.isGoalkeeper = isGoalkeeper;
        
        // Propiedades físicas
        this.radius = isGoalkeeper ? 18 : 14;
        this.baseSpeed = isGoalkeeper ? 2.5 : 3.5;
        this.speed = this.baseSpeed;
        this.sprintSpeed = this.baseSpeed * 1.6;
        this.acceleration = 0.35;
        this.deceleration = 0.88;
        
        // Estado del balón
        this.hasBall = false;
        
        // Dirección
        this.direction = team === 'home' ? 1 : -1;
        
        // Movimiento
        this.vx = 0;
        this.vy = 0;
        this.isSprinting = false;
        
        // Stamina (energía)
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaDrain = 0.15;
        this.staminaRecovery = 0.05;
        
        // Cooldowns
        this.dribbleCooldown = 0;
        this.shootCooldown = 0;
        this.passCooldown = 0;
        this.tackleCooldown = 0;
        
        // Estados
        this.isDribbling = false;
        this.dribbleTimer = 0;
        this.isTackling = false;
        this.tackleTimer = 0;
        this.tackleRange = 30;
        this.tackleSuccess = 0.35;
        
        // Posición y animación
        this.position = this.getPositionName();
        this.bobOffset = Math.random() * Math.PI * 2;
        this.runCycle = 0;
        
        // Efectos visuales
        this.effects = [];
        
        this.updateTeamColors();
    }

    updateTeamColors() {
        if (this.team === 'home') {
            this.primaryColor = '#e63946';
            this.secondaryColor = '#ffffff';
            this.skinColor = '#f4d4b0';
            this.shortsColor = '#1a1a2e';
        } else {
            this.primaryColor = '#457b9d';
            this.secondaryColor = '#a8dadc';
            this.skinColor = '#8d6346';
            this.shortsColor = '#1a1a2e';
        }
    }

    getPositionName() {
        if (this.isGoalkeeper) return 'goalkeeper';
        if (this.number <= 2) return 'defender';
        if (this.number <= 5) return 'midfielder';
        return 'forward';
    }

    update(ball, keys, deltaTime = 1) {
        const dt = deltaTime / 16.67;
        // DEBUG: Log player state every 60 frames
        if (!window._debugFrame) window._debugFrame = 0;
        window._debugFrame++;
        if (window._debugFrame % 60 === 0) {
            console.log(`[Player ${this.number}] hasBall=${this.hasBall}, keysCount=${keys ? Object.keys(keys).length : "null"}, vx=${this.vx.toFixed(2)}, vy=${this.vy.toFixed(2)}`);
        }
        
        // Actualizar cooldowns
        this.updateCooldowns(dt);
        
        // Manejar stamina
        this.updateStamina(dt, keys);
        
        // Movimiento basado en teclas (siempre funciona, no solo con balón)
        if (keys && Object.keys(keys).length > 0) {
            this.handlePlayerInput(keys, ball, dt);
        }
        
        // Aplicar velocidad con fricción
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Limitar al campo
        this.constrainToField();
        
        // Actualizar ciclo de carrera
        if (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5) {
            this.runCycle += dt * 0.3;
        }
        
        // Reducir velocidad
        this.vx *= Math.pow(0.92, dt);
        this.vy *= Math.pow(0.92, dt);
        
        // Detener si muy lento
        if (Math.abs(this.vx) < 0.05) this.vx = 0;
        if (Math.abs(this.vy) < 0.05) this.vy = 0;
        
        // Actualizar efectos
        this.updateEffects(dt);
    }

    updateCooldowns(dt) {
        if (this.dribbleCooldown > 0) this.dribbleCooldown -= dt;
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.passCooldown > 0) this.passCooldown -= dt;
        if (this.tackleCooldown > 0) this.tackleCooldown -= dt;
        
        if (this.dribbleTimer > 0) this.dribbleTimer -= dt;
        if (this.tackleTimer > 0) this.tackleTimer -= dt;
        
        if (this.dribbleTimer <= 0) this.isDribbling = false;
        if (this.tackleTimer <= 0) this.isTackling = false;
    }

    updateStamina(dt, keys) {
        // Drenar stamina si está corriendo
        if ((keys['ShiftLeft'] || keys['ShiftRight']) && this.stamina > 0) {
            this.stamina -= this.staminaDrain * dt;
            this.isSprinting = true;
            this.speed = this.sprintSpeed;
        } else {
            this.isSprinting = false;
            this.speed = this.baseSpeed;
        }
        
        // Recuperar stamina si no está corriendo
        if (!this.isSprinting && this.stamina < this.maxStamina) {
            this.stamina += this.staminaRecovery * dt;
            this.stamina = Math.min(this.maxStamina, this.stamina);
        }
    }

    handlePlayerInput(keys, ball, dt) {
        this.vx = 0;
        this.vy = 0;
        // TEST: Auto-move right if no keys pressed (to test if game is working)
        const keysPressed = keys["KeyW"] || keys["KeyA"] || keys["KeyS"] || keys["KeyD"] || keys["ArrowUp"] || keys["ArrowDown"] || keys["ArrowLeft"] || keys["ArrowRight"];
        if (!keysPressed) {
            this.vx = this.speed * 0.5; // Move right automatically as test
        }
        
        // Movimiento
        if (keys['KeyW'] || keys['ArrowUp']) this.vy = -this.speed;
        if (keys['KeyS'] || keys['ArrowDown']) this.vy = this.speed;
        if (keys['KeyA'] || keys['ArrowLeft']) {
            this.vx = -this.speed;
            this.direction = -1;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            this.vx = this.speed;
            this.direction = 1;
        }
        
        // Sprint
        if ((keys['ShiftLeft'] || keys['ShiftRight']) && this.stamina > 0) {
            this.vx *= 1.5;
            this.vy *= 1.5;
        }
        
        // Normalizar diagonal
        if (this.vx !== 0 && this.vy !== 0) {
            const factor = 0.707;
            this.vx *= factor;
            this.vy *= factor;
        }
        
        // Dribble
        if (keys['Space'] && this.dribbleCooldown <= 0) {
            this.dribble();
        }
    }

    dribble() {
        this.isDribbling = true;
        this.dribbleTimer = 12;
        this.dribbleCooldown = 25;
        
        // Impulso en dirección actual
        this.vx += this.direction * this.speed * 2;
        this.vy += (Math.random() - 0.5) * this.speed;
        
        // Añadir efecto visual
        this.addEffect('burst');
        
        window.audioManager?.playSound('kick');
    }

    tackle() {
        if (this.tackleCooldown <= 0 && !this.hasBall) {
            this.isTackling = true;
            this.tackleTimer = 15;
            this.tackleCooldown = 40;
            
            // Animación de tackle
            this.vx = this.direction * this.speed * 1.5;
            
            this.addEffect('tackle');
            
            return true;
        }
        return false;
    }

    shoot(targetX, targetY, ball, height = null, curve = 0) {
        if (!this.hasBall || this.shootCooldown > 0) return false;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Potencia del tiro
        const power = Math.min(20, Math.max(10, distance / 15 + 10));
        
        // Añadir imprecisión si está cansado
        const accuracy = this.stamina > 30 ? 1 : 0.7;
        const randomOffset = (1 - accuracy) * 30 * (Math.random() - 0.5);
        
        const finalTargetX = targetX + randomOffset;
        const finalTargetY = targetY + randomOffset * 0.5;
        
        // Usar altura proporcionada o calcular según sprint
        const finalHeight = height !== null ? height : (this.isSprinting ? 12 : 0);
        // Pasar curva al balón
        const finalCurve = curve !== 0 ? curve : (Math.random() - 0.5) * 0.5;
        ball.shoot(power, finalTargetX, finalTargetY, finalHeight, finalCurve);;
        this.shootCooldown = 18;
        this.hasBall = false;
        
        this.addEffect('shoot');
        
        return true;
    }

    pass(targetPlayer, ball) {
        if (!this.hasBall || this.passCooldown > 0 || !targetPlayer) return false;
        
        // Calcular posición predictiva del compañero
        const predictX = targetPlayer.x + targetPlayer.vx * 10;
        const predictY = targetPlayer.y + targetPlayer.vy * 10;
        
        ball.pass(this, predictX, predictY);
        this.passCooldown = 12;
        this.hasBall = false;
        
        this.addEffect('pass');
        
        return true;
    }

    lobPass(targetPlayer, ball) {
        if (!this.hasBall || this.passCooldown > 0 || !targetPlayer) return false;
        
        ball.lob(targetPlayer.x, targetPlayer.y);
        this.passCooldown = 15;
        this.hasBall = false;
        
        this.addEffect('lob');
        
        return true;
    }

    addEffect(type) {
        this.effects.push({
            type: type,
            timer: 20,
            maxTimer: 20
        });
        
        if (this.effects.length > 5) {
            this.effects.shift();
        }
    }

    updateEffects(dt) {
        this.effects = this.effects.filter(effect => {
            effect.timer -= dt;
            return effect.timer > 0;
        });
    }

    constrainToField() {
        const padding = 25;
        
        if (this.x < padding + this.radius) this.x = padding + this.radius;
        if (this.x > 1200 - padding - this.radius) this.x = 1200 - padding - this.radius;
        if (this.y < padding + this.radius) this.y = padding + this.radius;
        if (this.y > 700 - padding - this.radius) this.y = 700 - padding - this.radius;
    }

    draw(ctx, time) {
        const bobAmount = Math.sin(time / 120 + this.bobOffset) * (this.isSprinting ? 2.5 : 1.5);
        const runOffset = Math.sin(this.runCycle) * 3;
        
        // Sombra
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.radius + 2, this.radius * 0.9, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();
        
        // Dibujar efectos
        this.drawEffects(ctx, bobAmount);
        
        // Cuerpo (círculo)
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobAmount, this.radius, 0, Math.PI * 2);
        
        // Gradiente para efecto 3D
        const gradient = ctx.createRadialGradient(
            this.x - 3, this.y + bobAmount - 3, 0,
            this.x, this.y + bobAmount, this.radius
        );
        gradient.addColorStop(0, this.skinColor);
        gradient.addColorStop(1, this.darkenColor(this.skinColor, 40));
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Camiseta
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobAmount, this.radius - 2, 0, Math.PI * 2);
        ctx.fillStyle = this.primaryColor;
        ctx.fill();
        
        // Shorts
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobAmount + 4, this.radius - 4, 0, Math.PI * 2);
        ctx.fillStyle = this.shortsColor;
        ctx.fill();
        
        // Número
        ctx.fillStyle = this.secondaryColor;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.number.toString(), this.x, this.y + bobAmount - 2);
        
        // Indicadores
        this.drawIndicators(ctx, bobAmount);
        
        // Indicador de stamina
        if (this.stamina < 80) {
            this.drawStaminaBar(ctx);
        }
    }

    drawIndicators(ctx, bobAmount) {
        // Indicador de portero
        if (this.isGoalkeeper) {
            ctx.strokeStyle = '#f9c74f';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y + bobAmount, this.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Indicador de posesión del balón
        if (this.hasBall) {
            // Anillo brillante
            ctx.strokeStyle = '#f9c74f';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y + bobAmount, this.radius + 7, 0, Math.PI * 2);
            ctx.stroke();
            
            // Efecto de brillo
            ctx.beginPath();
            ctx.arc(this.x - 2, this.y + bobAmount - 2, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fill();
        }
        
        // Indicador de sprint
        if (this.isSprinting && this.stamina > 0) {
            ctx.beginPath();
            ctx.moveTo(this.x - this.direction * 15, this.y + bobAmount);
            ctx.lineTo(this.x - this.direction * 25, this.y + bobAmount - 5);
            ctx.lineTo(this.x - this.direction * 25, this.y + bobAmount + 5);
            ctx.closePath();
            ctx.fillStyle = 'rgba(249, 199, 79, 0.5)';
            ctx.fill();
        }
    }

    drawStaminaBar(ctx) {
        const barWidth = 30;
        const barHeight = 4;
        const x = this.x - barWidth / 2;
        const y = this.y - this.radius - 12;
        
        // Fondo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Stamina
        const staminaPercent = this.stamina / this.maxStamina;
        ctx.fillStyle = staminaPercent > 0.3 ? '#4CAF50' : '#f44336';
        ctx.fillRect(x, y, barWidth * staminaPercent, barHeight);
    }

    drawEffects(ctx, bobAmount) {
        this.effects.forEach(effect => {
            const alpha = effect.timer / effect.maxTimer;
            
            switch (effect.type) {
                case 'burst':
                    // Sprint effect
                    ctx.beginPath();
                    ctx.arc(this.x, this.y + bobAmount, this.radius + 10 * (1 - alpha), 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    break;
                    
                case 'shoot':
                    // Shot line
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y + bobAmount);
                    ctx.lineTo(this.x + this.direction * 50 * (1 - alpha), this.y + bobAmount);
                    ctx.strokeStyle = `rgba(249, 199, 79, ${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    break;
                    
                case 'tackle':
                    // Tackle slide effect
                    ctx.beginPath();
                    ctx.arc(this.x, this.y + bobAmount, this.radius + 5 * (1 - alpha), 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(230, 57, 70, ${alpha * 0.6})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    break;
                    
                case 'pass':
                case 'lob':
                    // Pass/lob arc effect
                    ctx.beginPath();
                    ctx.arc(this.x, this.y + bobAmount - 10, 15 * (1 - alpha), 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(74, 222, 128, ${alpha * 0.5})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    break;
                    
                case 'pickup':
                    // Ball pickup effect - golden ring
                    ctx.beginPath();
                    ctx.arc(this.x, this.y + bobAmount, this.radius + 15 * (1 - alpha), 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.7})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    // Inner ring
                    ctx.beginPath();
                    ctx.arc(this.x, this.y + bobAmount, this.radius + 8 * (1 - alpha), 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    break;
            }
        });
    }

    darkenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
        const b = Math.max(0, (num & 0x0000FF) - amount);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    distanceTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    angleTo(other) {
        return Math.atan2(other.y - this.y, other.x - this.x);
    }
}