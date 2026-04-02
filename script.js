/**
 * CoreFix System Master - Edición de Ingeniería Cloud
 * Administrador: merinomotajoseluis@gmail.com
 * Desarrollador: Jose Luis Merino Mota - UTTECAM
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// PUNTO 1: CONFIGURACIÓN Y CONEXIÓN SEGURA
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBgoQDuWsn8_alITK2FwQQ0RF3T5kW1k20",
  authDomain: "corefix-system.firebaseapp.com",
  projectId: "corefix-system",
  databaseURL: "https://corefix-system-default-rtdb.firebaseio.com",
  storageBucket: "corefix-system.appspot.com",
  messagingSenderId: "1081209996313",
  appId: "1:1081209996313:web:6c89f5936f328da1c3d688",
  measurementId: "G-2BC2F8JBWM"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const META_MENSUAL = 10000;

// ==========================================
// PUNTO 2: MOTOR DE ACCESO Y REGISTRO
// ==========================================
window.ejecutarRegistro = function(e) {
    if(e) e.preventDefault();
    const emailRaw = document.getElementById('regEmail').value.trim();
    const emailKey = emailRaw.replace(/\./g, '_'); 
    
    const nuevoUser = {
        name: document.getElementById('regName').value,
        email: emailRaw,
        pass: document.getElementById('regPass').value,
        fechaRegistro: new Date().toLocaleDateString()
    };

    set(ref(db, 'usuarios/' + emailKey), nuevoUser).then(() => {
        alert("✅ Registro exitoso en la nube de CoreFix.");
        window.location.href = 'login.html';
    }).catch(err => alert("Error: " + err.message));
};

window.loginUsuario = function(e) {
    if(e) e.preventDefault();
    const role = document.querySelector('input[name="userRole"]:checked').value;
    const userInput = document.getElementById('logEmail').value.trim();
    const pass = document.getElementById('logPass').value;

    if (role === 'admin' && userInput === "merinomotajoseluis@gmail.com" && pass === "CoreFix2026") {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('staffUser', JSON.stringify({ name: "José Luis" }));
        return window.location.href = 'admin.html';
    }

    onValue(ref(db, 'usuarios'), (snapshot) => {
        const users = snapshot.val();
        let encontrado = false;
        for (let key in users) {
            if (users[key].email === userInput && users[key].pass === pass) {
                encontrado = true;
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', role);
                localStorage.setItem('staffUser', JSON.stringify(users[key]));
                window.location.href = 'index.html';
                break;
            }
        }
        if (!encontrado) alert('❌ Datos incorrectos.');
    }, { onlyOnce: true });
};

// ==========================================
// PUNTO 3: COTIZADOR PRO Y MODO EXPRESS
// ==========================================
window.updatePrice = function() {
    let base = parseInt(document.getElementById('damageType').value) || 0;
    if (document.getElementById('expressMode')?.checked && base > 0) base *= 1.20;
    if (document.getElementById('priceDisplay')) {
        document.getElementById('priceDisplay').innerText = Math.round(base);
    }
};

window.aceptarCotizacion = function() {
    const fallaSel = document.getElementById('damageType');
    if (!fallaSel || fallaSel.value === "0") return alert("⚠️ Selecciona una falla.");

    const newOrder = {
        id: 'CF-' + Math.floor(1000 + Math.random() * 9000),
        nombre: document.getElementById('clientName').value,
        telefono: document.getElementById('clientPhone').value,
        marca: document.getElementById('clientBrand').value,
        modelo: document.getElementById('clientModel').value,
        falla: fallaSel.options[fallaSel.selectedIndex].text,
        precio: parseInt(document.getElementById('priceDisplay').innerText),
        ubicacion: document.getElementById('deliveryPoint').value,
        fecha: new Date().toLocaleDateString(),
        estado: "EN REVISIÓN"
    };

    push(ref(db, 'cotizaciones'), newOrder).then(() => {
        localStorage.setItem('currentOrder', JSON.stringify(newOrder));
        alert("📩 Orden enviada a la nube.");
        window.location.href = 'ticket.html';
    });
};

// ==========================================
// PUNTO 4: PANEL ADMIN REALTIME
// ==========================================
function listenAdminData() {
    const tableBody = document.getElementById('adminTableBody');
    if (!tableBody) return;

    onValue(ref(db, 'cotizaciones'), (snapshot) => {
        const data = snapshot.val();
        let cajaReal = 0;
        let logs = data ? Object.entries(data).map(([key, val]) => ({...val, fbKey: key})) : [];

        tableBody.innerHTML = logs.reverse().map(log => {
            if (log.estado === "ENTREGADO") cajaReal += log.precio;
            return `
            <tr class="hover:bg-blue-500/[0.03] border-b border-slate-700/50">
                <td class="p-8">${log.fecha}<br><b class="text-blue-500 text-lg">${log.id}</b></td>
                <td class="p-8"><b class="text-white">${log.nombre}</b></td>
                <td class="p-8"><span class="text-blue-400 text-[10px] font-black uppercase">${log.falla}</span></td>
                <td class="p-8 text-green-400 font-black">$${log.precio}</td>
                <td class="p-8 text-center"><span class="px-4 py-1.5 rounded-full border border-blue-500/20 uppercase text-[10px]">${log.estado}</span></td>
                <td class="p-8 text-right">
                    <button onclick="cambiarEstadoNube('${log.fbKey}', 'ENTREGADO')" class="bg-green-600 p-3 rounded-xl text-white mx-1">✓</button>
                    <button onclick="eliminarOrdenNube('${log.fbKey}')" class="bg-red-600/10 p-3 rounded-xl text-red-500 mx-1"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
        actualizarWidgets(cajaReal);
    });
}

// ==========================================
// PUNTO 5: ALMACÉN E INVENTARIO CLOUD
// ==========================================
function listenInventory() {
    const invContainer = document.getElementById('inventoryContainer');
    if (!invContainer) return;

    onValue(ref(db, 'inventario'), (snapshot) => {
        const inv = snapshot.val() || {};
        invContainer.innerHTML = Object.entries(inv).map(([key, p]) => `
            <div onclick="editarStockNube('${key}', ${p.cantidad})" class="flex justify-between items-center border-b border-white/5 p-2 cursor-pointer hover:bg-white/5">
                <span class="text-slate-300 uppercase font-black text-[10px]">${key}</span>
                <span class="${p.cantidad <= 2 ? 'text-red-500 animate-pulse' : 'text-green-400'} border border-current px-2 py-0.5 rounded text-[9px] font-black">${p.cantidad} U.</span>
            </div>`).join('');
    });
}

window.editarStockNube = (pieza, actual) => {
    const nueva = prompt(`Stock de ${pieza}:`, actual);
    if (nueva !== null) update(ref(db, 'inventario/' + pieza), { cantidad: parseInt(nueva) });
};

// ==========================================
// PUNTO 6: RASTREO DE ÓRDENES
// ==========================================
window.buscarEstado = function() {
    const phone = document.getElementById('searchPhone').value;
    const container = document.getElementById('resultContainer');
    onValue(ref(db, 'cotizaciones'), (snapshot) => {
        const data = snapshot.val();
        const found = data ? Object.values(data).filter(l => l.telefono.includes(phone)) : [];
        container.innerHTML = found.length ? found.map(f => `<div class="bg-slate-800 p-4 rounded-xl mb-2"><b>${f.id}</b>: ${f.estado}</div>`).join('') : "No encontrado";
        container.classList.remove('hidden');
    }, { onlyOnce: true });
};

// ==========================================
// PUNTO 7: WIDGETS Y METAS
// ==========================================
function actualizarWidgets(real) {
    if (document.getElementById('cajaReal')) document.getElementById('cajaReal').innerText = `$${real}`;
    const porcentaje = Math.min(Math.round((real / META_MENSUAL) * 100), 100);
    if(document.getElementById('metaBar')) document.getElementById('metaBar').style.width = porcentaje + "%";
    if(document.getElementById('metaPorcentaje')) document.getElementById('metaPorcentaje').innerText = porcentaje + "%";
}

// ==========================================
// PUNTO 8: TICKET PDF Y ACCIONES CLOUD
// ==========================================
window.cambiarEstadoNube = (key, est) => update(ref(db, `cotizaciones/${key}`), { estado: est });
window.eliminarOrdenNube = (key) => confirm("¿Eliminar?") && remove(ref(db, `cotizaciones/${key}`));

window.descargarTicketPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 150] });
    const order = JSON.parse(localStorage.getItem('currentOrder'));
    doc.text("COREFIX TICKET", 40, 15, { align: "center" });
    doc.text(`Folio: ${order.id}`, 10, 30);
    doc.save(`Ticket_CoreFix_${order.id}.pdf`);
};

// ==========================================
// PUNTO 9: MODO NOCHE Y SEGURIDAD
// ==========================================
window.togglePassword = (inputId, iconId) => {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
};

function aplicarModoNoche() {
    if (new Date().getHours() >= 20 || new Date().getHours() < 6) document.body.classList.add('bg-slate-950');
}

// ==========================================
// ARRANQUE Y VINCULACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    aplicarModoNoche();
    listenAdminData();
    listenInventory();
    
    // Vinculación de formularios
    document.getElementById('registerForm')?.addEventListener('submit', window.ejecutarRegistro);
    document.getElementById('loginForm')?.addEventListener('submit', window.loginUsuario);

    // Navbar dinámico
    const authCont = document.getElementById('auth-container');
    if (authCont && localStorage.getItem('isLoggedIn') === 'true') {
        const user = JSON.parse(localStorage.getItem('staffUser'));
        authCont.innerHTML = `<div class="bg-slate-800 p-2 rounded-full border border-blue-500/40 px-4">
            <span class="text-[10px] font-black text-blue-400 uppercase">${user.name}</span>
            <button onclick="logout()" class="text-red-500 ml-2"><i class="fas fa-power-off"></i></button></div>`;
    }
});

window.logout = () => { localStorage.clear(); window.location.href = 'index.html'; };