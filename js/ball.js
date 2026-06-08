/**
 * FIFA Mobile - Ball Class
 * Maneja la física y rendering del balón
 */

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.985;
        this.maxSpeed = 15;
        this.owner = null;
        this.isFree = true;
        
        // Constantes de campo
        this.fieldWidth = 1200;
        this.fieldHeight = 700;
        this.goalWidth = 120;
        this.goalDepth = 30;
    }

    update() {
        if (this.owner) {
            // El balón sigue al jugador
            const offsetX = this.owner.direction * 15;
            const offsetY = -10;
            
            this.x = this.owner.x + offsetX;
            this.y = this.owner.y + offsetY;
            this.vx = 0;
            this.vy = 0;
            this.isFree = false;
        } else {
            // Balón libre - aplicar física
            this.x += this.vx;
            this.y += this.vy;
            
            // Aplicar fricción
            this.vx *= this.friction;
            this.vy *= this.friction;
            
            // Limitar velocidad máxima
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > this.maxSpeed) {
                this.vx = (this.vx / speed) * this.maxSpeed;
                this.vy = (this.vy / speed) * this.maxSpeed;
            }
            
            // Detener completamente si está muy lento
            if (speed < 0.1) {
                this.vx = 0;
                this.vy = 0;
            }
            
            this.isFree = true;
            
            // Colisión con bordes del campo
            this.handleWallCollision();
        }
    }

    handleWallCollision() {
        const wallPadding = 20;
        
        // Paredes laterales (arriba y abajo)
        if (this.y - this.radius < wallPadding) {
            this.y = wallPadding + this.radius;
            this.vy = -this.vy * 0.7;
        }
        if (this.y + this.radius > this.fieldHeight - wallPadding) {
            this.y = this.fieldHeight - wallPadding - this.radius;
            this.vy = -this.vy * 0.7;
        }
        
        // Paredes de los lados (teniendo en cuenta las porterías)
        const goalTop = (this.fieldHeight - this.goalWidth) / 2;
        const goalBottom = (this.fieldHeight + this.goalWidth) / 2;
        
        // Lado izquierdo
        if (this.x - this.radius < wallPadding) {
            // Verificar si está en el área de la portería
            if (this.y > goalTop && this.y < goalBottom) {
                // Está en el área de gol - no rebota en el borde horizontal
                if (this.x - this.radius < -this.goalDepth) {
                    // GOL - resetear
                    return 'goal_left';
                }
            } else {
                this.x = wallPadding + this.radius;
                this.vx = -this.vx * 0.7;
            }
        }
        
        // Lado derecho
        if (this.x + this.radius > this.fieldWidth - wallPadding) {
            if (this.y > goalTop && this.y < goalBottom) {
                if (this.x + this.radius > this.fieldWidth + this.goalDepth) {
                    return 'goal_right';
                }
            } else {
                this.x = this.fieldWidth - wallPadding - this.radius;
                this.vx = -this.vx * 0.7;
            }
        }
        
        return null;
    }

    shoot(power, targetX, targetY) {
        if (this.owner) {
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Normalizar y aplicar potencia
            this.vx = (dx / distance) * power;
            this.vy = (dy / distance) * power;
            
            // Soltar el balón
            this.owner.hasBall = false;
            this.owner = null;
        }
    }

    pass(fromPlayer, toX, toY) {
        if (this.owner === fromPlayer) {
            const dx = toX - this.x;
            const dy = toY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const passPower = Math.min(12, distance / 10 + 5);
            this.vx = (dx / distance) * passPower;
            this.vy = (dy / distance) * passPower;
            
            this.owner.hasBall = false;
            this.owner = null;
        }
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
        }
    }

    reset() {
        this.x = this.fieldWidth / 2;
        this.y = this.fieldHeight / 2;
        this.vx = 0;
        this.vy = 0;
        this.owner = null;
        this.isFree = true;
    }

    draw(ctx) {
        // Sombra del balón
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y + 3, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        // Balón principal
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Gradiente para efecto 3D
        const gradient = ctx.createRadialGradient(
            this.x - 3, this.y - 3, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#cccccc');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Patrón del balón (pentágonos negros)
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Brillo
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }

    // Verificar si el balón está en un área específica
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