// ==========================================
// CONFIGURACIÓN DE FIREBASE (NUBE)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBgoQDuWsn8_alITK2FwQQ0RF3T5kW1k20",
  authDomain: "corefix-system.firebaseapp.com",
  projectId: "corefix-system",
  databaseURL: "https://corefix-system-default-rtdb.firebaseio.com", // <-- AGREGA ESTA LÍNEA
  storageBucket: "corefix-system.appspot.com",
  messagingSenderId: "1081209996313",
  appId: "1:1081209996313:web:6c89f5936f328da1c3d688",
  measurementId: "G-2BC2F8JBWM"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 1. MOTOR DE ACCESO (USUARIOS EN NUBE)
// ==========================================
window.registrarUsuario = function(e) {
    e.preventDefault();
    const email = document.getElementById('regEmail').value.trim().replace('.', '_');
    const userData = {
        name: document.getElementById('regName').value,
        pass: document.getElementById('regPass').value,
        fecha: new Date().toLocaleDateString()
    };
    set(ref(db, 'usuarios/' + email), userData).then(() => {
        alert("✅ Registro exitoso en la nube.");
        window.location.href = 'login.html';
    });
};

// ==========================================
// 2. COTIZADOR (ÓRDENES EN TIEMPO REAL)
// ==========================================
window.aceptarCotizacion = function() {
    const orderData = {
        id: 'CF-' + Math.floor(1000 + Math.random() * 9000),
        nombre: document.getElementById('clientName').value,
        telefono: document.getElementById('clientPhone').value,
        marca: document.getElementById('clientBrand').value,
        modelo: document.getElementById('clientModel').value,
        falla: document.getElementById('damageType').options[document.getElementById('damageType').selectedIndex].text,
        precio: parseInt(document.getElementById('priceDisplay').innerText),
        ubicacion: document.getElementById('deliveryPoint').value,
        fecha: new Date().toLocaleDateString(),
        estado: "EN REVISIÓN"
    };

    const newOrderRef = push(ref(db, 'cotizaciones'));
    set(newOrderRef, orderData).then(() => {
        localStorage.setItem('currentOrder', JSON.stringify(orderData));
        alert("📩 Ticket enviado a la nube. Sincronizando con sucursales...");
        window.location.href = 'ticket.html';
    });
};

// ==========================================
// 3. DASHBOARD ANALÍTICO (GRÁFICAS)
// ==========================================
function renderCharts(logs) {
    const ctxRep = document.getElementById('reparacionesChart');
    if (!ctxRep || typeof Chart === 'undefined') return;

    new Chart(ctxRep, {
        type: 'line',
        data: {
            labels: logs.slice(-5).map(l => l.id),
            datasets: [{ label: 'Ingresos', data: logs.slice(-5).map(l => l.precio), borderColor: '#3b82f6' }]
        }
    });
}

// ==========================================
// 4. PANEL ADMIN (LECTURA DESDE FIREBASE)
// ==========================================
function listenToAdminData() {
    const tableBody = document.getElementById('adminTableBody');
    if (!tableBody) return;

    onValue(ref(db, 'cotizaciones'), (snapshot) => {
        const data = snapshot.val();
        const logs = data ? Object.entries(data).map(([key, value]) => ({...value, firebaseKey: key})) : [];
        
        tableBody.innerHTML = logs.reverse().map(log => `
            <tr class="hover:bg-blue-500/[0.02] border-b border-slate-700/50">
                <td class="p-8">${log.fecha}<br><b class="text-blue-500 text-lg">${log.id}</b></td>
                <td class="p-8"><b class="text-white">${log.nombre}</b></td>
                <td class="p-8"><span class="text-blue-400 text-[10px] font-black">${log.falla}</span></td>
                <td class="p-8 text-green-400 font-black">$${log.precio}</td>
                <td class="p-8 text-center"><span class="px-4 py-1.5 rounded-full border border-blue-500/20 uppercase text-[10px]">${log.estado}</span></td>
                <td class="p-8 text-right">
                    <button onclick="cambiarEstadoNube('${log.firebaseKey}', 'ENTREGADO')" class="bg-green-600 p-2 rounded-lg text-white"><i class="fas fa-check"></i></button>
                    <button onclick="eliminarOrdenNube('${log.firebaseKey}')" class="bg-red-600/10 p-2 rounded-lg text-red-500"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`).join('');
        
        renderCharts(logs);
    });
}

window.cambiarEstadoNube = (key, estado) => {
    update(ref(db, 'cotizaciones/' + key), { estado: estado });
};

window.eliminarOrdenNube = (key) => {
    if(confirm("¿Eliminar registro de la nube?")) remove(ref(db, 'cotizaciones/' + key));
};

// ==========================================
// 5. PDF CON IMPACTO AMBIENTAL
// ==========================================
window.descargarTicketPDF = function(id) {
    const log = JSON.parse(localStorage.getItem('currentOrder'));
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 150] });

    doc.setFontSize(14); doc.text("COREFIX CLOUD", 40, 15, { align: "center" });
    doc.setFontSize(8); doc.text(`FOLIO: ${log.id}`, 10, 30);
    doc.text(`CLIENTE: ${log.nombre}`, 10, 37);
    doc.text(`TOTAL: $${log.precio}.00`, 10, 44);
    
    doc.setTextColor(34, 197, 94);
    doc.text("♻️ REPARAR ES SUSTENTABLE", 40, 60, { align: "center" });
    doc.save(`Ticket_CoreFix_${log.id}.pdf`);
};

// ==========================================
// 6. ALMACÉN E INVENTARIO EN NUBE
// ==========================================
function listenToInventory() {
    const container = document.getElementById('inventoryContainer');
    if (!container) return;

    onValue(ref(db, 'inventario'), (snapshot) => {
        const inv = snapshot.val() || {};
        container.innerHTML = Object.entries(inv).map(([key, p]) => `
            <div onclick="editStock('${key}', ${p.cantidad})" class="flex justify-between border-b border-white/5 p-2 cursor-pointer">
                <span class="text-slate-300 uppercase font-black">${key}</span>
                <span class="text-green-400 font-black">${p.cantidad} UNID.</span>
            </div>`).join('');
    });
}

window.editStock = (pieza, actual) => {
    const nueva = prompt(`Nuevo stock para ${pieza}:`, actual);
    if (nueva !== null) update(ref(db, 'inventario/' + pieza), { cantidad: parseInt(nueva) });
};

// ==========================================
// 7, 8, 9. UTILIDADES Y ARRANQUE
// ==========================================
window.logout = () => { localStorage.clear(); window.location.href = 'index.html'; };

document.addEventListener('DOMContentLoaded', () => {
    listenToAdminData();
    listenToInventory();
    
    // Modo Noche
    if (new Date().getHours() >= 20 || new Date().getHours() < 6) {
        document.body.classList.add('bg-slate-950');
    }
});