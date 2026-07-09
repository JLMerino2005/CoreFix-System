// IMPORTACIÓN DE MÓDULOS DE FIREBASE DESDE CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ✅ CREDENCIALES REALES EXTRAÍDAS DE TU CONSOLA DE FIREBASE[cite: 20]
const firebaseConfig = {
    apiKey: "AIzaSyBgoQDuWsn8_aITK2FwQQ0RF3T5kW1k20",
    authDomain: "corefix-system.firebaseapp.com",
    databaseURL: "https://corefix-system-default-rtdb.firebaseio.com",
    projectId: "corefix-system",
    storageBucket: "corefix-system.firebasestorage.app",
    messagingSenderId: "1081209996313",
    appId: "1:1081209996313:web:6c89f5936f328da1c3d688",
    measurementId: "G-2BC2F8JBWM"
};

// Inicializar servicios de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// INICIALIZADOR Y VINCULACIÓN DIRECTA DE EVENTOS
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("galeria-publica")) {
        escucharGaleriaFirebase();
    }
    if (document.getElementById("caja-total")) {
        escucharCajaFirebase();
    }

    // Vincular botones del panel administrador por ID para evitar problemas de modulo
    const btnCaja = document.getElementById("btn-guardar-caja");
    if (btnCaja) {
        btnCaja.addEventListener("click", registrarIngreso);
    }

    const btnTrabajo = document.getElementById("btn-subir-trabajo");
    if (btnTrabajo) {
        btnTrabajo.addEventListener("click", publicarTrabajo);
    }
});

// ==========================================
// 💵 GESTIÓN FINANCIERA (FIRESTORE)[cite: 20]
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
// 📸 SUBIDA DE IMÁGENES REALES (STORAGE + FIRESTORE)[cite: 20]
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

// ==========================================
// 🖼️ LÓGICA DE CONTROL DEL MODAL DE DETALLES[cite: 20]
// ==========================================
function abrirDetalles(servicio) {
    const modal = document.getElementById('modal-detalles');
    const titulo = document.getElementById('modal-titulo');
    const lista = document.getElementById('modal-lista');
    
    if (!modal || !titulo || !lista) return;
    lista.innerHTML = "";

    if (servicio === 'celulares') {
        titulo.innerText = "Soporte Especializado en Celulares";
        lista.innerHTML = `
            <li>• Reemplazo de módulos de pantalla (Calidad Original y OLED)</li>
            <li>• Rebalanceo de ciclos de carga y cambio de baterías certificadas</li>
            <li>• Microelectrónica en centros de carga Tipo-C y Lightning</li>
            <li>• Flasheo de ROMs de fábrica y recuperación de sistemas colapsados</li>
        `;
    } else if (servicio === 'laptops') {
        titulo.innerText = "Soporte en Cómputo y Laptops";
        lista.innerHTML = `
            <li>• Clonación de sistemas operativos hacia unidades de estado sólido SSD</li>
            <li>• Mantenimiento de cooling térmico preventivo con pasta de alta gama</li>
            <li>• Reconstrucción estructural y alineación mecánica de bisagras dañadas</li>
            <li>• Diagnósticos lógicos avanzados de fallas en placas base</li>
        `;
    } else if (servicio === 'impresoras') {
        titulo.innerText = "Soporte Técnico en Impresión";
        lista.innerHTML = `
            <li>• Ultrasonido y destape profundo de inyectores/cabezales térmicos</li>
            <li>• Reajuste y reseteo por software de almohadillas digitales de desecho</li>
            <li>• Mantenimiento correctivo a rodillos de arrastre y trenes de engranajes</li>
            <li>• Solución de atascos críticos y calibración óptica de escáneres</li>
        `;
    }
    modal.classList.remove('hidden');
}

function cerrarDetalles() {
    const modal = document.getElementById('modal-detalles');
    if (modal) modal.classList.add('hidden');
}

// Vinculación para funciones que siguen usándose inline en el index público
window.abrirDetalles = abrirDetalles;
window.cerrarDetalles = cerrarDetalles;