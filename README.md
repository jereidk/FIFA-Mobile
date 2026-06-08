# ⚽ FIFA Mobile - Jereidk Edition

Un juego de fútbol 2D jugable con mecánicas realistas de partido, IA inteligente y soporte para dispositivos móviles.

![FIFA Mobile](https://img.shields.io/badge/Version-2.0.0-blue)
![Platform](https://img.shields.io/badge/Platform-HTML5-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎮 Características del Juego

### 🎯 Mecánicas Realistas
- **Física del balón avanzada**: Rebotes, efecto Magnus, altura y sombra
- **Sistema de stamina**: Los jugadores se cansan al sprintar
- **Regates y dribles**: Movimientos rápidos para esquivar defensas
- **Pases precisos**: Sistema de pase con predicción de posición
- **Tiros potentes**: Control de potencia y dirección

### 🤖 Inteligencia Artificial
- **IA adaptativa**: Múltiples estados (defensa, ataque, presión, marca)
- **3 niveles de dificultad**: Fácil, Normal, Difícil
- **Comportamiento realista**: Los jugadores mantienen formación
- **Toma de decisiones**: Evalúa tiros, pases y movimientos

### 📱 Soporte Móvil
- **Joystick virtual**: Controles táctiles intuitivos
- **Botones de acción**: Tiro, pase y regate con un toque
- **Responsive design**: Funciona en cualquier tamaño de pantalla

### 🔊 Sistema de Audio
- **Sonidos realistas**: Patadas, goles, silbatos, foule
- **Efectos de multitudes**: Ambientación de estadio
- **Audio generado proceduralmente**: Sin necesidad de archivos externos

### 📊 Estadísticas del Partido
- Goles, tiros, faltas, posesión
- Indicador de tiempo y半场
- HUD completo con toda la información

## 🚀 Cómo Jugar

### Controles - PC
| Tecla | Acción |
|-------|--------|
| **WASD** / **Flechas** | Mover jugador |
| **ESPACIO** | Driblar / Sprint |
| **SHIFT** | Correr más rápido |
| **Q** | Pasar al compañero |
| **W** | Golpe alto (lob) |
| **E** | Disparar a portería |
| **CLICK** | Dirigir pase/tiro |
| **ESC** | Pausar juego |
| **R** | Reiniciar partido |

### Controles - Móvil
| Control | Acción |
|---------|--------|
| **Joystick** | Mover jugador |
| **⚽ Botón** | Disparar |
| **↗ Botón** | Pasar |
| **⚡ Botón** | Driblar |

## 🎯 Modos de Juego

### ⚡ Partido Rápido (3 minutos)
- Ideal para partidas rápidas

### 🏆 Partido Completo (6 minutos)
- Dos tiempos de 3 minutos con descanso

### 🎮 Práctica
- Sin límite de tiempo para practicar

## 📁 Estructura del Proyecto

```
FIFA-Mobile/
├── index.html              # Página principal
├── css/
│   └── style.css           # Estilos y animaciones
├── js/
│   ├── game.js             # Controlador principal
│   ├── player.js           # Clase jugador
│   ├── ball.js             # Física del balón
│   ├── team.js             # Sistema de equipos
│   ├── ai.js               # IA del CPU
│   ├── audio.js            # Sistema de sonidos
│   └── android-controls.js # Controles táctiles
├── docs/
│   └── GAMEPLAY.md         # Guía detallada
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Pages auto-deploy
└── README.md
```

## 🛠️ Instalación

### Jugar en línea
Visita: **https://jereidk.github.io/FIFA-Mobile/**

### Ejecutar localmente
```bash
# Clonar repositorio
git clone https://github.com/jereidk/FIFA-Mobile.git

# Abrir en navegador
# O usar servidor local
cd FIFA-Mobile
python3 -m http.server 8000
# Visit http://localhost:8000
```

## 🔧 Tecnologías

- **HTML5 Canvas**: Renderizado 2D a 60 FPS
- **JavaScript ES6+**: Código modular y optimizado
- **CSS3**: Animaciones fluidas y diseño responsive
- **Web Audio API**: Sonidos procedurales
- **GitHub Pages**: Hosting gratuito con CI/CD

## 📊 Especificaciones

| Característica | Valor |
|---------------|-------|
| Resolución | 1200x700px |
| FPS | 60 |
| Jugadores | 22 (11 por equipo) |
| Duración | 3-6 minutos |
| Plataformas | PC, Android, iOS |

## 🎨 Personalización

### Cambiar colores de equipos
Edita `js/player.js`:
```javascript
// Equipo local (rojo)
this.primaryColor = '#e63946';

// Equipo CPU (azul)
this.primaryColor = '#457b9d';
```

### Ajustar dificultad IA
Edita `js/ai.js`:
```javascript
this.gameMode = 'balanced'; // 'easy', 'balanced', 'hard'
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcion`)
3. Commit tus cambios
4. Push y crea Pull Request

## 📝 Licencia

MIT License - Libre para usar y modificar.

---

**⚽ Desarrollado con ❤️ para los amantes del fútbol**

*Inspirado en FIFA Mobile y eFootball*