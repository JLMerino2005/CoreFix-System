// ESTADO GLOBAL DE DATOS (Usando localStorage para persistencia local)
let dineroEnCaja = parseFloat(localStorage.getItem('corefix_ingresos')) || 0;
let listaTrabajos = JSON.parse(localStorage.getItem('corefix_trabajos')) || [
    {
        url: "https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=600",
        descripcion: "Limpieza profunda y cambio de pasta térmica en Laptop"
    },
    {
        url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600",
        descripcion: "Sustitución de centro de carga en dispositivo móvil"
    }
];

// INICIALIZADOR AL CARGAR LA PÁGINA
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("caja-total")) {
        actualizarCajaUI();
    }
    if (document.getElementById("galeria-publica")) {
        dibujarGaleriaPublica();
    }
});

// GESTIÓN FINANCIERA (ADMINISTRADOR)
function registrarIngreso() {
    const inputMonto = document.getElementById("input-monto");
    const valor = parseFloat(inputMonto.value);

    if (!isNaN(valor) && valor > 0) {
        dineroEnCaja += valor;
        localStorage.setItem('corefix_ingresos', dineroEnCaja);
        actualizarCajaUI();
        inputMonto.value = "";
        alert("💰 Cantidad guardada correctamente en el registro.");
    } else {
        alert("Por favor ingresa un monto válido.");
    }
}

function actualizarCajaUI() {
    const elementoCaja = document.getElementById("caja-total");
    if (elementoCaja) {
        elementoCaja.innerText = `$${dineroEnCaja.toFixed(2)}`;
    }
}

// GESTIÓN DEL PORTAFOLIO DINÁMICO
function publicarTrabajo() {
    const urlInput = document.getElementById("input-url").value.trim();
    const descInput = document.getElementById("input-desc").value.trim();

    if (!descInput) {
        alert("Por favor introduce una descripción del servicio técnico.");
        return;
    }

    // Imagen de repuesto si no se especifica una URL
    const imagenFinal = urlInput || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600";

    const nuevoTrabajo = {
        url: imagenFinal,
        descripcion: descInput
    };

    listaTrabajos.unshift(nuevoTrabajo); // Agrega al inicio
    localStorage.setItem('corefix_trabajos', JSON.stringify(listaTrabajos));
    
    // Limpiar campos de texto
    document.getElementById("input-url").value = "";
    document.getElementById("input-desc").value = "";
    alert("📸 ¡Trabajo publicado! Ya es visible para el público en la página principal.");
}

function dibujarGaleriaPublica() {
    const contenedor = document.getElementById("galeria-publica");
    if (!contenedor) return;
    
    contenedor.innerHTML = "";

    listaTrabajos.forEach(trabajo => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200/60 transition duration-300 hover:shadow-md";
        
        tarjeta.innerHTML = `
            <div class="h-48 overflow-hidden bg-slate-200 flex items-center justify-center">
                <img src="${trabajo.url}" alt="Evidencia de Trabajo COREFIX" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600';">
            </div>
            <div class="p-4 bg-white border-t">
                <p class="font-bold text-xs text-azulCielo uppercase tracking-wide mb-1">COREFIX TALLER</p>
                <p class="text-sm font-semibold text-slate-700">${trabajo.descripcion}</p>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}