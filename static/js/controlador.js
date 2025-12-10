/* === ELEMENTOS DOM === */
let form;
let btn;
let estadoEscaneo;
let salidaRecursos;
let canvasRadar;
let ctxRadar;
let canvasGrafica;
let ctxGrafica;
let canvasMapa;
let ctxMapa;

/* === ESTADO === */
let historialReportes = [];
let ultimaProyeccion = [];
let puntosGrafica = [];
let hoverIndex = -1;
let ultimoDatoEntrada = {};

/* === RADAR ANIMADO (canvas) === */
let anguloRadar = 0;
let radarActivo = false;

function ajustarCanvasRadar() {
    if (!canvasRadar || !ctxRadar) return;
    const rect = canvasRadar.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasRadar.width = rect.width * dpr;
    canvasRadar.height = rect.height * dpr;
    ctxRadar.setTransform(1, 0, 0, 1, 0, 0);
    ctxRadar.scale(dpr, dpr);
}

function dibujarRadar() {
    if (!canvasRadar || !ctxRadar || !radarActivo) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvasRadar.width / dpr;
    const h = canvasRadar.height / dpr;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(cx, cy) - 6;

    ctxRadar.clearRect(0, 0, w, h);

    ctxRadar.strokeStyle = "rgba(0,229,255,0.18)";
    ctxRadar.lineWidth = 1;
    [1, 0.7, 0.4].forEach(f => {
        ctxRadar.beginPath();
        ctxRadar.arc(cx, cy, maxR * f, 0, Math.PI * 2);
        ctxRadar.stroke();
    });

    for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        ctxRadar.beginPath();
        ctxRadar.moveTo(cx, cy);
        ctxRadar.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
        ctxRadar.stroke();
    }

    ctxRadar.strokeStyle = "rgba(0,229,255,0.7)";
    ctxRadar.lineWidth = 3;
    ctxRadar.beginPath();
    ctxRadar.moveTo(cx, cy);
    ctxRadar.lineTo(cx + Math.cos(anguloRadar) * maxR, cy + Math.sin(anguloRadar) * maxR);
    ctxRadar.stroke();

    const t = Date.now() / 1000;
    for (let i = 0; i < 8; i++) {
        const angP = (i * 0.8) + t * 0.2 * ((i % 2) ? 1 : -1);
        const rP = maxR * (0.25 + (i % 4) * 0.15);
        const px = cx + Math.cos(angP) * rP;
        const py = cy + Math.sin(angP) * rP;
        const pulso = 2 + Math.sin(t * 3 + i) * 0.8;
        ctxRadar.fillStyle = "rgba(255,77,157,0.85)";
        ctxRadar.beginPath();
        ctxRadar.arc(px, py, pulso, 0, Math.PI * 2);
        ctxRadar.fill();
    }

    anguloRadar += 0.05;
    requestAnimationFrame(dibujarRadar);
}

/* === GRÁFICA EN CANVAS DETALLADA === */
function ajustarCanvasGrafica() {
    if (!canvasGrafica || !ctxGrafica) return;
    const rect = canvasGrafica.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasGrafica.width = rect.width * dpr;
    canvasGrafica.height = rect.height * dpr;
    ctxGrafica.setTransform(1, 0, 0, 1, 0, 0);
    ctxGrafica.scale(dpr, dpr);
}

function dibujarGrafica(proyeccion = ultimaProyeccion) {
    if (!canvasGrafica || !ctxGrafica) return;
    ultimaProyeccion = proyeccion || [];
    ajustarCanvasGrafica();
    const dpr = window.devicePixelRatio || 1;
    const w = canvasGrafica.width / dpr;
    const h = canvasGrafica.height / dpr;
    ctxGrafica.clearRect(0, 0, w, h);

    const padding = 34;
    const ancho = w - padding * 2;
    const alto = h - padding * 2;
    if (!ultimaProyeccion.length) return;

    const factorIncertidumbre = calcularIncertidumbre();
    const maxInt = Math.max(...ultimaProyeccion.map(p => p.intensidad * (1 + factorIncertidumbre)), 1);
    const maxT = Math.max(...ultimaProyeccion.map(p => p.tiempo), 1);

    ctxGrafica.strokeStyle = "rgba(255,255,255,0.06)";
    ctxGrafica.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding + (alto / 4) * i;
        ctxGrafica.beginPath();
        ctxGrafica.moveTo(padding, y);
        ctxGrafica.lineTo(padding + ancho, y);
        ctxGrafica.stroke();
        const valY = ((maxInt / 4) * (4 - i)).toFixed(1);
        ctxGrafica.fillStyle = "#8a9bb8";
        ctxGrafica.font = "11px 'Outfit', sans-serif";
        ctxGrafica.fillText(valY, 6, y + 4);
    }
    for (let i = 0; i <= 5; i++) {
        const x = padding + (ancho / 5) * i;
        ctxGrafica.beginPath();
        ctxGrafica.moveTo(x, padding);
        ctxGrafica.lineTo(x, padding + alto);
        ctxGrafica.stroke();
        const valX = ((maxT / 5) * i).toFixed(1);
        ctxGrafica.fillStyle = "#8a9bb8";
        ctxGrafica.font = "11px 'Outfit', sans-serif";
        ctxGrafica.fillText(valX, x - 8, padding + alto + 16);
    }

    ctxGrafica.strokeStyle = "rgba(255,255,255,0.12)";
    ctxGrafica.lineWidth = 1.4;
    ctxGrafica.beginPath();
    ctxGrafica.moveTo(padding, padding + alto);
    ctxGrafica.lineTo(padding + ancho, padding + alto);
    ctxGrafica.moveTo(padding, padding);
    ctxGrafica.lineTo(padding, padding + alto);
    ctxGrafica.stroke();

    const bandaSup = ultimaProyeccion.map(p => p.intensidad * (1 + factorIncertidumbre));
    const bandaInf = ultimaProyeccion.map(p => Math.max(0, p.intensidad * (1 - factorIncertidumbre)));

    puntosGrafica = ultimaProyeccion.map((p, idx) => ({
        x: padding + (p.tiempo / maxT) * ancho,
        y: padding + alto - (p.intensidad / maxInt) * alto,
        t: p.tiempo,
        i: p.intensidad,
        ySup: padding + alto - (bandaSup[idx] / maxInt) * alto,
        yInf: padding + alto - (bandaInf[idx] / maxInt) * alto,
    }));

    const grad = ctxGrafica.createLinearGradient(0, padding, 0, padding + alto);
    grad.addColorStop(0, "rgba(0,229,255,0.25)");
    grad.addColorStop(1, "rgba(0,229,255,0.02)");
    ctxGrafica.fillStyle = grad;
    ctxGrafica.beginPath();
    puntosGrafica.forEach((p, idx) => {
        if (idx === 0) ctxGrafica.moveTo(p.x, p.y);
        else ctxGrafica.lineTo(p.x, p.y);
    });
    ctxGrafica.lineTo(padding + ancho, padding + alto);
    ctxGrafica.lineTo(padding, padding + alto);
    ctxGrafica.closePath();
    ctxGrafica.fill();

    ctxGrafica.fillStyle = "rgba(255,77,157,0.12)";
    ctxGrafica.beginPath();
    puntosGrafica.forEach((p, idx) => {
        if (idx === 0) ctxGrafica.moveTo(p.x, p.ySup);
        else ctxGrafica.lineTo(p.x, p.ySup);
    });
    for (let i = puntosGrafica.length - 1; i >= 0; i--) {
        const p = puntosGrafica[i];
        ctxGrafica.lineTo(p.x, p.yInf);
    }
    ctxGrafica.closePath();
    ctxGrafica.fill();

    ctxGrafica.strokeStyle = "#00e5ff";
    ctxGrafica.lineWidth = 2.5;
    ctxGrafica.beginPath();
    puntosGrafica.forEach((p, i) => {
        if (i === 0) ctxGrafica.moveTo(p.x, p.y);
        else ctxGrafica.lineTo(p.x, p.y);
    });
    ctxGrafica.stroke();

    ctxGrafica.fillStyle = "#ff4d9d";
    puntosGrafica.forEach(p => {
        ctxGrafica.beginPath();
        ctxGrafica.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctxGrafica.fill();
    });

    const ultimo = puntosGrafica[puntosGrafica.length - 1];
    ctxGrafica.fillStyle = "#fff";
    ctxGrafica.font = "12px 'Outfit', sans-serif";
    ctxGrafica.fillText(`Fin: ${ultimo.i.toFixed(2)} @ ${ultimo.t}h`, ultimo.x - 50, ultimo.y - 10);

    ctxGrafica.fillStyle = "#8a9bb8";
    ctxGrafica.font = "12px 'Outfit', sans-serif";
    ctxGrafica.fillText("Tiempo (horas)", padding + ancho - 90, padding + alto + 30);
    ctxGrafica.fillText("Banda de incertidumbre", padding + 8, padding + 14);
    ctxGrafica.save();
    ctxGrafica.translate(padding - 26, padding + 8);
    ctxGrafica.rotate(-Math.PI / 2);
    ctxGrafica.fillText("Intensidad", 0, 0);
    ctxGrafica.restore();

    if (hoverIndex >= 0 && puntosGrafica[hoverIndex]) {
        dibujarTooltip(puntosGrafica[hoverIndex]);
    }
}

function calcularIncertidumbre() {
    if (!ultimoDatoEntrada || Object.keys(ultimoDatoEntrada).length === 0) return 0.15;
    const viento = Math.min(ultimoDatoEntrada.velocidad_viento || 0, 90);
    const humedad = Math.min(Math.max(ultimoDatoEntrada.humedad || 50, 0), 100);
    const base = 0.1 + viento / 200;
    const ajusteH = (100 - humedad) / 300;
    return Math.min(0.3, base + ajusteH);
}

function dibujarTooltip(punto) {
    ctxGrafica.strokeStyle = "rgba(255,255,255,0.2)";
    ctxGrafica.lineWidth = 1;
    const dpr = window.devicePixelRatio || 1;
    const w = canvasGrafica.width / dpr;
    const h = canvasGrafica.height / dpr;
    ctxGrafica.beginPath();
    ctxGrafica.moveTo(punto.x, 0);
    ctxGrafica.lineTo(punto.x, h);
    ctxGrafica.moveTo(0, punto.y);
    ctxGrafica.lineTo(w, punto.y);
    ctxGrafica.stroke();

    const boxW = 150;
    const boxH = 46;
    const pad = 8;
    const x = Math.min(w - boxW - 10, Math.max(10, punto.x - boxW / 2));
    const y = Math.max(10, punto.y - boxH - 10);

    ctxGrafica.fillStyle = "rgba(12,18,32,0.9)";
    ctxGrafica.strokeStyle = "rgba(0,229,255,0.4)";
    ctxGrafica.lineWidth = 1;
    ctxGrafica.beginPath();
    if (typeof ctxGrafica.roundRect === "function") {
        ctxGrafica.roundRect(x, y, boxW, boxH, 8);
    } else {
        ctxGrafica.rect(x, y, boxW, boxH);
    }
    ctxGrafica.fill();
    ctxGrafica.stroke();

    ctxGrafica.fillStyle = "#fff";
    ctxGrafica.font = "12px 'Outfit', sans-serif";
    ctxGrafica.fillText(`Tiempo: ${punto.t} h`, x + pad, y + 18);
    ctxGrafica.fillText(`Intensidad: ${punto.i.toFixed(3)}`, x + pad, y + 34);
}

function formatearValor(v) {
    if (typeof v === "number" && !Number.isInteger(v)) return v.toFixed(2);
    return v;
}

function resumenDatos(datos) {
    return `Bosque ${datos.tamano_bosque} ha · Viento ${datos.velocidad_viento} km/h · Humedad ${datos.humedad}% · Combustible ${datos.combustible} · Distancia ${datos.distancia_foco} km`;
}

function renderTarjetas(recursos) {
    const items = [
        { titulo: "Bomberos requeridos", valor: recursos.bomberos_requeridos },
        { titulo: "Helicópteros requeridos", valor: recursos.helicopteros_requeridos },
        { titulo: "Agua necesaria (litros)", valor: recursos.agua_litros_requeridos.toLocaleString("es-ES") },
        { titulo: "Tasa de expansión", valor: recursos.tasa_expansion },
        { titulo: "Retardo brigadas (horas)", valor: recursos.retardo_brigadas_horas },
        { titulo: "Retardo helicópteros (horas)", valor: recursos.retardo_helicopteros_horas },
        { titulo: "Energía estimada", valor: recursos.energia_fuego },
    ];
    return `<div class="tarjetas">${items.map(it => `
        <div class="tarjeta">
            <h3>${it.titulo}</h3>
            <div class="valor">${formatearValor(it.valor)}</div>
        </div>`).join("")}</div>`;
}

function renderHistorial() {
    if (!salidaRecursos) return;
    if (!historialReportes.length) {
        salidaRecursos.innerHTML = '<div class="historial-vacio">Aún no hay reportes. Ejecuta una simulación para generar el primero.</div>';
        return;
    }
    salidaRecursos.innerHTML = historialReportes.map((item, idx) => {
        const fecha = item.timestamp.toLocaleString("es-ES", { hour12: false });
        const filasDatos = filasEntrada(item.datos).map(f => `<tr><td>${f.label}</td><td>${f.valor}</td></tr>`).join("");
        const stats = resumenProyeccion(item.proyeccion);
        return `
            <div class="reporte">
                <div class="reporte-header">
                    <div>
                        <div class="reporte-titulo">Reporte ${idx + 1} · ${fecha}</div>
                        <div class="detalle-monitoreo">${resumenDatos(item.datos)}</div>
                    </div>
                    <span class="chip">Monitoreo guardado</span>
                </div>
                <div class="reporte-cuerpo">
                    <div class="tabla-wrapper">
                        <table class="tabla-datos">
                            <thead><tr><th>Variable</th><th>Valor</th></tr></thead>
                            <tbody>${filasDatos}</tbody>
                        </table>
                    </div>
                    <div class="stats">
                        <div>Máx intensidad: <strong>${stats.maxInt}</strong></div>
                        <div>Final @ ${stats.tiempoFinal} h: <strong>${stats.intFinal}</strong></div>
                        <div>${stats.extinguido ? "Extinguido" : "Activo"}</div>
                    </div>
                    ${renderTarjetas(item.recursos)}
                </div>
            </div>
        `;
    }).join("");
}

function mostrarError(msg) {
    if (!salidaRecursos) return;
    const card = `<div class="tarjeta" style="grid-column:1/-1;border-color:#ff4d4d;margin-bottom:10px"><h3>Error</h3><div class="valor" style="color:#ff4d4d">${msg}</div></div>`;
    salidaRecursos.insertAdjacentHTML("afterbegin", card);
}

function registrarReporte(recursos, datos, proyeccion) {
    historialReportes.unshift({ recursos, datos, proyeccion, timestamp: new Date() });
    renderHistorial();
}

/* === MAPA OPERATIVO LIGERO === */
function ajustarCanvasMapa() {
    if (!canvasMapa || !ctxMapa) return;
    const rect = canvasMapa.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasMapa.width = rect.width * dpr;
    canvasMapa.height = rect.height * dpr;
    ctxMapa.setTransform(1, 0, 0, 1, 0, 0);
    ctxMapa.scale(dpr, dpr);
}

function dibujarMapa(datos = ultimoDatoEntrada) {
    if (!canvasMapa || !ctxMapa) return;
    ajustarCanvasMapa();
    const dpr = window.devicePixelRatio || 1;
    const w = canvasMapa.width / dpr;
    const h = canvasMapa.height / dpr;
    ctxMapa.clearRect(0, 0, w, h);

    ctxMapa.strokeStyle = "rgba(255,255,255,0.06)";
    ctxMapa.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = (h / 5) * i;
        ctxMapa.beginPath();
        ctxMapa.moveTo(0, y);
        ctxMapa.lineTo(w, y);
        ctxMapa.stroke();
    }
    for (let i = 0; i <= 6; i++) {
        const x = (w / 6) * i;
        ctxMapa.beginPath();
        ctxMapa.moveTo(x, 0);
        ctxMapa.lineTo(x, h);
        ctxMapa.stroke();
    }

    if (!datos || Object.keys(datos).length === 0) {
        ctxMapa.fillStyle = "#8a9bb8";
        ctxMapa.font = "13px 'Outfit', sans-serif";
        ctxMapa.fillText("Ejecuta una simulación para ver perímetro y focos", 16, h / 2);
        return;
    }

    const centroX = w / 2;
    const centroY = h / 2;
    const area = Math.max(datos.tamano_bosque || 200, 50);
    const radioBase = Math.min(w, h) * 0.35;
    const radio = radioBase * Math.tanh(area / 500);

    ctxMapa.strokeStyle = "rgba(0,229,255,0.8)";
    ctxMapa.lineWidth = 2;
    ctxMapa.beginPath();
    ctxMapa.arc(centroX, centroY, radio, 0, Math.PI * 2);
    ctxMapa.stroke();

    ctxMapa.fillStyle = "rgba(0,229,255,0.12)";
    ctxMapa.beginPath();
    ctxMapa.arc(centroX, centroY, radio, 0, Math.PI * 2);
    ctxMapa.fill();

    const viento = datos.velocidad_viento || 0;
    const pendiente = datos.pendiente || 0;
    const angViento = ((pendiente % 360) * Math.PI) / 180;
    const flechaLong = 28 + Math.min(viento, 80) * 0.6;
    ctxMapa.strokeStyle = "#ff4d9d";
    ctxMapa.lineWidth = 2;
    ctxMapa.beginPath();
    ctxMapa.moveTo(w - 60, 26);
    ctxMapa.lineTo(w - 60 + Math.cos(angViento) * flechaLong, 26 + Math.sin(angViento) * flechaLong);
    ctxMapa.stroke();
    ctxMapa.fillStyle = "#ff4d9d";
    ctxMapa.font = "11px 'Outfit', sans-serif";
    ctxMapa.fillText(`Viento ${viento} km/h`, w - 140, 18);

    const focos = Math.max(3, Math.round((datos.combustible || 50) / 12 + viento / 20));
    ctxMapa.fillStyle = "rgba(255,77,157,0.9)";
    for (let i = 0; i < focos; i++) {
        const ang = (i * (Math.PI * 2)) / focos + pendiente / 45;
        const r = radio * (0.35 + ((i * 37) % 100) / 100 * 0.5);
        const x = centroX + Math.cos(ang) * r;
        const y = centroY + Math.sin(ang) * r;
        const tam = 3 + ((i * 13) % 5);
        ctxMapa.beginPath();
        ctxMapa.arc(x, y, tam, 0, Math.PI * 2);
        ctxMapa.fill();
    }

    ctxMapa.fillStyle = "#8a9bb8";
    ctxMapa.font = "11px 'Outfit', sans-serif";
    ctxMapa.fillText("Perímetro estimado", 12, 16);
    ctxMapa.fillText("Focos calientes", 12, 32);
}

/* === ENVIAR DATOS === */
async function enviarDatos() {
    const datos = {};
    const formData = new FormData(form);
    for (const [clave, valor] of formData.entries()) {
        if (valor === "") {
            mostrarError("Completa todos los campos.");
            return;
        }
        datos[clave] = parseFloat(valor);
    }

    estadoEscaneo.textContent = "Procesando...";
    btn.disabled = true;
    btn.textContent = "Simulando...";

    try {
        const resp = await fetch("/simular", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error || "Error en simulación");

        estadoEscaneo.textContent = "Análisis completado";
        ultimoDatoEntrada = datos;
        registrarReporte(json.recursos, datos, json.proyeccion);
        dibujarGrafica(json.proyeccion);
        dibujarMapa(datos);
        document.querySelector(".panel-recursos").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
        estadoEscaneo.textContent = "Error";
        mostrarError(err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Iniciar simulación";
    }
}

function filasEntrada(datos) {
    const vars = [
        { key: "tamano_bosque", label: "Tamaño del bosque (ha)" },
        { key: "velocidad_viento", label: "Velocidad del viento (km/h)" },
        { key: "temperatura", label: "Temperatura (°C)" },
        { key: "humedad", label: "Humedad relativa (%)" },
        { key: "combustible", label: "Carga de combustible (0-100)" },
        { key: "distancia_foco", label: "Distancia al foco (km)" },
        { key: "pendiente", label: "Pendiente (grados)" },
        { key: "velocidad_brigada", label: "Velocidad brigada (km/h)" },
        { key: "velocidad_helicoptero", label: "Velocidad helicóptero (km/h)" },
        { key: "capacidad_control_brigada", label: "Capacidad brigada (MWh)" },
        { key: "capacidad_descarga_helicoptero", label: "Capacidad helicóptero (MWh)" },
    ];
    return vars.map(v => ({ label: v.label, valor: formatearValor(datos?.[v.key] ?? "-") }));
}

function resumenProyeccion(proyeccion = []) {
    if (!proyeccion.length) return { maxInt: "-", intFinal: "-", tiempoFinal: "-", extinguido: false };
    const maxIntVal = Math.max(...proyeccion.map(p => p.intensidad));
    const ultimo = proyeccion[proyeccion.length - 1];
    const cero = proyeccion.find(p => p.intensidad <= 0);
    return {
        maxInt: formatearValor(maxIntVal),
        intFinal: formatearValor(ultimo.intensidad),
        tiempoFinal: formatearValor(ultimo.tiempo),
        extinguido: Boolean(cero)
    };
}

/* === INIT === */
window.addEventListener("DOMContentLoaded", () => {
    form = document.getElementById("form-condiciones");
    btn = document.getElementById("btn-simular");
    estadoEscaneo = document.getElementById("estado-escaneo");
    salidaRecursos = document.getElementById("salida-recursos");
    canvasRadar = document.getElementById("canvas-radar");
    ctxRadar = canvasRadar.getContext("2d");
    canvasGrafica = document.getElementById("grafica");
    ctxGrafica = canvasGrafica.getContext("2d");
    canvasMapa = document.getElementById("canvas-mapa");
    ctxMapa = canvasMapa.getContext("2d");

    ajustarCanvasRadar();
    radarActivo = true;
    requestAnimationFrame(dibujarRadar);
    ajustarCanvasGrafica();
    ajustarCanvasMapa();
    dibujarMapa();
    renderHistorial();

    btn.addEventListener("click", enviarDatos);
    form.addEventListener("submit", e => { e.preventDefault(); enviarDatos(); });

    canvasGrafica.addEventListener("mousemove", manejarHoverGrafica);
    canvasGrafica.addEventListener("mouseleave", () => { hoverIndex = -1; dibujarGrafica(); });
});

function manejarHoverGrafica(evt) {
    if (!puntosGrafica.length) return;
    const rect = canvasGrafica.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    let mejor = -1;
    let min = Infinity;
    puntosGrafica.forEach((p, idx) => {
        const dx = p.x - x;
        const dy = p.y - y;
        const d = dx * dx + dy * dy;
        if (d < min) {
            min = d;
            mejor = idx;
        }
    });
    hoverIndex = min < 400 ? mejor : -1; // umbral ~20 px
    dibujarGrafica();
}

window.addEventListener("resize", () => {
    ajustarCanvasRadar();
    dibujarGrafica();
    dibujarMapa();
});
