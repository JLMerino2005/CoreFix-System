/**
 * CoreFix - Lógica Profesional Unificada (Ingeniería de Almacén)
 * Administrador: merinomotajoseluis@gmail.com
 */

// --- 1. MOTOR DE ACCESO Y SEGURIDAD ---
document.addEventListener('submit', (e) => {
    // Lógica para LOGIN
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
                alert('❌ Error: Credenciales incorrectas o usuario no registrado.');
            }
        }
    }

    // Lógica para REGISTRO
    if (e.target.id === 'registerForm') {
        e.preventDefault();
        const user = {
            name: document.getElementById('regName').value,
            email: document.getElementById('regEmail').value.trim(),
            pass: document.getElementById('regPass').value
        };
        localStorage.setItem('staffUser', JSON.stringify(user));
        alert("✅ Cuenta creada con éxito. Ahora inicia sesión.");
        window.location.href = 'login.html';
    }
});

// --- 2. GESTIÓN DE INTERFAZ (DOM) ---
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    const authContainer = document.getElementById('auth-container');
    const path = window.location.pathname;

    // Control de barra de navegación
    if (isLoggedIn === 'true' && authContainer) {
        const user = JSON.parse(localStorage.getItem('staffUser')) || { name: "Usuario" };
        const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f43f5e'];
        const avatarHTML = `<div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs" style="background-color: ${colors[0]}">${user.name.charAt(0).toUpperCase()}</div>`;
        const panelLink = (userRole === 'admin') ? 'admin.html' : 'index.html';

        authContainer.innerHTML = `
            <div class="flex items-center gap-3 bg-slate-800 p-1.5 pr-3 rounded-full border border-blue-500/40 shadow-lg relative">
                ${avatarHTML}
                <a href="${panelLink}" class="text-[10px] font-black text-blue-400 uppercase tracking-widest">${userRole === 'admin' ? 'ADMIN' : user.name.split(' ')[0]}</a>
                <button onclick="logout()" class="text-red-500 text-xs ml-1"><i class="fas fa-power-off"></i></button>
            </div>`;
    }

    // Carga de tablas y datos según la página
    if (path.includes('admin.html')) {
        if (isLoggedIn === 'true' && userRole === 'admin') {
            renderAdminTable();
            cargarAlmacenEnInterfaz();
            cargarBitacoraEnInterfaz();
        } else {
            window.location.href = 'login.html';
        }
    }
});

// --- 3. PANEL DE ADMINISTRACIÓN ---
function renderAdminTable() {
    const tableBody = document.getElementById('adminTableBody');
    const totalDisplay = document.getElementById('totalMoney');
    if (!tableBody) return;

    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    if (logs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-32 text-center text-slate-600 uppercase font-black italic opacity-20 text-2xl">Bandeja Vacía</td></tr>`;
        if (totalDisplay) totalDisplay.innerText = "$0";
        return;
    }

    let total = 0;
    tableBody.innerHTML = logs.slice().reverse().map(log => {
        total += parseInt(log.precio || 0);
        let st = log.estado === "ENTREGADO" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20";

        return `
        <tr class="hover:bg-blue-500/[0.03] border-b border-slate-700/50">
            <td class="p-8 text-xs font-mono text-slate-500">${log.fecha}<br><b class="text-blue-500 text-lg">${log.id}</b></td>
            <td class="p-8"><b>${log.nombre}</b><br><span class="text-xs text-slate-500">${log.telefono}</span></td>
            <td class="p-8"><span class="text-[10px] font-black uppercase">${log.falla}</span><br><span class="text-[10px] italic">📍 ${log.ubicacion}</span></td>
            <td class="p-8"><b class="text-2xl font-black text-green-400">$${log.precio}</b></td>
            <td class="p-8 text-center"><span class="${st} px-4 py-1.5 rounded-full text-[10px] font-black border uppercase">${log.estado}</span></td>
            <td class="p-8 text-right">
                <button onclick="cambiarEstado('${log.id}', 'ENTREGADO')" class="bg-green-600 p-3 rounded-xl text-white"><i class="fas fa-check"></i></button>
                <button onclick="showEvidencePanel('${log.id}')" class="bg-blue-600 p-3 rounded-xl text-white ml-2"><i class="fas fa-camera"></i></button>
                <button onclick="eliminarOrden('${log.id}')" class="bg-red-600/10 p-3 rounded-xl text-red-500 ml-2"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');
    if (totalDisplay) totalDisplay.innerText = `$${total}`;
}

// --- 4. ALMACÉN Y BITÁCORA ---
function cargarAlmacenEnInterfaz() {
    const invContainer = document.getElementById('inventoryContainer');
    if (!invContainer) return;
    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    invContainer.innerHTML = inv.map(p => `
        <div onclick="editarCantidad('${p.pieza}')" class="flex justify-between items-center border-b border-white/5 pb-2 group cursor-pointer hover:bg-blue-500/5 p-2 rounded-lg transition-all">
            <div class="flex flex-col">
                <span class="text-slate-300 group-hover:text-blue-400">${p.pieza}</span>
                <span class="text-[7px] text-slate-500 italic">Costo: $${p.costo || 0}</span>
            </div>
            <span class="${p.cantidad <= 2 ? 'text-red-500 animate-pulse' : 'text-green-400'} border border-current px-2 rounded text-[9px]">
                ${p.cantidad} UNID.
            </span>
        </div>`).join('');
}

function registrarMovimiento(pieza, accion, anterior, nueva) {
    let bitacora = JSON.parse(localStorage.getItem('bitacoraCoreFix')) || [];
    bitacora.unshift({
        fecha: new Date().toLocaleString(),
        usuario: JSON.parse(localStorage.getItem('staffUser'))?.name || "Admin",
        pieza: pieza, accion: accion, detalle: `De ${anterior} a ${nueva}`
    });
    localStorage.setItem('bitacoraCoreFix', JSON.stringify(bitacora.slice(0, 50)));
}

function editarCantidad(nombrePieza) {
    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    const i = inv.findIndex(p => p.pieza === nombrePieza);
    if (i !== -1) {
        const ant = inv[i].cantidad;
        const nueva = prompt(`Actualizar stock ${nombrePieza}:`, ant);
        if (nueva !== null && !isNaN(nueva)) {
            inv[i].cantidad = parseInt(nueva);
            localStorage.setItem('inventario', JSON.stringify(inv));
            registrarMovimiento(nombrePieza, "EDICIÓN MANUAL", ant, nueva);
            location.reload();
        }
    }
}

// --- 5. LÓGICA DE COTIZACIÓN ---
function aceptarCotizacion() {
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    const damage = document.getElementById('damageType');
    const area = document.getElementById('deliveryPoint').value;
    const imei = document.getElementById('clientIMEI')?.value || "N/A";
    
    if (!name || !phone || damage.value === "0") return alert("Faltan datos");

    const order = { 
        id: "CF-" + Math.floor(1000 + Math.random() * 9999), 
        fecha: new Date().toLocaleDateString(), 
        nombre: name, telefono: phone, ubicacion: area, imei: imei,
        falla: damage.options[damage.selectedIndex].text, 
        precio: document.getElementById('priceDisplay').innerText, 
        estado: "PENDIENTE",
        fotoAntes: document.getElementById('beforePreview')?.src || null
    };
    
    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    logs.push(order);
    localStorage.setItem('cotizaciones', JSON.stringify(logs));
    localStorage.setItem('currentOrder', JSON.stringify(order));
    window.location.href = 'orden.html';
}

// --- 6. RASTREO ---
function buscarEstado() {
    const p = document.getElementById('searchPhone').value.trim();
    const res = document.getElementById('resultContainer');
    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const my = logs.filter(l => l.telefono === p);
    
    if (my.length === 0) {
        res.classList.remove('hidden');
        res.innerHTML = "<p class='text-red-500 font-bold'>No se encontraron reparaciones.</p>";
        return;
    }
    
    const last = my[my.length - 1];
    res.classList.remove('hidden');
    res.innerHTML = `
        <div class="bg-blue-600/10 border border-blue-500/30 p-8 rounded-[2rem] shadow-2xl">
            <h4 class="text-blue-400 font-black">FOLIO: ${last.id}</h4>
            <h3 class="text-3xl font-black uppercase my-2">${last.estado}</h3>
            <p class="text-xs text-slate-400 uppercase tracking-widest">📍 Sucursal: ${last.ubicacion}</p>
        </div>`;
}

// --- UTILIDADES ---
function logout() { localStorage.removeItem('isLoggedIn'); window.location.href = 'login.html'; }

function updatePrice() { 
    const sel = document.getElementById('damageType');
    const express = document.getElementById('expressMode')?.checked;
    let base = parseInt(sel.value);
    if(express && base > 0) base = Math.round(base * 1.20);
    const display = document.getElementById('priceDisplay');
    if(display) display.innerText = base; 
}

function filterAdminTable() {
    const val = document.getElementById('adminSearch').value.toLowerCase();
    document.querySelectorAll('#adminTableBody tr').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(val) ? '' : 'none';
    });
}

function openLogin() { window.location.href = 'login.html'; }

// --- INICIALIZACIÓN DE ALMACÉN COMPLETO ---
if (!localStorage.getItem('inventario')) {
    const stockInicial = [
        { pieza: "Pantalla iPhone OLED", cantidad: 5, costo: 1200 },
        { pieza: "Pantalla iPhone Incell", cantidad: 8, costo: 650 },
        { pieza: "Pantalla Samsung A/M", cantidad: 6, costo: 850 },
        { pieza: "Batería iPhone", cantidad: 12, costo: 250 },
        { pieza: "Batería Android", cantidad: 15, costo: 160 },
        { pieza: "Centro de Carga", cantidad: 40, costo: 30 },
        { pieza: "Cristal de Cámara", cantidad: 25, costo: 45 },
        { pieza: "Mica de Cerámica", cantidad: 50, costo: 40 }
    ];
    localStorage.setItem('inventario', JSON.stringify(stockInicial));
}
// ========================================================
// NÚCLEO DE OPERACIONES COREFIX (LOGIN + ENTREGAS)
// ========================================================

// 1. ESCUCHA DE FORMULARIOS (LOGIN Y REGISTRO)
document.addEventListener('submit', (e) => {
    // Manejo del Login
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
                alert('❌ Datos incorrectos o usuario no registrado.');
            }
        }
    }

    // Manejo del Registro
    if (e.target.id === 'registerForm') {
        e.preventDefault();
        const user = {
            name: document.getElementById('regName').value,
            email: document.getElementById('regEmail').value.trim(),
            pass: document.getElementById('regPass').value
        };
        localStorage.setItem('staffUser', JSON.stringify(user));
        alert("✅ Cuenta de Staff creada. Ya puedes iniciar sesión.");
        window.location.href = 'login.html';
    }
});

// 2. FUNCIÓN MAESTRA DE CAMBIO DE ESTADO (CONFIRMAR PEDIDOS)
function cambiarEstado(id, nuevo) {
    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const i = logs.findIndex(l => l.id === id);
    
    if(i !== -1) { 
        // Si se marca como entregado, intentamos descontar stock automáticamente
        if (nuevo === "ENTREGADO" && logs[i].estado !== "ENTREGADO") {
            let inv = JSON.parse(localStorage.getItem('inventario')) || [];
            const fallaTxt = logs[i].falla.toLowerCase();
            
            // Buscamos coincidencia en el almacén por la primera palabra de la falla
            const idx = inv.findIndex(p => fallaTxt.includes(p.pieza.toLowerCase().split(' ')[0]));
            
            if (idx !== -1 && inv[idx].cantidad > 0) {
                const ant = inv[idx].cantidad;
                inv[idx].cantidad -= 1;
                localStorage.setItem('inventario', JSON.stringify(inv));
                
                // Si tienes la función de bitácora, registramos el movimiento
                if(typeof registrarMovimiento === 'function') {
                    registrarMovimiento(inv[idx].pieza, "VENTA AUTOMÁTICA", ant, inv[idx].cantidad);
                }
            }
        }

        logs[i].estado = nuevo; 
        localStorage.setItem('cotizaciones', JSON.stringify(logs)); 
        alert(`✅ Pedido ${id} actualizado a ${nuevo}`);
        
        // Refrescar para ver cambios en tabla y almacén
        if (window.location.pathname.includes('admin.html')) {
            renderAdminTable();
            location.reload(); 
        }
    }
}

// 3. VÍNCULOS DE BOTONES EXTERNOS
function openLogin() { window.location.href = 'login.html'; }