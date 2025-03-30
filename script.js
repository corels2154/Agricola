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
        showGameScreen();
    } catch (error) {
        alert("Error al iniciar sesión: " + error.message);
    }
}

async function handleRegister() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (username.length < 4 || password.length < 6) {
        alert("Usuario o contraseña no cumplen los requisitos");
        return;
    }
    const email = `${username}@pescacolombiana-test.com`;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        showGameScreen();
    } catch (error) {
        alert("Error al registrar: " + error.message);
    }
}

async function handleLogout() {
    await signOut(auth);
    currentUser = null;
    loginContainer.style.display = 'block';
    gameContainer.style.display = 'none';
    leaderboardContainer.style.display = 'none';
}

function showGameScreen() {
    loginContainer.style.display = 'none';
    gameContainer.style.display = 'flex';
    gameContainer.style.justifyContent = 'center';
    gameContainer.style.alignItems = 'center';
    gameContainer.style.height = '100vh';
    startGame();
}

// ================== FUNCIONES DEL JUEGO ================== //

function startGame() {
    if (gameInstance) {
        gameInstance.destroy(true);
    }
    gameScore = 0;
    gameTime = 60;
    scoreDisplay.textContent = gameScore;
    timeDisplay.textContent = gameTime;
    clearInterval(timerInterval);
    
    const config = {
        type: Phaser.CANVAS,
        width: 800,
        height: 600,
        parent: 'game-container',
        physics: { 
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: { preload, create, update }
    };
    
    gameInstance = new Phaser.Game(config);
    timerInterval = setInterval(updateTimer, 1000);
}

function preload() {
    this.load.image('background', 'assets/Background.jpeg');
    this.load.image('cana', 'assets/cana.png');
    this.load.image('fish1', 'assets/fish1.png');
    this.load.image('fish2', 'assets/fish2.png');
}

function create() {
    this.add.image(400, 300, 'background').setDisplaySize(800, 600);
    fishingRod = this.add.image(400, 300, 'cana').setScale(0.4).setDepth(20);
    
    this.input.keyboard.on('keydown-LEFT', () => fishingRod.x -= 20);
    this.input.keyboard.on('keydown-RIGHT', () => fishingRod.x += 20);
    this.input.keyboard.on('keydown-UP', () => fishingRod.y -= 20);
    this.input.keyboard.on('keydown-DOWN', () => fishingRod.y += 20);
    
    createFishes.call(this);
    this.time.addEvent({ delay: 2000, callback: createFishes, callbackScope: this, loop: true });
}

function update() {
    fishes.forEach(fish => {
        fish.x += fish.getData('speed');
        if (fish.x < 50 || fish.x > 750) {
            fish.setData('speed', fish.getData('speed') * -1);
            fish.flipX = !fish.flipX;
        }
    });
}

function createFishes() {
    const fishType = `fish${Phaser.Math.Between(1, 2)}`;
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

function catchFish(fish) {
    gameScore += fish.getData('points');
    scoreDisplay.textContent = gameScore;
    fish.destroy();
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
    
    const scoresRef = collection(db, 'scores');
    await addDoc(scoresRef, { user: currentUser.email, score: gameScore, timestamp: Date.now() });
    
    const scoresSnapshot = await getDocs(query(scoresRef, orderBy('score', 'desc'), limit(5)));
    leaderboardList.innerHTML = scoresSnapshot.docs.map(doc => `<li>${doc.data().user}: ${doc.data().score}</li>`).join('');
}
