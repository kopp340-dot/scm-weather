/**
 * SCM Live-Wetter Mattsee
 * Version: 3.13
 * Datenquelle: GeoSphere Austria (GeoSphere Hub API)
 */

const VERSION = "3.16";

// GeoSphere API - 10-Minuten-Daten für Station Mattsee (ID: 11152)
const API_URL = 
    "https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?station_ids=11152&parameters=TL&parameters=FF&parameters=FFX&parameters=DD&parameters=RF&parameters=P&parameters=RR";

// Aktualisierungsintervall: 10 Minuten (600000 ms) = GeoSphere-Update-Intervall
const REFRESH_INTERVAL = 600000;

// Panorama-Kamera (Segelclub Mattsee)
const WEBCAM_URL = "https://scmattsee.panocloud.webcam/current1.jpg";

// Webcam-Aktualisierung: alle 60 Minuten
const WEBCAM_INTERVAL = 3600000;

// Historie für Trend-Berechnung
let windHistory = [];
let tempHistory = [];
let pressureHistory = [];
const MAX_WIND_HISTORY = 6;    // 1 Stunde (6 * 10 Min)
const MAX_TEMP_HISTORY = 18;   // 3 Stunden (18 * 10 Min)
const MAX_PRESSURE_HISTORY = 18;

// ====================================================
// HILFSFUNKTIONEN
// ====================================================

/**
 * Umrechnung m/s in Knoten
 */
function msToKnots(ms) {
    return ms * 1.94384;
}

/**
 * Beaufort-Skala aus Knoten
 */
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

/**
 * Windrichtung als Kompassrichtung
 */
function windDirection(deg) {
    const dirs = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
}

/**
 * Wind-Info basierend auf Knoten
 * Gibt Text und Farbe zurueck (konsistent mit Segelampel)
 */
function getWindInfo(k) {
    if (k < 3) return { text: "Windstille", color: "#0099ff" };
    else if (k < 10) return { text: "Leichtwind", color: "#0099ff" };
    else if (k < 15) return { text: "Ideal", color: "#00ff99" };
    else if (k < 20) return { text: "Frischer Wind", color: "#ffff00" };
    else if (k < 25) return { text: "Starkwind", color: "#ff9900" };
    else if (k < 30) return { text: "Warnung", color: "#ff3300" };
    else return { text: "Sturm", color: "#cc0000" };
}

// ====================================================
// TREND-ANZEIGE - EMPFINDLICHER
// ====================================================

/**
 * Mini-Trend-Graphik rendern
 */
function renderTrendGraph(container, history, trendPerHour, threshold) {
    if (history.length < 2) {
        container.innerHTML = "";
        return;
    }

    const maxVal = Math.max(...history.map(h => h.value));
    const minVal = Math.min(...history.map(h => h.value));
    const range = maxVal - minVal || 1;

    const width = 50;
    const height = 20;
    const points = history.map((h, i) => {
        const x = (i / (history.length - 1)) * width;
        const y = height - ((h.value - minVal) / range) * height;
        return `${x},${y}`;
    }).join(" ");

    // Trend-Farbe und Pfeil bestimmen
    let color, arrow;
    if (trendPerHour > threshold) {
        color = "#009933"; // Gruen = steigend
        arrow = "\u2191";
    } else if (trendPerHour < -threshold) {
        color = "#cc0000"; // Rot = fallend
        arrow = "\u2193";
    } else {
        color = "#666666"; // Grau = stabil
        arrow = "\u2192";
    }

    container.innerHTML = `
        <svg width="${width}" height="${height}" style="vertical-align: middle; margin-left: 5px;" viewBox="0 0 ${width} ${height}">
            <polyline fill="none" stroke="${color}" stroke-width="2" points="${points}"/>
        </svg>
        <span style="color: ${color}; font-size: 1.2rem; margin-left: 5px;">${arrow}</span>
    `;
}

/**
 * Wind-Trend aktualisieren
 */
function updateWindTrend(currentWind) {
    const container = document.getElementById("windTrend");
    if (!container) return;

    windHistory.push({ value: currentWind, time: new Date() });
    if (windHistory.length > MAX_WIND_HISTORY) {
        windHistory.shift();
    }

    if (windHistory.length >= 2) {
        const first = windHistory[0];
        const last = windHistory[windHistory.length - 1];
        const timeDiffHours = (last.time - first.time) / (1000 * 60 * 60);
        const valueDiff = last.value - first.value;
        const trendPerHour = valueDiff / timeDiffHours;
        // Empfindlicher: Schwellenwert auf 0.1 reduziert
        renderTrendGraph(container, windHistory, trendPerHour, 0.1);
    } else {
        container.innerHTML = "";
    }
}

/**
 * Temperatur-Trend aktualisieren
 */
function updateTempTrend(currentTemp) {
    const container = document.getElementById("tempTrend");
    if (!container) return;

    tempHistory.push({ value: currentTemp, time: new Date() });
    if (tempHistory.length > MAX_TEMP_HISTORY) {
        tempHistory.shift();
    }

    if (tempHistory.length >= 2) {
        const first = tempHistory[0];
        const last = tempHistory[tempHistory.length - 1];
        const timeDiffHours = (last.time - first.time) / (1000 * 60 * 60);
        const valueDiff = last.value - first.value;
        const trendPerHour = valueDiff / timeDiffHours;
        // Schwellenwert fuer Temperatur: 0.5 Grad/Stunde
        renderTrendGraph(container, tempHistory, trendPerHour, 0.5);
    } else {
        container.innerHTML = "";
    }
}

/**
 * Luftdruck-Trend aktualisieren
 */
function updatePressureTrend(currentPressure) {
    const container = document.getElementById("pressureTrend");
    if (!container) return;

    pressureHistory.push({ value: currentPressure, time: new Date() });
    if (pressureHistory.length > MAX_PRESSURE_HISTORY) {
        pressureHistory.shift();
    }

    if (pressureHistory.length >= 2) {
        const first = pressureHistory[0];
        const last = pressureHistory[pressureHistory.length - 1];
        const timeDiffHours = (last.time - first.time) / (1000 * 60 * 60);
        const valueDiff = last.value - first.value;
        const trendPerHour = valueDiff / timeDiffHours;
        // Schwellenwert fuer Luftdruck: 1 hPa/Stunde
        renderTrendGraph(container, pressureHistory, trendPerHour, 1);
    } else {
        container.innerHTML = "";
    }
}

// ====================================================
// COUNTDOWN - KORRIGIERT
// ====================================================

/**
 * Countdown zur naechsten Aktualisierung
 * Synchronisiert mit GeoSphere: Alle 10 Minuten + 2 Minuten Delay
 * Zeigt Sekunden in der letzten Minute an
 */
function updateCountdown() {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // GeoSphere aktualisiert zu vollen 10-Minuten (0, 10, 20, 30, 40, 50)
    // Wir wollen 2 Minuten DANACH laden
    const nextFullTenMinutes = Math.floor((minutes + 2) / 10) * 10;
    let targetMinutes = nextFullTenMinutes;
    if (targetMinutes <= minutes) {
        targetMinutes += 10; // Naechster 10-Minuten-Block
    }

    // Wenn targetMinutes >= 60, dann auf 0 zuruecksetzen (naechste Stunde)
    if (targetMinutes >= 60) {
        targetMinutes -= 60;
    }

    let waitMinutes = targetMinutes - minutes;
    if (waitMinutes < 0) waitMinutes += 60;
    let waitSeconds = waitMinutes * 60 - seconds;

    if (waitSeconds < 0) waitSeconds = 0;

    const refreshInfo = document.getElementById("refreshInfo");
    if (!refreshInfo) return;

    if (waitSeconds <= 0) {
        refreshInfo.textContent = "Aktualisierung jetzt...";
    } else if (waitSeconds < 60) {
        // Letzte Minute: Sekunden herunterzaehlen
        refreshInfo.textContent = "Nächste Aktualisierung in " + Math.ceil(waitSeconds) + " s";
    } else {
        const displayMinutes = Math.floor(waitSeconds / 60);
        refreshInfo.textContent = "Nächste Aktualisierung in " + displayMinutes + " Min.";
    }
}

// Countdown alle Sekunde aktualisieren
setInterval(updateCountdown, 1000);
updateCountdown();

// ====================================================
// SEGELAMPEL
// ====================================================

/**
 * Segelampel basierend auf Wind und Boen
 */
function updateSailingLight(knots, gust = null) {
    const light = document.getElementById("sailingLight");
    if (!light) return;

    const windInfo = getWindInfo(knots);
    let displayText = windInfo.text;
    let background = windInfo.color;

    if (gust !== null && gust !== undefined) {
        const gustInfo = getWindInfo(gust);
        if (windInfo.text !== gustInfo.text) {
            displayText = windInfo.text + " - Böen: " + gustInfo.text;
            background = `linear-gradient(to right, ${windInfo.color}, ${gustInfo.color})`;
        }
    }

    light.textContent = displayText;
    light.style.background = background;
}

// ====================================================
// FARBEN FUER WIND UND BOEN
// ====================================================

/**
 * Wind-Wert farbig markieren
 */
function updateWindColor(knots) {
    const wind = document.getElementById("wind");
    if (!wind) return;

    const windUnit = document.querySelector(".wind-number .wind-unit");
    
    // Alte Klassen entfernen
    wind.classList.remove("wind-blue", "wind-green", "wind-yellow", "wind-orange", "wind-red");
    if (windUnit) {
        windUnit.classList.remove("wind-blue", "wind-green", "wind-yellow", "wind-orange", "wind-red");
    }

    // Neue Klasse basierend auf Windstaerke
    let colorClass;
    if (knots < 10) colorClass = "wind-blue";
    else if (knots < 15) colorClass = "wind-green";
    else if (knots < 20) colorClass = "wind-yellow";
    else if (knots < 25) colorClass = "wind-orange";
    else colorClass = "wind-red";

    wind.classList.add(colorClass);
    if (windUnit) windUnit.classList.add(colorClass);
}

/**
 * Boen-Wert farbig markieren
 */
function updateGustColor(knots) {
    const gustElement = document.getElementById("gust");
    const gustLabel = document.getElementById("gustLabel");
    
    if (!gustElement) return;

    // Alte Klassen entfernen
    gustElement.classList.remove("gust-blue", "gust-green", "gust-yellow", "gust-orange", "gust-red");
    if (gustLabel) {
        gustLabel.classList.remove("gust-blue", "gust-green", "gust-yellow", "gust-orange", "gust-red");
    }

    // Neue Klasse basierend auf Boenstaerke
    let colorClass;
    if (knots < 10) colorClass = "gust-blue";
    else if (knots < 15) colorClass = "gust-green";
    else if (knots < 20) colorClass = "gust-yellow";
    else if (knots < 25) colorClass = "gust-orange";
    else colorClass = "gust-red";

    gustElement.classList.add(colorClass);
    if (gustLabel) gustLabel.classList.add(colorClass);
}

// ====================================================
// WETTERDATEN LADEN
// ====================================================

/**
 * Wetterdaten von GeoSphere laden
 */
async function loadWeather() {
    try {
        document.getElementById("liveStatus").textContent = "🟢 LIVE";

        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("HTTP " + response.status);

        const json = await response.json();
        if (!json.features || json.features.length === 0) {
            throw new Error("Keine Wetterdaten erhalten.");
        }

        const p = json.features[0].properties.parameters;

        // Werte extrahieren
        const wind = msToKnots(p.FF.data[0]);
        const gust = msToKnots(p.FFX.data[0]);
        const dir = p.DD.data[0];

        // --- WIND ---
        const windElement = document.getElementById("wind");
        if (windElement) {
            windElement.textContent = wind.toFixed(1);
            updateWindColor(wind);
            updateWindTrend(wind);
        }

        // --- BOEN ---
        const gustElement = document.getElementById("gust");
        if (gustElement) {
            gustElement.textContent = gust.toFixed(1) + " kt";
            updateGustColor(gust);
        }

        // Beaufort
        const beaufortElement = document.getElementById("beaufort");
        if (beaufortElement) {
            beaufortElement.textContent = knotsToBeaufort(wind) + " Bft";
        }

        // --- WINDRICHTUNG ---
        const directionValue = document.getElementById("directionValue");
        const directionText = document.getElementById("directionText");
        const windArrow = document.getElementById("windArrow");
        
        if (directionValue) directionValue.textContent = Math.round(dir) + "°";
        if (directionText) directionText.textContent = windDirection(dir);
        if (windArrow) windArrow.style.transform = `rotate(${(dir + 180) % 360}deg)`;

        // --- WETTERDATEN ---
        const tempElement = document.getElementById("temperature");
        if (tempElement) {
            tempElement.textContent = p.TL.data[0].toFixed(1) + " °C";
            updateTempTrend(p.TL.data[0]);
        }

        const pressureElement = document.getElementById("pressure");
        if (pressureElement) {
            pressureElement.textContent = p.P.data[0].toFixed(1) + " hPa";
            updatePressureTrend(p.P.data[0]);
        }

        const humidityElement = document.getElementById("humidity");
        if (humidityElement) {
            humidityElement.textContent = p.RF.data[0].toFixed(0) + " %";
        }

        const rainElement = document.getElementById("rain");
        if (rainElement) {
            rainElement.textContent = p.RR.data[0].toFixed(1) + " mm";
        }

        // --- ZEITSTEMPEL ---
        const ts = new Date(json.timestamps[0]);
        const timestampElement = document.getElementById("timestamp");
        if (timestampElement) {
            timestampElement.textContent = ts.toLocaleString("de-AT", {
                timeZone: "Europe/Vienna",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        }

        // --- SEGELAMPEL ---
        updateSailingLight(wind, gust);

    } catch (err) {
        console.error("GeoSphere Fehler:", err);
        document.getElementById("liveStatus").textContent = "🔴 OFFLINE";
        document.getElementById("refreshInfo").textContent = "Verbindung zur GeoSphere fehlgeschlagen.";
    }
}

// ====================================================
// HINTERGRUNDBILD
// ====================================================

/**
 * Webcam-Hintergrund aktualisieren
 */
function updateWebcam() {
    const bg = document.getElementById("webcamBg");
    if (!bg) return;
    bg.src = WEBCAM_URL + "?t=" + Date.now();
}

// ====================================================
// SYNCHRONISIERTES LADEN
// ====================================================

/**
 * Wetterdaten synchronisiert mit GeoSphere laden
 * (2 Minuten nach jedem 10-Minuten-Update: 02, 12, 22, 32, 42, 52)
 */
function scheduleWeatherUpdate() {
    // Sofort laden
    loadWeather();

    // Rekursive Funktion zum Planen des naechsten Updates
    function scheduleNext() {
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // GeoSphere aktualisiert zu 0, 10, 20, 30, 40, 50 Minuten
        // Wir wollen 2 Minuten DANACH laden: 2, 12, 22, 32, 42, 52
        const geosphereMinute = Math.floor(minutes / 10) * 10;
        let targetMinutes = geosphereMinute + 2;
        
        if (targetMinutes <= minutes) {
            targetMinutes += 10; // Naechster 10-Minuten-Block + 2
        }
        if (targetMinutes >= 60) {
            targetMinutes -= 60;
        }

        let waitSeconds = (targetMinutes - minutes) * 60 - seconds;
        if (waitSeconds < 0) waitSeconds = 0;

        // Naechsten Update planen (rekursiv)
        setTimeout(() => {
            loadWeather();
            scheduleNext();
        }, waitSeconds * 1000);
    }

    // Ersten naechsten Update planen
    scheduleNext();
}

// ====================================================
// INITIALISIERUNG
// ====================================================

// Version anzeigen
document.getElementById("version").textContent = 
    "SCM Live-Wetter · Version " + VERSION + " · © 2026 Segelclub Mattsee";

// Webcam laden
updateWebcam();
setInterval(updateWebcam, WEBCAM_INTERVAL);

// Wetterdaten laden
loadWeather();
scheduleWeatherUpdate();
