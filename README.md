# RTS-01: Web-Based Real-Time Strategy Game

A modern web-based real-time strategy game inspired by the classic Dune 2, built with HTML5, JavaScript, and WebGL for immersive desert warfare gameplay.

![Game Preview](https://via.placeholder.com/800x400/8B4513/FFFFFF?text=RTS-01+Desert+Warfare)

## 🎮 Game Overview

RTS-01 is a browser-based real-time strategy game that captures the essence of classic RTS gameplay from Dune 2. Players command one of three desert factions, harvesting the precious resource "Spice" while building bases, training armies, and engaging in tactical combat across procedurally generated desert landscapes.

### Core Gameplay Features

- **Resource Management**: Harvest Spice to fund your war machine
- **Base Construction**: Build and upgrade structures strategically
- **Unit Production**: Train diverse military units with unique abilities
- **Tactical Combat**: Command armies in real-time battles
- **Faction Warfare**: Choose from three distinct factions with unique technologies
- **Technology Research**: Unlock advanced units and structures
- **Multiplayer Support**: Battle against other players online

## 🏗️ Technology Stack

- **Frontend**: HTML5 Canvas/WebGL, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js with Express.js
- **Real-time Communication**: WebSockets (Socket.io)
- **Database**: MongoDB for player data and game states
- **Build Tools**: Webpack, Babel
- **Testing**: Jest for unit tests, Cypress for E2E testing

## 🛣️ Development Milestones

**Important Note**: Each milestone must end with a **running, demonstrable product** that showcases all completed milestone items. This ensures iterative development with tangible progress at each stage.

### Milestone 1: Core Game Engine 🎯
**Target: 3-4 weeks**

**Objectives:**
- Set up basic HTML5 Canvas rendering system
- Implement camera controls (pan, zoom)
- Create basic tile-based map system
- Add mouse/keyboard input handling
- Establish game loop and timing system

**Deliverables:**
- Functional game canvas with smooth 60 FPS rendering
- Interactive camera that can navigate a basic desert map
- Input system for mouse clicks and keyboard shortcuts
- Basic game state management

**Technical Requirements:**
- Canvas 2D rendering with smooth interpolation
- Viewport culling for performance optimization
- Event-driven input system
- Game state architecture (Model-View-Controller pattern)

**Demo Product:**
A playable web application where users can navigate around a desert map using mouse and keyboard controls, demonstrating smooth camera movement and responsive input handling.

---

### Milestone 2: Resource Management System 💎
**Target: 2-3 weeks**

**Objectives:**
- Implement Spice resource spawning on map
- Create basic harvester unit
- Add resource collection and storage mechanics
- Build simple economy simulation

**Deliverables:**
- Spice deposits randomly distributed across the map
- Functional harvester that can collect and transport Spice
- Resource counter and storage system
- Basic pathfinding for harvester units

**Technical Requirements:**
- A* pathfinding algorithm implementation
- Resource node management system
- Unit state machines (idle, moving, harvesting, returning)
- Collision detection for resource collection

**Demo Product:**
A functional harvesting simulation where players can click to spawn harvesters that automatically navigate to Spice deposits, collect resources, and return to base while displaying real-time resource counters.

---

### Milestone 3: Base Building Foundation 🏭
**Target: 3-4 weeks**

**Objectives:**
- Create construction system for basic structures
- Implement building placement and validation
- Add structure health and destruction mechanics
- Design basic UI for construction management

**Deliverables:**
- Construction Yard (main base structure)
- Spice Refinery for resource processing
- Basic defensive structures (Gun Turrets)
- Construction interface with build queues

**Technical Requirements:**
- Grid-based building placement system
- Building prerequisite and dependency management
- Construction progress tracking
- UI framework for building menus and information panels

**Demo Product:**
A base-building game where players can construct and manage buildings using Spice resources, with visual construction progress, building health indicators, and a responsive UI for managing their growing desert outpost.

---

### Milestone 4: Unit Production & Movement 🚗
**Target: 4-5 weeks**

**Objectives:**
- Implement unit production facilities
- Create diverse unit types with unique attributes
- Add advanced pathfinding and group movement
- Design unit selection and command interface

**Deliverables:**
- Barracks for infantry production
- Factory for vehicle production
- Multiple unit types: Infantry, Light Vehicles, Tanks
- Formation movement and group selection
- Waypoint system for complex orders

**Technical Requirements:**
- Production queue management system
- Unit attribute system (health, speed, damage, armor)
- Flow field pathfinding for group movement
- Selection rectangle and multi-unit commands
- Order queue system for complex unit behaviors

**Demo Product:**
A military command simulator where players can build production facilities, train various unit types, and command armies with group selection, formation movement, and waypoint-based orders across the battlefield.

---

### Milestone 5: Combat System ⚔️
**Target: 3-4 weeks**

**Objectives:**
- Implement real-time combat mechanics
- Add weapon systems and projectile physics
- Create damage calculation and unit destruction
- Design visual effects for combat

**Deliverables:**
- Line-of-sight and attack range systems
- Projectile-based and instant-hit weapons
- Armor/damage type effectiveness matrix
- Combat animations and particle effects
- Unit veterancy and experience system

**Technical Requirements:**
- Efficient collision detection for projectiles
- Damage calculation engine with armor types
- Visual effects system (explosions, muzzle flashes, impacts)
- Combat state management
- Performance optimization for large battles

**Demo Product:**
A tactical combat game featuring real-time battles between opposing forces, complete with projectile weapons, visual combat effects, unit destruction, and strategic combat mechanics that showcase the full warfare experience.

---

### Milestone 6: AI & Multiple Factions 🤖
**Target: 5-6 weeks**

**Objectives:**
- Implement computer-controlled opponents
- Create three distinct factions with unique units
- Add faction-specific technologies and buildings
- Design AI decision-making systems

**Deliverables:**
- House Atreides: Balanced faction with strong defense
- House Harkonnen: Aggressive faction with heavy units
- House Ordos: Technology-focused faction with stealth units
- AI players with different difficulty levels
- Faction-specific unit rosters and abilities

**Technical Requirements:**
- Finite State Machine AI for strategic decisions
- Behavior trees for unit AI
- Faction configuration system
- Technology tree implementation
- AI pathfinding optimization

**Demo Product:**
A complete single-player RTS experience where players can choose their faction (Atreides, Harkonnen, or Ordos) and battle against AI opponents with distinct strategies, featuring faction-unique units, technologies, and gameplay styles.

---

### Milestone 7: Advanced Features & Polish ✨
**Target: 4-5 weeks**

**Objectives:**
- Add multiplayer support with matchmaking
- Implement save/load game functionality
- Create advanced graphics and sound systems
- Add tutorial and campaign modes

**Deliverables:**
- Real-time multiplayer battles (2-4 players)
- Comprehensive tutorial system
- Single-player campaign with story missions
- Enhanced graphics with WebGL shaders
- Full sound design and music
- Player statistics and leaderboards

**Technical Requirements:**
- WebSocket-based multiplayer architecture
- Game state synchronization and lag compensation
- WebGL shader system for advanced graphics
- Audio management system
- Campaign scripting system
- Player profile and progression system

**Demo Product:**
The final, fully-featured RTS game with multiplayer battles, comprehensive tutorials, single-player campaigns, enhanced graphics with WebGL shaders, full audio design, and player progression systems - ready for public release.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser with WebGL support

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/josephshum/RTS-01.git
   cd RTS-01
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run lint         # Check code style
npm run format       # Format code with Prettier
```

## 📁 Project Structure

```
RTS-01/
├── src/
│   ├── client/          # Frontend game code
│   │   ├── engine/      # Core game engine
│   │   ├── entities/    # Game objects (units, buildings)
│   │   ├── systems/     # Game systems (rendering, input, AI)
│   │   ├── ui/          # User interface components
│   │   └── assets/      # Game assets (sprites, sounds)
│   ├── server/          # Backend server code
│   │   ├── api/         # REST API endpoints
│   │   ├── socket/      # WebSocket handlers
│   │   └── database/    # Database models and migrations
│   └── shared/          # Shared code between client/server
├── tests/               # Test files
├── docs/               # Documentation
├── webpack.config.js   # Build configuration
└── package.json        # Project dependencies
```

## 🎯 Current Status

- **Phase**: Planning and Architecture
- **Next Milestone**: Milestone 1 - Core Game Engine
- **Contributors**: josephshum

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style Guidelines
- Use ESLint configuration provided
- Follow conventional commit messages
- Write tests for new features
- Update documentation as needed

## 📈 Performance Goals

- **Frame Rate**: Maintain 60 FPS with 200+ units on screen
- **Network Latency**: Sub-100ms response time for multiplayer
- **Load Time**: Initial game load under 5 seconds
- **Memory Usage**: Stay under 256MB RAM usage
- **Browser Support**: Chrome 80+, Firefox 75+, Safari 13+

## 🎵 Art & Sound Direction

- **Visual Style**: Retro-futuristic desert warfare aesthetic
- **Color Palette**: Desert tans, deep blues, industrial grays
- **Unit Design**: Inspired by 90s RTS games with modern flair
- **Sound Design**: Industrial machinery, desert winds, explosive combat
- **Music**: Electronic/orchestral hybrid soundtrack

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Westwood Studios' Dune 2
- Built with modern web technologies
- Community feedback and contributions

---

**Ready to command the desert? The spice must flow! 🏜️** 