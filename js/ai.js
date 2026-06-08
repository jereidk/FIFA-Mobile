/**
 * FIFA Mobile - AI Controller (Enhanced)
 * Inteligencia artificial inteligente tipo FIFA/PES con múltiples estados
 */

class AIController {
    constructor(team) {
        this.team = team;
        this.gameMode = 'balanced'; // 'easy', 'balanced', 'hard'
        
        // Estados de la IA
        this.STATE = {
            IDLE: 'idle',
            DEFENDING: 'defending',
            ATTACKING: 'attacking',
            COUNTER_ATTACK: 'counter_attack',
            PRESSING: 'pressing',
            MARKING: 'marking',
            SUPPORTING: 'supporting'
        };
        
        // Configuración por dificultad
        this.difficultyConfig = {
            easy: {
                reactionTime: 400,
                maxSpeed: 2.5,
                shootAccuracy: 0.4,
                passAccuracy: 0.6,
                decisionDelay: 200,
                aggression: 0.3
            },
            balanced: {
                reactionTime: 200,
                maxSpeed: 3.2,
                shootAccuracy: 0.65,
                passAccuracy: 0.8,
                decisionDelay: 100,
                aggression: 0.5
            },
            hard: {
                reactionTime: 80,
                maxSpeed: 3.8,
                shootAccuracy: 0.85,
                passAccuracy: 0.95,
                decisionDelay: 50,
                aggression: 0.7
            }
        };
        
        this.config = this.difficultyConfig[this.gameMode];
        
        // Memoria de decisiones
        this.decisionMemory = {
            lastBallCarrier: null,
            lastDecisionTime: 0,
            currentState: this.STATE.IDLE
        };
        
        // Jugador objetivo para marcar
        this.markingTarget = null;
        
        // timers
        this.thinkTimer = 0;
        this.thinkInterval = 100; // ms entre pensamientos
    }

    setDifficulty(difficulty) {
        this.gameMode = difficulty;
        this.config = this.difficultyConfig[difficulty];
    }

    update(ball, homeTeam, currentTime) {
        // Procesar pensamiento cada cierto intervalo
        this.thinkTimer += 16.67; // Asumiendo 60fps
        if (this.thinkTimer < this.thinkInterval) return;
        this.thinkTimer = 0;
        
        // Determinar estado general del equipo
        this.updateTeamState(ball, homeTeam);
        
        // Actualizar porter
        this.updateGoalkeeper(ball, homeTeam);
        
        // Actualizar jugadores de campo
        this.team.players.forEach(player => {
            if (!player.isGoalkeeper) {
                this.updatePlayer(player, ball, homeTeam);
            }
        });
    }

    updateTeamState(ball, homeTeam) {
        const ourGoalX = this.team.side === 'home' ? 0 : 1200;
        const theirGoalX = this.team.side === 'home' ? 1200 : 0;
        
        // Evaluar situación
        const ballInOurHalf = ball.x < 600;
        const ballInTheirHalf = ball.x > 600;
        const weHaveBall = ball.owner && ball.owner.team === this.team.side;
        
        if (weHaveBall) {
            this.decisionMemory.currentState = this.STATE.ATTACKING;
        } else if (ball.owner && ball.owner.team !== this.team.side) {
            if (ballInOurHalf) {
                this.decisionMemory.currentState = this.STATE.DEFENDING;
            } else {
                this.decisionMemory.currentState = this.STATE.PRESSING;
            }
        } else {
            // Balón libre
            this.decisionMemory.currentState = this.STATE.IDLE;
        }
    }

    updateGoalkeeper(goalkeeper, ball) {
        const goalCenterY = 350;
        const goalWidth = 120;
        const fieldWidth = 1200;
        
        let targetX = this.team.side === 'home' ? 30 : fieldWidth - 30;
        let targetY = goalCenterY;
        
        // Si el balón está lejos, reposicionarse
        if (ball.x > 400 && ball.x < 800) {
            // Balón en campo medio - salir un poco
            targetX = this.team.side === 'home' ? 50 : fieldWidth - 50;
            targetY = ball.y * 0.4 + goalCenterY * 0.6;
        } else if (ball.x > 700) {
            // Balón acercándose a nuestra portería
            const dangerLevel = (ball.x - 700) / 500;
            targetY = ball.y * (0.3 + dangerLevel * 0.5) + goalCenterY * (0.7 - dangerLevel * 0.3);
            
            // Salir de la línea si hay peligro
            if (ball.vx < 0 && ball.x > 900) {
                targetX = this.team.side === 'home' ? 80 : fieldWidth - 80;
            }
        }
        
        // Limitar al área de la portería
        const minY = (700 - goalWidth) / 2 + 15;
        const maxY = (700 + goalWidth) / 2 - 15;
        targetY = Math.max(minY, Math.min(maxY, targetY));
        
        // Mover hacia posición objetivo
        const dx = targetX - goalkeeper.x;
        const dy = targetY - goalkeeper.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const speed = Math.min(this.config.maxSpeed * 0.8, distance * 0.08);
            goalkeeper.vx = (dx / distance) * speed;
            goalkeeper.vy = (dy / distance) * speed;
        }
        
        // Si el balón está muy cerca, intentar atraparlo
        const distToBall = goalkeeper.distanceTo(ball);
        if (distToBall < 60 && ball.x < 100) {
            const bDx = ball.x - goalkeeper.x;
            const bDy = ball.y - goalkeeper.y;
            const bDist = Math.sqrt(bDx * bDx + bDy * bDy);
            
            if (bDist > 5) {
                goalkeeper.vx = (bDx / bDist) * this.config.maxSpeed;
                goalkeeper.vy = (bDy / bDist) * this.config.maxSpeed;
            }
        }
    }

    updatePlayer(player, ball, homeTeam) {
        // Determinar rol según posición y estado del juego
        const role = this.determineRole(player, ball);
        
        switch (role) {
            case 'ball_chaser':
                this.chaseBall(player, ball);
                break;
            case 'marker':
                this.markOpponent(player, ball, homeTeam);
                break;
            case 'support':
                this.supportAttack(player, ball);
                break;
            case 'defender':
                this.defendPosition(player, ball);
                break;
            case 'attacker':
                this.attackPosition(player, ball);
                break;
        }
    }

    determineRole(player, ball) {
        const closestToBall = this.team.getClosestToBall(ball);
        
        // Si es el más cercano al balón, perseguirlo
        if (player === closestToBall && !ball.owner) {
            return 'ball_chaser';
        }
        
        // Si tenemos posesión
        if (ball.owner && ball.owner.team === this.team.side) {
            // Jugadores adelante son soportes
            if (this.team.side === 'home' ? player.x > ball.x : player.x < ball.x) {
                return 'support';
            }
            return 'defender';
        }
        
        // Si el rival tiene el balón
        if (ball.owner && ball.owner.team !== this.team.side) {
            // Los más cercanos presionan
            if (player.distanceTo(ball.owner) < 150) {
                return 'ball_chaser';
            }
            // Otros marcan
            return 'marker';
        }
        
        return 'defender';
    }

    chaseBall(player, ball) {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 8) {
            const speed = Math.min(this.config.maxSpeed, distance * 0.12);
            player.vx = (dx / distance) * speed;
            player.vy = (dy / distance) * speed;
        }
        
        // Intentar robar si está muy cerca
        if (distance < 25 && ball.owner) {
            // Intento de robo - con probabilidad según dificultad
            if (Math.random() < this.config.aggression * 0.3) {
                // Robo exitoso
                ball.assignTo(player);
            }
        }
    }

    markOpponent(player, ball, homeTeam) {
        // Encontrar el oponente más peligroso a marcar
        if (!this.markingTarget || this.markingTarget !== ball.owner) {
            this.markingTarget = ball.owner;
        }
        
        if (this.markingTarget) {
            const dx = this.markingTarget.x - player.x;
            const dy = this.markingTarget.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Mantener distancia de marca
            if (distance > 60) {
                player.vx = (dx / distance) * this.config.maxSpeed * 0.7;
                player.vy = (dy / distance) * this.config.maxSpeed * 0.7;
            } else if (distance < 30) {
                // Demasiado cerca - retroceder un poco
                player.vx = -(dx / distance) * this.config.maxSpeed * 0.5;
                player.vy = -(dy / distance) * this.config.maxSpeed * 0.5;
            }
        } else {
            // Volver a posición defensiva
            this.returnToPosition(player);
        }
    }

    supportAttack(player, ball) {
        // Buscar espacio para recibir pase
        const ourGoalX = this.team.side === 'home' ? 0 : 1200;
        const theirGoalX = this.team.side === 'home' ? 1200 : 0;
        
        // Posición ideal: entre balón y portería contraria
        let targetX, targetY;
        
        if (player.hasBall) {
            // Este jugador tiene el balón - avanzar
            targetX = player.x + (this.team.side === 'home' ? 30 : -30);
            targetY = player.y;
        } else {
            // Buscar espacio
            targetX = ball.x + (this.team.side === 'home' ? 50 : -50);
            targetY = ball.y + (Math.random() - 0.5) * 100;
        }
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            const speed = Math.min(this.config.maxSpeed * 0.8, distance * 0.06);
            player.vx = (dx / distance) * speed;
            player.vy = (dy / distance) * speed;
        }
        
        // Decidir si pasar o disparar
        if (player.hasBall) {
            this.makeOffensiveDecision(player, ball);
        }
    }

    makeOffensiveDecision(player, ball) {
        const theirGoalX = this.team.side === 'home' ? 1200 : 0;
        const distanceToGoal = Math.abs(theirGoalX - player.x);
        
        // Evaluar tiro
        if (distanceToGoal < 200 && Math.random() < this.config.shootAccuracy * 0.4) {
            const targetY = 350 + (Math.random() - 0.5) * 80;
            player.shoot(theirGoalX, targetY, ball);
            return;
        }
        
        // Evaluar pase
        const bestTarget = this.team.findBestPassTarget(player);
        if (bestTarget && Math.random() < this.config.passAccuracy) {
            player.pass(bestTarget, ball);
        }
    }

    defendPosition(player, ball) {
        // Volver a posición defensiva base
        this.returnToPosition(player);
    }

    attackPosition(player, ball) {
        // Avanzar hacia el área
        const theirGoalX = this.team.side === 'home' ? 1200 : 0;
        
        // Encontrar espacio
        let targetX = ball.x + (this.team.side === 'home' ? 40 : -40);
        let targetY = ball.y + (Math.random() - 0.5) * 150;
        
        // Limitar avance
        if (this.team.side === 'home') {
            targetX = Math.min(targetX, 1100);
        } else {
            targetX = Math.max(targetX, 100);
        }
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 25) {
            const speed = Math.min(this.config.maxSpeed * 0.7, distance * 0.05);
            player.vx = (dx / distance) * speed;
            player.vy = (dy / distance) * speed;
        }
    }

    returnToPosition(player) {
        const formation = this.team.formation[player.number - 1];
        if (!formation) return;
        
        // Posición objetivo (reflejada para equipo away)
        let targetX = (1 - formation.x) * 1200;
        const targetY = formation.y * 700;
        
        // Ajuste según estado del juego
        if (this.decisionMemory.currentState === this.STATE.DEFENDING) {
            // Mantener líneas más juntas
            targetX = this.team.side === 'home' 
                ? Math.max(200, targetX - 100)
                : Math.min(1000, targetX + 100);
        }
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 30) {
            const speed = Math.min(this.config.maxSpeed * 0.5, distance * 0.03);
            player.vx = (dx / distance) * speed;
            player.vy = (dy / distance) * speed;
        }
    }

    // Verificar si debe intentar robar
    shouldAttemptSteal(player, ball) {
        if (!ball.owner || ball.owner.team === this.team.side) return false;
        
        const distance = player.distanceTo(ball.owner);
        
        if (distance < 30 && Math.random() < this.config.aggression * 0.5) {
            return true;
        }
        
        return false;
    }

    // Calcular ángulo de tiro óptimo
    calculateShootAngle(player, ball) {
        const theirGoalX = this.team.side === 'home' ? 1200 : 0;
        const goalCenterY = 350;
        
        // Añadir imprecisión según dificultad
        const accuracy = this.config.shootAccuracy;
        const randomOffset = (1 - accuracy) * 50 * (Math.random() - 0.5);
        
        return {
            x: theirGoalX,
            y: goalCenterY + randomOffset
        };
    }
}

// Exportar para uso global
window.AIController = AIController;