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