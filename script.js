/**
 * CoreFix - Lógica Profesional Unificada (Blindada + QR + WhatsApp)
 * Administrador: merinomotajoseluis@gmail.com
 */

// --- GENERADOR DE AVATAR ---
function getAvatar(name) {
    const initial = name ? name.charAt(0).toUpperCase() : 'C';
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f43f5e'];
    const color = colors[initial.charCodeAt(0) % colors.length];
    return `<div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white/20 shadow-lg" style="background-color: ${color}">${initial}</div>`;
}

// --- [NUEVO] SISTEMA DE FIRMA DIGITAL ---
let canvas = document.getElementById('signature-pad');
let ctx = canvas ? canvas.getContext('2d') : null;
let drawing = false;

if (canvas) {
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    canvas.addEventListener('mousedown', () => drawing = true);
    canvas.addEventListener('mouseup', () => { drawing = false; ctx.beginPath(); });
    canvas.addEventListener('mousemove', e => {
        if (!drawing) return;
        let rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#0f172a';
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke(); ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
}
function clearSignature() { if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }

document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    const authContainer = document.getElementById('auth-container');
    const path = window.location.pathname;

    if (isLoggedIn === 'true' && authContainer) {
        const user = JSON.parse(localStorage.getItem('staffUser')) || { name: "Usuario" };
        const avatarHTML = getAvatar(user.name);
        const hasNewOrders = (localStorage.getItem('newOrderAlert') === 'true' && userRole === 'admin');
        const panelLink = (userRole === 'admin') ? 'admin.html' : 'index.html';

        authContainer.innerHTML = `
            <div class="flex items-center gap-3 bg-slate-800 p-1.5 pr-3 rounded-full border ${hasNewOrders ? 'border-red-500 animate-pulse' : 'border-blue-500/40'} shadow-lg relative">
                ${hasNewOrders && userRole === 'admin' ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-ping"></span>' : ''}
                ${avatarHTML}
                <a href="${panelLink}" onclick="localStorage.setItem('newOrderAlert', 'false')" class="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    ${userRole === 'admin' ? 'ADMIN' : user.name.split(' ')[0]}
                </a>
                <button onclick="logout()" class="text-red-500 text-xs ml-1"><i class="fas fa-power-off"></i></button>
            </div>
        `;
    }

    if (path.includes('admin.html')) {
        if (isLoggedIn === 'true' && userRole === 'admin') renderAdminTable();
        else window.location.href = 'login.html';
    }
});

// --- SISTEMA DE LOGIN Y REGISTRO ---
const logForm = document.getElementById('loginForm');
if (logForm) {
    logForm.addEventListener('submit', (e) => {
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
            if(savedUser && (savedUser.email === userInput || savedUser.phone === userInput) && savedUser.pass === pass) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', 'user');
                window.location.href = 'index.html';
            } else { alert('Datos incorrectos.'); }
        }
    });
}

const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = document.getElementById('regEmail').value.trim();
        const user = { name: document.getElementById('regName').value, email: val, phone: val, pass: document.getElementById('regPass').value };
        localStorage.setItem('staffUser', JSON.stringify(user));
        alert("¡Cuenta creada!");
        window.location.href = 'login.html';
    });
}

// --- PANEL DE ADMINISTRACIÓN PROFESIONAL ---
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
        let st = log.estado === "ENTREGADO" ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                 (log.estado === "DEMORA" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20");

        return `
        <tr class="hover:bg-blue-500/[0.03] transition-all group border-b border-slate-700/50">
            <td class="p-8 text-xs font-mono text-slate-500">${log.fecha}<br><b class="text-blue-500 text-lg">${log.id}</b></td>
            <td class="p-8"><div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-black text-blue-400">${log.nombre.charAt(0)}</div>
                <div><b class="text-white text-base block mb-0.5">${log.nombre}</b><span class="text-slate-500 text-xs font-bold"><i class="fas fa-phone-alt mr-1 text-[10px]"></i>${log.telefono}</span></div>
            </div></td>
            <td class="p-8"><span class="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">${log.falla} ${log.express ? '⚡' : ''}</span><br><span class="text-[10px] text-slate-500 italic">📍 ${log.ubicacion}</span></td>
            <td class="p-8"><b class="text-2xl font-black text-green-400 tracking-tighter">$${log.precio}</b></td>
            <td class="p-8 text-center"><span class="${st} px-4 py-1.5 rounded-full text-[10px] font-black border shadow-sm">${log.estado}</span></td>
            <td class="p-8 text-right"><div class="inline-flex gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-700">
                <button onclick="cambiarEstado('${log.id}', 'ENTREGADO')" class="w-10 h-10 bg-green-600 hover:bg-green-500 text-white rounded-xl flex items-center justify-center"><i class="fas fa-check"></i></button>
                <button onclick="showEvidencePanel('${log.id}')" class="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center"><i class="fas fa-camera"></i></button>
                <button onclick="eliminarOrden('${log.id}')" class="w-10 h-10 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl flex items-center justify-center"><i class="fas fa-trash-alt"></i></button>
            </div></td>
        </tr>`;
    }).join('');
    if (totalDisplay) totalDisplay.innerText = `$${total}`;
}

// --- LOGICA WHATSAPP AUTOMÁTICO ---
function cambiarEstado(id, nuevo) {
    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const i = logs.findIndex(l => l.id === id);
    if(i !== -1) { 
        logs[i].estado = nuevo; 
        localStorage.setItem('cotizaciones', JSON.stringify(logs)); 
        renderAdminTable(); 
        if(nuevo === "ENTREGADO" && confirm("¿Notificar al cliente?")) {
            const o = logs[i];
            const msj = `¡Hola *${o.nombre}*! 👋 Soy José Luis de *CoreFix*.%0A🛠️ Tu equipo (*${o.id}*) ya está listo para entrega.%0A💰 Total: $${o.precio}%0A📍 Entrega: ${o.ubicacion}`;
            window.open(`https://wa.me/${o.telefono}?text=${msj}`, '_blank');
        }
    }
}

// --- ANÁLISIS DE FALLAS ---
function obtenerEstadisticas() {
    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const stats = {};
    logs.forEach(log => { stats[log.falla] = (stats[log.falla] || 0) + 1; });
    return stats;
}

// --- COTIZACIÓN Y UTILIDADES ACTUALIZADAS ---
function aceptarCotizacion() {
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    const damage = document.getElementById('damageType');
    const area = document.getElementById('deliveryPoint').value;
    
    // [NUEVOS DATOS]
    const isExpress = document.getElementById('expressMode')?.checked;
    const photo = document.getElementById('beforePreview')?.src || null;
    const signature = canvas ? canvas.toDataURL() : null;

    if (!name || !phone || damage.value === "0") return alert("Faltan datos");

    playSuccessSound();
    
    let price = parseInt(damage.value);
    if(isExpress) price = Math.round(price * 1.20); // Recargo express

    const order = { 
        id: "CF-" + Math.floor(1000 + Math.random() * 9999), 
        fecha: new Date().toLocaleDateString(), 
        nombre: name, telefono: phone, ubicacion: area, 
        falla: damage.options[damage.selectedIndex].text, 
        precio: price, estado: "PENDIENTE",
        express: isExpress,
        fotoAntes: photo,
        fotoDespues: null,
        firma: signature
    };
    
    let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    logs.push(order);
    localStorage.setItem('cotizaciones', JSON.stringify(logs));
    localStorage.setItem('currentOrder', JSON.stringify(order));
    localStorage.setItem('newOrderAlert', 'true');
    window.location.href = 'orden.html';
}

function buscarEstado() {
    const p = document.getElementById('searchPhone').value.trim();
    const res = document.getElementById('resultContainer');
    const logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
    const my = logs.filter(l => l.telefono === p);
    if (my.length === 0) { res.classList.remove('hidden'); res.innerHTML = "No hay órdenes"; return; }
    const last = my[my.length - 1];
    res.classList.remove('hidden');
    res.innerHTML = `<div class="bg-blue-500/10 border border-white/5 p-10 rounded-[3rem] shadow-2xl"><h4>Folio: ${last.id}</h4><h3 class="text-xl font-black uppercase text-blue-400">${last.estado}</h3><p class="text-xs italic">📍 Zona: ${last.ubicacion}</p></div>`;
}

function eliminarOrden(id) {
    if(confirm('¿Eliminar?')) {
        let logs = JSON.parse(localStorage.getItem('cotizaciones')) || [];
        localStorage.setItem('cotizaciones', JSON.stringify(logs.filter(l => l.id !== id)));
        renderAdminTable();
    }
}

function logout() { localStorage.clear(); window.location.href = 'index.html'; }
function openLogin() { window.location.href = 'login.html'; }

function updatePrice() { 
    const sel = document.getElementById('damageType');
    const express = document.getElementById('expressMode')?.checked;
    let base = parseInt(sel.value);
    if(express && base > 0) base = Math.round(base * 1.20);
    const display = document.getElementById('priceDisplay');
    if(display) display.innerText = base; 
}

// --- FILTRO DE BUSQUEDA EN TIEMPO REAL ---
function filterAdminTable() {
    const val = document.getElementById('adminSearch').value.toLowerCase();
    document.querySelectorAll('#adminTableBody tr').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(val) ? '' : 'none';
    });
}

function playSuccessSound() { new Audio('https://www.soundjay.com/buttons/beep-07a.mp3').play().catch(e=>{}); }