//importaciones (versión 9 modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";;

const firebaseConfig = {
    apiKey: "AIzaSyAdGmID3ekNpffctMWh1Lbo41cu8GuCyXw",
  authDomain: "agricultura-inteligente-d8313.firebaseapp.com",
  projectId: "agricultura-inteligente-d8313",
  storageBucket: "agricultura-inteligente-d8313.firebasestorage.app",
  messagingSenderId: "90143842831",
  appId: "1:90143842831:web:9d59d24d766e5bc6c5f97a"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Variables globales
let currentUser = null;
let gameInstance = null;
let gameScore = 0;
let gameTime = 60;
let timerInterval = null;

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

// Event Listeners
loginBtn.addEventListener('click', handleLogin);
registerBtn.addEventListener('click', handleRegister);
logoutBtn.addEventListener('click', handleLogout);
playAgainBtn.addEventListener('click', () => {
    leaderboardContainer.style.display = 'none';
    startGame();
});

// Manejo de Autenticación
async function handleLogin() {
    const email = usernameInput.value + "@pescacolombiana.com";
    const password = passwordInput.value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
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
    
    // Usamos un dominio temporal para testing
    const email = `${username}@pescacolombiana-test.com`;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        
        // Guardar información adicional del usuario
        await setDoc(doc(db, "users", currentUser.uid), {
            username: username,
            createdAt: new Date(),
            lastLogin: new Date()
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
        if (gameInstance) {
            gameInstance.destroy();
            gameInstance = null;
        }
        clearInterval(timerInterval);
        loginContainer.style.display = 'block';
        gameContainer.style.display = 'none';
        leaderboardContainer.style.display = 'none';
        usernameInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        alert("Error al cerrar sesión: " + error.message);
    }
}

// Mostrar pantalla de juego
function showGameScreen() {
    loginContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    startGame();
}

// Juego Phaser
function startGame() {
    gameScore = 0;
    gameTime = 60;
    scoreDisplay.textContent = gameScore;
    timeDisplay.textContent = gameTime;
    
    if (gameInstance) {
        gameInstance.destroy();
    }
    
    const config = {
        type: Phaser.AUTO,
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
    
    // Iniciar temporizador
    clearInterval(timerInterval);
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
    
    // Guardar puntaje
    try {
        await addDoc(collection(db, "scores"), {
            userId: currentUser.uid,
            username: currentUser.email.split('@')[0],
            score: gameScore,
            date: new Date()
        });
    } catch (error) {
        console.error("Error guardando puntaje: ", error);
    }
    
    // Mostrar leaderboard
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
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<span>${data.username}</span><span>${data.score} pts</span>`;
            leaderboardList.appendChild(li);
        });
    } catch (error) {
        console.error("Error cargando leaderboard: ", error);
    }
}

// Funciones del juego
function preload() {
    // Cargar imágenes
    this.load.image('background', 'https://images.unsplash.com/photo-1518562180175-34a163b1c930?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80');
    this.load.image('hook', 'assets/hook.png');
    
    // Peces colombianos
    this.load.image('bocachico', 'assets/bocachico.png');
    this.load.image('bagre', 'assets/bagre.png');
    this.load.image('arapaima', 'assets/arapaima.png');
    this.load.image('cachama', 'assets/cachama.png');
    this.load.image('dorado', 'assets/dorado.png');
    this.load.image('trucha', 'assets/trucha.png');
    
    // Sonidos
    this.load.audio('catch', 'assets/catch.mp3');
    this.load.audio('water', 'assets/water.mp3');
}

function create() {
    // Configurar fondo
    this.add.image(400, 300, 'background');
    
    // Configurar anzuelo
    this.hook = this.physics.add.image(400, 100, 'hook');
    this.hook.setCollideWorldBounds(true);
    this.hook.setScale(0.5);
    
    // Configurar controles
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Grupo de peces
    this.fishes = this.physics.add.group();
    
    // Temporizador para generar peces
    this.time.addEvent({
        delay: 1000,
        callback: spawnFish,
        callbackScope: this,
        loop: true
    });
    
    // Colisión entre anzuelo y peces
    this.physics.add.overlap(this.hook, this.fishes, catchFish, null, this);
    
    // Sonido de agua
    this.waterSound = this.sound.add('water', { loop: true, volume: 0.3 });
    this.waterSound.play();
}

function update() {
    // Movimiento del anzuelo
    if (this.cursors.left.isDown) {
        this.hook.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
        this.hook.setVelocityX(200);
    } else {
        this.hook.setVelocityX(0);
    }
    
    if (this.cursors.up.isDown) {
        this.hook.setVelocityY(-200);
    } else if (this.cursors.down.isDown) {
        this.hook.setVelocityY(200);
    } else {
        this.hook.setVelocityY(0);
    }
}

function spawnFish() {
    const fishTypes = ['bocachico', 'bagre', 'arapaima', 'cachama', 'dorado', 'trucha'];
    const fishType = fishTypes[Math.floor(Math.random() * fishTypes.length)];
    
    // Configurar puntaje según el tipo de pez
    let fishScore = 10;
    let fishSpeed = Phaser.Math.Between(50, 150);
    let fishScale = 0.3;
    
    switch(fishType) {
        case 'bocachico':
            fishScore = 10;
            fishSpeed = Phaser.Math.Between(50, 100);
            fishScale = 0.3;
            break;
        case 'bagre':
            fishScore = 20;
            fishSpeed = Phaser.Math.Between(70, 120);
            fishScale = 0.4;
            break;
        case 'cachama':
            fishScore = 30;
            fishSpeed = Phaser.Math.Between(80, 130);
            fishScale = 0.5;
            break;
        case 'dorado':
            fishScore = 40;
            fishSpeed = Phaser.Math.Between(90, 140);
            fishScale = 0.6;
            break;
        case 'trucha':
            fishScore = 50;
            fishSpeed = Phaser.Math.Between(100, 150);
            fishScale = 0.7;
            break;
        case 'arapaima':
            fishScore = 100;
            fishSpeed = Phaser.Math.Between(120, 180);
            fishScale = 0.9;
            break;
    }
    
    // Posición inicial aleatoria
    let x, y;
    if (Math.random() > 0.5) {
        x = Math.random() > 0.5 ? 0 : 800;
        y = Phaser.Math.Between(100, 500);
    } else {
        x = Phaser.Math.Between(100, 700);
        y = 0;
    }
    
    const fish = this.physics.add.image(x, y, fishType);
    fish.setScale(fishScale);
    fish.setData('score', fishScore);
    
    // Movimiento aleatorio
    const targetX = Phaser.Math.Between(100, 700);
    const targetY = Phaser.Math.Between(100, 500);
    
    this.physics.moveTo(fish, targetX, targetY, fishSpeed);
    
    // Eliminar pez cuando salga de la pantalla
    fish.setCollideWorldBounds(true);
    fish.worldBoundsBounce = new Phaser.Geom.Rectangle(0, 0, 800, 600);
    
    this.fishes.add(fish);
}

function catchFish(hook, fish) {
    // Sonido de captura
    this.sound.play('catch', { volume: 0.5 });
    
    // Añadir puntaje
    const fishScore = fish.getData('score');
    gameScore += fishScore;
    scoreDisplay.textContent = gameScore;
    
    // Efecto visual
    const scoreText = this.add.text(fish.x, fish.y, `+${fishScore}`, {
        fontSize: '24px',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2
    });
    
    this.tweens.add({
        targets: scoreText,
        y: fish.y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: () => scoreText.destroy()
    });
    
    // Eliminar pez
    fish.destroy();
}