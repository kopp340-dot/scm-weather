const VERSION = "2.0";

const API_URL =
"https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?station_ids=11152&parameters=TL&parameters=FF&parameters=FFX&parameters=DD&parameters=RF&parameters=P&parameters=RR";

const REFRESH_INTERVAL = 600000;

// Panorama-Kamera (Segelclub Mattsee)
const WEBCAM_URL = "https://scmattsee.panocloud.webcam/current1.jpg";
// Stündliche Aktualisierung des Hintergrundbilds
const WEBCAM_INTERVAL = 3600000;

let nextUpdateInMinutes = 10;
let lastWindValue = null;
let lastWindTime = null;
let lastTempValue = null;
let lastPressureValue = null;

// Historie für Trend-Berechnung (1h für Wind, 3h für Temp/Druck)
let windHistory = [];
let tempHistory = [];
let pressureHistory = [];
const MAX_WIND_HISTORY = 6;   // 1 Stunde (6 * 10 Min)
const MAX_TEMP_HISTORY = 18;  // 3 Stunden (18 * 10 Min)
const MAX_PRESSURE_HISTORY = 18;

// ----------------------------------------------------
// Hilfsfunktionen
// ----------------------------------------------------

function msToKnots(ms) {
    return ms * 1.94384;
}

function knotsToBeaufort(knots) {

    if (knots < 1) return 0;
    if (knots < 4) return 1;
    if (knots < 7) return 2;
    if (knots < 11) return 3;
    if (knots < 17) return 4;
    if (knots < 22) return 5;
    if (knots < 28) return 6;
    if (knots < 34) return 7;
    if (knots < 41) return 8;
    if (knots < 48) return 9;
    if (knots < 56) return 10;
    if (knots < 64) return 11;

    return 12;
}

function windDirection(deg) {

    const dirs = [
        "N",
        "NO",
        "O",
        "SO",
        "S",
        "SW",
        "W",
        "NW"
    ];

    return dirs[Math.round(deg / 45) % 8];
}

// Trend-Anzeige für Wind (Mini-Graphik, 1h Historie)
function updateWindTrend(currentWind) {
    const container = document.getElementById("windTrend");
    if (!container) return;

    // Wert zur Historie hinzufügen
    windHistory.push({ value: currentWind, time: new Date() });
    if (windHistory.length > MAX_WIND_HISTORY) {
        windHistory.shift();
    }

    // Trend berechnen (nur wenn genug Daten da sind)
    if (windHistory.length >= 2) {
        const first = windHistory[0];
        const last = windHistory[windHistory.length - 1];
        const timeDiffHours = (last.time - first.time) / (1000 * 60 * 60);
        const valueDiff = last.value - first.value;
        const trendPerHour = valueDiff / timeDiffHours;

        // Mini-Graphik generieren
        renderTrendGraph(container, windHistory, trendPerHour, 0.3);
    } else {
        container.innerHTML = "";
    }
}

// Trend-Anzeige für Temperatur (Mini-Graphik, 3h Historie)
function updateTempTrend(currentTemp) {
    const container = document.getElementById("tempTrend");
    if (!container) return;

    // Wert zur Historie hinzufügen
    tempHistory.push({ value: currentTemp, time: new Date() });
    if (tempHistory.length > MAX_TEMP_HISTORY) {
        tempHistory.shift();
    }

    // Trend berechnen (nur wenn genug Daten da sind)
    if (tempHistory.length >= 2) {
        const first = tempHistory[0];
        const last = tempHistory[tempHistory.length - 1];
        const timeDiffHours = (last.time - first.time) / (1000 * 60 * 60);
        const valueDiff = last.value - first.value;
        const trendPerHour = valueDiff / timeDiffHours;

        // Mini-Graphik generieren
        renderTrendGraph(container, tempHistory, trendPerHour, 0.3);
    } else {
        container.innerHTML = "";
    }
}

// Trend-Anzeige für Luftdruck (Mini-Graphik, 3h Historie)
function updatePressureTrend(currentPressure) {
    const container = document.getElementById("pressureTrend");
    if (!container) return;

    // Wert zur Historie hinzufügen
    pressureHistory.push({ value: currentPressure, time: new Date() });
    if (pressureHistory.length > MAX_PRESSURE_HISTORY) {
        pressureHistory.shift();
    }

    // Trend berechnen (nur wenn genug Daten da sind)
    if (pressureHistory.length >= 2) {
        const first = pressureHistory[0];
        const last = pressureHistory[pressureHistory.length - 1];
        const timeDiffHours = (last.time - first.time) / (1000 * 60 * 60);
        const valueDiff = last.value - first.value;
        const trendPerHour = valueDiff / timeDiffHours;

        // Mini-Graphik generieren
        renderTrendGraph(container, pressureHistory, trendPerHour, 1);
    } else {
        container.innerHTML = "";
    }
}

// Hilfsfunktion: Mini-Trend-Graphik rendern
function renderTrendGraph(container, history, trendPerHour, threshold) {
    if (history.length < 2) {
        container.innerHTML = "";
        return;
    }

    // Normalisierte Werte für die Graphik berechnen
    const maxVal = Math.max(...history.map(h => h.value));
    const minVal = Math.min(...history.map(h => h.value));
    const range = maxVal - minVal || 1;

    // SVG für Mini-Graphik erstellen
    const width = 50;
    const height = 20;
    const points = history.map((h, i) => {
        const x = (i / (history.length - 1)) * width;
        const y = height - ((h.value - minVal) / range) * height;
        return `${x},${y}`;
    }).join(" ");

    // Trend-Farbe bestimmen
    let color, arrow;
    if (trendPerHour > threshold) {
        color = "#009933"; // Grün
        arrow = "↑";
    } else if (trendPerHour < -threshold) {
        color = "#cc0000"; // Rot
        arrow = "↓";
    } else {
        color = "#666666"; // Grau
        arrow = "→";
    }

    // SVG + Pfeil anzeigen
    container.innerHTML = `
        <svg width="${width}" height="${height}" style="vertical-align: middle; margin-right: 5px;" viewBox="0 0 ${width} ${height}">
            <polyline fill="none" stroke="${color}" stroke-width="2" points="${points}"/>
        </svg>
        <span style="color: ${color}; font-size: 1.2rem;">${arrow}</span>
    `;
}

function updateCountdown() {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Berechne die nächste volle 10-Minuten-Marke + 2 Minuten Offset
    const nextFullTenMinutes = Math.ceil(minutes / 10) * 10;
    let targetMinutes = nextFullTenMinutes + 2;
    if (targetMinutes >= 60) targetMinutes -= 60;

    // Wartezeit bis zum nächsten Zielzeitpunkt
    let waitMinutes = targetMinutes - minutes;
    if (waitMinutes < 0) waitMinutes += 60;
    let waitSeconds = waitMinutes * 60 - seconds;

    if (waitSeconds <= 0) {
        document.getElementById("refreshInfo").textContent = "Aktualisierung jetzt...";
    } else if (waitSeconds <= 60) {
        // Letzte Minute: Sekunden anzeigen
        document.getElementById("refreshInfo").textContent = 
            "Nächste Aktualisierung in " + Math.ceil(waitSeconds) + " s";
    } else {
        // Mehr als eine Minute: Minuten anzeigen
        const displayMinutes = Math.ceil(waitSeconds / 60000);
        document.getElementById("refreshInfo").textContent = 
            "Nächste Aktualisierung in " + displayMinutes + " Min.";
    }
}

// Alle 1 Sekunde aktualisieren, wenn weniger als 1 Minute übrig ist, sonst alle 30 Sekunden
function updateCountdownInterval() {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const nextFullTenMinutes = Math.ceil(minutes / 10) * 10;
    let targetMinutes = nextFullTenMinutes + 2;
    if (targetMinutes >= 60) targetMinutes -= 60;

    let waitMinutes = targetMinutes - minutes;
    if (waitMinutes < 0) waitMinutes += 60;
    let waitSeconds = waitMinutes * 60 - seconds;

    // Intervall anpassen: 1 Sekunde, wenn < 60s übrig, sonst 30 Sekunden
    if (waitSeconds <= 60) {
        setInterval(updateCountdown, 1000);
    } else {
        setInterval(updateCountdown, 30000);
    }
}

// Initialen Countdown starten
updateCountdown();
updateCountdownInterval();
setInterval(updateCountdownInterval, 30000);

function updateSailingLight(knots, gust = null) {

    const light = document.getElementById("sailingLight");

    // Hilfsfunktion zur Bestimmung des Textes und der Farbe
    function getWindInfo(k) {
        if(k < 3) return { text: "Windstille", color: "#e6f7ff" };
        else if(k < 10) return { text: "Leichtwind", color: "#0099ff" };
        else if(k < 15) return { text: "Ideal", color: "#00ff99" };
        else if(k < 20) return { text: "Frischer Wind", color: "#ffff00" };
        else if(k < 25) return { text: "Starkwind", color: "#ff9900" };
        else if(k < 30) return { text: "Warnung", color: "#ff3300" };
        else return { text: "Sturm", color: "#cc0000" };
    }

    // Wind-Info
    const windInfo = getWindInfo(knots);

    // Böen-Info
    let displayText = windInfo.text;
    let background = windInfo.color;

    if (gust !== null && gust !== undefined) {
        const gustInfo = getWindInfo(gust);
        if (windInfo.text !== gustInfo.text) {
            displayText = windInfo.text + " – Böen: " + gustInfo.text;
            // Zweifarbig: Gradient von Windfarbe zu Böenfarbe
            background = `linear-gradient(to right, ${windInfo.color}, ${gustInfo.color})`;
        }
    }

    light.textContent = displayText;
    light.style.background = background;

}

function updateWindColor(knots){

    const wind =
        document.getElementById("wind");

    wind.classList.remove(
        "wind-blue",
        "wind-yellow",
        "wind-green",
        "wind-orange",
        "wind-red"
    );

    if(knots < 3){

        wind.classList.add("wind-blue");

    }
    else if(knots < 10){

        wind.classList.add("wind-blue");

    }
    else if(knots < 15){

        wind.classList.add("wind-green");

    }
    else if(knots < 20){

        wind.classList.add("wind-yellow");

    }
    else if(knots < 25){

        wind.classList.add("wind-orange");

    }
    else if(knots < 30){

        wind.classList.add("wind-red");

    }
    else{

        wind.classList.add("wind-red");

    }

}
// ----------------------------------------------------
// Böen-Farbe (analog Windampel)
// ----------------------------------------------------

function updateGustColor(knots){

    const gust =
        document.getElementById("gust");

    gust.classList.remove(
        "gust-blue",
        "gust-yellow",
        "gust-green",
        "gust-orange",
        "gust-red"
    );

    if(knots < 3){

        gust.classList.add("gust-blue");

    }
    else if(knots < 10){

        gust.classList.add("gust-blue");

    }
    else if(knots < 15){

        gust.classList.add("gust-green");

    }
    else if(knots < 20){

        gust.classList.add("gust-yellow");

    }
    else if(knots < 25){

        gust.classList.add("gust-orange");

    }
    else if(knots < 30){

        gust.classList.add("gust-red");

    }
    else{

        gust.classList.add("gust-red");

    }

}

// ----------------------------------------------------
// Panorama-Hintergrundbild laden
// ----------------------------------------------------

function updateWebcam(){

    const bg =
        document.getElementById("webcamBg");

    if(!bg) return;

    // Cache-Busting: Zeitstempel erzwingt Neuladen
    bg.src =
        WEBCAM_URL +
        "?t=" +
        Date.now();

}

// ----------------------------------------------------
// Wetterdaten laden
// ----------------------------------------------------

async function loadWeather() {

    try {

        document.getElementById("liveStatus").textContent = "🟢 LIVE";

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const json = await response.json();

        if (!json.features || json.features.length === 0) {
            throw new Error("Keine Wetterdaten erhalten.");
        }

        const p = json.features[0].properties.parameters;

        // -----------------------------
        // Werte übernehmen
        // -----------------------------

        const wind = msToKnots(p.FF.data[0]);
        const gust = msToKnots(p.FFX.data[0]);
        const dir = p.DD.data[0];

        // Wind

        document.getElementById("wind").textContent =
            wind.toFixed(1);
        updateWindTrend(wind);

        document.getElementById("gust").textContent =
            gust.toFixed(1) + " kt";

        document.getElementById("beaufort").textContent =
            knotsToBeaufort(wind) + " Bft";

        updateWindColor(wind);

        updateGustColor(gust);

        // Windrichtung

        document.getElementById("directionValue").textContent =
            Math.round(dir) + "°";

        document.getElementById("directionText").textContent =
            windDirection(dir);

        // Pfeil zeigt die Richtung,
        // in die der Wind weht

        document.getElementById("windArrow").style.transform =
            `rotate(${(dir + 180) % 360}deg)`;

        // Wetterdaten

        document.getElementById("temperature").textContent =
            p.TL.data[0].toFixed(1) + " °C";
        updateTempTrend(p.TL.data[0]);

        document.getElementById("pressure").textContent =
            p.P.data[0].toFixed(1) + " hPa";
        updatePressureTrend(p.P.data[0]);

        document.getElementById("humidity").textContent =
            p.RF.data[0].toFixed(0) + " %";

        document.getElementById("rain").textContent =
            p.RR.data[0].toFixed(1) + " mm";

        // Zeit

        // Zeitstempel in lokaler Zeit (Europe/Vienna) anzeigen
        const ts = new Date(json.timestamps[0]);
        document.getElementById("timestamp").textContent =
            ts.toLocaleString("de-AT", {
                timeZone: "Europe/Vienna",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

        // Segelampel

        updateSailingLight(wind, gust);

        // Countdown zurücksetzen

        nextUpdateInMinutes = 10;

    }

    catch(err){

        console.error("GeoSphere Fehler:", err);

        document.getElementById("liveStatus").textContent =
            "🔴 OFFLINE";

        document.getElementById("refreshInfo").textContent =
            "Verbindung zur GeoSphere fehlgeschlagen.";

    }

}

// ----------------------------------------------------
// Start
// ----------------------------------------------------

document.getElementById("version").textContent =
    "SCM Live-Wetter · Version " + VERSION + " · © 2026 Segelclub Mattsee";

// Synchronisiertes Laden (2 Minuten nach GeoSphere-Update)
function scheduleWeatherUpdate() {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Berechne die nächste volle 10-Minuten-Marke + 2 Minuten Offset
    const nextFullTenMinutes = Math.ceil(minutes / 10) * 10;
    let targetMinutes = nextFullTenMinutes + 2;
    if (targetMinutes >= 60) targetMinutes -= 60;

    // Wartezeit bis zum nächsten Zielzeitpunkt
    let waitMinutes = targetMinutes - minutes;
    if (waitMinutes < 0) waitMinutes += 60;
    let waitSeconds = waitMinutes * 60 - seconds;

    // Sofort laden, wenn wir bereits im richtigen Fenster sind
    if (waitSeconds <= 0) {
        loadWeather();
        setInterval(loadWeather, REFRESH_INTERVAL);
    } else {
        // Warte bis zum Zielzeitpunkt, dann starte Intervall
        setTimeout(() => {
            loadWeather();
            setInterval(loadWeather, REFRESH_INTERVAL);
        }, waitSeconds * 1000);
    }
}

// Webcam einmal laden und stündlich aktualisieren
updateWebcam();
setInterval(updateWebcam, WEBCAM_INTERVAL);

// Sofort laden und dann synchronisiert weitermachen
loadWeather();
scheduleWeatherUpdate();