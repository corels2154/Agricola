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
const finalScoreDisplay = document.getElementById('final-score');

// Event Listeners
loginBtn.addEventListener('click', handleLogin);
registerBtn.addEventListener('click', handleRegister);
logoutBtn.addEventListener('click', handleLogout);
playAgainBtn.addEventListener('click', startGame);

// ================== FUNCIONES DEL JUEGO ================== //

function startGame() {
    if (gameInstance) {
        gameInstance.destroy(true);
    }
    
    gameScore = 0;
    gameTime = 60;
    fishes = [];
    bubbles = [];
    fishingRod = null;

    scoreDisplay.textContent = gameScore;
    timeDisplay.textContent = gameTime;

    clearInterval(timerInterval);
    
    const config = {
        type: Phaser.WEBGL, // 🔹 Forzar WebGL
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
        scene: { preload, create, update }
    };
    
    gameInstance = new Phaser.Game(config);
    timerInterval = setInterval(updateTimer, 1000);
}

function preload() {
    console.log("Cargando imágenes...");
    this.load.image('background', 'assets/Background.jpeg');
    this.load.image('cana', 'assets/cana.png');
    this.load.image('fish1', 'assets/fish1.png');
    this.load.image('fish2', 'assets/fish2.png');
    this.load.on('complete', () => console.log("Carga de imágenes completa"));
}

function create() {
    this.add.image(400, 300, 'background').setDisplaySize(800, 600);
    fishingRod = this.add.image(400, 100, 'cana').setScale(0.4).setDepth(20);
    createFishes.call(this);
    this.input.on('pointerdown', (pointer) => {
        castFishingLine.call(this, pointer.x, pointer.y);
    });
}

function update() {
    fishes.forEach(fish => {
        fish.x += fish.getData('speed');
        if (fish.x < 50 || fish.x > 750) {
            fish.setData('speed', -fish.getData('speed'));
            fish.flipX = !fish.flipX;
        }
    });
}

function createFishes() {
    fishes = [];
    for (let i = 0; i < 10; i++) {
        const fishType = `fish${Phaser.Math.Between(1, 2)}`;
        const fish = this.physics.add.sprite(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(200, 500),
            fishType
        ).setScale(0.15);
        
        fish.setData('speed', Phaser.Math.FloatBetween(0.5, 2));
        fish.setInteractive();
        fish.on('pointerdown', () => catchFish.call(this, fish));
        fishes.push(fish);
    }
}

function catchFish(fish) {
    gameScore += 10;
    scoreDisplay.textContent = gameScore;
    this.tweens.add({
        targets: fish,
        y: fishingRod.y - 50,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
            fish.x = Phaser.Math.Between(50, 750);
            fish.y = Phaser.Math.Between(200, 500);
        }
    });
}

function castFishingLine(x, y) {
    this.tweens.add({
        targets: fishingRod,
        y: y - 50,
        duration: 200,
        yoyo: true,
        ease: 'Sine.easeOut'
    });
}
