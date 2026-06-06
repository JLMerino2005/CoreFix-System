/**
 * CoreFix System Master - Edición de Ingeniería Cloud UTTECAM
 * Ingeniería: Jose Luis Merino Mota
 * Práctica 4: Implementación de Logs Profesionales
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// CONFIGURACIÓN DE LOGS (PRÁCTICA 4)
// ==========================================
const CoreFixLogger = {
    registrar: function(nivel, mensaje) {
        const timestamp = new Date().toLocaleString();
        const formato = `[${timestamp}] [${nivel.toUpperCase()}]: ${mensaje}`;
        
        switch(nivel.toLowerCase()) {
            case 'info':
                console.log(`%c${formato}`, "color: #007bff; font-weight: bold;");
                break;
            case 'warn':
                console.warn(formato);
                break;
            case 'error':
                console.error(formato);
                break;
        }
    }
};

// ==========================================
// PUNTO 1: CONFIGURACIÓN Y CONEXIÓN
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

// Log de Inicio de Sistema
CoreFixLogger.registrar('info', 'CoreFix Cloud: Conexión establecida con Firebase RTDB.');

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
        CoreFixLogger.registrar('info', `Nuevo usuario registrado: ${emailRaw}`);
        alert("✅ Registro exitoso en CoreFix Cloud.");
        window.location.href = 'login.html';
    }).catch(err => {
        CoreFixLogger.registrar('error', `Fallo en registro: ${err.message}`);
    });
};

window.loginUsuario = function(e) {
    if(e) e.preventDefault();
    const userInput = document.getElementById('logEmail').value.trim();
    const pass = document.getElementById('logPass').value;
    const role = document.querySelector('input[name="userRole"]:checked').value;

    if (userInput === "merinomotajoseluis@gmail.com" && pass === "CoreFix2026") {
        CoreFixLogger.registrar('info', 'Acceso de Administrador Maestro detectado.');
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
                    CoreFixLogger.registrar('info', `Sesión iniciada: ${userInput}`);
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userRole', role);
                    localStorage.setItem('staffUser', JSON.stringify(users[key]));
                    window.location.href = 'index.html';
                    break;
                }
            }
        }
        if (!encontrado) {
            CoreFixLogger.registrar('warn', `Intento de acceso fallido: ${userInput}`);
            alert('❌ Datos incorrectos.');
        }
    }, { onlyOnce: true });
};

// ==========================================
// PUNTO 3: COTIZADOR PRO Y MODO EXPRESS
// ==========================================
window.updatePrice = function() {
    let base = parseInt(document.getElementById('damageType').value) || 0;
    if (document.getElementById('expressMode')?.checked && base > 0) base *= 1.20;
    if (document.getElementById('priceDisplay')) document.getElementById('priceDisplay').innerText = Math.round(base);
};

window.aceptarCotizacion = function() {
    const damageType = document.getElementById('damageType');
    const newOrder = {
        id: 'CF-' + Math.floor(1000 + Math.random() * 9000),
        nombre: document.getElementById('clientName').value,
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
        CoreFixLogger.registrar('info', `Cotización generada: ${newOrder.id} para ${newOrder.nombre}`);
        localStorage.setItem('currentOrder', JSON.stringify(newOrder));
        alert("📩 Orden enviada a la nube.");
        window.location.href = 'ticket.html';
    });
};

// ==========================================
// PUNTO 4: PANEL ADMIN REALTIME
// ==========================================
function listenAdminData(filtro = 'TODOS') {
    const tableBody = document.getElementById('adminTableBody');
    if (!tableBody) return;

    onValue(ref(db, 'cotizaciones'), (snapshot) => {
        const data = snapshot.val();
        let cajaReal = 0;
        let logs = data ? Object.entries(data).map(([key, val]) => ({...val, fbKey: key})) : [];
        
        if (filtro !== 'TODOS') logs = logs.filter(l => l.ubicacion === filtro);

        tableBody.innerHTML = logs.reverse().map(log => {
            if (log.estado === "ENTREGADO") cajaReal += log.precio;
            const datosString = JSON.stringify(log).replace(/"/g, '&quot;');

            return `
            <tr class="hover:bg-blue-500/[0.03] border-b border-slate-700/50">
                <td class="p-8">${log.fecha}<br><b class="text-blue-500 text-lg">${log.id}</b></td>
                <td class="p-8"><b class="text-white">${log.nombre}</b></td>
                <td class="p-8"><span class="text-blue-400 text-[10px] font-black uppercase">${log.falla}</span><br><small>${log.ubicacion}</small></td>
                <td class="p-8 text-green-400 font-black">$${log.precio}</td>
                <td class="p-8 text-center"><span class="px-4 py-1.5 rounded-full border border-blue-500/20 uppercase text-[10px]">${log.estado}</span></td>
                <td class="p-8 text-right">
                    ${log.estado !== 'ENTREGADO' ? `
                        <button onclick="cambiarEstadoNube('${log.fbKey}', '${log.estado}', ${datosString})" 
                                class="${log.estado === 'LISTO PARA RECOGER' ? 'bg-blue-600' : 'bg-green-600'} p-3 rounded-xl text-white shadow-lg">
                            <i class="fas ${log.estado === 'LISTO PARA RECOGER' ? 'fa-handshake' : 'fa-check'}"></i>
                        </button>
                    ` : '<span class="text-green-500 font-black text-[10px]">FINALIZADO</span>'}
                    <button onclick="eliminarOrdenNube('${log.fbKey}')" class="bg-red-600/10 p-3 rounded-xl text-red-500 mx-1"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
        actualizarWidgets(cajaReal);
    });
}

// ==========================================
// PUNTO 5: ALMACÉN E INVENTARIO
// ==========================================
window.editarStockNube = (p, a) => {
    const n = prompt(`Stock para ${p}:`, a);
    if (n !== null) {
        update(ref(db, 'inventario/' + p), { cantidad: parseInt(n) });
        CoreFixLogger.registrar('warn', `Inventario modificado: ${p} ahora tiene ${n} unidades.`);
    }
};

// ==========================================
// SEGURIDAD: ELIMINAR REGISTROS
// ==========================================
window.eliminarOrdenNube = (key) => {
    if (confirm("¿Eliminar registro permanentemente?")) {
        remove(ref(db, `cotizaciones/${key}`));
        CoreFixLogger.registrar('error', `Registro eliminado de la base de datos: ${key}`);
    }
};

// ==========================================
// ARRANQUE GLOBAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    listenAdminData();
    // Log final de carga
    CoreFixLogger.registrar('info', 'CoreFix: Interfaz de usuario lista y monitoreada.');
});

window.logout = () => { 
    CoreFixLogger.registrar('warn', 'Cierre de sesión manual ejecutado.');
    localStorage.clear(); 
    window.location.href = 'index.html'; 
};