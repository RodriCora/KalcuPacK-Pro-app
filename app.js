// ==========================================
// 1. CONFIGURACIÓN DE DATOS Y PRECIOS
// ==========================================
// --- Forzar Modo Oscuro por Defecto ---
document.documentElement.setAttribute("data-theme", "dark");
localStorage.setItem("theme", "dark");

let precios = JSON.parse(localStorage.getItem("misPrecios")) || {
    A: { paquete: 2441.07, gestion: 2441.07, retiro: 2243.67, retiroExtra: 448.73, extra: 448.73, movistar: 2719.42 },
    B: { paquete: 2243.67, gestion: 2243.67, retiro: 1809.70, retiroExtra: 361.84, extra: 361.84, movistar: 2719.42 },
    global: { tarjeta: 1542.22 }
};

const barriosPorZona = {
    A: ["Allan", "Bosques", "Ranelagh", "Vatteone"],
    B: ["Berazategui", "Bernal", "Calzada", "Claypole", "Quilmes", "Solano", "Wilde"]
};

let currentScreen = 0;
const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

let data = {
    zona: "", barrio: "", paquetes: 0, paqueteExtra: 0,
    movistar: 0, tarjetas: 0, retiros: 0, retiroExtra: 0, gestiones: 0
};

let selectBarrio, nextBarrioBtn, histDiv, histTotalMonto, histTitulo;

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
    } else {
        const home = document.getElementById("homeScreen");
        if(home) {
            home.classList.add("active");
            home.style.display = "flex";
        }
    }
}

function goHome() {
    resetData();
    document.querySelectorAll("input").forEach(i => {
        if(i.type === "number") i.value = 0;
    });
   
    document.querySelectorAll(".subtotal-pantalla").forEach(el => el.textContent = fmt.format(0));
    document.getElementById("editIndex").value = "-1";
    document.getElementById("btnEliminarEntrada").style.display = "none";
   
    if(selectBarrio) {
        selectBarrio.innerHTML = '<option value="">Seleccionar barrio...</option>';
        nextBarrioBtn.disabled = true;
    }
    showScreen("homeScreen");
}

function resetData() {
    data = { zona: "", barrio: "", paquetes: 0, paqueteExtra: 0, movistar: 0, tarjetas: 0, retiros: 0, retiroExtra: 0, gestiones: 0 };
}

// =====================
// 3. LÓGICA DE CÁLCULO
// =====================

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
    document.querySelectorAll("input[data-key]").forEach(input => {
        data[input.dataset.key] = Number(input.value) || 0;
    });

    const z = data.zona;
    const p = precios[z];
    if(!z || !p) return;

    escribirSubtotal("subtotal-paquetes", (data.paquetes * p.paquete) + (data.paqueteExtra * p.extra));
    escribirSubtotal("subtotal-movistar", (data.movistar * p.movistar));
    escribirSubtotal("subtotal-tarjetas", (data.tarjetas * (precios.global?.tarjeta || 0)));
    escribirSubtotal("subtotal-retiros", (data.retiros * p.retiro) + (data.retiroExtra * p.extra));
    escribirSubtotal("subtotal-gestiones", (data.gestiones * p.gestion));
}

function escribirSubtotal(idElemento, monto) {
    const el = document.getElementById(idElemento);
    if(el) el.textContent = fmt.format(monto);
}

function renderSummary() {
    const total = calcularTotal();
    const summary = document.querySelector(".summary");
    if(summary) {
        summary.innerHTML = `
            <p><strong>📍 Zona ${data.zona} - ${data.barrio}</strong></p>
            <hr>
            <p>📦 Paquetes: ${data.paquetes} (Extra: ${data.paqueteExtra})</p>
            <p>📱 Movistar: ${data.movistar} | 💳 Tarjetas: ${data.tarjetas}</p>
            <p>🚚 Retiros: ${data.retiros} (Extra: ${data.retiroExtra})</p>
            <p>📝 Gestiones: ${data.gestiones}</p>
        `;
    }
    document.getElementById("montoTotalResumen").textContent = `TOTAL: ${fmt.format(total)}`;
}

// =====================
// 4. HISTORIAL Y ADMIN
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
    document.getElementById("fechaEntrada").value = `${partes[2]}-${partes[1]}-${partes[0]}`;
    data.zona = h.zona;
    showScreen(1);
    setTimeout(() => {
        cargarBarrios(h.zona);
        selectBarrio.value = h.barrio;
        nextBarrioBtn.disabled = false;
        actualizarDataYSubtotales();
    }, 100);
}

// NUEVA FUNCIÓN PARA EL BOTÓN ELIMINAR
function eliminarEntradaActual() {
    const index = parseInt(document.getElementById("editIndex").value);
    if (index > -1 && confirm("¿Seguro que querés eliminar este registro?")) {
        const historial = JSON.parse(localStorage.getItem("historial")) || [];
        historial.splice(index, 1);
        localStorage.setItem("historial", JSON.stringify(historial));
        alert("Registro eliminado");
        goHome();
    }
}

function limpiarHistorialCompleto() {
    if (confirm("⚠️ ¿Estás seguro? Se borrarán TODOS los registros. Esta acción no se puede deshacer.")) {
        localStorage.removeItem("historial");
        alert("Historial vaciado.");
        goHome(); 
    }
}

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

function actualizarSelectorMeses() {
    const historial = JSON.parse(localStorage.getItem("historial")) || [];
    const selector = document.getElementById("filtroMes");
    const mesesOrden = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    let mesesUnicos = [...new Set(historial.map(h => h.mesAno))];
    mesesUnicos.sort((a, b) => {
        const [mesA, anoA] = a.split(" ");
        const [mesB, anoB] = b.split(" ");
        if (anoA !== anoB) return anoA - anoB;
        return mesesOrden.indexOf(mesA) - mesesOrden.indexOf(mesB);
    });
    selector.innerHTML = mesesUnicos.length ? "" : '<option>Sin datos</option>';
    mesesUnicos.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m; opt.textContent = m;
        selector.appendChild(opt);
    });
    const ahora = new Date();
    const mesAnoHoy = `${mesesOrden[ahora.getMonth()]} ${ahora.getFullYear()}`;
    if (mesesUnicos.includes(mesAnoHoy)) selector.value = mesAnoHoy;
    else if (mesesUnicos.length > 0) selector.selectedIndex = mesesUnicos.length - 1;
}

function renderVistaHistorial(tipo) {
    const historial = JSON.parse(localStorage.getItem("historial")) || [];
    const mesSel = document.getElementById("filtroMes").value;
    histDiv.innerHTML = "";
    let acumulado = 0;
    const filtrados = historial.map((h, i) => ({...h, idxOrig: i})).filter(h => h.mesAno === mesSel);
    filtrados.forEach(h => acumulado += h.montoTotal);

    if (tipo === "parcial") {
        histTitulo.textContent = `Acumulado ${mesSel}`;
        const pTotal = document.createElement("div");
        pTotal.style = "display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; text-align: center;";
        pTotal.innerHTML = `<div style="color: #666; font-size: 16px; margin-bottom: 10px;">TOTAL HASTA EL MOMENTO</div>
                            <div style="font-size: 42px; font-weight: 900; color: var(--primary);text-shadow: 0 0 4px var(--glow);">${fmt.format(acumulado)}</div>`;
        histDiv.appendChild(pTotal);
        histTotalMonto.style.display = "none";
    } else {
        histTotalMonto.style.display = "block";
        histTitulo.textContent = `Detalle: ${mesSel}`;
        filtrados.forEach(h => {
            const item = document.createElement("div");
            item.className = "historial-item"; 
            item.style = "padding: 15px; margin-bottom: 10px; background: #fff; border-left: 5px solid #5b1e8f; border-radius: 10px; position:relative; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";
            item.innerHTML = `<button onclick="editarEntrada(${h.idxOrig})" style="position:absolute; right:10px; top:10px; background:none; border:none; font-size:18px;">✏️</button>
                <div style="font-size:12px; color:#666;">${h.fecha} | ${h.barrio}</div>
                <div style="font-weight:bold; color:#d32f2f;">${fmt.format(h.montoTotal)}</div>
                <div style="font-size:11px;">Paq: ${h.paquetes} | Mov: ${h.movistar} | Ret: ${h.retiros}</div>`;
            histDiv.appendChild(item);
        });
        histTotalMonto.textContent = `TOTAL ${mesSel.toUpperCase()}: ${fmt.format(acumulado)}`;
    }
}

// =====================
// 5. INICIALIZACIÓN
// =====================

function iniciarApp() {
    selectBarrio = document.getElementById("selectBarrio");
    nextBarrioBtn = document.getElementById("nextBarrio");
    histDiv = document.querySelector(".historial");
    histTotalMonto = document.getElementById("histTotalMonto");
    histTitulo = document.getElementById("histTitulo");

    const splash = document.getElementById("splashScreen");
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = "0";
            setTimeout(() => {
                splash.style.display = "none";
                showScreen("homeScreen");
            }, 600);
        }, 3000);
    } else {
        showScreen("homeScreen");
    }

    selectBarrio?.addEventListener("change", () => {
        nextBarrioBtn.disabled = (selectBarrio.value === "");
    });

    // VINCULACIÓN DEL BOTÓN ELIMINAR

    document.getElementById("btnEliminarEntrada")?.addEventListener("click", eliminarEntradaActual);
    document.getElementById("btnHBorrar")?.addEventListener("click", limpiarHistorialCompleto);

    document.getElementById("btnNuevo")?.addEventListener("click", () => {
        goHome();
        const hoy = new Date();
        const fechaLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        document.getElementById("fechaEntrada").value = fechaLocal;
        showScreen(1);
    });

    document.getElementById("btnHistorial")?.addEventListener("click", () => {
        actualizarSelectorMeses();
        showScreen(9);
    });

    document.getElementById("btnConfig")?.addEventListener("click", () => {
        document.getElementById("loginAdmin").style.display = "block";
        document.getElementById("formPrecios").style.display = "none";
        showScreen(11);
    });

    document.querySelectorAll(".zona-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            data.zona = btn.getAttribute("data-zona");
            cargarBarrios(data.zona);
            showScreen(2);
        });
    });

    document.querySelectorAll(".next-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (currentScreen === 2) data.barrio = selectBarrio.value;
            let next = currentScreen + 1;
            if (next === 8) renderSummary();
            showScreen(next);
        });
    });

    document.querySelectorAll(".back-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (currentScreen === 1 || currentScreen === 9) goHome();
            else showScreen(currentScreen - 1);
        });
    });

    document.querySelector(".finish-btn")?.addEventListener("click", () => {
        const totalDia = calcularTotal();
        const historial = JSON.parse(localStorage.getItem("historial")) || [];
        const editIndex = parseInt(document.getElementById("editIndex").value);
        const f = new Date(document.getElementById("fechaEntrada").value + "T12:00:00");
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const nuevo = { mesAno: `${meses[f.getMonth()]} ${f.getFullYear()}`, fecha: f.toLocaleDateString('es-AR'), montoTotal: totalDia, ...data };
        if (editIndex > -1) historial[editIndex] = nuevo; else historial.push(nuevo);
        localStorage.setItem("historial", JSON.stringify(historial));
        alert("✅ Guardado");
        goHome();
    });

    document.getElementById("btnHParcial")?.addEventListener("click", () => { renderVistaHistorial("parcial"); showScreen(10); });
    document.getElementById("btnHCompleto")?.addEventListener("click", () => { renderVistaHistorial("completo"); showScreen(10); });

    document.querySelectorAll(".counter").forEach(counter => {
        const input = counter.querySelector("input");
        counter.querySelector(".plus-btn").onclick = () => { input.value = (Number(input.value) || 0) + 1; actualizarDataYSubtotales(); };
        counter.querySelector(".minus-btn").onclick = () => { input.value = Math.max(0, (Number(input.value) || 0) - 1); actualizarDataYSubtotales(); };
    });

    document.getElementById("btnEntrarAdmin")?.addEventListener("click", () => {
        if(document.getElementById("pinAdmin").value === "1234") {
            document.getElementById("loginAdmin").style.display = "none";
            document.getElementById("formPrecios").style.display = "block";
        }
    });

    const btnDark = document.getElementById("btnDarkMode");
    if (localStorage.getItem("theme") === "dark") document.documentElement.setAttribute("data-theme", "dark");
    btnDark?.addEventListener("click", () => {
        let isDark = document.documentElement.getAttribute("data-theme") === "dark";
        document.documentElement.setAttribute("data-theme", isDark ? "light" : "dark");
        localStorage.setItem("theme", isDark ? "light" : "dark");
    });
}

window.onload = iniciarApp;

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(reg => console.log("SW registrado", reg))
            .catch(err => console.log("Error:", err));
    });
}

let eventoInstalacion;
const botonInstalar = document.getElementById('btnInstalar');

window.addEventListener('beforeinstallprompt', (e) => {
    // Evita que el navegador muestre su propio cartelito genérico
    e.preventDefault();
    // Guarda el evento para usarlo después
    eventoInstalacion = e;
    // Muestra nuestro botón personalizado
    botonInstalar.style.display = 'block';
});

botonInstalar.addEventListener('click', async () => {
    if (eventoInstalacion) {
        // Muestra el prompt de instalación
        eventoInstalacion.prompt();
        // Espera la respuesta del usuario
        const { outcome } = await eventoInstalacion.userChoice;
        if (outcome === 'accepted') {
            console.log('El usuario aceptó la instalación');
            botonInstalar.style.display = 'none';
        }
        eventoInstalacion = null;
    }
});

// Ocultar el botón si la app ya se instaló
window.addEventListener('appinstalled', () => {
    botonInstalar.style.display = 'none';
    console.log('App instalada con éxito');
});
// --- LÓGICA DE INSTALACIÓN ---
let deferredPrompt;
const installBtn = document.getElementById('btnInstalar');

window.addEventListener('beforeinstallprompt', (e) => {
    // Evita que Chrome muestre el banner automático
    e.preventDefault();
    // Guarda el evento
    deferredPrompt = e;
    // Muestra el botón violeta
    installBtn.style.display = 'block';
    console.log("Evento de instalación capturado");
});

// PLAN DE RESPALDO: Si pasan 3 segundos y el botón sigue oculto (porque el celu es viejo), 
// lo mostramos con instrucciones manuales.
setTimeout(() => {
    if (installBtn.style.display === 'none') {
        installBtn.style.display = 'block';
        installBtn.innerHTML = "📲 ¿Cómo instalar en este celu?";
        installBtn.onclick = () => {
            alert("Para instalar:\n1. Tocá los 3 puntitos del navegador.\n2. Buscá 'Instalar' o 'Agregar a pantalla de inicio'.");
        };
    }
}, 3000);

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    }
});

// Ocultar si ya se instaló
window.addEventListener('appinstalled', () => {
    installBtn.style.display = 'none';
    console.log('App instalada');
});