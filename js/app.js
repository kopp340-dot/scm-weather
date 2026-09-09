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

// Trend-Anzeige für Wind
function updateWindTrend(currentWind) {
    const trendElement = document.getElementById("windTrend");
    if (!trendElement) return;

    if (lastWindValue === null || lastWindTime === null) {
        trendElement.textContent = "";
        trendElement.style.color = "";
    } else {
        const now = new Date();
        const timeDiffMs = now - lastWindTime;
        const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

        if (timeDiffHours < 1) {
            const trend = currentWind - lastWindValue;
            if (trend > 0.5) {
                trendElement.textContent = " ↑";
                trendElement.style.color = "#009933";
            } else if (trend < -0.5) {
                trendElement.textContent = " ↓";
                trendElement.style.color = "#cc0000";
            } else {
                trendElement.textContent = " →";
                trendElement.style.color = "#666666";
            }
        } else {
            trendElement.textContent = "";
            trendElement.style.color = "";
        }
    }
    lastWindValue = currentWind;
    lastWindTime = new Date();
}

function updateCountdown() {
    const now = new Date();
    const nextUpdate = new Date(Math.ceil(now.getTime() / 600000) * 600000);
    const diffMs = nextUpdate - now;
    nextUpdateInMinutes = Math.ceil(diffMs / 60000);
    
    if (nextUpdateInMinutes === 0) {
        document.getElementById("refreshInfo").textContent = "Aktualisierung jetzt...";
    } else {
        document.getElementById("refreshInfo").textContent = 
            "Nächste Aktualisierung in " + nextUpdateInMinutes + " Min.";
    }
}

// Alle 30 Sekunden aktualisieren
setInterval(updateCountdown, 30000);
updateCountdown();

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

        document.getElementById("pressure").textContent =
            p.P.data[0].toFixed(1) + " hPa";

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

// Webcam einmal laden und stündlich aktualisieren
updateWebcam();
setInterval(updateWebcam, WEBCAM_INTERVAL);

loadWeather();

setInterval(loadWeather, REFRESH_INTERVAL);