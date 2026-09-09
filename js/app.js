const VERSION = "2.0";

const API_URL =
"https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?station_ids=11152&parameters=TL&parameters=FF&parameters=FFX&parameters=DD&parameters=RF&parameters=P&parameters=RR";

const REFRESH_INTERVAL = 60000;

// Panorama-Kamera (Segelclub Mattsee)
const WEBCAM_URL = "https://scmattsee.panocloud.webcam/current1.jpg";
// Stündliche Aktualisierung des Hintergrundbilds
const WEBCAM_INTERVAL = 3600000;

let nextUpdateInMinutes = 10;

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

function updateSailingLight(knots, gust = null){

    const light =
        document.getElementById("sailingLight");

    // Hilfsfunktion zur Bestimmung des Textes
    function getWindText(k) {
        if(k < 3) return "Windstille";
        else if(k < 10) return "Leichtwind";
        else if(k < 15) return "Ideal";
        else if(k < 20) return "Frischer Wind";
        else if(k < 25) return "Starkwind";
        else if(k < 30) return "Warnung";
        else return "Sturm";
    }

    // Wind-Text
    const windText = getWindText(knots);

    // Böen-Text nur anzeigen, wenn sie abweichen
    let displayText = windText;
    if (gust !== null && gust !== undefined) {
        const gustText = getWindText(gust);
        if (windText !== gustText) {
            displayText = windText + " – Böen: " + gustText;
        }
    }

    // Hintergrundfarbe basierend auf Wind
    if(knots < 3){
        light.style.background = "#e6f7ff";
    }
    else if(knots < 10){
        light.style.background = "#0099ff";
    }
    else if(knots < 15){
        light.style.background = "#00ff99";
    }
    else if(knots < 20){
        light.style.background = "#ffff00";
    }
    else if(knots < 25){
        light.style.background = "#ff9900";
    }
    else if(knots < 30){
        light.style.background = "#ff3300";
    }
    else{
        light.style.background = "#cc0000";
    }

    light.textContent = displayText;

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