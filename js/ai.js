/**
 * FIFA Mobile - AI Controller (Tactical System)
 * Sistema de IA con comportamiento táctico avanzado
 */

class AIController {
    constructor(team, gameMode = 'balanced') {
        this.team = team;
        this.gameMode = gameMode;
        this.side = team.side;
        
        // Estados tácticos
        this.STATE = {
            IDLE: 'idle',
            DEFENDING: 'defending',
            PRESSING: 'pressing',
            BUILDING: 'building',
            ATTACKING: 'attacking',
            COUNTER: 'counter'
        };
        
        this.currentState = this.STATE.IDLE;
        this.lastState = this.STATE.IDLE;
        this.stateTimer = 0;
        this.lastDecisionTime = 0;
        
        // Configuración por dificultad
        this.difficultyConfig = {
            easy: {
                reactionTime: 400,
                maxSpeed: 2.8,
                shootAccuracy: 0.45,
                passAccuracy: 0.65,
                decisionDelay: 200,
                aggression: 0.35,
                markDistance: 50,
                positioning: 0.6
            },
            balanced: {
                reactionTime: 200,
                maxSpeed: 3.5,
                shootAccuracy: 0.6,
                passAccuracy: 0.75,
                decisionDelay: 100,
                aggression: 0.45,
                markDistance: 55,
                positioning: 0.8
            },
            hard: {
                reactionTime: 80,
                maxSpeed: 4.0,
                shootAccuracy: 0.8,
                passAccuracy: 0.9,
                decisionDelay: 50,
                aggression: 0.65,
                markDistance: 60,
                positioning: 0.95
            }
        };
        
        this.config = this.difficultyConfig[this.gameMode];
        
        // Memoria de decisiones
        this.decisionMemory = {
            lastPassTarget: null,
            lastShootTime: 0,
            lastDribbleTime: 0,
            lastPassTime: 0,
            markingAssignments: new Map()
        };
        
        // Transiciones de estado
        this.transitionThresholds = {
            toPressing: 150,
            toAttacking: 600,
            toCounter: 200
        };
    }

    update(ball, homeTeam, currentTime) {
        if (currentTime - this.lastDecisionTime < this.config.reactionTime) {
            return;
        }
        
        this.determineTacticalState(ball, homeTeam);
        
        this.team.players.forEach(player => {
            if (player.isGoalkeeper) {
                this.updateGoalkeeper(player, ball);
            } else {
                this.updateFieldPlayer(player, ball, homeTeam, currentTime);
            }
        });
        
        this.lastDecisionTime = currentTime;
    }

    determineTacticalState(ball, homeTeam) {
        const weHaveBall = ball.owner && ball.owner.team === this.side;
        const theyHaveBall = ball.owner && ball.owner.team !== this.side;
        const closestToBall = this.team.getClosestToBall(ball);
        const distanceToBall = closestToBall ? closestToBall.distanceTo(ball) : Infinity;
        
        if (weHaveBall) {
            const ballOwner = ball.owner;
            const advanceLevel = this.side === 'home' ? ballOwner.x : 1200 - ballOwner.x;
            
            if (advanceLevel > this.transitionThresholds.toAttacking) {
                this.currentState = this.STATE.ATTACKING;
            } else {
                this.currentState = this.STATE.BUILDING;
            }
        } else if (theyHaveBall) {
            if (distanceToBall < this.transitionThresholds.toPressing) {
                this.currentState = this.STATE.PRESSING;
            } else {
                this.currentState = this.STATE.DEFENDING;
            }
        } else {
            this.currentState = this.STATE.IDLE;
        }
        
        if (this.currentState !== this.lastState) {
            this.stateTimer = 0;
            this.lastState = this.currentState;
        }
        this.stateTimer++;
    }

    updateGoalkeeper(player, ball) {
        const gkX = this.side === 'home' ? 40 : 1160;
        const goalCenterY = 350;
        const goalWidth = 120;
        const goalTop = goalCenterY - goalWidth / 2;
        const goalBottom = goalCenterY + goalWidth / 2;
        
        let targetY = goalCenterY;
        if (ball.y > goalTop && ball.y < goalBottom) {
            targetY = ball.y * 0.7 + goalCenterY * 0.3;
        }
        
        const dy = targetY - player.y;
        if (Math.abs(dy) > 5) {
            player.vy = Math.sign(dy) * this.config.maxSpeed * 0.6;
        } else {
            player.vy = 0;
        }
        
        const dx = gkX - player.x;
        if (Math.abs(dx) > 3) {
            player.vx = Math.sign(dx) * this.config.maxSpeed * 0.3;
        } else {
            player.vx = 0;
        }
    }

    updateFieldPlayer(player, ball, homeTeam, currentTime) {
        const ballOwner = ball.owner;
        
        if (this.side === 'home' && player === homeTeam.controlledPlayer) {
            return;
        }
        
        switch (this.currentState) {
            case this.STATE.PRESSING:
                this.handlePressing(player, ball, ballOwner);
                break;
            case this.STATE.DEFENDING:
                this.handleDefending(player, ball, homeTeam);
                break;
            case this.STATE.BUILDING:
                this.handleBuilding(player, ball, currentTime);
                break;
            case this.STATE.ATTACKING:
                this.handleAttacking(player, ball, currentTime);
                break;
            case this.STATE.IDLE:
                this.handleIdle(player, ball);
                break;
        }
    }

    handlePressing(player, ball, ballOwner) {
        if (!ballOwner || ballOwner.team === this.side) return;
        
        const distanceToBall = player.distanceTo(ball);
        const distanceToOwner = player.distanceTo(ballOwner);
        const role = player.role || 'CM';
        
        if (distanceToBall > this.transitionThresholds.toPressing * 2) return;
        
        if (role === 'ST' || role === 'LW' || role === 'RW') {
            if (distanceToOwner < 200) {
                const dx = ballOwner.x - player.x;
                const dy = ballOwner.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                player.vx = (dx / dist) * this.config.maxSpeed;
                player.vy = (dy / dist) * this.config.maxSpeed;
            }
        } else if (role === 'CDM' || role === 'CM' || role === 'CAM') {
            const passLane = this.getPassLaneIntercept(player, ballOwner);
            if (passLane) {
                const dx = passLane.x - player.x;
                const dy = passLane.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 20) {
                    player.vx = (dx / dist) * this.config.maxSpeed * 0.8;
                    player.vy = (dy / dist) * this.config.maxSpeed * 0.8;
                }
            } else if (distanceToOwner < 150) {
                const dx = ballOwner.x - player.x;
                const dy = ballOwner.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                player.vx = (dx / dist) * this.config.maxSpeed * 0.6;
                player.vy = (dy / dist) * this.config.maxSpeed * 0.6;
            }
        } else {
            this.moveToBasePosition(player);
        }
    }

    handleDefending(player, ball, homeTeam) {
        const ballOwner = ball.owner;
        const role = player.role || 'CM';
        
        const opponents = homeTeam.players.filter(p => !p.isGoalkeeper);
        const closestOpponent = opponents.reduce((a, b) => 
            player.distanceTo(a) < player.distanceTo(b) ? a : b
        );
        
        if (role === 'CB') {
            const targetX = this.side === 'home' ? 100 : 1100;
            const targetY = closestOpponent ? closestOpponent.y : 350;
            
            const dx = targetX - player.x;
            const dy = targetY - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 10) {
                player.vx = (dx / dist) * this.config.maxSpeed * 0.5;
                player.vy = (dy / dist) * this.config.maxSpeed * 0.5;
            }
            
            this.maintainDefensiveLine(player);
            
        } else if (role === 'LB' || role === 'RB' || role === 'LWB' || role === 'RWB') {
            const markTarget = closestOpponent && 
                ((role === 'LB' && closestOpponent.y < 300) ||
                 (role === 'RB' && closestOpponent.y > 400) ||
                 (role === 'LWB' && closestOpponent.y < 250) ||
                 (role === 'RWB' && closestOpponent.y > 450))
                ? closestOpponent : null;
            
            if (markTarget) {
                const dx = markTarget.x - player.x;
                const dy = markTarget.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 50) {
                    player.vx = (dx / dist) * this.config.maxSpeed * 0.7;
                    player.vy = (dy / dist) * this.config.maxSpeed * 0.7;
                } else if (dist < 25) {
                    player.vx = -(dx / dist) * this.config.maxSpeed * 0.3;
                    player.vy = -(dy / dist) * this.config.maxSpeed * 0.3;
                }
            } else {
                this.maintainDefensiveLine(player);
            }
            
        } else if (role === 'CDM') {
            const coverPos = this.getCentralCoverPosition(player, ball);
            const dx = coverPos.x - player.x;
            const dy = coverPos.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 15) {
                player.vx = (dx / dist) * this.config.maxSpeed * 0.6;
                player.vy = (dy / dist) * this.config.maxSpeed * 0.6;
            }
            
        } else if (role === 'CM' || role === 'CAM') {
            const coverPos = this.getMidfieldCoverPosition(player, ball);
            const dx = coverPos.x - player.x;
            const dy = coverPos.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 20) {
                player.vx = (dx / dist) * this.config.maxSpeed * 0.5;
                player.vy = (dy / dist) * this.config.maxSpeed * 0.5;
            }
            
        } else {
            this.moveToCounterPosition(player);
        }
    }

    handleBuilding(player, ball, currentTime) {
        if (!ball.owner || ball.owner.team !== this.side) return;
        
        const ballOwner = ball.owner;
        const role = player.role || 'CM';
        
        if (player.distanceTo(ball) > 300) return;
        
        if (role === 'CDM' || role === 'CM') {
            const spaceTarget = this.team.findSpace(ball);
            const dx = spaceTarget.x - player.x;
            const dy = spaceTarget.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 30) {
                player.vx = (dx / dist) * this.config.maxSpeed * 0.5;
                player.vy = (dy / dist) * this.config.maxSpeed * 0.5;
            }
            
            if (dist < 100 && dist > 30) {
                player.vx *= 0.3;
                player.vy *= 0.3;
            }
            
        } else if (role === 'LB' || role === 'RB' || role === 'LWB' || role === 'RWB') {
            const targetX = this.side === 'home' ? ballOwner.x + 100 : ballOwner.x - 100;
            const targetY = player.baseY;
            
            const dx = targetX - player.x;
            const dy = targetY - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 20 && Math.abs(dx * (this.side === 'home' ? 1 : -1)) > 0) {
                player.vx = (dx / dist) * this.config.maxSpeed * 0.6;
                player.vy = (dy / dist) * this.config.maxSpeed * 0.4;
            }
            
        } else if (role === 'ST' || role === 'LW' || role === 'RW') {
            const separationTarget = this.getSeparationPosition(player, ballOwner);
            const dx = separationTarget.x - player.x;
            const dy = separationTarget.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 40) {
                player.vx = (dx / dist) * this.config.maxSpeed * 0.4;
                player.vy = (dy / dist) * this.config.maxSpeed * 0.4;
            }
        }
    }

    handleAttacking(player, ball, currentTime) {
        if (!ball.owner || ball.owner.team !== this.side) return;
        
        const ballOwner = ball.owner;
        const role = player.role || 'ST';
        
        if (player.hasBall) {
            this.makeOffensiveDecision(player, ball, currentTime);
            return;
        }
        
        const direction = this.side === 'home' ? 1 : -1;
        const targetX = this.side === 'home' ? ballOwner.x + 150 : ballOwner.x - 150;
        const targetY = this.getAttackYPosition(player, ball);
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 30) {
            const speed = role === 'ST' || role === 'LW' || role === 'RW' ? 0.7 : 0.5;
            player.vx = (dx / dist) * this.config.maxSpeed * speed;
            player.vy = (dy / dist) * this.config.maxSpeed * speed;
        }
        
        if (role !== 'ST' && player.distanceTo(ballOwner) < 200) {
            const wallTarget = this.team.findWallPassTarget(player, ball);
            if (wallTarget && currentTime - this.decisionMemory.lastPassTime > 1000) {
                const wallPos = this.getWallPosition(player, wallTarget);
                const wdx = wallPos.x - player.x;
                const wdy = wallPos.y - player.y;
                const wdist = Math.sqrt(wdx * wdx + wdy * wdy);
                
                if (wdist > 20) {
                    player.vx = (wdx / wdist) * this.config.maxSpeed * 0.6;
                    player.vy = (wdy / wdist) * this.config.maxSpeed * 0.6;
                }
            }
        }
    }

    handleIdle(player, ball) {
        if (!ball.owner) {
            const closestToBall = this.team.getClosestToBall(ball);
            if (player === closestToBall) {
                const dx = ball.x - player.x;
                const dy = ball.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 20) {
                    player.vx = (dx / dist) * this.config.maxSpeed * 0.8;
                    player.vy = (dy / dist) * this.config.maxSpeed * 0.8;
                }
            } else {
                this.moveToBasePosition(player);
            }
        } else {
            this.moveToBasePosition(player);
        }
    }

    makeOffensiveDecision(player, ball, currentTime) {
        const direction = this.side === 'home' ? 1 : -1;
        const theirGoalX = this.side === 'home' ? 1200 : 0;
        const goalCenterY = 350;
        const distanceToGoal = Math.abs(theirGoalX - player.x);
        const playerY = player.y;
        
        const inGoodPosition = playerY > goalCenterY - 60 && playerY < goalCenterY + 60;
        const goodDistance = distanceToGoal < 280 && distanceToGoal > 70;
        
        let shootChance = 0;
        if (distanceToGoal < 80) shootChance = 0.75;
        else if (distanceToGoal < 130) shootChance = 0.55;
        else if (distanceToGoal < 180 && inGoodPosition) shootChance = 0.35;
        else if (distanceToGoal < 250 && inGoodPosition) shootChance = 0.15;
        
        shootChance *= this.config.shootAccuracy;
        
        const verticalPass = this.evaluateVerticalPass(player, ball);
        const wallPass = this.team.findWallPassTarget(player, ball);
        
        if (goodDistance && Math.random() < shootChance) {
            const targetY = goalCenterY + (Math.random() - 0.5) * 80;
            player.shoot(theirGoalX, targetY, ball);
            this.decisionMemory.lastShootTime = currentTime;
            return;
        }
        
        if (verticalPass && Math.random() < 0.4) {
            player.pass(verticalPass, ball);
            this.decisionMemory.lastPassTarget = verticalPass;
            this.decisionMemory.lastPassTime = currentTime;
            return;
        }
        
        if (wallPass && Math.random() < this.config.passAccuracy * 0.8) {
            player.pass(wallPass, ball);
            this.decisionMemory.lastPassTarget = wallPass;
            this.decisionMemory.lastPassTime = currentTime;
            return;
        }
        
        const bestTarget = this.team.findBestPassTarget(player, ball, 'attack');
        if (bestTarget && Math.random() < this.config.passAccuracy) {
            player.pass(bestTarget, ball);
            this.decisionMemory.lastPassTarget = bestTarget;
            this.decisionMemory.lastPassTime = currentTime;
            return;
        }
        
        if (currentTime - this.decisionMemory.lastDribbleTime > 800) {
            player.vx += direction * this.config.maxSpeed * 0.6;
            player.vy += (Math.random() - 0.5) * this.config.maxSpeed * 0.3;
            this.decisionMemory.lastDribbleTime = currentTime;
        }
    }

    evaluateVerticalPass(player, ball) {
        const direction = this.side === 'home' ? 1 : -1;
        const teammates = this.team.players.filter(p => 
            p !== player && 
            !p.isGoalkeeper &&
            p.x * direction > player.x * direction - 50
        );
        
        let best = null;
        let bestScore = -Infinity;
        
        teammates.forEach(p => {
            const dx = p.x - player.x;
            const dy = p.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 200 || dist > 400) return;
            if (dx * direction < 50) return;
            
            const score = dx * direction - dist * 0.5;
            
            if (score > bestScore) {
                bestScore = score;
                best = p;
            }
        });
        
        return best;
    }

    moveToBasePosition(player) {
        const base = this.team.getBasePosition(player);
        const dx = base.x - player.x;
        const dy = base.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 10) {
            player.vx = (dx / dist) * this.config.maxSpeed * 0.4;
            player.vy = (dy / dist) * this.config.maxSpeed * 0.4;
        } else {
            player.vx *= 0.8;
            player.vy *= 0.8;
        }
    }

    moveToCounterPosition(player) {
        const direction = this.side === 'home' ? 1 : -1;
        const targetX = this.side === 'home' ? 500 : 700;
        const targetY = player.baseY;
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 30) {
            player.vx = (dx / dist) * this.config.maxSpeed * 0.5;
            player.vy = (dy / dist) * this.config.maxSpeed * 0.3;
        }
    }

    maintainDefensiveLine(player) {
        const lineX = this.side === 'home' ? 150 : 1050;
        
        const dx = lineX - player.x;
        if (Math.abs(dx) > 10) {
            player.vx = Math.sign(dx) * this.config.maxSpeed * 0.3;
        }
    }

    getPassLaneIntercept(player, ballOwner) {
        const gk = this.team.getGoalkeeper();
        if (!gk) return null;
        
        const midX = (ballOwner.x + gk.x) / 2;
        const midY = (ballOwner.y + gk.y) / 2;
        
        const dx = midX - player.x;
        const dy = midY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
            return { x: midX, y: midY };
        }
        return null;
    }

    getCentralCoverPosition(player, ball) {
        const ballOwner = ball.owner;
        
        let targetX = player.baseX;
        let targetY = player.baseY;
        
        if (ballOwner && ballOwner.team !== this.side) {
            targetX = this.side === 'home' ? Math.min(player.baseX + 50, ballOwner.x - 100) : Math.max(player.baseX - 50, ballOwner.x + 100);
            targetY = ballOwner.y * 0.5 + 350 * 0.5;
        }
        
        return { x: targetX, y: targetY };
    }

    getMidfieldCoverPosition(player, ball) {
        let targetY = player.baseY;
        
        if (ball.owner && ball.owner.team !== this.side) {
            targetY = player.baseY + (ball.y - 350) * 0.2;
        }
        
        return { x: player.baseX, y: targetY };
    }

    getSeparationPosition(player, ballOwner) {
        const dx = player.x - ballOwner.x;
        const dy = player.y - ballOwner.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 100) {
            return { x: player.x + dx * 0.3, y: player.y + dy * 0.3 };
        } else if (dist > 250) {
            return { x: player.x - dx * 0.2, y: player.y - dy * 0.2 };
        }
        
        const direction = this.side === 'home' ? 1 : -1;
        const space = this.team.findSpace(ballOwner);
        return { x: player.x + direction * 50, y: space.y };
    }

    getAttackYPosition(player, ball) {
        const ballOwner = ball.owner;
        const role = player.role || 'ST';
        
        if (role === 'LW' || role === 'RW' || role === 'LM' || role === 'RM') {
            return player.baseY;
        }
        
        const space = this.team.findSpace(ball);
        return space.y;
    }

    getWallPosition(player, target) {
        const direction = this.side === 'home' ? 1 : -1;
        return { x: target.x - direction * 80, y: target.y };
    }
}