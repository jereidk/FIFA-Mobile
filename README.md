# ⚽ FIFA Mobile - Jereidk Edition

Un juego de fútbol 2D jugable con mecánicas completas de partido.

![Game Banner](assets/banner.png)

## 🎮 Características del Juego

### Mecánicas de Juego
- **Controles intuitivos**: Movimiento fluido con WASD o flechas
- **Sistema de pases**: Presiona Q para pasar al compañero más cercano
- **Tiros potentes**: Presiona E para disparar a portería
- **Regates**: Espacia para driblar y engañar al defensa

### Física del Balón
- Movimiento realista con fricción
- Rebotes en bandas y corners
- Intercepción de balones

### IA del Contrario
- Marca al jugador con el balón
- Presión defensiva inteligente
- Intentos de robo de balón

### Gráficos y Estilo
- Estadio 2D con vista cenital
- Jugadores diferenciados por equipos (rojo/azul)
- Porterías animadas
- Indicadores de dirección y potencia

## 🚀 Cómo Jugar

### Controles
| Tecla | Acción |
|-------|--------|
| WASD / Flechas | Mover jugador |
| ESPACIO | Driblar/Regate |
| Q | Pasar balón |
| E | Disparar/Tiro |
| R | Resetear partido |
| ESC | Pausar/Reanudar |

### Objetivo
- Anota más goles que el equipo contrario en 3 minutos
- Controla tu equipo y lleva el balón a la portería rival

## 🛠️ Instalación

### Opción 1: Jugar en línea (GitHub Pages)
Accede a: `https://jereidk.github.io/FIFA-Mobile/`

### Opción 2: Ejecutar localmente
```bash
# Clonar el repositorio
git clone https://github.com/jereidk/FIFA-Mobile.git

# Abrir index.html en el navegador
# O usar un servidor local
python3 -m http.server 8000
# Luego visitar http://localhost:8000
```

## 📁 Estructura del Proyecto

```
FIFA-Mobile/
├── index.html          # Página principal del juego
├── css/
│   └── style.css       # Estilos del juego
├── js/
│   ├── game.js         # Lógica principal del juego
│   ├── player.js       # Clase jugador
│   ├── ball.js         # Clase balón
│   ├── team.js         # Clase equipo
│   └── ai.js           # Inteligencia artificial
├── assets/
│   ├── sounds/         # Efectos de sonido
│   └── images/         # Sprites y gráficos
├── docs/
│   └── GAMEPLAY.md     # Documentación detallada
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions para Pages
└── README.md
```

## 🎯 Modos de Juego

### Partido Rápido
- 1vs1 local en la misma computadora
- 3 minutos de partido
- Gana quien anote más goles

## 🔧 Desarrollo

### Tecnologías
- **HTML5 Canvas**: Renderizado del juego
- **JavaScript ES6+**: Lógica del juego
- **CSS3**: Estilos y animaciones
- **GitHub Pages**: Hosting gratuito
- **GitHub Actions**: CI/CD automático

### Compilar y Probar
```bash
# No requiere compilación - es JavaScript puro
# Solo abre index.html en tu navegador

# Para desarrollo con auto-refresh
npx serve .
```

## 📊 Estadísticas

- Resolución: 1200x700px
- FPS: 60 (requestAnimationFrame)
- Jugadores: 22 (11 por equipo)
- Duración partido: 180 segundos

## 🎨 Personalización

### Cambiar equipos
Edita los colores en `js/team.js`:
```javascript
const TEAM_COLORS = {
    home: { primary: '#E63946', secondary: '#FFFFFF' },
    away: { primary: '#1D3557', secondary: '#A8DADC' }
};
```

### Modificar dificultad IA
Ajusta los parámetros en `js/ai.js`:
```javascript
const AI_CONFIG = {
    reactionSpeed: 0.05,
    maxSpeed: 3,
    shootThreshold: 0.7
};
```

## 📝 Licencia

MIT License - Libre para usar y modificar.

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcion`)
3. Commit tus cambios (`git commit -m 'Agregar nueva función'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

---

**Desarrollado con ❤️ para los amantes del fútbol**

*Este juego fue creado inspirándose en las mecánicas clásicas de FIFA Mobile*