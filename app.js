// ==========================================
// 1. CONFIGURACIÓN DE DATOS Y PRECIOS
// ==========================================

let precios = JSON.parse(localStorage.getItem("misPrecios")) || {
    A: { paquete: 2441.07, gestion: 2441.07, retiro: 2243.67, extra: 448.73, movistar: 2719.42 },
    B: { paquete: 2243.67, gestion: 2243.67, retiro: 1809.70, extra: 361.84, movistar: 2719.42 },
    global: { tarjeta: 1542.22 }
};

const barriosPorZona = {
    A: ["Allan", "Bosques", "Ranelagh", "Vatteone"],
    B: ["Berazategui", "Bernal", "Calzada", "Claypole", "Quilmes", "Solano", "Wilde"]
};

let currentScreen = 0;
const screens = document.querySelectorAll(".screen");
const selectBarrio = document.getElementById("selectBarrio");
const nextBarrioBtn = document.getElementById("nextBarrio");
const histDiv = document.querySelector(".historial");
const histTotalMonto = document.getElementById("histTotalMonto");
const histTitulo = document.getElementById("histTitulo");
const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

let data = {
    zona: "", barrio: "", paquetes: 0, paqueteExtra: 0,
    movistar: 0, tarjetas: 0, retiros: 0, retiroExtra: 0, gestiones: 0
};

// =====================
// 2. NAVEGACIÓN
// =====================

function showScreen(indexOrId) {
    const todasLasScreens = document.querySelectorAll(".screen");
    todasLasScreens.forEach(s => {
        s.classList.remove("active");
        s.style.display = "none";
    });

    let target;
    if (typeof indexOrId === "string") {
        target = document.getElementById(indexOrId);
    } else {
        target = todasLasScreens[indexOrId];
    }

    if (target) {
        target.classList.add("active");
        target.style.display = "flex";
        currentScreen = Array.from(todasLasScreens).indexOf(target);
        window.scrollTo(0, 0);
    }
}

function goHome() {
    resetData();
    document.querySelectorAll("input").forEach(i => {
        if(i.type === "number") i.value = 0;
    });
    
    // Limpiar textos de subtotales por pantalla
    document.querySelectorAll(".subtotal-pantalla").forEach(el => el.textContent = fmt.format(0));
    
    document.getElementById("editIndex").value = "-1";
    document.getElementById("btnEliminarEntrada").style.display = "none";
    
    selectBarrio.innerHTML = '<option value="">Seleccionar barrio...</option>';
    nextBarrioBtn.disabled = true;
    showScreen(0);
}

function resetData() {
    data = { zona: "", barrio: "", paquetes: 0, paqueteExtra: 0, movistar: 0, tarjetas: 0, retiros: 0, retiroExtra: 0, gestiones: 0 };
}

// =====================
// 3. EVENTOS PRINCIPALES
// =====================

document.getElementById("btnNuevo").addEventListener("click", () => {
    goHome();
    
    const hoy = new Date();
    // Extraemos año, mes y día por separado del reloj local
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0'); // Mes (0-11, por eso +1)
    const dd = String(hoy.getDate()).padStart(2, '0'); // Día local
    
    const fechaLocal = `${yyyy}-${mm}-${dd}`;
    
    document.getElementById("fechaEntrada").value = fechaLocal;
    showScreen(1);
});

document.getElementById("btnHistorial").addEventListener("click", () => {
    actualizarSelectorMeses();
    showScreen(9);
});

document.getElementById("btnConfig").addEventListener("click", () => {
    document.getElementById("loginAdmin").style.display = "block";
    document.getElementById("formPrecios").style.display = "none";
    document.getElementById("pinAdmin").value = "";
    showScreen(11);
});

document.querySelectorAll(".back-home-btn").forEach(btn => btn.addEventListener("click", goHome));

document.querySelectorAll(".zona-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const fechaVal = document.getElementById("fechaEntrada").value;
        if(!fechaVal) return alert("Por favor, selecciona una fecha.");

        data.zona = btn.getAttribute("data-zona");
        cargarBarrios(data.zona);
        showScreen(2);
    });
});

function cargarBarrios(zona) {
    selectBarrio.innerHTML = '<option value="">Seleccionar barrio...</option>';
    if(barriosPorZona[zona]) {
        barriosPorZona[zona].forEach(b => {
            const opt = document.createElement("option");
            opt.value = b; opt.textContent = b;
            selectBarrio.appendChild(opt);
        });
    }
}

selectBarrio.addEventListener("change", () => {
    nextBarrioBtn.disabled = selectBarrio.value === "";
});

document.querySelectorAll(".next-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (currentScreen === 2) {
            if(!selectBarrio.value) return alert("Selecciona un barrio.");
            data.barrio = selectBarrio.value;
        }
        let next = currentScreen + 1;
        if (next === 8) renderSummary();
        showScreen(next);
    });
});

document.querySelectorAll(".back-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (currentScreen === 1 || currentScreen === 9) goHome();
        else if (currentScreen === 10) showScreen(9);
        else showScreen(currentScreen - 1);
    });
});

// =====================
// 4. LÓGICA DE CÁLCULO Y EDICIÓN
// =====================

function editarEntrada(index) {
    const historial = JSON.parse(localStorage.getItem("historial")) || [];
    const h = historial[index];
    if (!h) return;

    resetData();
    document.getElementById("editIndex").value = index;
    document.getElementById("btnEliminarEntrada").style.display = "block";

    Object.keys(data).forEach(key => {
        if (h[key] !== undefined) {
            data[key] = h[key];
            const input = document.querySelector(`input[data-key="${key}"]`);
            if(input) input.value = h[key];
        }
    });

    const partes = h.fecha.split('/');
    const fechaISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
    document.getElementById("fechaEntrada").value = fechaISO;

    data.zona = h.zona; 
    showScreen(1); 
    
    setTimeout(() => {
        cargarBarrios(h.zona);
        selectBarrio.value = h.barrio;
        nextBarrioBtn.disabled = false;
        actualizarDataYSubtotales(); // Calcular subtotales al cargar edición
    }, 100);
}

function calcularTotal() {
    const z = data.zona;
    const p = precios[z];
    if(!z || !p) return 0;

    return (data.paquetes * p.paquete) + 
           (data.paqueteExtra * p.extra) + 
           (data.movistar * p.movistar) +
           (data.tarjetas * (precios.global?.tarjeta || 0)) + 
           (data.retiros * p.retiro) + 
           (data.retiroExtra * p.extra) + 
           (data.gestiones * p.gestion);
}

function actualizarDataYSubtotales() {
    // 1. Mapear todos los inputs a la variable data
    document.querySelectorAll("input[data-key]").forEach(input => {
        data[input.dataset.key] = Number(input.value) || 0;
    });

    const z = data.zona;
    const p = precios[z];
    
    // Si no hay zona elegida (por seguridad), salimos
    if(!z || !p) return;

    // --- PANTALLA PAQUETES ---
    const subPaq = (data.paquetes * p.paquete) + (data.paqueteExtra * p.extra);
    escribirSubtotal("subtotal-paquetes", subPaq);

    // --- PANTALLA MOVISTAR (Pantalla 4) ---
    const subMovi = (data.movistar * p.movistar);
    escribirSubtotal("subtotal-movistar", subMovi);

    // --- PANTALLA TARJETAS (Pantalla 5) ---
    // Usamos el precio global de tarjeta
    const precioTarjeta = precios.global ? precios.global.tarjeta : 0;
    const subTarj = (data.tarjetas * precioTarjeta);
    escribirSubtotal("subtotal-tarjetas", subTarj);

    // --- PANTALLA RETIROS ---
    const subRet = (data.retiros * p.retiro) + (data.retiroExtra * p.extra);
    escribirSubtotal("subtotal-retiros", subRet);

    // --- PANTALLA GESTIONES ---
    const subGest = (data.gestiones * p.gestion);
    escribirSubtotal("subtotal-gestiones", subGest);
}

function escribirSubtotal(idElemento, monto) {
    const el = document.getElementById(idElemento);
    if(el) el.textContent = fmt.format(monto);
}

function renderSummary() {
    const total = calcularTotal();
    document.querySelector(".summary").innerHTML = `
        <p><strong>📍 Zona ${data.zona} - ${data.barrio}</strong></p>
        <hr>
        <p>📦 Paquetes: ${data.paquetes} (Extra: ${data.paqueteExtra})</p>
        <p>📱 Movistar: ${data.movistar} | 💳 Tarjetas: ${data.tarjetas}</p>
        <p>🚚 Retiros: ${data.retiros} (Extra: ${data.retiroExtra})</p>
        <p>📝 Gestiones: ${data.gestiones}</p>
    `;
    document.getElementById("montoTotalResumen").textContent = `TOTAL: ${fmt.format(total)}`;
}

document.querySelector(".finish-btn").addEventListener("click", () => {
    const totalDia = calcularTotal();
    if (totalDia <= 0) return alert("Carga datos antes de terminar.");

    const historial = JSON.parse(localStorage.getItem("historial")) || [];
    const editIndex = parseInt(document.getElementById("editIndex").value);
    const fechaInput = document.getElementById("fechaEntrada").value;
    const f = new Date(fechaInput + "T12:00:00");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    const nuevoRegistro = {
        mesAno: `${meses[f.getMonth()]} ${f.getFullYear()}`,
        fecha: f.toLocaleDateString('es-AR'),
        montoTotal: totalDia,
        ...data
    };

    if (editIndex > -1) { historial[editIndex] = nuevoRegistro; } 
    else { historial.push(nuevoRegistro); }
    
    localStorage.setItem("historial", JSON.stringify(historial));
    alert("✅ Operación exitosa.");
    goHome();
});

// =====================
// 5. HISTORIAL Y PDF
// =====================

function actualizarSelectorMeses() {
    const historial = JSON.parse(localStorage.getItem("historial")) || [];
    const selector = document.getElementById("filtroMes");
    
    // 1. Definimos el orden correcto de los meses
    const mesesOrden = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    // 2. Obtenemos los meses únicos
    let mesesUnicos = [...new Set(historial.map(h => h.mesAno))];

    // 3. Ordenamos cronológicamente (por año y luego por mes)
    mesesUnicos.sort((a, b) => {
        const [mesA, anoA] = a.split(" ");
        const [mesB, anoB] = b.split(" ");
        
        if (anoA !== anoB) {
            return anoA - anoB; // Primero comparamos el año
        }
        return mesesOrden.indexOf(mesA) - mesesOrden.indexOf(mesB); // Luego la posición en mesesOrden
    });

    selector.innerHTML = mesesUnicos.length ? "" : '<option>Sin datos</option>';
    
    mesesUnicos.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        selector.appendChild(opt);
    });

    // 4. Lógica para seleccionar el mes en curso automáticamente
    const ahora = new Date();
    const mesActualNombre = mesesOrden[ahora.getMonth()];
    const anoActual = ahora.getFullYear();
    const mesAnoHoy = `${mesActualNombre} ${anoActual}`;

    if (mesesUnicos.includes(mesAnoHoy)) {
        selector.value = mesAnoHoy;
    } else if (mesesUnicos.length > 0) {
        // Si el mes actual no tiene datos, mostramos el último del año (el final de la lista)
        selector.selectedIndex = mesesUnicos.length - 1;
    }
}

function renderVistaHistorial(tipo) {
    const historial = JSON.parse(localStorage.getItem("historial")) || [];
    const mesSel = document.getElementById("filtroMes").value;
    const btnPDF = document.getElementById("btnDescargarPDF");
    
    histDiv.innerHTML = "";
    let acumulado = 0;

    btnPDF.style.display = (tipo === "completo") ? "block" : "none";

    // Filtramos los datos del mes
    const filtrados = historial.map((h, i) => ({...h, idxOrig: i})).filter(h => h.mesAno === mesSel);
    
    // Calculamos el acumulado siempre
    filtrados.forEach(h => acumulado += h.montoTotal);

    if (tipo === "parcial") {
        // === VISTA TOTALES DEL MES (SOLO EL MONTO FINAL) ===
        histTitulo.textContent = `Acumulado ${mesSel}`;
        
        const pantallaTotal = document.createElement("div");
        pantallaTotal.style = "display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; text-align: center;";
        
        pantallaTotal.innerHTML = `
            <div style="color: #666; font-size: 16px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Total hasta el momento</div>
            <div style="font-size: 42px; font-weight: 900; color: #5b1e8f;">${fmt.format(acumulado)}</div>
        `;
        
        histDiv.appendChild(pantallaTotal);
        
        // Escondemos el texto de abajo para que no se duplique
        histTotalMonto.style.display = "none";

    } else {
        // === VISTA DETALLE DIARIO (MANTIENE TU LOGICA ORIGINAL) ===
        histTotalMonto.style.display = "block"; // Aseguramos que se vea el total abajo
        histTitulo.textContent = `Detalle: ${mesSel}`;
        
        if (!filtrados.length) return histDiv.innerHTML = "<p>No hay registros.</p>";

        filtrados.forEach(h => {
            const item = document.createElement("div");
            item.style = "padding: 15px; margin-bottom: 10px; background: #fff; border-left: 5px solid #5b1e8f; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); position:relative;";
            
            const btnEdit = `<button onclick="editarEntrada(${h.idxOrig})" style="position:absolute; right:10px; top:10px; background:none; border:none; font-size:18px; cursor:pointer;">✏️</button>`;

            item.innerHTML = `${btnEdit}
                              <div style="font-size:12px; color:#666;">${h.fecha} | ${h.barrio}</div>
                              <div style="font-weight:bold; color:#d32f2f;">${fmt.format(h.montoTotal)}</div>
                              <div style="font-size:11px;">Paq: ${h.paquetes} | Mov: ${h.movistar} | Ret: ${h.retiros}</div>`;
            histDiv.appendChild(item);
        });
        histTotalMonto.textContent = `TOTAL ${mesSel.toUpperCase()}: ${fmt.format(acumulado)}`;
    }
}

document.getElementById("btnHParcial").addEventListener("click", () => { renderVistaHistorial("parcial"); showScreen(10); });
document.getElementById("btnHCompleto").addEventListener("click", () => { renderVistaHistorial("completo"); showScreen(10); });
document.getElementById("btnHBorrar").addEventListener("click", () => {
    if (confirm("¿Borrar todo el historial?")) { localStorage.removeItem("historial"); goHome(); }
});

document.getElementById("btnDescargarPDF").addEventListener("click", () => {
    const historial = JSON.parse(localStorage.getItem("historial")) || [];
    const mesSel = document.getElementById("filtroMes").value;
    const filtrados = historial.filter(h => h.mesAno === mesSel);
    let acumulado = 0;
    let contenidoPDF = `<div style="padding: 20px; font-family: Arial;">
        <h1 style="color: #5b1e8f; text-align: center;">REPORTE MENSUAL</h1>
        <p style="text-align: center;">Periodo: ${mesSel}</p>
        <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background: #5b1e8f; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd;">Fecha</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Barrio</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
            </tr></thead><tbody>`;

    filtrados.forEach(h => {
        acumulado += h.montoTotal;
        contenidoPDF += `<tr>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${h.fecha}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${h.barrio}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${fmt.format(h.montoTotal)}</td>
        </tr>`;
    });

    contenidoPDF += `</tbody></table><h2 style="text-align: right;">TOTAL: ${fmt.format(acumulado)}</h2></div>`;
    html2pdf().set({ margin: 10, filename: `Reporte_${mesSel}.pdf` }).from(contenidoPDF).save();
});

// =====================
// 6. CONTADORES (+ / -) CON TOTAL PARCIAL
// =====================
document.querySelectorAll(".counter").forEach(counter => {
    const input = counter.querySelector("input");
    const btnPlus = counter.querySelector(".plus-btn");
    const btnMinus = counter.querySelector(".minus-btn");

    btnPlus.onclick = (e) => { 
        e.preventDefault(); 
        input.value = (Number(input.value) || 0) + 1;
        actualizarDataYSubtotales();
    };

    btnMinus.onclick = (e) => { 
        e.preventDefault(); 
        input.value = Math.max(0, (Number(input.value) || 0) - 1);
        actualizarDataYSubtotales();
    };

    input.oninput = () => actualizarDataYSubtotales();
    input.onclick = function() { if (!this.readOnly) this.select(); };
});

// =====================
// 7. SECCIÓN ADMIN
// =====================
document.getElementById("btnEntrarAdmin").addEventListener("click", () => {
    if(document.getElementById("pinAdmin").value === "1234") {
        document.getElementById("loginAdmin").style.display = "none";
        document.getElementById("formPrecios").style.display = "block";
        document.getElementById("p_A_paq").value = precios.A.paquete;
        document.getElementById("p_A_ext").value = precios.A.extra;
        document.getElementById("p_B_paq").value = precios.B.paquete;
        document.getElementById("p_B_ext").value = precios.B.extra;
        document.getElementById("p_movistar").value = precios.A.movistar; 
        document.getElementById("p_tarjeta").value = precios.global.tarjeta;
    } else { alert("PIN Incorrecto"); }
});

document.getElementById("btnGuardarPrecios").addEventListener("click", () => {
    precios.A.paquete = Number(document.getElementById("p_A_paq").value);
    precios.A.gestion = precios.A.paquete;
    precios.A.extra = Number(document.getElementById("p_A_ext").value);
    precios.B.paquete = Number(document.getElementById("p_B_paq").value);
    precios.B.gestion = precios.B.paquete;
    precios.B.extra = Number(document.getElementById("p_B_ext").value);
    precios.A.movistar = Number(document.getElementById("p_movistar").value);
    precios.B.movistar = precios.A.movistar;
    precios.global.tarjeta = Number(document.getElementById("p_tarjeta").value);
    localStorage.setItem("misPrecios", JSON.stringify(precios));
    alert("✅ Precios actualizados.");
    goHome();
});

// =====================
// 8. INICIO Y ELIMINAR
// =====================
function iniciarApp() {
    setTimeout(() => {
        const splash = document.getElementById("splashScreen");
        if (splash) {
            splash.style.opacity = "0";
            setTimeout(() => { splash.style.display = "none"; showScreen("homeScreen"); }, 800);
        }
    }, 3000); 
}

document.getElementById('btnEliminarEntrada').onclick = function() {
    const index = parseInt(document.getElementById('editIndex').value);
    if (index > -1 && confirm("¿Borrar esta entrada definitivamente?")) {
        let historial = JSON.parse(localStorage.getItem('historial')) || [];
        historial.splice(index, 1);
        localStorage.setItem('historial', JSON.stringify(historial));
        goHome(); 
    }
}; 

iniciarApp();