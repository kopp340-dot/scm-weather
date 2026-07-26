const API_URL = "https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?station_ids=11152&parameters=TL&parameters=FF&parameters=FFX&parameters=DD&parameters=RF&parameters=P&parameters=RR";

const REFRESH_INTERVAL = 60000; // 60 Sekunden

let secondsRemaining = 60;

function updateCountdown() {

    document.getElementById("refreshInfo").textContent =
        "Nächste Aktualisierung in " + secondsRemaining + " s";

    secondsRemaining--;

    if (secondsRemaining < 0) {
        secondsRemaining = 60;
    }
}

setInterval(updateCountdown, 1000);

function msToKnots(ms) {
    return (ms * 1.94384).toFixed(1);
}

function windDirection(deg) {
    const dirs = ["N","NO","O","SO","S","SW","W","NW"];
    return dirs[Math.round(deg / 45) % 8];
}

function updateSailingLight(knots) {

    const light = document.getElementById("sailingLight");

    if (knots < 4) {
        light.textContent = "🔴 Zu wenig Wind";
        light.style.background = "#ffd6d6";
    } else if (knots < 8) {
        light.textContent = "🟡 Leichter Wind";
        light.style.background = "#fff4c7";
    } else if (knots < 20) {
        light.textContent = "🟢 Gute Segelbedingungen";
        light.style.background = "#d8f5d2";
    } else {
        light.textContent = "🔴 Starkwind";
        light.style.background = "#ffcccc";
    }
}

async function loadWeather() {

    try {

        document.getElementById("liveStatus").textContent = "🟢 LIVE";

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const json = await response.json();

        const p = json.features[0].properties.parameters;

        const wind = msToKnots(p.FF.data[0]);
        const gust = msToKnots(p.FFX.data[0]);
        const dir = p.DD.data[0];

        // Wind
        document.getElementById("wind").textContent = wind;
        document.getElementById("gust").textContent = gust + " kt";

        // Windrichtung
        document.getElementById("directionValue").textContent =
            Math.round(dir) + "°";

        document.getElementById("directionText").textContent =
            windDirection(dir);

        // Pfeil zeigt die Richtung, in die der Wind weht
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
            json.timestamps[0].replace("T", " ").substring(0, 16);

        updateSailingLight(parseFloat(wind));

        secondsRemaining = 60;

    } catch (err) {

        console.error("GeoSphere Fehler:", err);

        document.getElementById("liveStatus").textContent = "🔴 OFFLINE";

        document.getElementById("refreshInfo").textContent =
            "Verbindung zur GeoSphere fehlgeschlagen.";
    }
}

loadWeather();

setInterval(loadWeather, REFRESH_INTERVAL);