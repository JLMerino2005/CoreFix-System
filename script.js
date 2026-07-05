/**
 * CoreFix System - Edición Vitrina Cloud Interactiva (Producción)
 * Ingeniería: Jose Luis Merino Mota
 * Control de Evidencias en Tiempo Real & Cotizador Modular
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// CONFIGURACIÓN Y CONEXIÓN CLOUD
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBgoQDuWsn8_alITK2FwQQ0RF3T5kW1k20",
  authDomain: "corefix-system.firebaseapp.com",
  projectId: "corefix-system",
  databaseURL: "https://corefix-system-default-rtdb.firebaseio.com",
  storageBucket: "corefix-system.appspot.com",
  messagingSenderId: "1081209996313",
  appId: "1:1081209996313:web:6c89f5936f328da1c3d688"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// LOGIN SECRETO (AL HACER CLIC EN TU FOTO DE PERFIL)
// ==========================================
window.loginSecretoAdmin = function() {
    const pass = prompt("🔐 Introduzca la clave maestra del Laboratorio CoreFix:");
    if (pass === "CoreFix2026") {
        localStorage.setItem('adminCoreFix', 'true');
        document.getElementById('adminPanelTrabajos')?.classList.remove('hidden');
        alert("✅ Modo Ingeniero activado. Panel de evidencias de la nube desbloqueado.");
        window.location.href = "#marcas";
        listenTrabajosTerminados(); 
    } else if (pass !== null) {
        alert("❌ Clave incorrecta. Acceso denegado.");
    }
};

window.cerrarSesionAdmin = function() {
    localStorage.removeItem('adminCoreFix');
    document.getElementById('adminPanelTrabajos')?.classList.add('hidden');
    location.reload();
};

// ==========================================
// PUBLICAR NUEVOS TRABAJOS (ESCRITURA EXCLUSIVA ADMIN)
// ==========================================
window.publicarTrabajo = function(e) {
    if(e) e.preventDefault();
    if(localStorage.getItem('adminCoreFix') !== 'true') return;

    const nuevoTrabajo = {
        modelo: document.getElementById('admModelo').value.trim(),
        marca: document.getElementById('admMarca').value,
        sede: document.getElementById('admSede').value.trim(),
        falla: document.getElementById('admFalla').value.trim(),
        solucion: document.getElementById('admSolucion').value.trim(),
        foto: document.getElementById('admUrlFoto').value.trim()
    };

    push(ref(db, 'trabajos_terminados'), nuevoTrabajo).then(() => {
        alert("🎯 Caso de éxito publicado con éxito en la nube.");
        document.getElementById('formNuevoTrabajo').reset();
    });
};

// ==========================================
// ELIMINACIÓN DE REGISTROS (SEGURIDAD ADMIN)
// ==========================================
window.eliminarTrabajo = function(key) {
    if(localStorage.getItem('adminCoreFix') !== 'true') return;
    
    if(confirm("¿Eliminar este caso de éxito de la vitrina de forma permanente?")) {
        remove(ref(db, `trabajos_terminados/${key}`));
    }
};

// ==========================================
// RENDERIZAR VITRINA EN TIEMPO REAL (VISTA PÚBLICA)
// ==========================================
function listenTrabajosTerminados() {
    const contenedor = document.getElementById('contenedorCasosExito');
    const isAdmin = localStorage.getItem('adminCoreFix') === 'true';

    if (!contenedor) return;

    onValue(ref(db, 'trabajos_terminados'), (snapshot) => {
        const data = snapshot.val();
        if(!data) {
            contenedor.innerHTML = `<p class="text-center md:col-span-3 text-slate-500 uppercase tracking-widest text-xs py-12">No hay trabajos registrados en la vitrina todavía.</p>`;
            return;
        }

        contenedor.innerHTML = Object.entries(data).reverse().map(([key, val]) => {
            let badgeColor = "bg-blue-600";
            if(val.marca === 'Apple') badgeColor = "bg-white text-black";
            if(val.marca === 'Motorola') badgeColor = "bg-red-600";
            if(val.marca === 'Xiaomi') badgeColor = "bg-orange-600";

            return `
            <div class="p-6 rounded-[2.5rem] glass-card border border-white/5 hover:border-blue-500/40 transition-all group overflow-hidden relative flex flex-col justify-between">
                <div>
                    <div class="relative rounded-2xl overflow-hidden mb-6 h-48 bg-slate-900 flex items-center justify-center">
                        <img src="${val.foto}" alt="${val.modelo}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='img/Logo.png'">
                        <span class="absolute top-4 left-4 ${badgeColor} text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                            ${val.marca}
                        </span>
                        <span class="absolute top-4 right-4 bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                            Entregado
                        </span>
                    </div>
                    <div class="px-2">
                        <h4 class="text-xl font-black uppercase italic mb-1">${val.modelo}</h4>
                        <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4">📍 Sede ${val.sede}</p>
                        <div class="space-y-2 text-xs border-t border-white/5 pt-4 text-slate-400 font-medium">
                            <p><b class="text-slate-200 uppercase text-[10px]">Falla:</b> ${val.falla}</p>
                            <p><b class="text-slate-200 uppercase text-[10px]">Solución:</b> ${val.solucion}</p>
                        </div>
                    </div>
                </div>
                ${isAdmin ? `
                    <button onclick="window.eliminarTrabajo('${key}')" class="mt-6 w-full bg-red-600/20 text-red-400 border border-red-500/30 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all tracking-widest">Eliminar Evidencia</button>
                ` : ''}
            </div>`;
        }).join('');
    });
}

// ==========================================
// MOTOR DEL COTIZADOR (PÁGINA COTIZAR)
// ==========================================
window.updatePrice = function() {
    let base = parseInt(document.getElementById('damageType').value) || 0;
    if (document.getElementById('expressMode')?.checked && base > 0) base *= 1.20;
    if (document.getElementById('priceDisplay')) document.getElementById('priceDisplay').innerText = Math.round(base);
};

window.aceptarCotizacion = function() {
    const nombre = document.getElementById('clientName').value.trim();
    const telefono = document.getElementById('clientPhone').value.trim();
    const marca = document.getElementById('clientBrand').value.trim();
    const modelo = document.getElementById('clientModel').value.trim();
    const damageSelect = document.getElementById('damageType');
    const falla = damageSelect.options[damageSelect.selectedIndex].text;
    const precio = document.getElementById('priceDisplay').innerText;
    const ubicacion = document.getElementById('deliveryPoint').value;
    const expressActive = document.getElementById('expressMode')?.checked ? "SÍ (Alta Prioridad)" : "No";

    if (!nombre || !modelo || damageSelect.value === "0") {
        alert("🚨 Por favor, introduce tu nombre, modelo del equipo y selecciona la falla.");
        return;
    }

    const mensaje = `*🔥 NUEVA COTIZACIÓN EN COREFIX* %0A%0A` +
                    `*👤 Cliente:* ${nombre}%0A` +
                    `*📱 Celular/WhatsApp:* ${telefono}%0A` +
                    `*📦 Equipo:* ${marca} ${modelo}%0A` +
                    `*🛠️ Falla Reportada:* ${falla}%0A` +
                    `*⚡ Servicio Express:* ${expressActive}%0A` +
                    `*💰 Inversión Estimada:* $${precio} MXN%0A` +
                    `*📍 Sucursal de Entrega:* ${ubicacion}%0A%0A` +
                    `_¡Hola! Vengo desde la página web y me gustaría agendar la reparación de mi equipo._`;

    window.open(`https://wa.me/5212231059545?text=${mensaje}`, '_blank');
};

// ==========================================
// ARRANQUE GLOBAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    listenTrabajosTerminados();

    if (localStorage.getItem('adminCoreFix') === 'true' && document.getElementById('adminPanelTrabajos')) {
        document.getElementById('adminPanelTrabajos').classList.remove('hidden');
    }
});