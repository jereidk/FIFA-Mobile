/**
 * FIFA Mobile - Ball Class (Enhanced Physics)
 * Física realista del balón con efectos, rebotes y Magnus
 */

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.vx = 0;
        this.vy = 0;
        
        // Física realista
        this.friction = 0.985;
        this.groundFriction = 0.92;
        this.airResistance = 0.998;
        this.bounceCoeff = 0.7;
        this.maxSpeed = 18;
        this.minSpeed = 0.05;
        
        // Efecto Magnus (curve)
        this.spin = 0;
        this.magnusCoeff = 0.15;
        
        // Estado
        this.owner = null;
        this.isFree = true;
        this.isAirborne = false;
        this.height = 0;
        this.targetHeight = 0;
        
        // Campo
        this.fieldWidth = 1200;
        this.fieldHeight = 700;
        this.goalWidth = 120;
        this.goalDepth = 30;
        
        // Efectos visuales
        this.trail = [];
        this.maxTrailLength = 10;
        
        // Sonido
        this.lastHitTime = 0;
    }

    update(deltaTime = 1) {
        const dt = deltaTime / 16.67; // Normalizar a 60fps
        
        if (this.owner) {
            // Balón con jugador
            this.followOwner();
            this.isAirborne = false;
            this.height = 0;
        } else {
            // Balón libre - física realista
            this.applyPhysics(dt);
            this.checkWallCollisions();
            this.updateTrail();
        }
        
        this.updateHeight(dt);
    }

    followOwner() {
        const offsetX = this.owner.direction * 18;
        const offsetY = -12;
        
        // Posición del balón relativa al jugador
        this.x = this.owner.x + offsetX;
        this.y = this.owner.y + offsetY;
        this.vx = this.owner.vx * 0.8;
        this.vy = this.owner.vy * 0.8;
        this.spin = this.owner.direction * 2;
    }

    applyPhysics(dt) {
        // Aplicar resistencia del aire
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        if (this.isAirborne) {
            // En el aire, menor fricción
            this.vx *= Math.pow(this.airResistance, dt);
            this.vy *= Math.pow(this.airResistance, dt);
            
            // Efecto Magnus (curva)
            if (Math.abs(this.spin) > 0.1) {
                this.vy += this.spin * this.magnusCoeff * dt;
                this.spin *= 0.98; // Reducir spin gradualmente
            }
        } else {
            // En el suelo, mayor fricción
            this.vx *= Math.pow(this.groundFriction, dt);
            this.vy *= Math.pow(this.groundFriction, dt);
            
            // Reducir altura
            if (this.height > 0) {
                this.targetHeight = 0;
            }
        }
        
        // Aplicar velocidad
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Limitar velocidad máxima
        if (speed > this.maxSpeed) {
            const factor = this.maxSpeed / speed;
            this.vx *= factor;
            this.vy *= factor;
        }
        
        // Detener si muy lento
        if (speed < this.minSpeed) {
            this.vx = 0;
            this.vy = 0;
            this.spin = 0;
        }
        
        this.isFree = true;
    }

    updateHeight(dt) {
        // Smooth height transition
        const heightDiff = this.targetHeight - this.height;
        this.height += heightDiff * 0.2 * dt;
        
        // If it's very low, mark as on ground
        if (this.height < 1) {
            this.height = 0;
            this.isAirborne = false;
        }
    }

    updateTrail() {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        if (speed > 3) {
            this.trail.push({ x: this.x, y: this.y, age: 0 });
            
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }
        
        // Envejecer trail
        this.trail.forEach(point => point.age++);
        this.trail = this.trail.filter(point => point.age < 20);
    }

    checkWallCollisions() {
        const wallPadding = 20;
        const goalTop = (this.fieldHeight - this.goalWidth) / 2;
        const goalBottom = (this.fieldHeight + this.goalWidth) / 2;
        
        // Determinar si está en área de portería
        const inLeftGoal = this.y > goalTop && this.y < goalBottom && this.x < wallPadding;
        const inRightGoal = this.y > goalTop && this.y < goalBottom && this.x > this.fieldWidth - wallPadding;
        
        // Rebote en paredes horizontales
        if (this.y - this.radius < wallPadding) {
            this.y = wallPadding + this.radius;
            this.vy = -this.vy * this.bounceCoeff;
            this.spin *= 0.5;
            this.playHitSound();
        }
        if (this.y + this.radius > this.fieldHeight - wallPadding) {
            this.y = this.fieldHeight - wallPadding - this.radius;
            this.vy = -this.vy * this.bounceCoeff;
            this.spin *= 0.5;
            this.playHitSound();
        }
        
        // Rebote en paredes verticales (excepto áreas de gol)
        if (!inLeftGoal && this.x - this.radius < wallPadding) {
            this.x = wallPadding + this.radius;
            this.vx = -this.vx * this.bounceCoeff;
            this.spin *= 0.5;
            this.playHitSound();
        }
        
        if (!inRightGoal && this.x + this.radius > this.fieldWidth - wallPadding) {
            this.x = this.fieldWidth - wallPadding - this.radius;
            this.vx = -this.vx * this.bounceCoeff;
            this.spin *= 0.5;
            this.playHitSound();
        }
        
        // Verificar goles
        if (this.x < -this.goalDepth && inLeftGoal) return 'goal_left';
        if (this.x > this.fieldWidth + this.goalDepth && inRightGoal) return 'goal_right';
        
        // Verificar postes
        if (inLeftGoal || inRightGoal) {
            // Verificar si golpeó el poste
            if (this.checkPostHit()) return 'post';
        }
        
        return null;
    }

    checkPostHit() {
        const goalTop = (this.fieldHeight - this.goalWidth) / 2;
        const goalBottom = (this.fieldHeight + this.goalWidth) / 2;
        const goalLine = this.fieldWidth - 20;
        
        // Poste superior
        if (this.y < goalTop + 10 && this.y > goalTop - 10 && this.x > goalLine - 20) {
            this.vy = Math.abs(this.vy) * this.bounceCoeff;
            this.playPostSound();
            return true;
        }
        
        // Poste inferior
        if (this.y > goalBottom - 10 && this.y < goalBottom + 10 && this.x > goalLine - 20) {
            this.vy = -Math.abs(this.vy) * this.bounceCoeff;
            this.playPostSound();
            return true;
        }
        
        return false;
    }

    playHitSound() {
        const now = Date.now();
        if (now - this.lastHitTime > 50) {
            window.audioManager.playSound('kick');
            this.lastHitTime = now;
        }
    }

    playPostSound() {
        window.audioManager.playSound('post');
    }

    shoot(power, targetX, targetY, height = 0) {
        if (!this.owner) return false;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calcular potencia y efecto
        const normalizedPower = Math.min(1, power / this.maxSpeed);
        const shootPower = 8 + normalizedPower * 10;
        
        // Añadir efecto (curva) basado en posición del objetivo
        const curveFactor = (targetY - this.fieldHeight / 2) / this.fieldHeight * 2;
        
        this.vx = (dx / distance) * shootPower;
        this.vy = (dy / distance) * shootPower + curveFactor;
        this.spin = curveFactor * 3;
        
        // Altura del tiro
        this.targetHeight = height;
        this.isAirborne = height > 5;
        
        // Soltar balón
        this.owner.hasBall = false;
        this.owner = null;
        
        window.audioManager.playSound('kick');
        return true;
    }

    pass(fromPlayer, toX, toY) {
        if (this.owner !== fromPlayer) return false;
        
        const dx = toX - this.x;
        const dy = toY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Velocidad de pase
        const passSpeed = Math.min(14, distance / 15 + 6);
        
        this.vx = (dx / distance) * passSpeed;
        this.vy = (dy / distance) * passSpeed;
        this.spin = (Math.random() - 0.5) * 0.5;
        
        this.owner.hasBall = false;
        this.owner = null;
        
        window.audioManager.playSound('pass');
        return true;
    }

    lob(targetX, targetY) {
        if (!this.owner) return false;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const lobPower = Math.min(12, distance / 20 + 6);
        
        this.vx = (dx / distance) * lobPower;
        this.vy = (dy / distance) * lobPower * 0.5;
        this.targetHeight = 40 + Math.min(30, distance / 20);
        this.isAirborne = true;
        this.spin = 1;
        
        this.owner.hasBall = false;
        this.owner = null;
        
        window.audioManager.playSound('kick');
        return true;
    }

    assignTo(player) {
        if (this.owner !== player) {
            if (this.owner) {
                this.owner.hasBall = false;
            }
            this.owner = player;
            player.hasBall = true;
            this.vx = 0;
            this.vy = 0;
            this.spin = 0;
            this.height = 0;
            this.targetHeight = 0;
            this.isAirborne = false;
        }
    }

    reset() {
        this.x = this.fieldWidth / 2;
        this.y = this.fieldHeight / 2;
        this.vx = 0;
        this.vy = 0;
        this.spin = 0;
        this.height = 0;
        this.targetHeight = 0;
        this.owner = null;
        this.isFree = true;
        this.isAirborne = false;
        this.trail = [];
    }

    draw(ctx) {
        // Dibujar trail
        this.drawTrail(ctx);
        
        // Calcular posición visual (efecto 3D)
        const visualY = this.y - this.height;
        
        // Sombra
        const shadowScale = 1 - (this.height / 100);
        const shadowAlpha = Math.max(0.2, shadowScale * 0.4);
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 5, this.radius * shadowScale, this.radius * shadowScale * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.fill();
        
        // Balón principal
        ctx.beginPath();
        ctx.arc(this.x, visualY, this.radius, 0, Math.PI * 2);
        
        // Gradiente 3D
        const gradient = ctx.createRadialGradient(
            this.x - 3, visualY - 3, 0,
            this.x, visualY, this.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, '#f0f0f0');
        gradient.addColorStop(1, '#cccccc');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Patrón del balón
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Brillo
        ctx.beginPath();
        ctx.arc(this.x - 3, visualY - 3, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
        
        // Efecto de altura (sombra en el suelo)
        if (this.height > 10) {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius * 0.5, this.radius * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fill();
        }
    }

    drawTrail(ctx) {
        if (this.trail.length < 2) return;
        
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed < 5) return;
        
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    isInGoalArea(side) {
        const goalTop = (this.fieldHeight - this.goalWidth) / 2;
        const goalBottom = (this.fieldHeight + this.goalWidth) / 2;
        
        if (side === 'left') {
            return this.x < 20 && this.y > goalTop && this.y < goalBottom;
        } else {
            return this.x > this.fieldWidth - 20 && this.y > goalTop && this.y < goalBottom;
        }
    }
}