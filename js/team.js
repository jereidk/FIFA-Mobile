/**
 * FIFA Mobile - Team Class (Tactical System)
 * Maneja un equipo de jugadores con formaciones y roles tácticos
 */

class Team {
    constructor(side, isPlayerControlled = false) {
        this.side = side; // 'home' o 'away'
        this.isPlayerControlled = isPlayerControlled;
        this.players = [];
        this.score = 0;
        
        // Configuración de colores
        this.updateColors();
        
        // Sistema táctico
        this.formationName = '4-4-2';
        this.formation = this.getFormationByName(this.formationName);
        this.tacticalState = 'defensive'; // defensive, balanced, attacking
        this.pressingIntensity = 0.5;
        this.lineHeight = 0.5; // Altura de la línea defensiva
        
        // Crear jugadores con roles
        this.createPlayers();
        
        // Jugador controlado actualmente
        this.controlledPlayer = null;
        
        // Sistema de marca
        this.markingAssignments = new Map();
    }

    updateColors() {
        if (this.side === 'home') {
            this.primaryColor = '#e63946';
            this.secondaryColor = '#ffffff';
        } else {
            this.primaryColor = '#457b9d';
            this.secondaryColor = '#a8dadc';
        }
    }

    // Formaciones disponibles
    getFormationByName(name) {
        const formations = {
            '4-4-2': {
                positions: [
                    { x: 0.05, y: 0.5, role: 'GK', isGoalkeeper: true },
                    { x: 0.12, y: 0.15, role: 'LB' },
                    { x: 0.12, y: 0.38, role: 'CB' },
                    { x: 0.12, y: 0.62, role: 'CB' },
                    { x: 0.12, y: 0.85, role: 'RB' },
                    { x: 0.30, y: 0.15, role: 'LM' },
                    { x: 0.30, y: 0.38, role: 'CM' },
                    { x: 0.30, y: 0.62, role: 'CM' },
                    { x: 0.30, y: 0.85, role: 'RM' },
                    { x: 0.50, y: 0.35, role: 'ST' },
                    { x: 0.50, y: 0.65, role: 'ST' }
                ],
                defensiveLine: 0.15,
                midfieldLine: 0.35
            },
            '4-3-3': {
                positions: [
                    { x: 0.05, y: 0.5, role: 'GK', isGoalkeeper: true },
                    { x: 0.12, y: 0.15, role: 'LB' },
                    { x: 0.12, y: 0.38, role: 'CB' },
                    { x: 0.12, y: 0.62, role: 'CB' },
                    { x: 0.12, y: 0.85, role: 'RB' },
                    { x: 0.30, y: 0.30, role: 'CM' },
                    { x: 0.30, y: 0.50, role: 'CDM' },
                    { x: 0.30, y: 0.70, role: 'CM' },
                    { x: 0.50, y: 0.20, role: 'LW' },
                    { x: 0.50, y: 0.50, role: 'ST' },
                    { x: 0.50, y: 0.80, role: 'RW' }
                ],
                defensiveLine: 0.15,
                midfieldLine: 0.35
            },
            '4-2-3-1': {
                positions: [
                    { x: 0.05, y: 0.5, role: 'GK', isGoalkeeper: true },
                    { x: 0.12, y: 0.15, role: 'LB' },
                    { x: 0.12, y: 0.38, role: 'CB' },
                    { x: 0.12, y: 0.62, role: 'CB' },
                    { x: 0.12, y: 0.85, role: 'RB' },
                    { x: 0.28, y: 0.35, role: 'CDM' },
                    { x: 0.28, y: 0.65, role: 'CDM' },
                    { x: 0.42, y: 0.20, role: 'LW' },
                    { x: 0.42, y: 0.50, role: 'CAM' },
                    { x: 0.42, y: 0.80, role: 'RW' },
                    { x: 0.55, y: 0.50, role: 'ST' }
                ],
                defensiveLine: 0.15,
                midfieldLine: 0.30
            },
            '3-5-2': {
                positions: [
                    { x: 0.05, y: 0.5, role: 'GK', isGoalkeeper: true },
                    { x: 0.10, y: 0.25, role: 'CB' },
                    { x: 0.10, y: 0.50, role: 'CB' },
                    { x: 0.10, y: 0.75, role: 'CB' },
                    { x: 0.25, y: 0.12, role: 'LWB' },
                    { x: 0.28, y: 0.35, role: 'CM' },
                    { x: 0.28, y: 0.50, role: 'CDM' },
                    { x: 0.28, y: 0.65, role: 'CM' },
                    { x: 0.25, y: 0.88, role: 'RWB' },
                    { x: 0.48, y: 0.35, role: 'ST' },
                    { x: 0.48, y: 0.65, role: 'ST' }
                ],
                defensiveLine: 0.12,
                midfieldLine: 0.28
            }
        };
        return formations[name] || formations['4-4-2'];
    }

    createPlayers() {
        const fieldWidth = 1200;
        const fieldHeight = 700;
        const direction = this.side === 'home' ? 1 : -1;
        
        this.formation.positions.forEach((pos, index) => {
            // Escalar posiciones al tamaño del campo
            let x = pos.x * fieldWidth;
            let y = pos.y * fieldHeight;
            
            // Invertir para equipo away
            if (this.side === 'away') {
                x = fieldWidth - x;
                y = fieldHeight - y;
            }
            
            const player = new Player(x, y, this.side, index + 1, pos.isGoalkeeper || false);
            player.direction = direction;
            player.role = pos.role;
            player.baseX = x;
            player.baseY = y;
            
            // Asignar atributos según rol
            this.assignRoleAttributes(player);
            
            this.players.push(player);
        });
        
        // Asignar jugador controlado si es el equipo del jugador
        if (this.isPlayerControlled && this.players.length > 2) {
            // Buscar un mediocampista o delantero
            const attackers = this.players.filter(p => ['ST', 'LW', 'RW', 'CAM'].includes(p.role));
            this.controlledPlayer = attackers.length > 0 ? attackers[0] : this.players[8];
        }
    }
    
    assignRoleAttributes(player) {
        // Atributos base según rol
        const roleAttributes = {
            'GK': { speed: 2.0, acceleration: 0.2, aggression: 0.1 },
            'CB': { speed: 2.8, acceleration: 0.25, aggression: 0.6, stamina: 90 },
            'LB': { speed: 3.5, acceleration: 0.3, aggression: 0.5, stamina: 95 },
            'RB': { speed: 3.5, acceleration: 0.3, aggression: 0.5, stamina: 95 },
            'CDM': { speed: 3.2, acceleration: 0.28, aggression: 0.5, positioning: 0.8 },
            'CM': { speed: 3.5, acceleration: 0.32, aggression: 0.4, positioning: 0.85 },
            'CAM': { speed: 3.6, acceleration: 0.35, aggression: 0.3, positioning: 0.9 },
            'LM': { speed: 3.6, acceleration: 0.33, aggression: 0.35, positioning: 0.8 },
            'RM': { speed: 3.6, acceleration: 0.33, aggression: 0.35, positioning: 0.8 },
            'LW': { speed: 3.8, acceleration: 0.38, aggression: 0.25, positioning: 0.75 },
            'RW': { speed: 3.8, acceleration: 0.38, aggression: 0.25, positioning: 0.75 },
            'LWB': { speed: 3.6, acceleration: 0.32, aggression: 0.45, positioning: 0.78 },
            'RWB': { speed: 3.6, acceleration: 0.32, aggression: 0.45, positioning: 0.78 },
            'ST': { speed: 3.7, acceleration: 0.36, aggression: 0.3, positioning: 0.85, finishing: 0.9 }
        };
        
        const attrs = roleAttributes[player.role] || roleAttributes['CM'];
        Object.assign(player, attrs);
    }

    // Obtener posición base según formación
    getBasePosition(player) {
        const direction = this.side === 'home' ? 1 : -1;
        const lineHeight = this.formation.defensiveLine;
        const midHeight = this.formation.midfieldLine;
        
        // Ajustar posiciones según estado táctico
        let x = player.baseX;
        let y = player.baseY;
        
        // Mover línea defensiva según presión
        if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(player.role)) {
            y = player.baseY + (this.tacticalState === 'attacking' ? -30 : this.tacticalState === 'defensive' ? 20 : 0);
        }
        
        // Centrocampistas mantienen posición
        if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(player.role)) {
            y = player.baseY + (this.tacticalState === 'attacking' ? -20 : this.tacticalState === 'defensive' ? 30 : 0);
        }
        
        return { x, y };
    }
    
    // Calcular posición de cobertura defensiva
    getCoverPosition(player, ballOwner) {
        const dx = ballOwner.x - player.baseX;
        const dy = ballOwner.y - player.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Posición de cobertura: ligeramente detrás y hacia un lado
        const coverDist = Math.min(80, dist * 0.4);
        const angle = Math.atan2(dy, dx) + Math.PI * 0.7; // 126 grados de décalage
        
        return {
            x: player.baseX + Math.cos(angle) * coverDist,
            y: player.baseY + Math.sin(angle) * coverDist * 0.6
        };
    }
    
    // Asignar marca a un oponente
    assignMark(enemyPlayer) {
        // Limpiar marca anterior
        this.markingAssignments.forEach((assignedPlayer, enemy) => {
            if (enemy === enemyPlayer) {
                this.markingAssignments.delete(enemy);
            }
        });
        
        // Encontrar jugador más apropiado para marcar
        const defenders = this.players.filter(p => !p.isGoalkeeper && p.role !== 'ST' && p.role !== 'LW' && p.role !== 'RW');
        if (defenders.length > 0) {
            const closest = defenders.reduce((a, b) => 
                a.distanceTo(enemyPlayer) < b.distanceTo(enemyPlayer) ? a : b
            );
            this.markingAssignments.set(enemyPlayer, closest);
            return closest;
        }
        return null;
    }

    update(ball, keys) {
        this.players.forEach(player => {
            if (this.isPlayerControlled && player === this.controlledPlayer) {
                player.update(ball, keys);
            } else {
                player.update(ball, {});
            }
        });
    }

    draw(ctx, time) {
        this.players.forEach(player => {
            player.draw(ctx, time);
        });
    }

    getClosestToBall(ball) {
        let closest = null;
        let minDistance = Infinity;
        
        this.players.forEach(player => {
            const distance = player.distanceTo(ball);
            if (distance < minDistance) {
                minDistance = distance;
                closest = player;
            }
        });
        
        return closest;
    }

    getClosestToPosition(x, y) {
        let closest = null;
        let minDistance = Infinity;
        
        this.players.forEach(player => {
            const distance = Math.sqrt(Math.pow(player.x - x, 2) + Math.pow(player.y - y, 2));
            if (distance < minDistance) {
                minDistance = distance;
                closest = player;
            }
        });
        
        return closest;
    }

    getGoalkeeper() {
        return this.players.find(p => p.isGoalkeeper);
    }

    // Encontrar compañero más cercano
    findNearestTeammate(player) {
        let closest = null;
        let minDistance = Infinity;
        
        this.players.forEach(p => {
            if (p !== player && !p.isGoalkeeper) {
                const distance = player.distanceTo(p);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = p;
                }
            }
        });
        
        return closest;
    }
    
    // Encontrar jugador para pared (uno que viene de atrás)
    findWallPassTarget(player, ball) {
        const direction = this.side === 'home' ? 1 : -1;
        const teammates = this.players.filter(p => 
            p !== player && 
            !p.isGoalkeeper &&
            ['CM', 'CAM', 'CDM', 'LM', 'RM'].includes(p.role)
        );
        
        // Buscar compañero que esté detrás o al lado, mirando hacia adelante
        let best = null;
        let bestScore = -Infinity;
        
        teammates.forEach(p => {
            const dx = p.x - player.x;
            const dy = p.y - player.y;
            
            // Debe estar relativamente cerca
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150 || dist > 350) return;
            
            // Debe estar detrás o al lado (no muy adelante)
            const behindScore = (this.side === 'home' ? p.x - player.x : player.x - p.x);
            if (behindScore < -50) return; // Demasiado atrás
            
            // Debe tener espacio libre hacia adelante
            const forwardSpace = p.x * direction;
            
            const score = forwardSpace + behindScore * 0.5 - dist * 0.3;
            
            if (score > bestScore) {
                bestScore = score;
                best = p;
            }
        });
        
        return best;
    }
    
    // Encontrar el mejor pase según situación
    findBestPassTarget(player, ball, situation = 'build') {
        const direction = this.side === 'home' ? 1 : -1;
        const teammates = this.players.filter(p => p !== player && !p.isGoalkeeper);
        
        let best = null;
        let bestScore = -Infinity;
        
        teammates.forEach(p => {
            const distance = player.distanceTo(p);
            const dx = p.x - player.x;
            const dy = p.y - player.y;
            
            // Distancia ideal para pase
            if (distance < 30 || distance > 400) return;
            
            let score = 0;
            
            switch(situation) {
                case 'attack':
                    // Priorizar pases hacia adelante
                    score = p.x * direction * 2;
                    // Bonus por estar en área
                    if (p.x * direction > 900) score += 200;
                    // Penalti por distancia
                    score -= distance * 0.5;
                    break;
                    
                case 'counter':
                    // Pases verticales rápidos
                    score = p.x * direction * 3;
                    // Pases cortos preferidos
                    score -= distance * 0.3;
                    break;
                    
                case 'build':
                default:
                    // Equilibrio entre avance y seguridad
                    score = p.x * direction;
                    // Seguridad: no pases muy largos
                    score -= distance * 0.7;
                    // Pases laterales también valen
                    score += 50;
                    break;
            }
            
            // Penalti si el receptor está marcado de cerca
            const markingDistance = this.getMarkingDistance(p);
            score -= markingDistance < 40 ? 50 : 0;
            
            if (score > bestScore) {
                bestScore = score;
                best = p;
            }
        });
        
        return best;
    }
    
    // Distancia al marcador más cercano
    getMarkingDistance(player) {
        // Esta información vendría del otro equipo
        // Por ahora, calcular distancia a jugadores propios (para IA)
        return 100; // Placeholder
    }
    
    // Encontrar espacios libres
    findSpace(ball) {
        const fieldWidth = 1200;
        const fieldHeight = 700;
        const direction = this.side === 'home' ? 1 : -1;
        
        // Buscar zona con menos jugadores
        let bestX = this.side === 'home' ? 600 : 600;
        let bestY = 350;
        let minPlayers = Infinity;
        
        // Dividir campo en zonas
        for (let x = 300; x < 900; x += 100) {
            for (let y = 100; y < 600; y += 100) {
                const adjustedX = this.side === 'home' ? x : fieldWidth - x;
                
                // Contar jugadores propios cercanos
                let nearbyPlayers = 0;
                this.players.forEach(p => {
                    const dist = Math.sqrt(Math.pow(p.x - adjustedX, 2) + Math.pow(p.y - y, 2));
                    if (dist < 100) nearbyPlayers++;
                });
                
                // Bonus por estar más adelante
                const advanceBonus = adjustedX * direction;
                
                const score = advanceBonus - nearbyPlayers * 50;
                
                if (score > minPlayers * direction - 100) {
                    minPlayers = nearbyPlayers;
                    bestX = adjustedX;
                    bestY = y;
                }
            }
        }
        
        return { x: bestX, y: bestY };
    }

    resetPositions() {
        this.formation.positions.forEach((pos, index) => {
            const player = this.players[index];
            player.x = player.baseX;
            player.y = player.baseY;
            player.vx = 0;
            player.vy = 0;
            player.hasBall = false;
        });
    }

    incrementScore() {
        this.score++;
    }

    resetScore() {
        this.score = 0;
    }

    hasPossession(ball) {
        return ball.owner && ball.owner.team === this.side;
    }
    
    // Actualizar estado táctico basado en situación
    updateTacticalState(ball) {
        const direction = this.side === 'home' ? 1 : -1;
        const ballX = ball.x * direction;
        
        if (ball.owner && ball.owner.team === this.side) {
            // Tenemos el balón - atacar
            if (ballX > 800) {
                this.tacticalState = 'attacking';
                this.pressingIntensity = 0.3;
            } else {
                this.tacticalState = 'balanced';
                this.pressingIntensity = 0.5;
            }
        } else if (ball.owner) {
            // rivals tienen balón - defender
            if (ballX > 800) {
                this.tacticalState = 'defensive';
                this.pressingIntensity = 0.8;
            } else if (ballX > 400) {
                this.tacticalState = 'balanced';
                this.pressingIntensity = 0.6;
            } else {
                this.tacticalState = 'balanced';
                this.pressingIntensity = 0.4;
            }
        } else {
            // Balón libre
            this.tacticalState = 'balanced';
            this.pressingIntensity = 0.5;
        }
    }
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Team;
}