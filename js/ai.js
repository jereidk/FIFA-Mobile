/**
 * FIFA Mobile - AI Class
 * Inteligencia artificial para el equipo CPU
 */

class AIController {
    constructor(team) {
        this.team = team;
        this.reactionDelay = 500; // ms
        this.lastDecisionTime = 0;
        
        // Configuración de comportamiento
        this.config = {
            // Velocidad de reacción
            reactionSpeed: 0.04,
            
            // Velocidad máxima de los jugadores IA
            maxSpeed: 3,
            
            // Distancia para intentar robar el balón
            stealDistance: 25,
            
            // Distancia para chutar a portería
            shootDistance: 250,
            
            // Probabilidad de tiro (0-1)
            shootChance: 0.7,
            
            // Distancia para pasar
            passDistance: 150,
            
            // Velocidad de persecución
            chaseSpeed: 2.8,
            
            // Volver a posición defensiva
            defensiveReturnSpeed: 2,
            
            // Área de presión
            pressureDistance: 80,
            
            // Distancia de marca
            markingDistance: 50
        };
        
        // Estado de la IA
        this.state = 'idle';
        this.targetPlayer = null;
    }

    update(ball, homeTeam, currentTime) {
        // No procesar si el balón está en nuestro equipo
        if (ball.owner && ball.owner.team === this.team.side) {
            return;
        }
        
        // Encontrar el jugador más cercano al balón
        const closestToBall = this.team.getClosestToBall(ball);
        
        // Encontrar jugador con balón rival más cercano
        let closestRivalWithBall = null;
        if (ball.owner) {
            closestRivalWithBall = ball.owner;
        }
        
        // Actualizar cada jugador
        this.team.players.forEach(player => {
            if (player.isGoalkeeper) {
                this.updateGoalkeeper(player, ball);
            } else {
                this.updateFieldPlayer(player, ball, closestToBall, closestRivalWithBall, homeTeam);
            }
        });
    }

    updateGoalkeeper(goalkeeper, ball) {
        const goalCenterY = 350;
        const goalWidth = 120;
        const fieldWidth = 1200;
        
        // Determinar posición objetivo
        let targetY = goalCenterY;
        
        // Si el balón viene hacia nuestra portería, salir a bloquear
        if (ball.vx < 0 && ball.x > 800) {
            // Balón acercándose
            const distanceToGoal = fieldWidth - ball.x;
            if (distanceToGoal < 300) {
                // Salir de la portería
                targetY = ball.y;
            }
        }
        
        // Siempre mantener posición entre balón y portería
        if (ball.x > 600) {
            targetY = ball.y * 0.3 + goalCenterY * 0.7;
        }
        
        // Limitar al área de la portería
        const minY = (700 - goalWidth) / 2 + 20;
        const maxY = (700 + goalWidth) / 2 - 20;
        targetY = Math.max(minY, Math.min(maxY, targetY));
        
        // Mover hacia posición objetivo
        const dy = targetY - goalkeeper.y;
        if (Math.abs(dy) > 5) {
            goalkeeper.vy = Math.sign(dy) * Math.min(this.config.maxSpeed, Math.abs(dy) * 0.1);
        }
        
        // Si el balón está muy cerca, salir a atraparlo
        const distToBall = goalkeeper.distanceTo(ball);
        if (distToBall < 50 && ball.x < 100) {
            const dx = ball.x - goalkeeper.x;
            const dy = ball.y - goalkeeper.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            goalkeeper.vx = (dx / dist) * this.config.maxSpeed;
            goalkeeper.vy = (dy / dist) * this.config.maxSpeed;
        }
    }

    updateFieldPlayer(player, ball, closestToBall, rivalWithBall, homeTeam) {
        const fieldWidth = 1200;
        const fieldHeight = 700;
        
        // Si este jugador está más cercano al balón, ir por él
        if (player === closestToBall) {
            this.chaseBall(player, ball);
            return;
        }
        
        // Si un rival tiene el balón, marcar y presionar
        if (rivalWithBall) {
            const distanceToRival = player.distanceTo(rivalWithBall);
            
            // Si está muy cerca, intentar robar
            if (distanceToRival < this.config.stealDistance && ball.owner === rivalWithBall) {
                this.attemptSteal(player, ball, rivalWithBall);
            } else if (distanceToRival < this.config.pressureDistance) {
                // Presionar al rival
                this.pressPlayer(player, rivalWithBall);
            } else {
                // Volver a posición defensiva base
                this.returnToPosition(player);
            }
            return;
        }
        
        // Si el balón está libre, ir a buscarlo
        if (!ball.owner) {
            if (player === closestToBall) {
                this.chaseBall(player, ball);
            } else {
                // Posicionarse para recuperación
                this.positionForRecovery(player, ball);
            }
            return;
        }
        
        // Comportamiento ofensivo cuando tenemos posesión (no aplica aquí)
        // Pero podemos posicionar paracontraataque
        this.returnToPosition(player);
    }

    chaseBall(player, ball) {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const speed = Math.min(this.config.chaseSpeed, distance * 0.1);
            player.vx = (dx / distance) * speed;
            player.vy = (dy / distance) * speed;
            
            // Actualizar dirección
            player.direction = dx > 0 ? 1 : -1;
        }
    }

    pressPlayer(player, target) {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            const speed = this.config.chaseSpeed * 0.9;
            player.vx = (dx / distance) * speed;
            player.vy = (dy / distance) * speed;
        }
    }

    attemptSteal(player, ball, ballHolder) {
        const distance = player.distanceTo(ballHolder);
        
        if (distance < this.config.stealDistance) {
            // Mover directamente hacia el portador del balón
            const dx = ballHolder.x - player.x;
            const dy = ballHolder.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            player.vx = (dx / dist) * this.config.maxSpeed;
            player.vy = (dy / dist) * this.config.maxSpeed;
        }
    }

    returnToPosition(player) {
        // Volver a posición base según el número
        // Esto hace que los jugadores mantengan formación
        const formation = this.team.formation[player.number - 1];
        if (!formation) return;
        
        // Posición objetivo (reflejada para equipo away)
        const targetX = (1 - formation.x) * 1200;
        const targetY = formation.y * 700;
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            const speed = Math.min(this.config.defensiveReturnSpeed, distance * 0.05);
            player.vx = (dx / distance) * speed;
            player.vy = (dy / distance) * speed;
        }
    }

    positionForRecovery(player, ball) {
        // Posicionarse entre el balón y nuestra portería
        const goalX = this.team.side === 'home' ? 1200 : 0;
        const goalY = 350;
        
        // Interpolación entre balón y portería
        const ratio = 0.3;
        const targetX = ball.x + (goalX - ball.x) * ratio;
        const targetY = ball.y + (goalY - ball.y) * ratio;
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 30) {
            const speed = Math.min(this.config.chaseSpeed * 0.7, distance * 0.05);
            player.vx = (dx / distance) * speed;
            player.vy = (dy / distance) * speed;
        }
    }

    // Verificar si un jugador de este equipo debe disparar
    shouldShoot(player, ball) {
        if (!player.hasBall) return false;
        
        const distanceToGoal = this.team.side === 'home' 
            ? 1200 - player.x 
            : player.x;
        
        if (distanceToGoal > this.config.shootDistance) return false;
        
        // Verificar ángulo de tiro
        const goalY = 350;
        const angleToGoal = Math.atan2(goalY - player.y, 
            this.team.side === 'home' ? 1200 - player.x : -player.x);
        
        // Si está bien posicionado, considerar disparar
        if (Math.abs(angleToGoal) < Math.PI / 3) {
            // Añadir algo de aleatoriedad para hacerlo más realista
            return Math.random() < this.config.shootChance;
        }
        
        return false;
    }

    // Verificar si debe pasar
    shouldPass(player, ball, teammates) {
        if (!player.hasBall) return false;
        
        const distanceToGoal = this.team.side === 'home' 
            ? 1200 - player.x 
            : player.x;
        
        // Si está muy lejos de la portería, pasar
        if (distanceToGoal > 400) {
            return true;
        }
        
        // Si hay compañeros más adelante, pasar
        const bestTarget = this.team.findBestPassTarget(player);
        if (bestTarget && player.distanceTo(bestTarget) < this.config.passDistance) {
            // Pasar si hay defensa cerca
            return Math.random() < 0.4;
        }
        
        return false;
    }
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIController;
}