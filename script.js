if (typeof Phaser === 'undefined') {
    throw new Error("Phaser no está cargado. Asegúrate de incluir el script de Phaser antes de tu código.");
}

// Importaciones (Firebase ya configurado)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    limit 
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";


// Configuración de Firebase (reemplaza con tus credenciales)
const firebaseConfig = {
    apiKey: "AIzaSyD6bQnXrirhoJkGV4Mf18jMiFKSspp83_w",
    authDomain: "pesca-70456.firebaseapp.com",
    projectId: "pesca-70456",
    storageBucket: "pesca-70456.firebasestorage.app",
    messagingSenderId: "673843283879",
    appId: "1:673843283879:web:645083de0977d81f439882"
  };

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Variables globales del juego
let currentUser = null;
let gameInstance = null;
let gameScore = 0;
let gameTime = 60;
let timerInterval = null;
let fishes = [];
let fishingRod = null;
let bubbles = [];

// Elementos del DOM
const loginContainer = document.getElementById('login-container');
const gameContainer = document.getElementById('game-container');
const leaderboardContainer = document.getElementById('leaderboard-container');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const leaderboardList = document.getElementById('leaderboard');
const playerNameDisplay = document.getElementById('player-name');
const finalScoreDisplay = document.getElementById('final-score');

// Event Listeners
loginBtn.addEventListener('click', handleLogin);
registerBtn.addEventListener('click', handleRegister);
logoutBtn.addEventListener('click', handleLogout);
playAgainBtn.addEventListener('click', () => {
    leaderboardContainer.style.display = 'none';
    startGame();
});

// ================== FUNCIONES DE AUTENTICACIÓN ================== //

async function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        alert("Por favor completa ambos campos");
        return;
    }
    
    const email = `${username}@pescacolombiana-test.com`;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        
        // Actualizar última conexión
        await setDoc(doc(db, "users", currentUser.uid), {
            lastLogin: new Date()
        }, { merge: true });
        
        showGameScreen();
    } catch (error) {
        alert("Error al iniciar sesión: " + error.message);
    }
}

async function handleRegister() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (username.length < 4) {
        alert("El nombre de usuario debe tener al menos 4 caracteres");
        return;
    }
    
    if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return;
    }
    
    const email = `${username}@pescacolombiana-test.com`;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        
        await setDoc(doc(db, "users", currentUser.uid), {
            username: username,
            createdAt: new Date(),
            lastLogin: new Date(),
            totalScore: 0,
            bestScore: 0
        });
        
        showGameScreen();
    } catch (error) {
        alert("Error al registrar: " + error.message);
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        currentUser = null;
        
        // Limpiar completamente el juego
        if (gameInstance) {
            gameInstance.destroy();
            gameInstance = null;
        }
        clearInterval(timerInterval);
        
        // Reiniciar estado
        gameScore = 0;
        gameTime = 60;
        fishes = [];
        bubbles = [];
        fishingRod = null;
        
        // Mostrar pantalla de login
        loginContainer.style.display = 'block';
        gameContainer.style.display = 'none';
        leaderboardContainer.style.display = 'none';
        usernameInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        alert("Error al cerrar sesión: " + error.message);
    }
}

// ================== FUNCIONES DEL JUEGO ================== //

function showGameScreen() {
    loginContainer.style.display = 'none';
    leaderboardContainer.style.display = 'none';
    
    // Efecto de transición
    gameContainer.style.opacity = '0';
    gameContainer.style.display = 'block';
    
    setTimeout(() => {
        gameContainer.style.opacity = '1';
        startGame();
    }, 10);
}

function startGame() {
    // Limpiar el estado anterior
    if (gameInstance) {
        gameInstance.destroy();
        gameInstance = null;
    }
    
    // Reiniciar variables del juego
    gameScore = 0;
    gameTime = 60;
    fishes = [];
    bubbles = [];
    fishingRod = null;
    
    // Actualizar la UI
    scoreDisplay.textContent = gameScore;
    timeDisplay.textContent = gameTime;
    
    // Limpiar cualquier intervalo previo
    clearInterval(timerInterval);
    
    // Crear nueva instancia del juego
    const config = {
        type: Phaser.WEBGL,
        width: 800,
        height: 600,
        parent: 'game-canvas',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    
    gameInstance = new Phaser.Game(config);
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    gameTime--;
    timeDisplay.textContent = gameTime;
    
    if (gameTime <= 0) {
        clearInterval(timerInterval);
        endGame();
    }
}

async function endGame() {
    gameContainer.style.display = 'none';
    leaderboardContainer.style.display = 'block';
    finalScoreDisplay.textContent = gameScore;
    
    if (!currentUser) {
        alert("No se pudo guardar el puntaje porque no hay un usuario autenticado.");
        return;
    }

    try {
        // Guardar el puntaje
        await addDoc(collection(db, "scores"), {
            userId: currentUser.uid,
            username: usernameInput.value.trim(),
            score: gameScore,
            date: new Date()
        });
        
        // Actualizar estadísticas del usuario
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
            totalScore: gameScore, // Esto debería sumarse, no reemplazarse (lo ideal sería una transacción)
            bestScore: gameScore    // Esto debería compararse con el anterior bestScore
        }, { merge: true });
        
    } catch (error) {
        console.error("Error guardando puntaje: ", error);
    }
    
    await showLeaderboard();
}

async function showLeaderboard() {
    try {
        const q = query(
            collection(db, "scores"), 
            orderBy("score", "desc"), 
            limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        leaderboardList.innerHTML = '';
        
        let position = 1;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="position">${position}.</span>
                <span class="name">${data.username}</span>
                <span class="score">${data.score} pts</span>
            `;
            
            // Resaltar el puntaje del jugador actual
            if (currentUser && data.userId === currentUser.uid) {
                li.classList.add('current-player');
            }
            
            leaderboardList.appendChild(li);
            position++;
        });
    } catch (error) {
        console.error("Error cargando leaderboard: ", error);
    }
    playAgainBtn.addEventListener('click', () => {
        leaderboardContainer.style.display = 'none';
        gameContainer.style.display = 'block';
        
        // Pequeño retraso para asegurar que el DOM esté listo
        setTimeout(() => {
            startGame();
        }, 50);
    });
}
playAgainBtn.addEventListener('click', () => {
    leaderboardContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    
    // Mostrar loader
    const gameCanvas = document.getElementById('game-canvas');
    gameCanvas.innerHTML = '<div class="loader">Cargando juego...</div>';
    
    // Reiniciar después de breve pausa
    setTimeout(() => {
        gameCanvas.innerHTML = '';
        startGame();
    }, 100);
});

// ================== FUNCIONES DE PHASER ================== //

function preload() {
    // Fondo y elementos del juego
    this.load.image('background', 'assets/Background.jpeg');
    this.load.image('cana','assets/cana.png');
    
    // Peces (ejemplo con 4 tipos)
    this.load.image('fish1', 'assets/fish1.png');
    this.load.image('fish2', 'assets/fish2.png');
  }

function create() {
    // Fondo del río
    this.add.image(400, 300, 'background').setDisplaySize(800, 600);
    
    // Caña de pescar
    fishingRod = this.add.image(400, 100, 'cana').setScale(0.4).setDepth(20);

    this.input.on('pointermove', (pointer) => {
        fishingRod.x = pointer.x;
        fishingRod.y = pointer.y;
    });
    
    
    // Crear peces
    createFishes.call(this);
    
    // Configurar eventos de clic/touch
    this.input.on('pointerdown', (pointer) => {
        castFishingLine.call(this, pointer.x, pointer.y);
    });
}

function update() {
    // Mover peces
    fishes.forEach(fish => {
        fish.x += fish.getData('speed');
        
        // Rebotar en los bordes
        if (fish.x < 50 || fish.x > 750) {
            fish.setData('speed', fish.getData('speed') * -1);
            fish.flipX = !fish.flipX;
        }
    });
    
    // Seguir el puntero con la caña de pescar
    if (this.input.activePointer) {
        fishingRod.x = this.input.activePointer.x;
    }
}

function createFishes() {
    fishes = [];
    
    // Peces comunes
    for (let i = 0; i < 10; i++) {
        const fishType = `fish${Phaser.Math.Between(1, 4)}`;
        const fish = this.physics.add.sprite(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(200, 500),
            fishType
        ).setScale(0.15);
        
        fish.setData('speed', Phaser.Math.FloatBetween(0.5, 2));
        fish.setData('points', 10);
        fish.setInteractive();
        
        fish.on('pointerdown', () => {
            catchFish.call(this, fish);
        });
        
        fishes.push(fish);
    }
    
    // Pez raro (más puntos)
    const rareFish = this.physics.add.sprite(
        Phaser.Math.Between(100, 700),
        Phaser.Math.Between(200, 500),
        'rare-fish'
    ).setScale(0.2);
    
    rareFish.setData('speed', Phaser.Math.FloatBetween(1.5, 3));
    rareFish.setData('points', 50);
    rareFish.setInteractive();
    
    rareFish.on('pointerdown', () => {
        catchFish.call(this, rareFish);
    });
    
    fishes.push(rareFish);
}

function catchFish(fish) {
    // Añadir puntos
    const points = fish.getData('points');
    gameScore += points;
    scoreDisplay.textContent = gameScore;
    
    // Efecto de captura
    this.tweens.add({
        targets: fish,
        y: fishingRod.y - 50,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
            // Mover el pez a una nueva posición
            fish.x = Phaser.Math.Between(50, 750);
            fish.y = Phaser.Math.Between(200, 500);
            fish.setData('speed', Phaser.Math.FloatBetween(0.5, 2));
        }
    });
    
    // Mostrar puntos ganados
    const pointsText = this.add.text(fish.x, fish.y, `+${points}`, {
        fontSize: '24px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 2
    });
    
    this.tweens.add({
        targets: pointsText,
        y: fish.y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: () => pointsText.destroy()
    });
}

function castFishingLine(x, y) {
    // Animación de la caña de pescar
    this.tweens.add({
        targets: fishingRod,
        y: y - 50,
        duration: 200,
        yoyo: true,
        ease: 'Sine.easeOut'
    });
}