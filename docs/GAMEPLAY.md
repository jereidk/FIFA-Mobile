# 📖 Guía de Gameplay - FIFA Mobile Jereidk Edition

## 🎮 Controles

### Controles del Jugador

| Tecla | Acción | Descripción |
|-------|--------|-------------|
| **W / ↑** | Mover arriba | Mueve tu jugador hacia arriba en el campo |
| **S / ↓** | Mover abajo | Mueve tu jugador hacia abajo en el campo |
| **A / ←** | Mover izquierda | Mueve tu jugador hacia la izquierda |
| **D / →** | Mover derecha | Mueve tu jugador hacia la derecha |
| **ESPACIO** | Driblar | Ejecuta un regate para esquivar defensores |
| **Q** | Pasar | Pasa el balón al compañero más cercano |
| **E** | Disparar | Dispara a portería (solo con balón) |
| **Click Ratón** | Dirigir tiro | Al hacer clic, disparas hacia esa dirección |
| **ESC** | Pausar | Pausa/reanuda el partido |
| **R** | Reiniciar | Reinicia el partido completo |

## ⚽ Mecánicas del Juego

### Posesión del Balón
- Tu jugador recibe automáticamente el balón al inicio
- Cuando el balón está libre, cualquier jugador puede recuperarlo
- El indicador dorado muestra quién tiene el balón actualmente

### Sistema de Pases
- Presiona **Q** para pasar al compañero más avanzado
- El sistema selecciona automáticamente el mejor objetivo
- Los pases tienen diferentes velocidades según la distancia

### Sistema de Tiros
- Presiona **E** para un tiro con potencia automática
- **Click izquierdo** te permite apuntar manualmente
- La potencia del tiro depende de la distancia a la portería

### Dribles y Regates
- Presiona **ESPACIO** para ejecutar un regate
- El jugador gana un impulso de velocidad
- Útil para evitar tackles de los defensas

## 🧠 Inteligencia Artificial (IA)

### Comportamiento del CPU
- El equipo CPU tiene IA que:
  - Persigue el balón cuando está libre
  - Presiona al jugador con balón
  - Intenta robar el balón
  - Vuelve a su posición defensiva
  - Dispara cuando tiene oportunidad

### Dificultad
- La IA tiene velocidad de reacción moderada
- No siempre dispara, evalúa oportunidades
- Mantiene formación defensiva básica

## 📊 Interfaz de Usuario

### Marcador
- **Tu Equipo**: Lado izquierdo (rojo)
- **CPU**: Lado derecho (azul)
- Tiempo restante en el centro

### Indicadores
- **Barra de posesión**: Muestra qué equipo tiene más el balón
- **Texto de estado**: Muestra acciones actuales (PASE, TIRO, etc.)
- **Indicador de objetivo**: Línea punteada hacia portería

## 🎯 Estrategias

### Ataque
1. Avanza con el balón hacia la portería rival
2. Usa dribles para esquivar defensas
3. Pasa a compañeros más avanzados cuando estés presionado
4. Dispara cuando estés dentro del área

### Defensa
1. Deja que la IA persiga el balón
2. Tu portero se reposiciona automáticamente
3. El balón libre será capturado por el equipo más cercano

### Contraataque
1. Cuando recuperes el balón, avanza rápidamente
2. Usa la velocidad del dribble
3. Busca disparo antes de que los defensas se reorganicen

## 🔧 Personalización

### Modificar Velocidades
```javascript
// En js/player.js
this.speed = 4; // Velocidad base del jugador

// En js/ai.js - Configuración de IA
const AI_CONFIG = {
    reactionSpeed: 0.05,  // Velocidad de reacción CPU
    maxSpeed: 3,          // Velocidad máxima CPU
    shootChance: 0.7      // Probabilidad de tiro (0-1)
};
```

### Cambiar Colores de Equipos
```javascript
// En js/team.js
const TEAM_COLORS = {
    home: { primary: '#e63946', secondary: '#ffffff' },
    away: { primary: '#457b9d', secondary: '#a8dadc' }
};
```

## 🐛 Solución de Problemas

### El juego no carga
- Verifica que todos los archivos JS estén en la carpeta `/js`
- Asegúrate de que los paths en `index.html` sean correctos
- Abre la consola del navegador (F12) para ver errores

### El balón no responde
- Verifica que `game.js` esté cargado correctamente
- Comprueba que no haya errores de JavaScript en la consola

### La IA no funciona
- Verifica que `ai.js` esté incluido en `index.html`
- Revisa la configuración en `js/ai.js`

## 🚀 Optimización

### Mejoras de Rendimiento
- El juego usa `requestAnimationFrame` para 60 FPS
- Las colisiones están optimizadas para 22 jugadores
- El canvas tiene tamaño fijo para mejor rendimiento

### Dispositivos Soportados
- Escritorio: Chrome, Firefox, Edge, Safari
- Móvil: Responsive, táctil básico soportado
- Tableta: Funciona correctamente con pantalla más grande

---

**¡Disfruta jugando FIFA Mobile!** ⚽