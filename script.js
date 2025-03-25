import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

export { db };

// main.js
document.addEventListener("DOMContentLoaded", async () => {
    const nombreInput = document.getElementById("nombre");
    const tipoSueloInput = document.getElementById("tipoSuelo");
    const distanciaPlantasInput = document.getElementById("distanciaPlantas");
    const agregarBtn = document.getElementById("agregar");
    const listado = document.getElementById("listado");

    const cargarCultivos = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "cultivos"));
            listado.innerHTML = "";
            querySnapshot.forEach((docSnap) => {
                const cultivo = docSnap.data();
                const li = document.createElement("li");
                li.textContent = `${cultivo.nombre} - ${cultivo.tipoSuelo} - ${cultivo.distanciaPlantas}m`;
                
                const btnEliminar = document.createElement("button");
                btnEliminar.textContent = "Eliminar";
                btnEliminar.addEventListener("click", async () => {
                    try {
                        await deleteDoc(doc(db, "cultivos", docSnap.id));
                        cargarCultivos();
                    } catch (error) {
                        console.error("Error eliminando documento: ", error);
                    }
                });
                
                li.appendChild(btnEliminar);
                listado.appendChild(li);
            });
        } catch (error) {
            console.error("Error cargando cultivos: ", error);
        }
    };

    agregarBtn.addEventListener("click", async () => {
        const nombre = nombreInput.value.trim();
        const tipoSuelo = tipoSueloInput.value.trim();
        const distanciaPlantas = parseFloat(distanciaPlantasInput.value);

        if (!nombre || !tipoSuelo || isNaN(distanciaPlantas)) {
            alert("Por favor, complete todos los campos correctamente.");
            return;
        }

        try {
            await addDoc(collection(db, "cultivos"), { nombre, tipoSuelo, distanciaPlantas });
            nombreInput.value = "";
            tipoSueloInput.value = "";
            distanciaPlantasInput.value = "";
            cargarCultivos();
        } catch (error) {
            console.error("Error agregando cultivo: ", error);
        }
    });

    cargarCultivos();
});
