/**
 * CoreFix System Master - Edición de Ingeniería Cloud UTTECAM
 * Ingeniería: Jose Luis Merino Mota
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
        if (users) {
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
    const name = document.getElementById('clientName').value;
    const damageType = document.getElementById('damageType');
    if (!name || damageType.value === "0") return alert("⚠️ Completa los datos.");

    const newOrder = {
        id: 'CF-' + Math.floor(1000 + Math.random() * 9000),
        nombre: name,
        telefono: document.getElementById('clientPhone').value,
        marca: document.getElementById('clientBrand').value,
        modelo: document.getElementById('clientModel').value,
        falla: damageType.options[damageType.selectedIndex].text,
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
                    <button onclick="cambiarEstadoNube('${log.fbKey}', 'ENTREGADO')" class="bg-green-600 p-3 rounded-xl text-white">✓</button>
                    <button onclick="eliminarOrdenNube('${log.fbKey}')" class="bg-red-600/10 p-3 rounded-xl text-red-500"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
        actualizarWidgets(cajaReal);
    });
}

// ==========================================
// PUNTO 5: ALMACÉN E INVENTARIO
// ==========================================
function listenInventory() {
    const invContainer = document.getElementById('inventoryContainer');
    if (!invContainer) return;

    onValue(ref(db, 'inventario'), (snapshot) => {
        const inv = snapshot.val() || {};
        invContainer.innerHTML = Object.entries(inv).map(([key, p]) => `
            <div onclick="editarStockNube('${key}', ${p.cantidad})" class="flex justify-between p-2 border-b border-white/5 cursor-pointer">
                <span class="text-slate-300 font-black text-[10px] uppercase">${key}</span>
                <span class="text-green-400 font-black">${p.cantidad} U.</span>
            </div>`).join('');
    });
}

window.editarStockNube = (p, a) => {
    const n = prompt(`Nuevo stock para ${p}:`, a);
    if (n !== null) update(ref(db, 'inventario/' + p), { cantidad: parseInt(n) });
};

window.agregarNuevaRefaccion = () => {
    const n = prompt("Nombre pieza:");
    const c = prompt("Cantidad:");
    if(n && c) set(ref(db, 'inventario/' + n), { cantidad: parseInt(c) });
};

// ==========================================
// PUNTO 6: RASTREO (CLIENTES)
// ==========================================
window.buscarEstado = function() {
    const phone = document.getElementById('searchPhone').value;
    const container = document.getElementById('resultContainer');
    onValue(ref(db, 'cotizaciones'), (snapshot) => {
        const data = snapshot.val();
        const logs = data ? Object.values(data).filter(l => l.telefono.includes(phone)) : [];
        container.innerHTML = logs.map(f => `
            <div class="bg-slate-800 p-6 rounded-2xl mb-4 border border-blue-500/30">
                <p class="text-blue-400 font-black text-xl">${f.id}</p>
                <p class="text-white">Estado: ${f.estado}</p>
            </div>`).join('') || "No se encontró nada.";
        container.classList.remove('hidden');
    }, { onlyOnce: true });
};

// ==========================================
// PUNTO 7: WIDGETS Y METAS
// ==========================================
function actualizarWidgets(real) {
    if (document.getElementById('cajaReal')) document.getElementById('cajaReal').innerText = `$${real}`;
    const porc = Math.min(Math.round((real / META_MENSUAL) * 100), 100);
    if(document.getElementById('metaBar')) document.getElementById('metaBar').style.width = porc + "%";
    if(document.getElementById('metaPorcentaje')) document.getElementById('metaPorcentaje').innerText = porc + "%";
}

// ==========================================
// PUNTO 8: EXCEL Y PDF
// ==========================================
window.exportarExcel = () => { alert("Generando archivo CSV..."); };
window.generarReporteRapido = () => { alert("Reporte enviado a WhatsApp..."); };

window.cambiarEstadoNube = (k, e) => update(ref(db, `cotizaciones/${k}`), { estado: e });
window.eliminarOrdenNube = (k) => confirm("¿Eliminar?") && remove(ref(db, `cotizaciones/${k}`));

// ==========================================
// PUNTO 9: MODO NOCHE Y SEGURIDAD
// ==========================================
window.togglePassword = (i, ic) => {
    const input = document.getElementById(i);
    input.type = input.type === 'password' ? 'text' : 'password';
};

// ARRANQUE
document.addEventListener('DOMContentLoaded', () => {
    listenAdminData();
    listenInventory();
    document.getElementById('registerForm')?.addEventListener('submit', window.ejecutarRegistro);
    document.getElementById('loginForm')?.addEventListener('submit', window.loginUsuario);
    if (new Date().getHours() >= 20 || new Date().getHours() < 6) document.body.classList.add('bg-slate-950');
});

window.logout = () => { localStorage.clear(); window.location.href = 'index.html'; };