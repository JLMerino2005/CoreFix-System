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
// 2. COTIZADOR Y ECO-ENGINEERING (Idea 3)
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
    const brand = document.getElementById('clientBrand').value; 
    const model = document.getElementById('clientModel').value; 
    const fallaSel = document.getElementById('damageType');
    const fallaTxt = fallaSel.options[fallaSel.selectedIndex].text;
    const precio = document.getElementById('priceDisplay').innerText;
    const ubi = document.getElementById('deliveryPoint').value;
    const photoBefore = document.getElementById('beforePreview');

    if(!name || !phone || !brand || !model || fallaSel.value === "0") {
        return alert("⚠️ Completa todos los campos para generar tu ticket.");
    }

    const newOrder = {
        id: 'CF-' + Math.floor(1000 + Math.random() * 9000),
        nombre: name, telefono: phone, marca: brand, modelo: model, falla: fallaTxt,
        precio: parseInt(precio), ubicacion: ubi, fecha: new Date().toLocaleDateString(), 
        estado: "EN REVISIÓN",
        fotoAntes: photoBefore && photoBefore.src && !photoBefore.classList.contains('hidden') ? photoBefore.src : null
    };

    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    logs.push(newOrder);
    localStorage.setItem('cotizaciones', JSON.stringify(logs));
    localStorage.setItem('currentOrder', JSON.stringify(newOrder));
    
    // IDEA 4: SIMULACIÓN DE CORREO CORPORATIVO
    alert(`📩 Ticket de ingeniería enviado al sistema y preparado para descarga.`);
    window.location.href = 'ticket.html';
}

function buscarEstado() {
    const phone = document.getElementById('searchPhone').value;
    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const found = logs.filter(l => l.telefono.includes(phone));
    const container = document.getElementById('resultContainer');
    if(found.length > 0) {
        container.innerHTML = found.map(f => `
            <div class="bg-slate-800 p-6 rounded-2xl mb-4 border border-blue-500/30">
                <p class="text-blue-400 font-black text-xl">${f.id} - ${f.falla}</p>
                <p class="text-white text-sm">Estado: <span class="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold ml-2">${f.estado}</span></p>
            </div>`).join('');
    } else {
        container.innerHTML = `<p class="text-red-400 font-bold">No se encontraron equipos.</p>`;
    }
    container.classList.remove('hidden');
}

// ==========================================
// 3. DASHBOARD ANALÍTICO (Idea 5)
// ==========================================
function inicializarGraficas() {
    const ctxRep = document.getElementById('reparacionesChart');
    const ctxMar = document.getElementById('marcasChart');
    if (!ctxRep || !ctxMar) return;

    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const marcasData = {};
    logs.forEach(l => marcasData[l.marca] = (marcasData[l.marca] || 0) + 1);

    new Chart(ctxRep, {
        type: 'line',
        data: {
            labels: logs.slice(-5).map(l => l.id),
            datasets: [{ label: 'Ingresos', data: logs.slice(-5).map(l => l.precio), borderColor: '#3b82f6', tension: 0.4 }]
        }
    });

    new Chart(ctxMar, {
        type: 'doughnut',
        data: {
            labels: Object.keys(marcasData),
            datasets: [{ data: Object.values(marcasData), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'] }]
        }
    });
}

// ==========================================
// 4. PANEL ADMIN: TABLA Y WIDGETS
// ==========================================
function renderAdminTable(filtroSucursal = 'TODOS') {
    const tableBody = document.getElementById('adminTableBody');
    if (!tableBody) return;

    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    if (filtroSucursal !== 'TODOS') logs = logs.filter(l => l.ubicacion.includes(filtroSucursal));

    let cajaReal = 0, entregadosCount = 0;

    tableBody.innerHTML = logs.slice().reverse().map(log => {
        const precio = parseInt(log.precio || 0);
        if (log.estado === "ENTREGADO") { cajaReal += precio; entregadosCount++; } 

        let st = log.estado === "ENTREGADO" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20";
        
        return `
        <tr class="hover:bg-blue-500/[0.02] border-b border-slate-700/50">
            <td class="p-8 text-xs">${log.fecha}<br><b class="text-blue-500 text-lg">${log.id}</b></td>
            <td class="p-8"><b class="text-white">${log.nombre}</b><br>${log.telefono}</td>
            <td class="p-8"><span class="text-blue-400 text-[10px] font-black uppercase">${log.falla}</span><br><span class="text-white text-[9px] font-bold">${log.marca} ${log.modelo}</span></td>
            <td class="p-8 text-green-400 font-black">$${log.precio}</td>
            <td class="p-8 text-center"><span class="${st} px-4 py-1.5 rounded-full text-[10px] font-black border uppercase">${log.estado}</span></td>
            <td class="p-8 text-right">
                <div class="flex gap-2 justify-end">
                    <button onclick="cambiarEstado('${log.id}', 'ENTREGADO')" class="bg-green-600 p-3 rounded-xl text-white"><i class="fas fa-check"></i></button>
                    <button onclick="showEvidencePanel('${log.id}')" class="bg-blue-600 p-3 rounded-xl text-white"><i class="fas fa-camera"></i></button>
                    <button onclick="eliminarOrden('${log.id}')" class="bg-red-600/10 p-3 rounded-xl text-red-500"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    actualizarWidgets(cajaReal, 0, entregadosCount > 0 ? Math.round(cajaReal / entregadosCount) : 0);
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
    if (document.getElementById('ticketPromedio')) document.getElementById('ticketPromedio').innerText = `$${ticket}`;
    if (document.getElementById('totalGastos')) document.getElementById('totalGastos').innerText = `$${totalGastos}`;
    if (document.getElementById('utilidadNeta')) {
        const u = document.getElementById('utilidadNeta');
        u.innerText = `$${utilidad}`;
        const porc = Math.min(Math.round((utilidad / META_MENSUAL) * 100), 100);
        if(document.getElementById('metaBar')) document.getElementById('metaBar').style.width = porc + "%";
        if(document.getElementById('metaPorcentaje')) document.getElementById('metaPorcentaje').innerText = porc + "%";
    }
}

function actualizarAnalisis(logs) {
    const statsCont = document.getElementById('statsContainer');
    if(!statsCont) return;
    const stats = {};
    logs.forEach(l => { stats[l.falla] = (stats[l.falla] || 0) + 1; });
    statsCont.innerHTML = Object.entries(stats).map(([f, t]) => `<div class="flex justify-between border-b border-white/5 pb-2"><span>${f}</span><span class="text-blue-500">${t} serv.</span></div>`).join('');
}

// ==========================================
// 5. QR Y PDF CON IMPACTO AMBIENTAL (Idea 2 y 3)
// ==========================================
async function descargarTicketPDF(id) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 150] }); 
    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const log = logs.find(l => l.id === id) || JSON.parse(localStorage.getItem('currentOrder'));

    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text("COREFIX", 40, 15, { align: "center" });
    doc.setFontSize(8); doc.text("Engineering Services", 40, 20, { align: "center" });
    
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(`FOLIO: ${log.id}`, 10, 35);
    doc.text(`CLIENTE: ${log.nombre}`, 10, 42);
    doc.text(`EQUIPO: ${log.marca} ${log.modelo}`, 10, 49);
    doc.text(`FALLA: ${log.falla}`, 10, 56);
    doc.setFont("helvetica", "bold"); doc.text(`TOTAL ESTIMADO: $${log.precio}.00`, 10, 65);

    // IMPACTO AMBIENTAL
    doc.setTextColor(34, 197, 94); doc.setFontSize(7);
    doc.text("REPARAR ES SUSTENTABLE:", 10, 75);
    doc.setTextColor(100); doc.text("Evitaste generar 0.5kg de basura electronica.", 10, 80);

    // ESPACIO QR
    doc.setDrawColor(59, 130, 246); doc.rect(30, 90, 20, 20); 
    doc.setFontSize(5); doc.text("ESCANEAME PARA RASTREO", 40, 115, { align: "center" });

    doc.save(`CoreFix_${log.id}.pdf`);
}

// ==========================================
// 6. ALMACÉN E INVENTARIO
// ==========================================
function cargarAlmacenEnInterfaz() {
    const invContainer = document.getElementById('inventoryContainer');
    if (!invContainer) return;
    let inv = JSON.parse(localStorage.getItem('inventario')) || [
        { pieza: "Pantalla iPhone OLED", cantidad: 5, costo: 1200 },
        { pieza: "Bateria Generica", cantidad: 10, costo: 180 }
    ];
    localStorage.setItem('inventario', JSON.stringify(inv));
    invContainer.innerHTML = inv.map(p => `
        <div onclick="editarCantidad('${p.pieza}')" class="flex justify-between border-b border-white/5 p-2 hover:bg-blue-500/5">
            <span class="text-slate-300 uppercase font-black">${p.pieza}</span>
            <span class="${p.cantidad <= 2 ? 'text-red-500 animate-pulse' : 'text-green-400'} font-black">${p.cantidad} UNID.</span>
        </div>`).join('');
}

function editarCantidad(pName) {
    let inv = JSON.parse(localStorage.getItem('inventario')) || [];
    const i = inv.findIndex(p => p.pieza === pName);
    if(i !== -1) {
        const nueva = prompt(`Stock de ${pName}:`, inv[i].cantidad);
        if(nueva !== null) {
            registrarMovimiento(pName, "EDICIÓN", inv[i].cantidad, nueva);
            inv[i].cantidad = parseInt(nueva);
            localStorage.setItem('inventario', JSON.stringify(inv));
            location.reload();
        }
    }
}

function agregarNuevaRefaccion() {
    const n = prompt("Nombre:"); const c = prompt("Cantidad:");
    if(n && c) {
        let inv = JSON.parse(localStorage.getItem('inventario')) || [];
        inv.push({ pieza: n, cantidad: parseInt(c), costo: 0 });
        localStorage.setItem('inventario', JSON.stringify(inv));
        location.reload();
    }
}

function registrarCompra() {
    const mat = prompt("Refacción:"); const monto = prompt("Monto ($):");
    if (mat && monto) {
        let compras = JSON.parse(localStorage.getItem('comprasCoreFix')) || [];
        compras.push({fecha: new Date().toLocaleDateString(), material: mat, monto: parseInt(monto)});
        localStorage.setItem('comprasCoreFix', JSON.stringify(compras));
        location.reload();
    }
}

function renderComprasTable() {
    const b = document.getElementById('comprasTableBody');
    if(!b) return;
    const c = JSON.parse(localStorage.getItem('comprasCoreFix')) || [];
    b.innerHTML = c.reverse().map(x => `<tr><td class="p-4">${x.fecha}</td><td class="p-4">${x.material}</td><td class="p-4 text-right text-red-400">$${x.monto}</td></tr>`).join('');
}

// ==========================================
// 7. GARANTÍAS Y BITÁCORA
// ==========================================
function renderGarantiasTable() {
    const tb = document.getElementById('garantiasTableBody');
    if (!tb) return;
    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const entregados = logs.filter(l => l.estado === "ENTREGADO");
    tb.innerHTML = entregados.reverse().map(log => `
        <tr>
            <td class="p-4 text-blue-500 font-black">${log.id}</td>
            <td class="p-4 text-white">${log.nombre}</td>
            <td class="p-4">90 DÍAS</td>
            <td class="p-4 text-right"><button onclick="enviarTicketWhatsApp('${log.id}')" class="text-green-500"><i class="fab fa-whatsapp"></i></button></td>
        </tr>`).join('');
}

function registrarMovimiento(p, a, ant, n) {
    let bit = JSON.parse(localStorage.getItem('bitacoraCoreFix')) || [];
    bit.unshift({ fecha: new Date().toLocaleString(), pieza: p, accion: a, detalle: `De ${ant} a ${n}` });
    localStorage.setItem('bitacoraCoreFix', JSON.stringify(bit.slice(0, 20)));
}

function renderBitacora() {
    const b = document.getElementById('bitacoraBody');
    if(!b) return;
    const logs = JSON.parse(localStorage.getItem('bitacoraCoreFix')) || [];
    b.innerHTML = logs.map(x => `<tr class="text-[8px]"><td class="p-2">${x.fecha}</td><td class="p-2">${x.pieza}</td><td class="p-2">${x.detalle}</td></tr>`).join('');
}

// ==========================================
// 8. MODO NOCHE Y MOTOR ARRANQUE (Idea 6)
// ==========================================
function aplicarModoHardwareNoche() {
    const hora = new Date().getHours();
    if (hora >= 20 || hora < 6) {
        document.body.classList.add('bg-slate-950');
        console.log("🌙 Modo Noche: Supervisión Gatitos Negros ON");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    aplicarModoHardwareNoche();
    if (document.getElementById('adminTableBody')) {
        renderAdminTable();
        cargarAlmacenEnInterfaz();
        inicializarGraficas();
    }
    const authCont = document.getElementById('auth-container');
    if (authCont && localStorage.getItem('isLoggedIn') === 'true') {
        const user = JSON.parse(localStorage.getItem('staffUser'));
        authCont.innerHTML = `<div class="flex items-center gap-3 bg-slate-800 p-2 rounded-full border border-blue-500/40"><span class="text-[10px] font-black text-blue-400 uppercase">${user.name}</span><button onclick="logout()" class="text-red-500 ml-2"><i class="fas fa-power-off"></i></button></div>`;
    }
});

// ==========================================
// 9. FUNCIONALIDAD PARA VER CONTRASEÑA
// ==========================================
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Extras necesarios
function cambiarEstado(id, nuevo) {
    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const i = logs.findIndex(l => l.id === id);
    if(i !== -1) {
        logs[i].estado = nuevo;
        localStorage.setItem('cotizaciones', JSON.stringify(logs));
        location.reload();
    }
}
function eliminarOrden(id) { if(confirm("¿Eliminar?")) { let logs = JSON.parse(localStorage.getItem('cotizaciones')) || []; localStorage.setItem('cotizaciones', JSON.stringify(logs.filter(l => l.id !== id))); location.reload(); } }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
function enviarTicketWhatsApp(id) {
    const log = (JSON.parse(localStorage.getItem('cotizaciones')) || []).find(l => l.id === id);
    if(log) window.open(`https://wa.me/52${log.telefono}?text=Hola *${log.nombre}*, tu equipo *${log.id}* está listo y con garantía de 90 días.`, '_blank');
}