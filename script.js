/**
 * CoreFix System Master - Edición Definitiva UTTECAM
 * Administrador: merinomotajoseluis@gmail.com
 */

const META_MENSUAL = 10000;

// ==========================================
// 1. MOTOR DE ACCESO Y REGISTRO
// ==========================================
document.addEventListener('submit', (e) => {
    if (e.target.id === 'registerForm') {
        e.preventDefault();
        const nuevoUser = {
            name: document.getElementById('regName').value,
            email: document.getElementById('regEmail').value.trim(),
            pass: document.getElementById('regPass').value,
            fechaRegistro: new Date().toLocaleDateString()
        };
        let db = JSON.parse(localStorage.getItem('dbUsuariosCoreFix')) || [];
        if (db.find(u => u.email === nuevoUser.email)) return alert("❌ Este correo ya existe.");
        db.push(nuevoUser);
        localStorage.setItem('dbUsuariosCoreFix', JSON.stringify(db));
        alert("✅ Registro exitoso.");
        window.location.href = 'login.html';
    }

    if (e.target.id === 'loginForm') {
        e.preventDefault();
        const role = document.querySelector('input[name="userRole"]:checked').value;
        const userInput = document.getElementById('logEmail').value.trim();
        const pass = document.getElementById('logPass').value;

        if (role === 'admin' && userInput === "merinomotajoseluis@gmail.com" && pass === "CoreFix2026") {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('staffUser', JSON.stringify({ name: "José Luis" }));
            return window.location.href = 'admin.html';
        } 
        let db = JSON.parse(localStorage.getItem('dbUsuariosCoreFix')) || [];
        const user = db.find(u => u.email === userInput && u.pass === pass);
        if (user) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', role);
            localStorage.setItem('staffUser', JSON.stringify(user));
            window.location.href = 'index.html';
        } else {
            alert('❌ Datos incorrectos.');
        }
    }
});

// ==========================================
// 2. COTIZADOR Y RASTREO (CLIENTES)
// ==========================================
function updatePrice() {
    let base = parseInt(document.getElementById('damageType').value) || 0;
    if (document.getElementById('expressMode') && document.getElementById('expressMode').checked && base > 0) {
        base += base * 0.20;
    }
    if (document.getElementById('priceDisplay')) {
        document.getElementById('priceDisplay').innerText = Math.round(base);
    }
}

function aceptarCotizacion() {
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    const brand = document.getElementById('clientBrand').value; // MARCA
    const model = document.getElementById('clientModel').value; // MODELO
    const fallaSel = document.getElementById('damageType');
    const fallaTxt = fallaSel.options[fallaSel.selectedIndex].text;
    const precio = document.getElementById('priceDisplay').innerText;
    const ubi = document.getElementById('deliveryPoint').value;
    const photoBefore = document.getElementById('beforePreview');

    if(!name || !phone || !brand || !model || fallaSel.value === "0") {
        return alert("⚠️ Completa Nombre, WhatsApp, Marca, Modelo y selecciona una Falla.");
    }

    const newOrder = {
        id: 'CF-' + Math.floor(1000 + Math.random() * 9000),
        nombre: name, 
        telefono: phone, 
        marca: brand,   
        modelo: model,  
        falla: fallaTxt,
        precio: parseInt(precio), 
        ubicacion: ubi,
        fecha: new Date().toLocaleDateString(), 
        estado: "EN REVISIÓN",
        fotoAntes: photoBefore && photoBefore.src && !photoBefore.classList.contains('hidden') ? photoBefore.src : null
    };

    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    logs.push(newOrder);
    localStorage.setItem('cotizaciones', JSON.stringify(logs));
    localStorage.setItem('currentOrder', JSON.stringify(newOrder));
    window.location.href = 'ticket.html';
}

function buscarEstado() {
    const phone = document.getElementById('searchPhone').value;
    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const found = logs.filter(l => l.telefono.includes(phone));
    const container = document.getElementById('resultContainer');

    if(found.length > 0) {
        container.innerHTML = found.map(f => `
            <div class="bg-slate-800 p-6 rounded-2xl mb-4 text-left border border-blue-500/30 shadow-lg">
                <p class="text-blue-400 font-black mb-2 text-xl">${f.id} - ${f.falla}</p>
                <p class="text-white text-sm">Estado Actual: <span class="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold ml-2">${f.estado}</span></p>
                <p class="text-slate-500 text-xs mt-3 italic"><i class="fas fa-map-marker-alt"></i> ${f.ubicacion}</p>
            </div>
        `).join('');
    } else {
        container.innerHTML = `<p class="text-red-400 bg-red-500/10 border border-red-500/30 p-4 rounded-xl font-bold">No se encontraron equipos con ese número.</p>`;
    }
    container.classList.remove('hidden');
}

// ==========================================
// 3. PANEL ADMIN: RENDERIZADO Y WIDGETS
// ==========================================
function calcularSemaforo(fechaOrden) {
    const hoy = new Date();
    const partes = fechaOrden.split('/');
    const registro = new Date(partes[2], partes[1] - 1, partes[0]);
    const diffHoras = (hoy - registro) / 36e5;
    if (diffHoras > 48) return "animate-pulse text-red-500 font-black"; 
    if (diffHoras > 24) return "text-yellow-500 font-bold";
    return "text-blue-500"; 
}

function renderAdminTable(filtroSucursal = 'TODOS') {
    const tableBody = document.getElementById('adminTableBody');
    if (!tableBody) return;

    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    if (filtroSucursal !== 'TODOS') logs = logs.filter(l => l.ubicacion.includes(filtroSucursal));

    let cajaReal = 0, cajaProyectada = 0, entregadosCount = 0;

    tableBody.innerHTML = logs.slice().reverse().map(log => {
        const precio = parseInt(log.precio || 0);
        if (log.estado === "ENTREGADO") { cajaReal += precio; entregadosCount++; } 
        else { cajaProyectada += precio; }

        let st = log.estado === "ENTREGADO" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20";
        let semaforo = log.estado !== "ENTREGADO" ? calcularSemaforo(log.fecha) : "text-green-500";

        // AQUI SE AGREGO LA MARCA Y MODELO EN LA INTERFAZ DEL ADMIN
        return `
        <tr class="hover:bg-blue-500/[0.03] border-b border-slate-700/50">
            <td class="p-8 text-xs font-mono text-slate-500">${log.fecha}<br><b class="${semaforo} text-lg">${log.id}</b></td>
            <td class="p-8"><b class="text-white">${log.nombre}</b><br><span class="text-xs text-slate-500">${log.telefono}</span></td>
            <td class="p-8">
                <span class="text-[10px] font-black uppercase text-blue-400">${log.falla}</span><br>
                <span class="text-[9px] font-bold text-white uppercase">${log.marca || 'N/A'} ${log.modelo || ''}</span><br>
                <span class="text-[10px] italic text-slate-500">📍 ${log.ubicacion}</span>
            </td>
            <td class="p-8"><b class="text-2xl font-black text-green-400">$${log.precio}</b></td>
            <td class="p-8 text-center"><span class="${st} px-4 py-1.5 rounded-full text-[10px] font-black border uppercase">${log.estado}</span></td>
            <td class="p-8 text-right"><div class="flex gap-2 justify-end">
                <button onclick="cambiarEstado('${log.id}', 'ENTREGADO')" class="bg-green-600 p-3 rounded-xl text-white hover:bg-green-500 transition-all"><i class="fas fa-check"></i></button>
                <button onclick="showEvidencePanel('${log.id}')" class="bg-blue-600 p-3 rounded-xl text-white hover:bg-blue-500 transition-all"><i class="fas fa-camera"></i></button>
                <button onclick="eliminarOrden('${log.id}')" class="bg-red-600/10 p-3 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all"><i class="fas fa-trash-alt"></i></button>
            </div></td>
        </tr>`;
    }).join('');

    const ticketProm = entregadosCount > 0 ? Math.round(cajaReal / entregadosCount) : 0;
    actualizarWidgets(cajaReal, cajaProyectada, ticketProm);
    actualizarAnalisis(logs);
    renderComprasTable();
    renderBitacora();
    renderGarantiasTable();
}

function actualizarWidgets(real, proyectado, ticket) {
    const compras = JSON.parse(localStorage.getItem('comprasCoreFix')) || [];
    const totalGastos = compras.reduce((acc, c) => acc + c.monto, 0);
    const utilidad = real - totalGastos;

    if (document.getElementById('cajaReal')) document.getElementById('cajaReal').innerText = `$${real}`;
    if (document.getElementById('totalMoney')) document.getElementById('totalMoney').innerText = `$${proyectado}`;
    if (document.getElementById('ticketPromedio')) document.getElementById('ticketPromedio').innerText = `$${ticket}`;
    if (document.getElementById('totalGastos')) document.getElementById('totalGastos').innerText = `$${totalGastos}`;
    
    const utilCont = document.getElementById('utilidadNeta');
    if (utilCont) {
        utilCont.innerText = `$${utilidad}`;
        utilCont.className = utilidad < 0 ? "text-3xl font-black text-red-400" : "text-3xl font-black text-white";
        
        const porcentaje = Math.min(Math.round((utilidad / META_MENSUAL) * 100), 100);
        const bar = document.getElementById('metaBar');
        const txt = document.getElementById('metaPorcentaje');
        if(bar && txt) {
            bar.style.width = porcentaje + "%";
            txt.innerText = porcentaje + "%";
            if(porcentaje >= 100) bar.classList.add('bg-yellow-400', 'shadow-[0_0_15px_#facc15]');
        }
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

// ==========================================
// 4. ADMIN: BOTONES DE ACCIÓN 
// ==========================================
function cambiarEstado(id, nuevo) {
    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const i = logs.findIndex(l => l.id === id);
    if(i !== -1) {
        if(logs[i].estado === "ENTREGADO") return alert("ℹ️ Este equipo ya está entregado.");
        logs[i].estado = nuevo;
        localStorage.setItem('cotizaciones', JSON.stringify(logs));
        location.reload();
    }
}

function showEvidencePanel(id) {
    const panel = document.getElementById('evidencePanel');
    const folioText = document.getElementById('activeFolio');
    if(panel && folioText) {
        folioText.innerText = id;
        panel.classList.remove('hidden');
    }
}

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
                alert(`📸 Evidencia guardada para el folio ${id}`);
                document.getElementById('evidencePanel').classList.add('hidden');
            }
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function eliminarOrden(id) {
    if(confirm(`⚠️ ¿Eliminar folio ${id} permanentemente?`)) {
        let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
        localStorage.setItem('cotizaciones', JSON.stringify(logs.filter(l => l.id !== id)));
        location.reload();
    }
}

// ==========================================
// 5. ALMACÉN, INVENTARIO Y ALERTAS
// ==========================================
function cargarAlmacenEnInterfaz() {
    const invContainer = document.getElementById('inventoryContainer');
    if (!invContainer) return;

    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    if (inv.length === 0) {
        inv = [
            { pieza: "Pantalla iPhone OLED", cantidad: 5, costo: 1200 },
            { pieza: "Pantalla Samsung A/M", cantidad: 6, costo: 850 },
            { pieza: "Batería Genérica", cantidad: 15, costo: 160 }
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
        
    actualizarAlertasStock(inv);
}

function actualizarAlertasStock(inv) {
    const alertContainer = document.getElementById('stockAlertContainer');
    if (!alertContainer) return;
    const bajas = inv.filter(p => p.cantidad <= 2);

    if (bajas.length > 0) {
        alertContainer.innerHTML = `
            <div class="animate-bounce bg-red-600/10 border border-red-500 p-4 rounded-2xl flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <div class="flex items-center gap-3">
                    <i class="fas fa-exclamation-triangle text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></i>
                    <div>
                        <p class="text-[10px] font-black uppercase text-red-200 tracking-widest">Alerta de Suministros</p>
                        <p class="text-[8px] text-red-400 uppercase font-bold">Faltan ${bajas.length} tipos de refacciones. ¡Surtir!</p>
                    </div>
                </div>
            </div>`;
    } else {
        alertContainer.innerHTML = `
            <div class="bg-blue-600/5 border border-blue-500/30 p-3 rounded-2xl flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                <i class="fas fa-check-circle text-blue-500"></i>
                <p class="text-[9px] font-black uppercase text-blue-300 tracking-[0.2em]">Inventario: Operativo</p>
            </div>`;
    }
}

function editarCantidad(pName) {
    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    const i = inv.findIndex(p => p.pieza === pName);
    if(i !== -1) {
        const nueva = prompt(`Stock actual de ${pName}: ${inv[i].cantidad}\nNueva cantidad:`, inv[i].cantidad);
        if(nueva !== null && !isNaN(nueva)) {
            registrarMovimiento(pName, "EDICIÓN MANUAL", inv[i].cantidad, nueva);
            inv[i].cantidad = parseInt(nueva);
            localStorage.setItem('inventario', JSON.stringify(inv));
            location.reload(); 
        }
    }
}

function agregarNuevaRefaccion() {
    const n = prompt("Nombre refacción:"); const c = prompt("Cantidad inicial:"); const cost = prompt("Costo Unitario ($):");
    if(n && c) {
        let inv = JSON.parse(localStorage.getItem('inventario')) || [];
        inv.push({ pieza: n, cantidad: parseInt(c), costo: parseInt(cost) || 0 });
        localStorage.setItem('inventario', JSON.stringify(inv));
        registrarMovimiento(n, "ALTA NUEVA", 0, c);
        location.reload();
    }
}

function registrarCompra() {
    const mat = prompt("Refacción/Material:"); const prov = prompt("Proveedor:"); const monto = prompt("Monto Total ($):");
    if (mat && monto) {
        let compras = JSON.parse(localStorage.getItem('comprasCoreFix')) || [];
        compras.push({fecha: new Date().toLocaleDateString(), material: mat, proveedor: prov, monto: parseInt(monto)});
        localStorage.setItem('comprasCoreFix', JSON.stringify(compras));
        location.reload();
    }
}

function registrarMovimiento(pieza, accion, ant, nueva) {
    let bitacora = JSON.parse(localStorage.getItem('bitacoraCoreFix')) || [];
    bitacora.unshift({
        fecha: new Date().toLocaleString(),
        usuario: JSON.parse(localStorage.getItem('staffUser'))?.name || "Admin",
        pieza: pieza, accion: accion, detalle: `De ${ant} a ${nueva}`
    });
    localStorage.setItem('bitacoraCoreFix', JSON.stringify(bitacora.slice(0, 50)));
}

function renderComprasTable() {
    const b = document.getElementById('comprasTableBody');
    if(!b) return;
    const c = JSON.parse(localStorage.getItem('comprasCoreFix')) || [];
    b.innerHTML = c.slice().reverse().map(x => `<tr class="hover:bg-white/5"><td class="p-4">${x.fecha}</td><td class="p-4 text-white">${x.material}</td><td class="p-4">${x.proveedor}</td><td class="p-4 text-right font-black text-red-400">$${x.monto}</td></tr>`).join('');
}

function renderBitacora() {
    const b = document.getElementById('bitacoraBody');
    if(!b) return;
    const logs = JSON.parse(localStorage.getItem('bitacoraCoreFix')) || [];
    b.innerHTML = logs.map(x => `<tr class="hover:bg-white/5"><td class="p-4 text-[8px]">${x.fecha}</td><td class="p-4 text-blue-400">${x.usuario}</td><td class="p-4">${x.pieza}</td><td class="p-4"><span class="bg-slate-700 px-2 py-1 rounded text-[7px]">${x.accion}</span></td><td class="p-4 italic">${x.detalle}</td></tr>`).join('');
}

// ==========================================
// 6. GARANTÍAS, PDF Y WHATSAPP
// ==========================================
function renderGarantiasTable() {
    const tb = document.getElementById('garantiasTableBody');
    if (!tb) return;
    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const entregados = logs.filter(l => l.estado === "ENTREGADO");

    if (entregados.length === 0) {
        tb.innerHTML = '<tr><td colspan="6" class="p-10 text-center text-slate-600 uppercase italic">No hay garantías activas</td></tr>';
        return;
    }

    tb.innerHTML = entregados.slice().reverse().map(log => {
        const partes = log.fecha.split('/');
        const fechaEntrega = new Date(partes[2], partes[1] - 1, partes[0]);
        const hoy = new Date();
        const diasRestantes = 90 - Math.floor((hoy - fechaEntrega) / 86400000);
        let color = diasRestantes <= 0 ? "text-slate-600 border-slate-600/30" : diasRestantes <= 10 ? "text-yellow-500 border-yellow-500/30 animate-pulse" : "text-blue-400 border-blue-400/30";

        return `
            <tr class="hover:bg-white/5 border-b border-white/5">
                <td class="p-4 font-black text-blue-500">${log.id}</td>
                <td class="p-4 text-white">${log.nombre}</td>
                <td class="p-4">${log.fecha}</td>
                <td class="p-4 font-black ${diasRestantes <= 10 ? 'text-red-500' : 'text-slate-300'}">${Math.max(0, diasRestantes)} D</td>
                <td class="p-4"><span class="px-3 py-1 rounded-full border text-[7px] font-black ${color}">${diasRestantes <= 0 ? 'EXPIRADA' : 'VIGENTE'}</span></td>
                <td class="p-4">
                    <div class="flex gap-2 justify-center">
                        <button onclick="enviarTicketWhatsApp('${log.id}')" class="bg-green-500/10 text-green-500 p-2 rounded-lg hover:bg-green-500 hover:text-white transition-all"><i class="fab fa-whatsapp"></i></button>
                        <button onclick="descargarTicketPDF('${log.id}')" class="bg-red-500/10 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"><i class="fas fa-file-pdf"></i></button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function enviarTicketWhatsApp(id) {
    const log = (JSON.parse(localStorage.getItem('cotizaciones')) || []).find(l => l.id === id);
    if (!log) return;
    const m = `*COREFIX - TICKET* 📱%0A%0AHola *${log.nombre}*.%0A📄 Folio: ${log.id}%0A🛠️ Falla: ${log.falla}%0A💰 Total: $${log.precio}%0A📅 Fecha: ${log.fecha}%0A%0A🛡️ *Garantía activa por 90 días*. ¡Gracias!`;
    window.open(`https://wa.me/52${log.telefono.replace(/\D/g, '')}?text=${m}`, '_blank');
}

async function descargarTicketPDF(id) {
    if (!window.jspdf) return alert("⚠️ Espera un segundo a que cargue el generador de PDF y vuelve a intentar.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 150] }); 
    const log = (JSON.parse(localStorage.getItem('cotizaciones')) || []).find(l => l.id === id);
    if (!log) return;

    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text("COREFIX", 40, 15, { align: "center" });
    doc.setFontSize(8); doc.text("Soporte Técnico Especializado", 40, 20, { align: "center" });
    doc.text("________________________________", 40, 23, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(`FOLIO: ${log.id}`, 10, 30); doc.text(`FECHA: ${log.fecha}`, 10, 35);
    doc.text(`CLIENTE: ${log.nombre}`, 10, 40); doc.text(`SEDE: ${log.ubicacion}`, 10, 45);
    doc.setFont("helvetica", "bold"); doc.text("SERVICIO:", 10, 55);
    doc.setFont("helvetica", "normal"); doc.text(`Falla: ${log.falla}`, 10, 60); doc.text(`Total: $${log.precio}.00 MXN`, 10, 65);
    doc.setFont("helvetica", "bold"); doc.text("GARANTIA", 40, 80, { align: "center" });
    doc.setFontSize(6); doc.text(doc.splitTextToSize("90 días naturales. Valido solo por defectos en la refacción instalada. No aplica en equipos mojados, rotos o intervenidos por terceros.", 60), 10, 85);
    doc.setFontSize(8); doc.text("¡Gracias por su preferencia!", 40, 110, { align: "center" });
    doc.save(`Ticket_CF_${log.id}.pdf`);
}

// ==========================================
// 7. INICIALIZACIÓN GLOBAL
// ==========================================
function filtrarSucursal(sucursal) { renderAdminTable(sucursal); }
function logout() { localStorage.removeItem('isLoggedIn'); localStorage.removeItem('userRole'); window.location.href = 'index.html'; }
function recuperarPass() {
    const mail = prompt("Ingresa tu correo o WhatsApp:");
    const user = (JSON.parse(localStorage.getItem('dbUsuariosCoreFix')) || []).find(u => u.email === mail);
    if(user) alert(`🔑 Tu contraseña es: [ ${user.pass} ]`); else alert("❌ Usuario no encontrado.");
}
function generarReporteRapido() {
    const real = document.getElementById('cajaReal')?.innerText || "$0";
    const gastos = document.getElementById('totalGastos')?.innerText || "$0";
    window.open(`https://wa.me/?text=📊 *COREFIX REPORT*%0A💰 Ingresos: ${real}%0A💸 Gastos: ${gastos}`, '_blank');
}

// Filtro de búsqueda en tiempo real
function filterAdminTable() {
    const input = document.getElementById('adminSearch').value.toUpperCase();
    const rows = document.getElementById('adminTableBody').getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        let textContent = rows[i].innerText.toUpperCase();
        rows[i].style.display = textContent.includes(input) ? "" : "none";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin.html')) {
        renderAdminTable();
        cargarAlmacenEnInterfaz();
    }
    const authCont = document.getElementById('auth-container');
    if (authCont && localStorage.getItem('isLoggedIn') === 'true') {
        const user = JSON.parse(localStorage.getItem('staffUser'));
        authCont.innerHTML = `<div class="flex items-center gap-3 bg-slate-800 p-1.5 pr-3 rounded-full border border-blue-500/40"><div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs bg-blue-600">${user.name.charAt(0).toUpperCase()}</div><span class="text-[10px] font-black text-blue-400 uppercase tracking-widest">${user.name.split(' ')[0]}</span><button onclick="logout()" class="text-red-500 text-xs ml-1"><i class="fas fa-power-off"></i></button></div>`;
    }
});
// ==========================================
// 8. EXPORTACIÓN A EXCEL (NUEVO)
// ==========================================
function exportarExcel() {
    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    if(logs.length === 0) return alert("⚠️ No hay datos para exportar.");
    
    // Crear cabeceras
    let csv = "Folio,Fecha,Cliente,Telefono,Marca,Modelo,Falla,Precio,Sede,Estado\n";
    
    // Llenar filas
    logs.forEach(l => {
        csv += `${l.id},${l.fecha},${l.nombre},${l.telefono},${l.marca || 'N/A'},${l.modelo || 'N/A'},${l.falla},${l.precio},${l.ubicacion},${l.estado}\n`;
    });
    
    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_CoreFix_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}