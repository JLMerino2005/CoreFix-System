/**
 * CoreFix - Lógica Profesional Unificada (Ingeniería de Almacén & Finanzas)
 * Administrador: merinomotajoseluis@gmail.com
 */

// --- 1. MOTOR DE ACCESO ---
document.addEventListener('submit', (e) => {
    if (e.target.id === 'loginForm') {
        e.preventDefault();
        const role = document.querySelector('input[name="userRole"]:checked').value;
        const userInput = document.getElementById('logEmail').value.trim();
        const pass = document.getElementById('logPass').value;

        if (role === 'admin' && userInput === "merinomotajoseluis@gmail.com" && pass === "CoreFix2026") {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('staffUser', JSON.stringify({ name: "José Luis" }));
            window.location.href = 'admin.html';
        } else {
            const savedUser = JSON.parse(localStorage.getItem('staffUser'));
            if (savedUser && (savedUser.email === userInput || savedUser.phone === userInput) && savedUser.pass === pass) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', role);
                window.location.href = 'index.html';
            } else {
                alert('❌ Datos incorrectos.');
            }
        }
    }
});

// --- 2. GESTIÓN DE INTERFAZ ---
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    const path = window.location.pathname;

    if (path.includes('admin.html')) {
        if (isLoggedIn === 'true' && userRole === 'admin') {
            renderAdminTable();
            cargarAlmacenEnInterfaz();
            cargarBitacoraEnInterfaz();
        } else {
            window.location.href = 'login.html';
        }
    }
    
    // Inyectar Avatar si existe el container
    const authCont = document.getElementById('auth-container');
    if (isLoggedIn === 'true' && authCont) {
        const user = JSON.parse(localStorage.getItem('staffUser')) || { name: "U" };
        const avatarHTML = `<div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs bg-blue-600 shadow-lg">${user.name.charAt(0).toUpperCase()}</div>`;
        authCont.innerHTML = `<div class="flex items-center gap-3 bg-slate-800 p-1.5 pr-3 rounded-full border border-blue-500/40 shadow-lg">
            ${avatarHTML} <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest">${userRole === 'admin' ? 'ADMIN' : user.name.split(' ')[0]}</span>
            <button onclick="logout()" class="text-red-500 text-xs ml-1"><i class="fas fa-power-off"></i></button>
        </div>`;
    }
});

// --- 3. PANEL DE ADMINISTRACIÓN & FINANZAS ---
function renderAdminTable(filtroSucursal = 'TODOS') {
    const tableBody = document.getElementById('adminTableBody');
    if (!tableBody) return;

    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    if (filtroSucursal !== 'TODOS') {
        logs = logs.filter(l => l.ubicacion.includes(filtroSucursal));
    }

    let cajaReal = 0;
    let cajaProyectada = 0;
    let entregadosCount = 0;

    if (logs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-32 text-center text-slate-600 uppercase font-black italic opacity-20 text-2xl">Bandeja Vacía</td></tr>`;
        actualizarWidgets(0, 0, 0);
        return;
    }

    tableBody.innerHTML = logs.slice().reverse().map(log => {
        const precio = parseInt(log.precio || 0);
        if (log.estado === "ENTREGADO") {
            cajaReal += precio;
            entregadosCount++;
        } else {
            cajaProyectada += precio;
        }

        let st = log.estado === "ENTREGADO" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20";

        return `
        <tr class="hover:bg-blue-500/[0.03] border-b border-slate-700/50">
            <td class="p-8 text-xs font-mono text-slate-500">${log.fecha}<br><b class="text-blue-500 text-lg">${log.id}</b></td>
            <td class="p-8"><b class="text-white">${log.nombre}</b><br><span class="text-xs text-slate-500">${log.telefono}</span></td>
            <td class="p-8"><span class="text-[10px] font-black uppercase text-blue-400">${log.falla}</span><br><span class="text-[10px] italic text-slate-500">📍 ${log.ubicacion}</span></td>
            <td class="p-8"><b class="text-2xl font-black text-green-400">$${log.precio}</b></td>
            <td class="p-8 text-center"><span class="${st} px-4 py-1.5 rounded-full text-[10px] font-black border uppercase">${log.estado}</span></td>
            <td class="p-8 text-right"><div class="flex gap-2 justify-end">
                <button onclick="cambiarEstado('${log.id}', 'ENTREGADO')" class="bg-green-600 hover:bg-green-500 p-3 rounded-xl text-white transition-all"><i class="fas fa-check"></i></button>
                <button onclick="showEvidencePanel('${log.id}')" class="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl text-white transition-all"><i class="fas fa-camera"></i></button>
                <button onclick="eliminarOrden('${log.id}')" class="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white p-3 rounded-xl transition-all"><i class="fas fa-trash-alt"></i></button>
            </div></td>
        </tr>`;
    }).join('');

    const ticketProm = entregadosCount > 0 ? Math.round(cajaReal / entregadosCount) : 0;
    actualizarWidgets(cajaReal, cajaProyectada, ticketProm);
    
    // Cargar Estadísticas de Fallas
    const stats = {};
    logs.forEach(l => { stats[l.falla] = (stats[l.falla] || 0) + 1; });
    const statsCont = document.getElementById('statsContainer');
    if(statsCont) statsCont.innerHTML = Object.entries(stats).map(([f, t]) => `
        <div class="flex justify-between border-b border-white/5 pb-2"><span>${f}</span><span class="text-blue-500">${t} servicios</span></div>`).join('');
}

function actualizarWidgets(real, proyectado, ticket) {
    if (document.getElementById('cajaReal')) document.getElementById('cajaReal').innerText = `$${real}`;
    if (document.getElementById('totalMoney')) document.getElementById('totalMoney').innerText = `$${proyectado}`;
    if (document.getElementById('ticketPromedio')) document.getElementById('ticketPromedio').innerText = `$${ticket}`;
}

// --- 4. ALMACÉN & BITÁCORA ---
function cargarAlmacenEnInterfaz() {
    const invContainer = document.getElementById('inventoryContainer');
    if (!invContainer) return;
    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    invContainer.innerHTML = inv.map(p => `
        <div onclick="editarCantidad('${p.pieza}')" class="flex justify-between items-center border-b border-white/5 pb-2 group cursor-pointer hover:bg-blue-500/5 p-2 rounded-lg transition-all">
            <div class="flex flex-col">
                <span class="text-slate-300 group-hover:text-blue-400 transition-colors uppercase font-black">${p.pieza}</span>
                <span class="text-[7px] text-slate-500 italic">Costo Ref: $${p.costo || 0}</span>
            </div>
            <span class="${p.cantidad <= 2 ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-green-400 bg-green-400/10'} border border-current px-2 py-0.5 rounded text-[9px] font-black">
                ${p.cantidad} UNID.
            </span>
        </div>`).join('');
}

function registrarMovimiento(pieza, accion, anterior, nueva) {
    let bitacora = JSON.parse(localStorage.getItem('bitacoraCoreFix')) || [];
    const user = JSON.parse(localStorage.getItem('staffUser'))?.name || "Admin";
    bitacora.unshift({
        fecha: new Date().toLocaleString(),
        usuario: user, pieza: pieza, accion: accion, detalle: `De ${anterior} a ${nueva}`
    });
    localStorage.setItem('bitacoraCoreFix', JSON.stringify(bitacora.slice(0, 50)));
    cargarBitacoraEnInterfaz();
}

function cargarBitacoraEnInterfaz() {
    const bitBody = document.getElementById('bitacoraBody');
    if (!bitBody) return;
    const bitacora = JSON.parse(localStorage.getItem('bitacoraCoreFix')) || [];
    bitBody.innerHTML = bitacora.map(log => `
        <tr class="hover:bg-white/5"><td class="p-4 text-slate-500 font-mono">${log.fecha}</td><td class="p-4 text-blue-400">${log.usuario}</td>
        <td class="p-4 text-white uppercase">${log.pieza}</td><td class="p-4"><span class="bg-slate-700 px-2 py-1 rounded text-[7px]">${log.accion}</span></td>
        <td class="p-4 text-slate-400 italic">${log.detalle}</td></tr>`).join('');
}

// --- 5. LOGICA DE NEGOCIO ---
function cambiarEstado(id, nuevo) {
    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const i = logs.findIndex(l => l.id === id);
    if(i !== -1 && logs[i].estado !== "ENTREGADO") { 
        let inv = JSON.parse(localStorage.getItem('inventario')) || [];
        const fallaTxt = logs[i].falla.toLowerCase();
        const idx = inv.findIndex(p => fallaTxt.includes(p.pieza.toLowerCase().split(' ')[0]));
        
        if (idx !== -1 && inv[idx].cantidad > 0) {
            const ant = inv[idx].cantidad;
            inv[idx].cantidad -= 1;
            localStorage.setItem('inventario', JSON.stringify(inv));
            registrarMovimiento(inv[idx].pieza, "VENTA AUTOMÁTICA", ant, inv[idx].cantidad);
        }
        logs[i].estado = nuevo; 
        localStorage.setItem('cotizaciones', JSON.stringify(logs)); 
        alert(`✅ Equipo CF-${id} entregado con éxito.`);
        location.reload();
    }
}

function filtrarSucursal(suc) { renderAdminTable(suc); }

// --- REPORTE DE INGENIERÍA FINANCIERA PARA WHATSAPP ---
function generarReporteRapido() {
    const real = document.getElementById('cajaReal').innerText;
    const gastos = document.getElementById('totalGastos').innerText;
    const utilidad = document.getElementById('utilidadNeta').innerText;
    const proyectado = document.getElementById('totalMoney').innerText;
    
    const user = JSON.parse(localStorage.getItem('staffUser'))?.name || "Admin";
    const fecha = new Date().toLocaleDateString();

    const text = `📊 *COREFIX - REPORTE DE OPERACIONES* 📊%0A` +
                 `📅 *Fecha:* ${fecha}%0A` +
                 `👤 *Responsable:* ${user}%0A%0A` +
                 `━━━━━━━━━━━━━━━━━━%0A` +
                 `💰 *INGRESOS (Ventas):* ${real}%0A` +
                 `💸 *INVERSIÓN (Gastos):* ${gastos}%0A` +
                 `📈 *UTILIDAD NETA:* ${utilidad}%0A` +
                 `━━━━━━━━━━━━━━━━━━%0A` +
                 `🛠️ *EN PROCESO (Caja Proyectada):* ${proyectado}%0A%0A` +
                 `✅ *Reporte generado automáticamente por CoreFix System.*`;

    window.open(`https://wa.me/?text=${text}`, '_blank');
}

// --- 6. UTILIDADES ---
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
function editarCantidad(pName) {
    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    const i = inv.findIndex(p => p.pieza === pName);
    if(i !== -1) {
        const ant = inv[i].cantidad;
        const nueva = prompt(`Stock ${pName}:`, ant);
        if(nueva !== null && !isNaN(nueva)) {
            inv[i].cantidad = parseInt(nueva);
            localStorage.setItem('inventario', JSON.stringify(inv));
            registrarMovimiento(pName, "MANUAL", ant, nueva);
            location.reload();
        }
    }
}
function agregarNuevaRefaccion() {
    const n = prompt("Nombre:"); const c = prompt("Cantidad:"); const cost = prompt("Costo:");
    if(n && c) {
        let inv = JSON.parse(localStorage.getItem('inventario')) || [];
        inv.push({pieza: n, cantidad: parseInt(c), costo: parseInt(cost) || 0});
        localStorage.setItem('inventario', JSON.stringify(inv));
        registrarMovimiento(n, "ALTA", 0, c);
        location.reload();
    }
}
function filterAdminTable() {
    const val = document.getElementById('adminSearch').value.toLowerCase();
    document.querySelectorAll('#adminTableBody tr').forEach(row => { row.style.display = row.innerText.toLowerCase().includes(val) ? '' : 'none'; });
}

// Inicialización
if (!localStorage.getItem('inventario')) {
    localStorage.setItem('inventario', JSON.stringify([{pieza:"Pantalla iPhone OLED",cantidad:5,costo:1200},{pieza:"Batería iPhone",cantidad:10,costo:250},{pieza:"Centro Carga",cantidad:20,costo:30}]));
}
// --- MÓDULO DE COMPRAS Y EGRESOS COREFIX ---

function registrarCompra() {
    const material = prompt("¿Qué refacciones compraste? (Ej: 5 Pantallas iPhone 11)");
    const proveedor = prompt("¿A qué proveedor?");
    const monto = prompt("¿Cuánto pagaste en total?");

    if (material && monto && !isNaN(monto)) {
        let compras = JSON.parse(localStorage.getItem('comprasCoreFix')) || [];
        const nuevaCompra = {
            fecha: new Date().toLocaleDateString(),
            material: material,
            proveedor: proveedor,
            monto: parseInt(monto),
            usuario: JSON.parse(localStorage.getItem('staffUser'))?.name || "Admin"
        };
        
        compras.push(nuevaCompra);
        localStorage.setItem('comprasCoreFix', JSON.stringify(compras));
        
        // Registrar en bitácora para auditoría
        registrarMovimiento("COMPRA MATERIAL", "EGRESO CAJA", 0, monto);
        
        alert("✅ Compra registrada. El balance se ha actualizado.");
        location.reload();
    }
}

// Actualización de la función que calcula los widgets
const originalActualizarWidgets = actualizarWidgets; 
actualizarWidgets = function(real, proyectado, ticket) {
    // Llamamos a la lógica anterior
    if (document.getElementById('cajaReal')) document.getElementById('cajaReal').innerText = `$${real}`;
    if (document.getElementById('totalMoney')) document.getElementById('totalMoney').innerText = `$${proyectado}`;
    if (document.getElementById('ticketPromedio')) document.getElementById('ticketPromedio').innerText = `$${ticket}`;

    // Nueva lógica de Gastos y Utilidad
    const compras = JSON.parse(localStorage.getItem('comprasCoreFix')) || [];
    const totalGastos = compras.reduce((acc, c) => acc + c.monto, 0);
    const utilidad = real - totalGastos;

    if (document.getElementById('totalGastos')) document.getElementById('totalGastos').innerText = `$${totalGastos}`;
    if (document.getElementById('utilidadNeta')) {
        document.getElementById('utilidadNeta').innerText = `$${utilidad}`;
        // Si la utilidad es negativa (gastaste más de lo que ganaste), poner en rojo
        document.getElementById('utilidadNeta').className = utilidad < 0 ? "text-3xl font-black text-red-400" : "text-3xl font-black text-white";
    }
};