
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

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD6bQnXrirhoJkGV4Mf18jMiFKSspp83_w",
    authDomain: "pesca-70456.firebaseapp.com",
    projectId: "pesca-70456",
    storageBucket: "pesca-70456.appspot.com",
    messagingSenderId: "673843283879",
    appId: "1:673843283879:web:645083de0977d81f439882"
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
    const email = usernameInput.value + "@pescacolombiana-test.com";
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
    
    const email = `${username}@pescacolombiana-test.com`;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        
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
    
    if (!currentUser) {
        alert("No se pudo guardar el puntaje porque no hay un usuario autenticado.");
        return;
    }

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

// Función preload: Carga los recursos del juego
function preload() {
    this.load.image('background', 'assets/Background.jpeg'); // Cambia la ruta a tu imagen
    this.load.image('fish', 'assets/fish.jpg'); // Cambia la ruta a tu imagen
}

// Función create: Configura los elementos iniciales del juego
function create() {
    this.add.image(400, 300, 'background'); // Fondo centrado
    const fish = this.physics.add.sprite(400, 300, 'fish');
    fish.setScale(0.2); // Ajusta el tamaño del pez
    fish.setInteractive();
    fish.on('pointerdown', () => {
        gameScore += 10;
        scoreDisplay.textContent = gameScore;

        // Mueve el pez a una posición aleatoria
        const x = Phaser.Math.Between(50, 750);
        const y = Phaser.Math.Between(50, 550);
        fish.setPosition(x, y);
    });
}

// Función update: Lógica que se ejecuta en cada frame
function update() {
    // Aquí puedes agregar lógica para mover elementos o manejar interacciones
}