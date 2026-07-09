// IMPORTACIÓN DE MÓDULOS DE FIREBASE DESDE CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ⚠️ Asegúrate de colocar aquí tus credenciales reales del botón "CoreFix-Web"
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUÍ",
    authDomain: "corefix-system.firebaseapp.com",
    projectId: "corefix-system",
    storageBucket: "corefix-system.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar servicios de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// INICIALIZADOR DE VISTAS AUTOMÁTICAS
document.addEventListener("DOMContentLoaded", () => {
    // Si la página tiene el contenedor de la galería, activamos la escucha en tiempo real
    if (document.getElementById("galeria-publica")) {
        escucharGaleriaFirebase();
    }
    // Si la página tiene el elemento de caja acumulada, activamos la escucha en tiempo real
    if (document.getElementById("caja-total")) {
        escucharCajaFirebase();
    }
});

// ==========================================
// 💵 GESTIÓN FINANCIERA (FIRESTORE) - INTEGRADO
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

    // Validaciones básicas
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
        
        // 1. Crear un nombre único para la foto usando el tiempo actual
        const nombreUnico = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `trabajos/${nombreUnico}`);
        
        // 2. Subir el archivo binario (la foto de tu teléfono) a Firebase Storage
        const snapshot = await uploadBytes(storageRef, file);
        
        // 3. Obtener la URL de descarga que generó Firebase Storage
        const urlPublica = await getDownloadURL(snapshot.ref);

        // 4. Guardar la descripción y la URL en la colección "portafolio" de Firestore
        await addDoc(collection(db, "portafolio"), {
            url: urlPublica,
            descripcion: descInput,
            fecha: Date.now() // Nos sirve para ordenar las fotos de la más nueva a la más vieja
        });

        // Limpiar el formulario para un nuevo registro
        archivoInput.value = "";
        document.getElementById("input-desc").value = "";
        alert("📸 ¡Trabajo publicado con éxito en tu catálogo público!");

    } catch (error) {
        console.error("Error crítico al subir a Firebase: ", error);
        alert("Hubo un error al intentar guardar la imagen.");
    }
}

// ==========================================
// 🖼️ RENDERIZAR LA GALERÍA PÚBLICA EN TIEMPO REAL
// ==========================================
function escucharGaleriaFirebase() {
    const contenedor = document.getElementById("galeria-publica");
    if (!contenedor) return;

    // Escucha la colección "portafolio" y se actualiza sola sin recargar la página
    onSnapshot(collection(db, "portafolio"), (snapshot) => {
        contenedor.innerHTML = "";
        
        const trabajos = [];
        snapshot.forEach((doc) => trabajos.push(doc.data()));
        
        // Ordenar: Los últimos trabajos realizados aparecen primero
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

// Exponer las funciones al entorno global para los botones del formulario de administración
window.registrarIngreso = registrarIngreso;
window.publicarTrabajo = publicarTrabajo;