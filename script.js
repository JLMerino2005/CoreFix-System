// IMPORTACIÓN DE MÓDULOS DE FIREBASE DESDE CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ⚠️ REEMPLAZA ESTAS LÍNEAS CON TUS DATOS REALES DE FIREBASE CONSOLE
const firebaseConfig = {
    apiKey: "TU_API_KEY_REAL",
    authDomain: "corefix-system.firebaseapp.com",
    projectId: "corefix-system",
    storageBucket: "corefix-system.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar servicios de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// INICIALIZADOR DE VISTAS AUTOMÁTICAS
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("galeria-publica")) {
        escucharGaleriaFirebase();
    }
    if (document.getElementById("caja-total")) {
        escucharCajaFirebase();
    }
});

// ==========================================
// 💵 GESTIÓN FINANCIERA (FIRESTORE)
// ==========================================
async function registrarIngreso() {
    const inputMonto = document.getElementById("input-monto");
    const valor = parseFloat(inputMonto.value);

    if (!isNaN(valor) && valor > 0) {
        try {
            const cajaRef = doc(db, "finanzas", "caja_principal");
            const docSnap = await getDoc(cajaRef);
            
            let nuevoTotal = valor;
            if (docSnap.exists()) {
                nuevoTotal += docSnap.data().totalRecibido || 0;
                await updateDoc(cajaRef, { totalRecibido: nuevoTotal });
            } else {
                await setDoc(cajaRef, { totalRecibido: nuevoTotal });
            }

            inputMonto.value = "";
            alert("💰 Cantidad guardada de manera segura en Firebase.");
        } catch (error) {
            console.error("Error al registrar dinero: ", error);
            alert("Hubo un error al guardar en la base de datos.");
        }
    } else {
        alert("Por favor ingresa un monto válido.");
    }
}

function escucharCajaFirebase() {
    onSnapshot(doc(db, "finanzas", "caja_principal"), (docSnap) => {
        const elementoCaja = document.getElementById("caja-total");
        if (elementoCaja && docSnap.exists()) {
            elementoCaja.innerText = `$${(docSnap.data().totalRecibido || 0).toFixed(2)}`;
        }
    });
}

// ==========================================
// 📸 SUBIDA DE IMÁGENES REALES (STORAGE + FIRESTORE)
// ==========================================
async function publicarTrabajo() {
    const archivoInput = document.getElementById("input-archivo");
    const descInput = document.getElementById("input-desc").value.trim();
    const file = archivoInput.files[0];

    if (!file) {
        alert("Por favor selecciona una foto desde tu galería o cámara.");
        return;
    }
    if (!descInput) {
        alert("Por favor introduce una descripción para este trabajo.");
        return;
    }

    try {
        alert("Subiendo imagen a los servidores de CoreFix... Espera un momento.");
        
        const nombreUnico = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `trabajos/${nombreUnico}`);
        const snapshot = await uploadBytes(storageRef, file);
        const urlPublica = await getDownloadURL(snapshot.ref);

        await addDoc(collection(db, "portafolio"), {
            url: urlPublica,
            descripcion: descInput,
            fecha: Date.now()
        });

        archivoInput.value = "";
        document.getElementById("input-desc").value = "";
        alert("📸 ¡Trabajo publicado con éxito en tu catálogo público!");

    } catch (error) {
        console.error("Error crítico al subir a Firebase: ", error);
        alert("Hubo un error al intentar guardar la imagen.");
    }
}

function escucharGaleriaFirebase() {
    const contenedor = document.getElementById("galeria-publica");
    if (!contenedor) return;

    onSnapshot(collection(db, "portafolio"), (snapshot) => {
        contenedor.innerHTML = "";
        const trabajos = [];
        snapshot.forEach((doc) => trabajos.push(doc.data()));
        trabajos.sort((a, b) => b.fecha - a.fecha);

        trabajos.forEach(trabajo => {
            const tarjeta = document.createElement("div");
            tarjeta.className = "group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200/60 transition duration-300 hover:shadow-md";
            
            tarjeta.innerHTML = `
                <div class="h-48 overflow-hidden bg-slate-200 flex items-center justify-center">
                    <img src="${trabajo.url}" alt="Evidencia COREFIX" class="w-full h-full object-cover">
                </div>
                <div class="p-4 bg-white border-t">
                    <p class="font-bold text-xs text-azulCielo uppercase tracking-wide mb-1">COREFIX TALLER</p>
                    <p class="text-sm font-semibold text-slate-700">${trabajo.descripcion}</p>
                </div>
            `;
            contenedor.appendChild(tarjeta);
        });
    });
}

// Vinculación definitiva con el entorno global de la página
window.registrarIngreso = registrarIngreso;
window.publicarTrabajo =公开Trabajo; // Fallback idiomático
window.publicarTrabajo = publicarTrabajo;