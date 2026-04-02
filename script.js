/**
 * CoreFix System Master - Edición de Ingeniería Cloud UTTECAM
 * Ingeniería: Jose Luis Merino Mota
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
        alert("✅ Registro exitoso en CoreFix Cloud.");
        window.location.href = 'login.html';
    });
};

window.loginUsuario = function(e) {
    if(e) e.preventDefault();
    const userInput = document.getElementById('logEmail').value.trim();
    const pass = document.getElementById('logPass').value;
    const role = document.querySelector('input[name="userRole"]:checked').value;

    if (userInput === "merinomotajoseluis@gmail.com" && pass === "CoreFix2026") {
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
        actualizarAnalitica(logs);
    });
}

window.filtrarSucursal = (suc) => listenAdminData(suc);

// ==========================================
// PUNTO 5: ALMACÉN E INVENTARIO
// ==========================================
function listenInventory() {
    const invContainer = document.getElementById('inventoryContainer');
    if (!invContainer) return;
    onValue(ref(db, 'inventario'), (snapshot) => {
        const inv = snapshot.val() || {};
        invContainer.innerHTML = Object.entries(inv).map(([key, p]) => `
            <div onclick="editarStockNube('${key}', ${p.cantidad})" class="flex justify-between p-2 border-b border-white/5 cursor-pointer hover:bg-white/5">
                <span class="text-slate-300 font-black text-[10px] uppercase">${key}</span>
                <span class="${p.cantidad <= 2 ? 'text-red-500 animate-pulse' : 'text-green-400'} font-black">${p.cantidad} U.</span>
            </div>`).join('');
    });
}

window.editarStockNube = (p, a) => {
    const n = prompt(`Stock para ${p}:`, a);
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
            </div>`).join('') || "No se encontró el número.";
        container.classList.remove('hidden');
    }, { onlyOnce: true });
};

// ==========================================
// PUNTO 7: WIDGETS Y METAS
// ==========================================
function actualizarWidgets(real) {
    if (document.getElementById('cajaReal')) document.getElementById('cajaReal').innerText = `$${real}`;
    if (document.getElementById('utilidadNeta')) {
        document.getElementById('utilidadNeta').innerText = `$${real}`;
        const porc = Math.min(Math.round((real / META_MENSUAL) * 100), 100);
        if(document.getElementById('metaBar')) document.getElementById('metaBar').style.width = porc + "%";
        if(document.getElementById('metaPorcentaje')) document.getElementById('metaPorcentaje').innerText = porc + "%";
    }
}

// ==========================================
// PUNTO 8: EXCEL Y REPORTES
// ==========================================
window.exportarExcel = () => {
    onValue(ref(db, 'cotizaciones'), (snapshot) => {
        const data = snapshot.val();
        if(!data) return;
        let csv = "ID,Cliente,Falla,Precio,Estado\n";
        Object.values(data).forEach(o => csv += `${o.id},${o.nombre},${o.falla},${o.precio},${o.estado}\n`);
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = 'CoreFix_Reporte.csv'; a.click();
    }, { onlyOnce: true });
};

window.generarReporteRapido = () => {
    const real = document.getElementById('cajaReal')?.innerText || "$0";
    window.open(`https://wa.me/?text=📊 *REPORTE COREFIX*%0A💰 Ventas: ${real}`, '_blank');
};

window.cambiarEstadoNube = (key, estadoActual, datos) => {
    let nuevoEstado = "";

    if (estadoActual === "EN REVISIÓN" || estadoActual === "REPARANDO") {
        nuevoEstado = "LISTO PARA RECOGER";
        const texto = `*COREFIX INFORMA* %0A%0AHola *${datos.nombre}*, tu equipo *${datos.marca} ${datos.modelo}* ya está reparado y listo para recoger en nuestra sucursal de *${datos.ubicacion}*.%0A%0A Total: *$${datos.precio}*%0A Te esperamos.`;
        window.open(`https://wa.me/52${datos.telefono}?text=${texto}`, '_blank');
    } else if (estadoActual === "LISTO PARA RECOGER") {
        nuevoEstado = "ENTREGADO";
        alert("✅ Equipo entregado y orden finalizada.");
    }

    if (nuevoEstado) {
        update(ref(db, `cotizaciones/${key}`), { estado: nuevoEstado });
    }
};

// CORRECCIÓN: Definición de eliminarOrdenNube para que use la llave correcta
window.eliminarOrdenNube = (key) => {
    if (confirm("¿Eliminar registro permanentemente?")) {
        remove(ref(db, `cotizaciones/${key}`));
    }
};

// ==========================================
// PUNTO 9: MODO NOCHE Y SEGURIDAD
// ==========================================
window.togglePassword = (i, ic) => {
    const input = document.getElementById(i);
    const icon = document.getElementById(ic);
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye-slash');
};

// ==========================================
// FUNCIÓN PARA MOSTRAR PERFIL
// ==========================================
function mostrarPerfilNavbar() {
    const authCont = document.getElementById('auth-container');
    const sesionActiva = localStorage.getItem('isLoggedIn');
    
    if (authCont && sesionActiva === 'true') {
        const user = JSON.parse(localStorage.getItem('staffUser'));
        if (user && user.name) {
            const inicial = user.name.charAt(0).toUpperCase();
            const primerNombre = user.name.split(' ')[0];

            authCont.innerHTML = `
                <div class="flex items-center gap-3 bg-slate-800 p-1.5 pr-4 rounded-full border border-blue-500/40">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs bg-blue-600 shadow-[0_0_10px_#2563eb]">
                        ${inicial}
                    </div>
                    <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        ${primerNombre}
                    </span>
                    <button onclick="logout()" class="text-red-500 hover:text-red-400 transition ml-1">
                        <i class="fas fa-power-off text-xs"></i>
                    </button>
                </div>`;
        }
    }
}

// ==========================================
// ARRANQUE GLOBAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    listenAdminData();
    listenInventory();
    mostrarPerfilNavbar();

    document.getElementById('registerForm')?.addEventListener('submit', window.ejecutarRegistro);
    document.getElementById('loginForm')?.addEventListener('submit', window.loginUsuario);
    
    if (new Date().getHours() >= 20 || new Date().getHours() < 6) document.body.classList.add('bg-slate-950');
});

window.logout = () => { localStorage.clear(); window.location.href = 'index.html'; };

// Gráficas Analíticas
function actualizarAnalitica(logs) {
    const ctx = document.getElementById('marcasChart');
    if (!ctx || typeof Chart === 'undefined') return;
    const marcas = {};
    logs.forEach(l => marcas[l.marca] = (marcas[l.marca] || 0) + 1);
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(marcas),
            datasets: [{ data: Object.values(marcas), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'] }]
        }
    });
}