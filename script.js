/**
 * CoreFix System v3.0 - Edición Especial UTTECAM
 * Administrador: merinomotajoseluis@gmail.com
 */

// --- 1. MOTOR DE ACCESO Y PERSISTENCIA DE USUARIOS ---
document.addEventListener('submit', (e) => {
    // REGISTRO DE USUARIOS (Colección para que no se borren)
    if (e.target.id === 'registerForm') {
        e.preventDefault();
        const nuevoUser = {
            name: document.getElementById('regName').value,
            email: document.getElementById('regEmail').value.trim(),
            pass: document.getElementById('regPass').value,
            fechaRegistro: new Date().toLocaleDateString()
        };

        let db = JSON.parse(localStorage.getItem('dbUsuariosCoreFix')) || [];
        if (db.find(u => u.email === nuevoUser.email)) return alert("❌ Este correo/teléfono ya existe en CoreFix.");

        db.push(nuevoUser);
        localStorage.setItem('dbUsuariosCoreFix', JSON.stringify(db));
        alert("✅ ¡Bienvenido a CoreFix! Registro exitoso.");
        window.location.href = 'login.html';
    }

    // LOGIN DINÁMICO (Busca en toda la base de datos)
    if (e.target.id === 'loginForm') {
        e.preventDefault();
        const role = document.querySelector('input[name="userRole"]:checked').value;
        const userInput = document.getElementById('logEmail').value.trim();
        const pass = document.getElementById('logPass').value;

        // Credenciales de Dueño (Master Admin)
        if (role === 'admin' && userInput === "merinomotajoseluis@gmail.com" && pass === "CoreFix2026") {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('staffUser', JSON.stringify({ name: "José Luis" }));
            return window.location.href = 'admin.html';
        } 

        // Búsqueda en Base de Datos de Clientes/Staff
        let db = JSON.parse(localStorage.getItem('dbUsuariosCoreFix')) || [];
        const user = db.find(u => u.email === userInput && u.pass === pass);
        if (user) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', role);
            localStorage.setItem('staffUser', JSON.stringify(user));
            window.location.href = 'index.html';
        } else {
            alert('❌ Datos incorrectos. Si olvidaste tu contraseña, usa el botón de recuperar.');
        }
    }
});

// --- 2. SEMÁFORO DE PRIORIDAD (SLA Tracker) ---
function calcularSemaforo(fechaOrden) {
    const hoy = new Date();
    const partes = fechaOrden.split('/');
    const registro = new Date(partes[2], partes[1] - 1, partes[0]);
    const diffHoras = (hoy - registro) / (1000 * 60 * 60);

    if (diffHoras > 48) return "animate-pulse text-red-500 font-black"; // Crítico (+2 días)
    if (diffHoras > 24) return "text-yellow-500 font-bold"; // Pendiente (+1 día)
    return "text-blue-500"; // Reciente
}

// --- 3. PANEL DE ADMINISTRACIÓN Y FINANZAS ---
function renderAdminTable(filtroSucursal = 'TODOS') {
    const tableBody = document.getElementById('adminTableBody');
    if (!tableBody) return;

    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    if (filtroSucursal !== 'TODOS') logs = logs.filter(l => l.ubicacion.includes(filtroSucursal));

    let cajaReal = 0, cajaProyectada = 0, entregadosCount = 0;

    tableBody.innerHTML = logs.slice().reverse().map(log => {
        const precio = parseInt(log.precio || 0);
        if (log.estado === "ENTREGADO") {
            cajaReal += precio; entregadosCount++;
        } else {
            cajaProyectada += precio;
        }

        let st = log.estado === "ENTREGADO" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20";
        let semaforo = log.estado !== "ENTREGADO" ? calcularSemaforo(log.fecha) : "text-green-500";

        return `
        <tr class="hover:bg-blue-500/[0.03] border-b border-slate-700/50">
            <td class="p-8 text-xs font-mono text-slate-500">${log.fecha}<br><b class="${semaforo} text-lg">${log.id}</b></td>
            <td class="p-8"><b class="text-white">${log.nombre}</b><br><span class="text-xs text-slate-500">${log.telefono}</span></td>
            <td class="p-8"><span class="text-[10px] font-black uppercase text-blue-400">${log.falla}</span><br><span class="text-[10px] italic text-slate-500">📍 ${log.ubicacion}</span></td>
            <td class="p-8"><b class="text-2xl font-black text-green-400">$${log.precio}</b></td>
            <td class="p-8 text-center"><span class="${st} px-4 py-1.5 rounded-full text-[10px] font-black border uppercase">${log.estado}</span></td>
            <td class="p-8 text-right"><div class="flex gap-2 justify-end">
                <button onclick="cambiarEstado('${log.id}', 'ENTREGADO')" class="bg-green-600 p-3 rounded-xl text-white"><i class="fas fa-check"></i></button>
                <button onclick="showEvidencePanel('${log.id}')" class="bg-blue-600 p-3 rounded-xl text-white ml-2"><i class="fas fa-camera"></i></button>
                <button onclick="eliminarOrden('${log.id}')" class="bg-red-600/10 p-3 rounded-xl text-red-500 ml-2"><i class="fas fa-trash-alt"></i></button>
            </div></td>
        </tr>`;
    }).join('');

    const ticketProm = entregadosCount > 0 ? Math.round(cajaReal / entregadosCount) : 0;
    actualizarWidgets(cajaReal, cajaProyectada, ticketProm);
    actualizarAnalisis(logs);
}

function actualizarWidgets(real, proyectado, ticket) {
    const compras = JSON.parse(localStorage.getItem('comprasCoreFix')) || [];
    const totalGastos = compras.reduce((acc, c) => acc + c.monto, 0);
    const utilidad = real - totalGastos;

    if (document.getElementById('cajaReal')) document.getElementById('cajaReal').innerText = `$${real}`;
    if (document.getElementById('totalMoney')) document.getElementById('totalMoney').innerText = `$${proyectado}`;
    if (document.getElementById('ticketPromedio')) document.getElementById('ticketPromedio').innerText = `$${ticket}`;
    if (document.getElementById('totalGastos')) document.getElementById('totalGastos').innerText = `$${totalGastos}`;
    if (document.getElementById('utilidadNeta')) {
        document.getElementById('utilidadNeta').innerText = `$${utilidad}`;
        document.getElementById('utilidadNeta').className = utilidad < 0 ? "text-3xl font-black text-red-400" : "text-3xl font-black text-white";
    }
}

function actualizarAnalisis(logs) {
    const statsCont = document.getElementById('statsContainer');
    if(!statsCont) return;
    
    let db = JSON.parse(localStorage.getItem('dbUsuariosCoreFix')) || [];
    const stats = {};
    logs.forEach(l => { stats[l.falla] = (stats[l.falla] || 0) + 1; });

    let fallasHtml = Object.entries(stats).map(([f, t]) => `
        <div class="flex justify-between border-b border-white/5 pb-2"><span>${f}</span><span class="text-blue-500">${t} servicios</span></div>`).join('');
    
    statsCont.innerHTML = `<div class="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 mb-6 text-center">
        <p class="text-[10px] uppercase text-slate-500 font-black tracking-widest">Base de Clientes</p>
        <h4 class="text-3xl font-black text-blue-400">${db.length}</h4>
    </div>` + fallasHtml;
}

// --- 4. GESTIÓN DE ALMACÉN Y BITÁCORA ---
function cargarAlmacenEnInterfaz() {
    const invContainer = document.getElementById('inventoryContainer');
    if (!invContainer) return;
    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    invContainer.innerHTML = inv.map(p => `
        <div onclick="editarCantidad('${p.pieza}')" class="flex justify-between items-center border-b border-white/5 pb-2 group cursor-pointer hover:bg-blue-500/5 p-2 rounded-lg transition-all">
            <div class="flex flex-col">
                <span class="text-slate-300 group-hover:text-blue-400 uppercase font-black">${p.pieza}</span>
                <span class="text-[7px] text-slate-500 italic">Inversión Unit: $${p.costo || 0}</span>
            </div>
            <span class="${p.cantidad <= 2 ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-green-400 bg-green-400/10'} border border-current px-2 rounded text-[9px] font-black">${p.cantidad} UNID.</span>
        </div>`).join('');
}

function registrarMovimiento(pieza, accion, ant, nueva) {
    let bitacora = JSON.parse(localStorage.getItem('bitacoraCoreFix')) || [];
    bitacora.unshift({
        fecha: new Date().toLocaleString(),
        usuario: JSON.parse(localStorage.getItem('staffUser'))?.name || "Admin",
        pieza: pieza, accion: accion, detalle: `Stock de ${ant} a ${nueva}`
    });
    localStorage.setItem('bitacoraCoreFix', JSON.stringify(bitacora.slice(0, 50)));
}

// --- 5. REPORTES Y WHATSAPP ---
function generarReporteRapido() {
    const real = document.getElementById('cajaReal').innerText;
    const gastos = document.getElementById('totalGastos').innerText;
    const utilidad = document.getElementById('utilidadNeta').innerText;
    const proj = document.getElementById('totalMoney').innerText;
    
    const text = `📊 *COREFIX REPORT* 📊%0A💰 *Ventas:* ${real}%0A💸 *Gastos:* ${gastos}%0A📈 *Ganancia Real:* ${utilidad}%0A🛠️ *En Espera:* ${proj}`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function recuperarPass() {
    const mail = prompt("Ingresa tu correo o WhatsApp:");
    let db = JSON.parse(localStorage.getItem('dbUsuariosCoreFix')) || [];
    const user = db.find(u => u.email === mail);
    if(user) alert(`🔑 Tu contraseña es: [ ${user.pass} ]`);
    else alert("❌ Usuario no encontrado.");
}

// --- 6. FUNCIONES DE CONTROL ---
function registrarCompra() {
    const mat = prompt("Material:"); const prov = prompt("Proveedor:"); const monto = prompt("Monto:");
    if (mat && monto) {
        let compras = JSON.parse(localStorage.getItem('comprasCoreFix')) || [];
        compras.push({fecha: new Date().toLocaleDateString(), material: mat, proveedor: prov, monto: parseInt(monto)});
        localStorage.setItem('comprasCoreFix', JSON.stringify(compras));
        location.reload();
    }
}

function cambiarEstado(id, nuevo) {
    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const i = logs.findIndex(l => l.id === id);
    if(i !== -1 && logs[i].estado !== "ENTREGADO") {
        logs[i].estado = nuevo;
        localStorage.setItem('cotizaciones', JSON.stringify(logs));
        location.reload();
    }
}

function filtrarSucursal(suc) { renderAdminTable(suc); }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }

// --- 7. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('admin.html')) {
        renderAdminTable(); 
        cargarAlmacenEnInterfaz();
    }
    
    const authCont = document.getElementById('auth-container');
    if (authCont && localStorage.getItem('isLoggedIn') === 'true') {
        const user = JSON.parse(localStorage.getItem('staffUser'));
        authCont.innerHTML = `<div class="flex items-center gap-3 bg-slate-800 p-1.5 pr-3 rounded-full border border-blue-500/40">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs bg-blue-600">${user.name.charAt(0).toUpperCase()}</div>
            <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest">${user.name.split(' ')[0]}</span>
            <button onclick="logout()" class="text-red-500 text-xs ml-1"><i class="fas fa-power-off"></i></button>
        </div>`;
    }
});
// --- LÓGICA DE META COREFIX ---
const META_MENSUAL = 10000; // Puedes cambiar tu meta aquí, Ingeniero

function calcularMeta(utilidad) {
    const porcentaje = Math.min(Math.round((utilidad / META_MENSUAL) * 100), 100);
    const bar = document.getElementById('metaBar');
    const txt = document.getElementById('metaPorcentaje');
    
    if(bar && txt) {
        bar.style.width = porcentaje + "%";
        txt.innerText = porcentaje + "%";
        // Si llegas al 100%, la barra brilla en dorado
        if(porcentaje >= 100) bar.classList.add('bg-yellow-400', 'shadow-[0_0_15px_#facc15]');
    }
}

// Llama a calcularMeta(utilidad) dentro de tu función actualizarWidgets

// --- 8. RESTAURACIÓN DEL ALMACÉN (PIEZAS Y VISUALIZACIÓN) ---

// Función para mostrar las piezas en el cuadro de "Almacén de Refacciones"
function cargarAlmacenEnInterfaz() {
    const invContainer = document.getElementById('inventoryContainer');
    if (!invContainer) return;

    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    
    // Si por alguna razón el inventario se borró, cargar el stock por defecto
    if (inv.length === 0) {
        inv = [
            { pieza: "Pantalla iPhone OLED", cantidad: 5, costo: 1200 },
            { pieza: "Pantalla iPhone Incell", cantidad: 8, costo: 650 },
            { pieza: "Pantalla Samsung A/M", cantidad: 6, costo: 850 },
            { pieza: "Batería iPhone Premium", cantidad: 12, costo: 250 },
            { pieza: "Batería Android Uni", cantidad: 15, costo: 160 },
            { pieza: "Centro de Carga", cantidad: 40, costo: 30 },
            { pieza: "Mica de Cerámica", cantidad: 50, costo: 40 }
        ];
        localStorage.setItem('inventario', JSON.stringify(inv));
    }

    invContainer.innerHTML = inv.map(p => `
        <div onclick="editarCantidad('${p.pieza}')" class="flex justify-between items-center border-b border-white/5 pb-2 group cursor-pointer hover:bg-blue-500/5 p-2 rounded-lg transition-all">
            <div class="flex flex-col">
                <span class="text-slate-300 group-hover:text-blue-400 uppercase font-black text-[10px]">${p.pieza}</span>
                <span class="text-[7px] text-slate-500 italic font-bold">Inversión: $${p.costo || 0}</span>
            </div>
            <span class="${p.cantidad <= 2 ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-green-400 bg-green-400/10'} border border-current px-2 py-0.5 rounded text-[9px] font-black">
                ${p.cantidad} UNID.
            </span>
        </div>`).join('');
}

// Función para subir o bajar el stock manualmente al hacer clic
function editarCantidad(pName) {
    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    const i = inv.findIndex(p => p.pieza === pName);
    if(i !== -1) {
        const ant = inv[i].cantidad;
        const nueva = prompt(`Actualizar Stock de ${pName}:`, ant);
        if(nueva !== null && !isNaN(nueva)) {
            inv[i].cantidad = parseInt(nueva);
            localStorage.setItem('inventario', JSON.stringify(inv));
            
            // Registrar el movimiento en la bitácora
            let bitacora = JSON.parse(localStorage.getItem('bitacoraCoreFix')) || [];
            bitacora.unshift({
                fecha: new Date().toLocaleString(),
                usuario: JSON.parse(localStorage.getItem('staffUser'))?.name || "Admin",
                pieza: pName, accion: "MANUAL", detalle: `Stock de ${ant} a ${nueva}`
            });
            localStorage.setItem('bitacoraCoreFix', JSON.stringify(bitacora.slice(0, 50)));
            
            location.reload(); // Recargar para ver los cambios
        }
    }
}

// Función para agregar una pieza nueva que no esté en la lista
function agregarNuevaRefaccion() {
    const n = prompt("Nombre de la refacción:");
    const c = prompt("Cantidad inicial:");
    const cost = prompt("Costo de compra:");
    if(n && c) {
        let inv = JSON.parse(localStorage.getItem('inventario')) || [];
        inv.push({ pieza: n, cantidad: parseInt(c), costo: parseInt(cost) || 0 });
        localStorage.setItem('inventario', JSON.stringify(inv));
        location.reload();
    }
}
// ========================================================
// MÓDULO DE INTELIGENCIA DE ALMACÉN Y ALERTAS
// ========================================================

/**
 * Renderiza las piezas en el contenedor de inventario y 
 * genera alertas si el stock es crítico (2 o menos).
 */
function cargarAlmacenEnInterfaz() {
    const invContainer = document.getElementById('inventoryContainer');
    const alertContainer = document.getElementById('stockAlertContainer');
    if (!invContainer) return;

    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    
    // 1. Verificar Piezas Agotadas para Alerta
    const piezasBajas = inv.filter(p => p.cantidad <= 2);
    if (alertContainer) {
        if (piezasBajas.length > 0) {
            alertContainer.innerHTML = `
                <div class="animate-bounce bg-red-600/20 border border-red-500 p-4 rounded-2xl flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <i class="fas fa-exclamation-triangle text-red-500"></i>
                    <div>
                        <p class="text-[10px] font-black uppercase text-red-200 tracking-widest">Alerta de Stock Crítico</p>
                        <p class="text-[9px] text-red-400 uppercase font-bold">Tienes ${piezasBajas.length} piezas por agotarse. Revisa el almacén.</p>
                    </div>
                </div>`;
        } else {
            alertContainer.innerHTML = '';
        }
    }

    // 2. Dibujar las tarjetas de refacciones
    invContainer.innerHTML = inv.map(p => `
        <div onclick="editarCantidad('${p.pieza}')" class="flex justify-between items-center border-b border-white/5 pb-2 group cursor-pointer hover:bg-blue-500/5 p-2 rounded-lg transition-all">
            <div class="flex flex-col">
                <span class="text-slate-300 group-hover:text-blue-400 uppercase font-black text-[10px]">${p.pieza}</span>
                <span class="text-[7px] text-slate-500 italic font-bold">Costo Unit: $${p.costo || 0}</span>
            </div>
            <span class="${p.cantidad <= 2 ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-green-400 bg-green-400/10'} border border-current px-2 py-0.5 rounded text-[9px] font-black">
                ${p.cantidad} UNID.
            </span>
        </div>`).join('');
}

/**
 * Permite editar el stock manualmente al hacer clic en una pieza
 */
function editarCantidad(pName) {
    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    const i = inv.findIndex(p => p.pieza === pName);
    if(i !== -1) {
        const ant = inv[i].cantidad;
        const nueva = prompt(`CoreFix Almacén - ${pName}\nCantidad actual: ${ant}\nNueva cantidad:`, ant);
        
        if(nueva !== null && !isNaN(nueva)) {
            inv[i].cantidad = parseInt(nueva);
            localStorage.setItem('inventario', JSON.stringify(inv));
            
            // Registrar movimiento en bitácora si existe la función
            if(typeof registrarMovimiento === 'function') {
                registrarMovimiento(pName, "EDICIÓN STOCK", ant, nueva);
            }
            
            location.reload(); 
        }
    }
}

/**
 * Agrega una pieza totalmente nueva al inventario
 */
function agregarNuevaRefaccion() {
    const n = prompt("Nombre de la nueva refacción:");
    const c = prompt("Cantidad inicial:");
    const cost = prompt("Costo de compra (Inversión):");
    
    if(n && c && !isNaN(c)) {
        let inv = JSON.parse(localStorage.getItem('inventario')) || [];
        inv.push({ pieza: n, cantidad: parseInt(c), costo: parseInt(cost) || 0 });
        localStorage.setItem('inventario', JSON.stringify(inv));
        location.reload();
    }
}
// ========================================================
// SISTEMA DE ALERTAS INTELIGENTES (NEÓN STATUS)
// ========================================================

/**
 * Escanea el inventario y actualiza el Dashboard con 
 * estados visuales dinámicos (Azul OK / Rojo CRÍTICO).
 */
function actualizarAlertasStock() {
    const alertContainer = document.getElementById('stockAlertContainer');
    if (!alertContainer) return;

    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    const piezasBajas = inv.filter(p => p.cantidad <= 2);

    if (piezasBajas.length > 0) {
        // --- ESTADO CRÍTICO (ROJO NEÓN) ---
        alertContainer.innerHTML = `
            <div class="animate-bounce bg-red-600/10 border border-red-500 p-4 rounded-2xl flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <div class="flex items-center gap-3">
                    <i class="fas fa-exclamation-triangle text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></i>
                    <div>
                        <p class="text-[10px] font-black uppercase text-red-200 tracking-widest">Alerta de Suministros</p>
                        <p class="text-[8px] text-red-400 uppercase font-bold">Faltan ${piezasBajas.length} tipos de refacciones. ¡Surtir ahora!</p>
                    </div>
                </div>
                <span class="text-[7px] bg-red-600 text-white px-2 py-1 rounded-full font-black animate-pulse uppercase tracking-widest">Crítico</span>
            </div>`;
    } else {
        // --- ESTADO ÓPTIMO (AZUL NEÓN) ---
        alertContainer.innerHTML = `
            <div class="bg-blue-600/5 border border-blue-500/30 p-3 rounded-2xl flex items-center justify-between shadow-[0_0_10px_rgba(59,130,246,0.1)] opacity-80 hover:opacity-100 transition-opacity">
                <div class="flex items-center gap-3">
                    <i class="fas fa-check-circle text-blue-500"></i>
                    <p class="text-[9px] font-black uppercase text-blue-300 tracking-[0.2em]">Inventario CoreFix: Operativo</p>
                </div>
                <span class="text-[7px] text-blue-400 font-black uppercase tracking-widest">Stock OK</span>
            </div>`;
    }
}

// Inyectar la llamada a las alertas dentro de cargarAlmacenEnInterfaz
// para que se actualice cada vez que cambias una cantidad.
const originalCargarAlmacen = cargarAlmacenEnInterfaz;
cargarAlmacenEnInterfaz = function() {
    originalCargarAlmacen();
    actualizarAlertasStock();
};

// Ejecutar al inicio
document.addEventListener('DOMContentLoaded', actualizarAlertasStock);
// ========================================================
// ========================================================
// SISTEMA DE GARANTÍAS COREFIX (90 DÍAS)
// ========================================================

function renderGarantiasTable() {
    const tableBody = document.getElementById('garantiasTableBody');
    if (!tableBody) return;

    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const entregados = logs.filter(l => l.estado === "ENTREGADO");

    // Validación: Si no hay garantías, mostramos un mensaje limpio
    if (entregados.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="p-10 text-center text-slate-700 uppercase font-black italic">No hay garantías activas</td></tr>';
        return;
    }

    tableBody.innerHTML = entregados.slice().reverse().map(log => {
        const partes = log.fecha.split('/');
        const fechaEntrega = new Date(partes[2], partes[1] - 1, partes[0]);
        const hoy = new Date();
        const diasRestantes = 90 - Math.floor((hoy - fechaEntrega) / (1000 * 60 * 60 * 24));

        let colorGarantia = diasRestantes <= 0 ? "text-slate-600 border-slate-600/30" : 
                            diasRestantes <= 10 ? "text-yellow-500 border-yellow-500/30 animate-pulse" : 
                            "text-blue-400 border-blue-400/30";

        return `
            <tr class="hover:bg-white/5 transition-colors border-b border-white/5">
                <td class="p-4 font-black text-blue-500">${log.id}</td>
                <td class="p-4 text-white">${log.nombre}</td>
                <td class="p-4 font-mono text-slate-500">${log.fecha}</td>
                <td class="p-4 font-black ${diasRestantes <= 10 ? 'text-red-500' : 'text-slate-300'}">${Math.max(0, diasRestantes)} D</td>
                <td class="p-4"><span class="px-3 py-1 rounded-full border text-[7px] font-black ${colorGarantia}">${diasRestantes <= 0 ? 'EXPIRADA' : 'VIGENTE'}</span></td>
                <td class="p-4">
                    <div class="flex gap-2">
                        <button onclick="enviarTicketWhatsApp('${log.id}')" class="bg-green-500/10 text-green-500 p-2 rounded-lg border border-green-500/30 hover:bg-green-500 hover:text-white transition-all" title="Enviar WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        <button onclick="descargarTicketPDF('${log.id}')" class="bg-red-500/10 text-red-500 p-2 rounded-lg border border-red-500/30 hover:bg-red-500 hover:text-white transition-all" title="Descargar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

// Inyectar la llamada al renderizado de garantías
const originalAdminTable = renderAdminTable;
renderAdminTable = function(filtro) {
    originalAdminTable(filtro);
    renderGarantiasTable();
};

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', renderGarantiasTable);
// ========================================================
// GENERADOR DE TICKET DE GARANTÍA WHATSAPP
// ========================================================

function enviarTicketWhatsApp(id) {
    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const log = logs.find(l => l.id === id);

    if (!log) return alert("❌ No se encontró la orden.");

    // Formatear el mensaje para el cliente
    const mensaje = `*COREFIX - TICKET DE GARANTÍA* 📱%0A%0A` +
        `Hola *${log.nombre}*, gracias por confiar en nosotros. Tu equipo ha sido entregado exitosamente.%0A%0A` +
        `📄 *Folio:* ${log.id}%0A` +
        `🛠️ *Servicio:* ${log.falla}%0A` +
        `💰 *Total Pagado:* $${log.precio}%0A` +
        `📅 *Fecha de Entrega:* ${log.fecha}%0A%0A` +
        `🛡️ *Garantía:* Recuerda que cuentas con *90 días* de cobertura en tu reparación por defectos de fábrica.%0A%0A` +
        `📍 *Ubicación:* ${log.ubicacion}%0A%0A` +
        `¡Cualquier duda, estamos a tus órdenes! 🛠️💎`;

    // Abrir WhatsApp con el número del cliente
    const tel = log.telefono.replace(/\D/g, ''); // Limpiar el número
    window.open(`https://wa.me/52${tel}?text=${mensaje}`, '_blank');
}

// --- ACTUALIZA TU RENDER DE TABLA DE GARANTÍAS ---
// Busca la función renderGarantiasTable y agrega esta celda al final del return del map:
// `<td class="p-4 text-right">
//     <button onclick="enviarTicketWhatsApp('${log.id}')" class="bg-green-600/20 text-green-400 p-2 rounded-lg border border-green-500/30 hover:bg-green-500 hover:text-white transition-all">
//         <i class="fab fa-whatsapp"></i>
//     </button>
// </td>`
// ========================================================
// GENERADOR DE TICKETS PROFESIONALES (PDF)
// ========================================================

async function descargarTicketPDF(id) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 150] }); // Formato Ticket Térmico
    
    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const log = logs.find(l => l.id === id);
    if (!log) return alert("Orden no encontrada");

    // DISEÑO DEL TICKET
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("COREFIX", 40, 15, { align: "center" });
    
    doc.setFontSize(8);
    doc.text("Soporte Técnico Especializado", 40, 20, { align: "center" });
    doc.text("________________________________", 40, 23, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.text(`FOLIO: ${log.id}`, 10, 30);
    doc.text(`FECHA: ${log.fecha}`, 10, 35);
    doc.text(`CLIENTE: ${log.nombre}`, 10, 40);
    doc.text(`SUCURSAL: ${log.ubicacion}`, 10, 45);

    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DEL SERVICIO:", 10, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Falla: ${log.falla}`, 10, 60);
    doc.text(`Total: $${log.precio}.00 MXN`, 10, 65);

    doc.setFont("helvetica", "bold");
    doc.text("PÓLIZA DE GARANTÍA", 40, 80, { align: "center" });
    doc.setFontSize(6);
    const terminos = doc.splitTextToSize("Este ticket ampara una garantía de 90 días naturales a partir de la fecha de entrega. La garantía es válida únicamente por defectos en la refacción instalada o mano de obra. No aplica en equipos mojados, golpeados o intervenidos por terceros.", 60);
    doc.text(terminos, 10, 85);

    doc.setFontSize(8);
    doc.text("¡Gracias por su preferencia!", 40, 110, { align: "center" });
    doc.text("www.corefix.com.mx", 40, 115, { align: "center" });

    // Descarga automática
    doc.save(`Ticket_CoreFix_${log.id}.pdf`);
}

// --- ACTUALIZACIÓN DE LA TABLA DE GARANTÍAS ---
// Añade este botón al lado del de WhatsApp en tu función renderGarantiasTable:
// `<button onclick="descargarTicketPDF('${log.id}')" class="bg-slate-700 text-white p-2 rounded-lg ml-1 hover:bg-slate-600">
//    <i class="fas fa-file-pdf"></i>
// </button>`
// ========================================================
// FUNCIONES DE LOS BOTONES DE ACCIÓN (TABLA PRINCIPAL)
// ========================================================

// 1. BOTÓN VERDE (Check): Marcar como ENTREGADO
function cambiarEstado(id, nuevo) {
    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const i = logs.findIndex(l => l.id === id);
    
    if (i !== -1) {
        if (logs[i].estado === "ENTREGADO") {
            return alert("ℹ️ Este equipo ya está marcado como entregado.");
        }
        logs[i].estado = nuevo; // Cambia a "ENTREGADO"
        localStorage.setItem('cotizaciones', JSON.stringify(logs));
        alert(`✅ Éxito: El equipo con folio ${id} ha sido entregado.`);
        location.reload(); // Recarga para actualizar las finanzas
    }
}

// 2. BOTÓN AZUL (Cámara): Abrir panel de evidencia
function showEvidencePanel(id) {
    const activeFolioElement = document.getElementById('activeFolio');
    const evidencePanel = document.getElementById('evidencePanel');
    
    if (activeFolioElement && evidencePanel) {
        activeFolioElement.innerText = id;
        evidencePanel.classList.remove('hidden'); // Muestra la ventana emergente
    } else {
        alert("❌ Error: No se encontró el panel de evidencia en el HTML.");
    }
}

// Lógica para guardar la foto de evidencia (Complemento del Botón Azul)
function uploadAfterPhoto(input) {
    const id = document.getElementById('activeFolio').innerText;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
            const i = logs.findIndex(l => l.id === id);
            if(i !== -1) {
                logs[i].fotoDespues = e.target.result;
                localStorage.setItem('cotizaciones', JSON.stringify(logs));
                alert(`📸 Evidencia fotográfica guardada para el folio ${id}`);
                document.getElementById('evidencePanel').classList.add('hidden');
            }
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// 3. BOTÓN ROJO (Basura): Eliminar la orden por completo
function eliminarOrden(id) {
    if(confirm(`⚠️ ¿Estás seguro de eliminar el folio ${id}? Esto borrará el registro de las finanzas y no se puede deshacer.`)) {
        let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
        // Filtra para quedarse con todos MENOS el que quieres borrar
        logs = logs.filter(l => l.id !== id);
        localStorage.setItem('cotizaciones', JSON.stringify(logs));
        location.reload(); // Recarga la tabla
    }
}