// ==========================================
// 1. CONFIGURACIÓN DE DATOS Y PRECIOS
// ==========================================

// Intentamos cargar precios del almacenamiento local, si no, usamos los de fábrica
let precios = JSON.parse(localStorage.getItem("misPrecios")) || {
    A: { paquete: 2441.07, gestion: 2441.07, retiro: 2243.67, extra: 448.73, movistar: 2719.42 },
    B: { paquete: 2243.67, gestion: 2243.67, retiro: 1809.70, extra: 361.84, movistar: 2719.42 },
    global: { tarjeta: 1542.22 }
};

const barriosPorZona = {
    A: ["Allan", "Bosques", "Ranelagh", "Vatteone"],
    B: ["Berazategui", "Bernal", "Calzada", "Claypole", "Quilmes", "Solano", "Wilde"]
};

// Variables Globales de Estado
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
    
    // Ocultamos todas
    todasLasScreens.forEach(s => {
        s.classList.remove("active");
        s.style.display = "none";
    });

    let target;
    if (typeof indexOrId === "string") {
        // Si le pasamos un nombre como "homeScreen"
        target = document.getElementById(indexOrId);
    } else {
        // Si le pasamos un número como 0, 1, 2...
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
    document.querySelectorAll("input").forEach(i => i.value = 0);
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

document.getElementById("btnNuevo").addEventListener("click", () => showScreen(1));

document.getElementById("btnHistorial").addEventListener("click", () => {
    actualizarSelectorMeses();
    showScreen(9);
});

// Botón de Configuración (Engranaje)
document.getElementById("btnConfig").addEventListener("click", () => {
    document.getElementById("loginAdmin").style.display = "block";
    document.getElementById("formPrecios").style.display = "none";
    document.getElementById("pinAdmin").value = "";
    showScreen(11); // Pantalla de Admin
});

document.querySelectorAll(".back-home-btn").forEach(btn => btn.addEventListener("click", goHome));

// Selección de Zona
document.querySelectorAll(".zona-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        data.zona = btn.getAttribute("data-zona");
        selectBarrio.innerHTML = '<option value="">Seleccionar barrio...</option>';
        barriosPorZona[data.zona].forEach(b => {
            const opt = document.createElement("option");
            opt.value = b; opt.textContent = b;
            selectBarrio.appendChild(opt);
        });
        showScreen(2);
    });
});

selectBarrio.addEventListener("change", () => nextBarrioBtn.disabled = selectBarrio.value === "");

// Flujo de "Siguiente"
document.querySelectorAll(".next-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const active = screens[currentScreen];
        if (currentScreen === 2) data.barrio = selectBarrio.value;
        const inputs = active.querySelectorAll("input[data-key]");
        inputs.forEach(input => data[input.dataset.key] = Number(input.value) || 0);

        let next = currentScreen + 1;
        if (next === 8) renderSummary();
        showScreen(next);
    });
});

// Botones "Atrás"
document.querySelectorAll(".back-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (currentScreen === 1 || currentScreen === 9) goHome();
        else if (currentScreen === 10) showScreen(9);
        else showScreen(currentScreen - 1);
    });
});

// =====================
// 4. LÓGICA DE CÁLCULO
// =====================

function calcularTotal() {
    const p = precios[data.zona];
    return (data.paquetes * p.paquete) + 
           (data.paqueteExtra * p.extra) + 
           (data.movistar * p.movistar) +
           (data.tarjetas * precios.global.tarjeta) + 
           (data.retiros * p.retiro) + 
           (data.retiroExtra * p.extra) + 
           (data.gestiones * p.gestion);
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
    const ahora = new Date();
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    historial.push({
        mesAno: `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`,
        fecha: ahora.toLocaleDateString(),
        montoTotal: totalDia,
        ...data
    });
    
    localStorage.setItem("historial", JSON.stringify(historial));
    alert("✅ Guardado correctamente.");
    goHome();
});

// =====================
// 5. HISTORIAL Y PDF
// =====================

function actualizarSelectorMeses() {
    const historial = JSON.parse(localStorage.getItem("historial")) || [];
    const selector = document.getElementById("filtroMes");
    const mesesUnicos = [...new Set(historial.map(h => h.mesAno))].reverse();
    selector.innerHTML = mesesUnicos.length ? "" : '<option>Sin datos</option>';
    mesesUnicos.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m; opt.textContent = m;
        selector.appendChild(opt);
    });
}

function renderVistaHistorial(tipo) {
    const historial = JSON.parse(localStorage.getItem("historial")) || [];
    const mesSel = document.getElementById("filtroMes").value;
    const btnPDF = document.getElementById("btnDescargarPDF");
    
    histDiv.innerHTML = "";
    let acumulado = 0;

    btnPDF.style.display = (tipo === "completo") ? "block" : "none";

    const filtrados = historial.filter(h => h.mesAno === mesSel);
    if (!filtrados.length) return histDiv.innerHTML = "<p>No hay registros.</p>";

    filtrados.forEach(h => {
        acumulado += h.montoTotal;
        const item = document.createElement("div");
        item.style = "padding: 15px; margin-bottom: 10px; background: #fff; border-left: 5px solid #5b1e8f; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";
        
        if (tipo === "parcial") {
            histTitulo.textContent = `Totales: ${mesSel}`;
            item.innerHTML = `<b>${h.fecha}</b> <span style="float:right">${fmt.format(h.montoTotal)}</span>`;
        } else {
            histTitulo.textContent = `Detalle: ${mesSel}`;
            item.innerHTML = `<div style="font-size:12px; color:#666;">${h.fecha} | ${h.barrio}</div>
                              <div style="font-weight:bold; color:#d32f2f;">${fmt.format(h.montoTotal)}</div>
                              <div style="font-size:11px;">Paq: ${h.paquetes} | Mov: ${h.movistar} | Ret: ${h.retiros}</div>`;
        }
        histDiv.appendChild(item);
    });
    histTotalMonto.textContent = `TOTAL ${mesSel.toUpperCase()}: ${fmt.format(acumulado)}`;
}

document.getElementById("btnHParcial").addEventListener("click", () => { renderVistaHistorial("parcial"); showScreen(10); });
document.getElementById("btnHCompleto").addEventListener("click", () => { renderVistaHistorial("completo"); showScreen(10); });
document.getElementById("btnHBorrar").addEventListener("click", () => {
    if (confirm("¿Borrar todo el historial?")) { localStorage.removeItem("historial"); goHome(); }
});

// Generación de PDF detallado
document.getElementById("btnDescargarPDF").addEventListener("click", () => {
    const historial = JSON.parse(localStorage.getItem("historial")) || [];
    const mesSel = document.getElementById("filtroMes").value;
    const filtrados = historial.filter(h => h.mesAno === mesSel);
    let acumulado = 0;
    
    let contenidoPDF = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="color: #5b1e8f; text-align: center;">REPORTE MENSUAL DE TRABAJO</h1>
            <p style="text-align: center; color: #666;">Periodo: ${mesSel}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #5b1e8f; color: white;">
                        <th style="padding: 10px; border: 1px solid #ddd;">Fecha</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Barrio</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Detalle</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
                    </tr>
                </thead>
                <tbody>
    `;

    filtrados.forEach(h => {
        acumulado += h.montoTotal;
        contenidoPDF += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${h.fecha}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${h.barrio}</td>
                <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">Paq: ${h.paquetes} | Mov: ${h.movistar} | Ret: ${h.retiros}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${fmt.format(h.montoTotal)}</td>
            </tr>`;
    });

    contenidoPDF += `</tbody></table>
        <h2 style="text-align: right; color: #d32f2f;">TOTAL: ${fmt.format(acumulado)}</h2>
        <p style="text-align: center; color: #aaa; font-size: 10px; margin-top: 30px;">Generado por KalcuPacK Pro</p>
    </div>`;

    html2pdf().set({ margin: 10, filename: `Reporte_${mesSel}.pdf`, html2canvas: { scale: 3 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(contenidoPDF).save();
});

// =====================
// 6. CONTADORES (+ / -)
// =====================

document.querySelectorAll(".counter").forEach(counter => {
    const input = counter.querySelector("input");
    counter.querySelector(".plus-btn").addEventListener("click", () => { input.value = Number(input.value) + 1; });
    counter.querySelector(".minus-btn").addEventListener("click", () => { input.value = Math.max(0, Number(input.value) - 1); });
    input.addEventListener("focus", (e) => {
        setTimeout(() => { e.target.select(); e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
    });
});

// =====================
// 7. SECCIÓN ADMIN PIN
// =====================

document.getElementById("btnEntrarAdmin").addEventListener("click", () => {
    if(document.getElementById("pinAdmin").value === "1234") {
        document.getElementById("loginAdmin").style.display = "none";
        document.getElementById("formPrecios").style.display = "block";
        // Cargar valores en inputs
        document.getElementById("p_A_paq").value = precios.A.paquete;
        document.getElementById("p_A_ext").value = precios.A.extra;
        document.getElementById("p_A_mov").value = precios.A.movistar;
        document.getElementById("p_B_paq").value = precios.B.paquete;
        document.getElementById("p_B_ext").value = precios.B.extra;
    } else { alert("PIN Incorrecto"); }
});

document.getElementById("btnGuardarPrecios").addEventListener("click", () => {
    precios.A.paquete = Number(document.getElementById("p_A_paq").value);
    precios.A.extra = Number(document.getElementById("p_A_ext").value);
    precios.A.movistar = Number(document.getElementById("p_A_mov").value);
    precios.B.paquete = Number(document.getElementById("p_B_paq").value);
    precios.B.extra = Number(document.getElementById("p_B_ext").value);
    localStorage.setItem("misPrecios", JSON.stringify(precios));
    alert("✅ Precios guardados.");
    goHome();
});

// =====================
// 8. INICIO (SPLASH)
// =====================

function iniciarApp() {
    setTimeout(() => {
        const splash = document.getElementById("splashScreen");
        if (splash) {
            splash.style.opacity = "0";
            setTimeout(() => {
                splash.style.display = "none";
                // LLAMADA POR ID (Más seguro)
                showScreen("homeScreen"); 
            }, 800);
        }
    }, 5000); 
}

iniciarApp();
