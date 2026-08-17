const VERSION = "1.1";

const API_URL =
"https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?station_ids=11152&parameters=TL&parameters=FF&parameters=FFX&parameters=DD&parameters=RF&parameters=P&parameters=RR";

const REFRESH_INTERVAL = 60000;

// Panorama-Kamera (Segelclub Mattsee)
const WEBCAM_URL = "https://scmattsee.panocloud.webcam/current1.jpg";
// Stündliche Aktualisierung des Hintergrundbilds
const WEBCAM_INTERVAL = 3600000;

let secondsRemaining = 60;

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

    document.getElementById("refreshInfo").textContent =
        "Nächste Aktualisierung in " +
        secondsRemaining +
        " s";

    secondsRemaining--;

    if (secondsRemaining < 0) {
        secondsRemaining = 60;
    }

}

setInterval(updateCountdown,1000);

function updateSailingLight(knots){

    const light =
        document.getElementById("sailingLight");

    if(knots < 4){

        light.textContent =
            "🔴 Zu wenig Wind";

        light.style.background =
            "#ffd8d8";

    }
    else if(knots < 8){

        light.textContent =
            "🟡 Leichtwind";

        light.style.background =
            "#fff3b5";

    }
    else if(knots < 20){

        light.textContent =
            "🟢 Gute Segelbedingungen";

        light.style.background =
            "#d7ffd4";

    }
    else{

        light.textContent =
            "🔴 Starkwind";

        light.style.background =
            "#ffbcbc";
    }

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

    if(knots < 4){

        wind.classList.add("wind-blue");

    }
    else if(knots < 8){

        wind.classList.add("wind-yellow");

    }
    else if(knots < 15){

        wind.classList.add("wind-green");

    }
    else if(knots < 20){

        wind.classList.add("wind-orange");

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

    if(knots < 4){

        gust.classList.add("gust-blue");

    }
    else if(knots < 8){

        gust.classList.add("gust-yellow");

    }
    else if(knots < 15){

        gust.classList.add("gust-green");

    }
    else if(knots < 20){

        gust.classList.add("gust-orange");

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

        document.getElementById("timestamp").textContent =
            json.timestamps[0]
                .replace("T", " ")
                .substring(0,16);

        // Segelampel

        updateSailingLight(wind);

        // Countdown zurücksetzen

        secondsRemaining = 60;

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