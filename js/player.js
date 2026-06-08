/**
 * FIFA Mobile - Player Class
 * Maneja las propiedades y comportamiento de cada jugador
 */

class Player {
    constructor(x, y, team, number, isGoalkeeper = false) {
        this.x = x;
        this.y = y;
        this.team = team; // 'home' o 'away'
        this.number = number;
        this.isGoalkeeper = isGoalkeeper;
        
        // Propiedades físicas
        this.radius = isGoalkeeper ? 18 : 14;
        this.speed = isGoalkeeper ? 2.5 : 3.5;
        this.maxSpeed = this.speed;
        
        // Estado del balón
        this.hasBall = false;
        
        // Dirección (1 = derecha, -1 = izquierda)
        this.direction = team === 'home' ? 1 : -1;
        
        // Movimiento
        this.vx = 0;
        this.vy = 0;
        this.targetX = x;
        this.targetY = y;
        
        // Control de dribling
        this.isDribbling = false;
        this.dribbleTimer = 0;
        this.dribbleCooldown = 0;
        
        // Control de tiro
        this.shootCooldown = 0;
        
        // Control de paso
        this.passCooldown = 0;
        
        // Posición en el campo (para IA)
        this.position = this.getPositionName();
        
        // Animación
        this.bobOffset = Math.random() * Math.PI * 2;
        
        // Color del equipo
        this.updateTeamColors();
    }

    updateTeamColors() {
        if (this.team === 'home') {
            this.primaryColor = '#e63946';
            this.secondaryColor = '#ffffff';
            this.skinColor = '#f4d4b0';
        } else {
            this.primaryColor = '#457b9d';
            this.secondaryColor = '#a8dadc';
            this.skinColor = '#8d6346';
        }
    }

    getPositionName() {
        if (this.isGoalkeeper) return 'goalkeeper';
        if (this.number <= 2) return 'defender';
        if (this.number <= 5) return 'midfielder';
        return 'forward';
    }

    update(ball, keys) {
        // Actualizar cooldowns
        if (this.dribbleCooldown > 0) this.dribbleCooldown--;
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.passCooldown > 0) this.passCooldown--;
        
        // Movimiento basado en teclas (solo para jugador controlado)
        if (this.hasBall) {
            this.handlePlayerInput(keys, ball);
        } else {
            // Movimiento idle si no tiene balón
            this.idleMovement();
        }
        
        // Aplicar velocidad
        this.x += this.vx;
        this.y += this.vy;
        
        // Limitar al campo
        this.constrainToField();
        
        // Reducir velocidad gradualmente
        this.vx *= 0.9;
        this.vy *= 0.9;
        
        // Detener si está muy lento
        if (Math.abs(this.vx) < 0.05) this.vx = 0;
        if (Math.abs(this.vy) < 0.05) this.vy = 0;
    }

    handlePlayerInput(keys, ball) {
        // Reset velocity
        this.vx = 0;
        this.vy = 0;
        
        // Movement
        if (keys['KeyW'] || keys['ArrowUp']) {
            this.vy = -this.speed;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            this.vy = this.speed;
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
            this.vx = -this.speed;
            this.direction = -1;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            this.vx = this.speed;
            this.direction = 1;
        }
        
        // Normalize diagonal movement
        if (this.vx !== 0 && this.vy !== 0) {
            const factor = 0.707; // 1/sqrt(2)
            this.vx *= factor;
            this.vy *= factor;
        }
        
        // Dribble
        if (keys['Space'] && this.dribbleCooldown === 0) {
            this.dribble();
        }
    }

    dribble() {
        this.isDribbling = true;
        this.dribbleTimer = 15;
        this.dribbleCooldown = 30;
        
        // Burst de velocidad en dirección actual
        this.vx += this.direction * 2;
        this.vy += (Math.random() - 0.5) * 1;
    }

    shoot(targetX, targetY, ball) {
        if (this.hasBall && this.shootCooldown === 0) {
            // Calcular potencia basada en distancia
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Potencia entre 8 y 18
            const power = Math.min(18, Math.max(8, distance / 20 + 8));
            
            ball.shoot(power, targetX, targetY);
            this.shootCooldown = 20;
            this.hasBall = false;
            
            return true;
        }
        return false;
    }

    pass(targetPlayer, ball) {
        if (this.hasBall && this.passCooldown === 0 && targetPlayer) {
            ball.pass(this, targetPlayer.x, targetPlayer.y);
            this.passCooldown = 15;
            return true;
        }
        return false;
    }

    idleMovement() {
        // Pequeños movimientos para parecer más natural
        this.vx *= 0.95;
        this.vy *= 0.95;
    }

    constrainToField() {
        const padding = 30;
        const goalArea = 120;
        
        // Límites horizontales
        if (this.x < padding + this.radius) {
            this.x = padding + this.radius;
        }
        if (this.x > 1200 - padding - this.radius) {
            this.x = 1200 - padding - this.radius;
        }
        
        // Límites verticales
        if (this.y < padding + this.radius) {
            this.y = padding + this.radius;
        }
        if (this.y > 700 - padding - this.radius) {
            this.y = 700 - padding - this.radius;
        }
    }

    draw(ctx, time) {
        // Animación de movimiento
        const bobAmount = Math.sin(time / 150 + this.bobOffset) * 1.5;
        
        // Sombra
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.radius + 3, this.radius * 0.8, this.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        // Cuerpo (círculo)
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobAmount, this.radius, 0, Math.PI * 2);
        
        // Gradiente para efecto 3D
        const gradient = ctx.createRadialGradient(
            this.x - 3, this.y + bobAmount - 3, 0,
            this.x, this.y + bobAmount, this.radius
        );
        gradient.addColorStop(0, this.skinColor);
        gradient.addColorStop(1, this.darkenColor(this.skinColor, 30));
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Camiseta
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobAmount, this.radius - 2, 0, Math.PI * 2);
        ctx.fillStyle = this.primaryColor;
        ctx.fill();
        
        // Número en la espalda (simplificado - solo mostrar para jugador principal)
        ctx.fillStyle = this.secondaryColor;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.number.toString(), this.x, this.y + bobAmount);
        
        // Indicador de portero
        if (this.isGoalkeeper) {
            ctx.strokeStyle = '#f9c74f';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y + bobAmount, this.radius + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Indicador de quién tiene el balón
        if (this.hasBall) {
            ctx.strokeStyle = '#f9c74f';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y + bobAmount, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
            
            // Efecto de brillo
            ctx.beginPath();
            ctx.arc(this.x - 2, this.y + bobAmount - 2, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        }
        
        // Efecto de dribling
        if (this.isDribbling && this.dribbleTimer > 0) {
            this.dribbleTimer--;
            // Línea de movimiento
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + bobAmount);
            ctx.lineTo(this.x - this.direction * 20, this.y + bobAmount);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        if (this.dribbleTimer === 0) {
            this.isDribbling = false;
        }
    }

    darkenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
        const b = Math.max(0, (num & 0x0000FF) - amount);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    // Distancia a otro jugador o al balón
    distanceTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Ángulo hacia otro objeto
    angleTo(other) {
        return Math.atan2(other.y - this.y, other.x - this.x);
    }
}