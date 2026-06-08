/**
 * FIFA Mobile - Team Class
 * Maneja un equipo de jugadores y sus formaciones
 */

class Team {
    constructor(side, isPlayerControlled = false) {
        this.side = side; // 'home' o 'away'
        this.isPlayerControlled = isPlayerControlled;
        this.players = [];
        this.score = 0;
        
        // Configuración de colores
        this.updateColors();
        
        // Formación inicial
        this.formation = this.getFormation();
        
        // Crear jugadores
        this.createPlayers();
        
        // Jugador controlado actualmente
        this.controlledPlayer = null;
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

    getFormation() {
        // Formación 4-3-3
        return [
            { x: 0.05, y: 0.5, isGoalkeeper: true },  // Portero
            { x: 0.15, y: 0.2 },  // Defensa izquierdo
            { x: 0.15, y: 0.4 },
            { x: 0.15, y: 0.6 },
            { x: 0.15, y: 0.8 },  // Defensa derecho
            { x: 0.35, y: 0.3 },  // Centrocampista izquierdo
            { x: 0.35, y: 0.5 },  // Centrocampista central
            { x: 0.35, y: 0.7 },  // Centrocampista derecho
            { x: 0.55, y: 0.25 }, // Delantero izquierdo
            { x: 0.55, y: 0.5 },  // Delantero centro
            { x: 0.55, y: 0.75 }  // Delantero derecho
        ];
    }

    createPlayers() {
        const fieldWidth = 1200;
        const fieldHeight = 700;
        const direction = this.side === 'home' ? 1 : -1;
        
        this.formation.forEach((pos, index) => {
            // Escalar posiciones al tamaño del campo
            const x = pos.x * fieldWidth;
            const y = pos.y * fieldHeight;
            
            const player = new Player(x, y, this.side, index + 1, pos.isGoalkeeper || false);
            player.direction = direction;
            
            this.players.push(player);
        });
        
        // Asignar jugador controlado si es el equipo del jugador
        if (this.isPlayerControlled && this.players.length > 2) {
            this.controlledPlayer = this.players[9]; // Delantero centro
        }
    }

    update(ball, keys) {
        // Actualizar todos los jugadores
        this.players.forEach(player => {
            // Solo el jugador controlado responde a input
            if (this.isPlayerControlled && player === this.controlledPlayer) {
                player.update(ball, keys);
            } else {
                // Otros jugadores tienen comportamiento idle
                player.update(ball, {});
            }
        });
    }

    draw(ctx, time) {
        this.players.forEach(player => {
            player.draw(ctx, time);
        });
    }

    // Encontrar el jugador más cercano al balón
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

    // Encontrar el jugador más cercano a una posición
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

    // Encontrar el portero
    getGoalkeeper() {
        return this.players.find(p => p.isGoalkeeper);
    }

    // Encontrar el compañero más cercano al jugador actual
    findNearest teammate(player) {
        let closest = null;
        let minDistance = Infinity;
        
        this.players.forEach(p => {
            if (p !== player) {
                const distance = player.distanceTo(p);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = p;
                }
            }
        });
        
        return closest;
    }

    // Encontrar el mejor compañero para pasar (más avanzado)
    findBestPassTarget(player) {
        const teammates = this.players.filter(p => p !== player && !p.isGoalkeeper);
        
        // Preferir compañeros más cerca del área rival
        const direction = this.side === 'home' ? 1 : -1;
        
        let best = null;
        let bestScore = -Infinity;
        
        teammates.forEach(p => {
            // Score basado en avance y distancia
            const advanceScore = p.x * direction;
            const distance = player.distanceTo(p);
            const score = advanceScore - distance * 0.5;
            
            if (score > bestScore) {
                bestScore = score;
                best = p;
            }
        });
        
        return best;
    }

    // Resetear posiciones al inicio
    resetPositions() {
        this.formation.forEach((pos, index) => {
            const player = this.players[index];
            player.x = pos.x * 1200;
            player.y = pos.y * 700;
            player.vx = 0;
            player.vy = 0;
            player.hasBall = false;
        });
    }

    // Incrementar puntuación
    incrementScore() {
        this.score++;
    }

    // Resetear puntuación
    resetScore() {
        this.score = 0;
    }

    // Verificar si el balón está en posesión
    hasPossession(ball) {
        return ball.owner && ball.owner.team === this.side;
    }
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Team;
}