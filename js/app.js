const url = "https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?station_ids=11152&parameters=TL&parameters=FF&parameters=FFX&parameters=DD&parameters=RF&parameters=P&parameters=RR";

function degreeToDirection(degree) {
    const directions = [
        "N", "NNO", "NO", "ONO",
        "O", "OSO", "SO", "SSO",
        "S", "SSW", "SW", "WSW",
        "W", "WNW", "NW", "NNW"
    ];

    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
}
async function loadWeather() {

    const response = await fetch(url);

    const json = await response.json();

    const p = json.features[0].properties.parameters;

    const temp = p.TL.data[0];

    const wind = p.FF.data[0];

    const direction = p.DD.data[0];

    const gust = p.FFX.data[0];

    const pressure = p.P.data[0];

    const humidity = p.RF.data[0];

    const rain = p.RR.data[0];

    const time = json.timestamps[0];
    const date = new Date(time);
    const formattedTime = date.toLocaleString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
    }) + " Uhr";

    document.getElementById("temperature").textContent =
        temp.toFixed(1) + " °C";

    document.getElementById("wind").textContent =
        (wind * 1.94384).toFixed(1) + " kt";

    document.getElementById("gust").textContent =
        (gust * 1.94384).toFixed(1) + " kt";

    document.getElementById("pressure").textContent =
        pressure.toFixed(1) + " hPa";

    document.getElementById("humidity").textContent =
        humidity.toFixed(0) + " %";

    document.getElementById("rain").textContent =
        rain.toFixed(1) + " mm";

    document.getElementById("direction").textContent =
        `${direction}° (${degreeToDirection(direction)})`;

    document.getElementById("timestamp").textContent =
        formattedTime;
}

loadWeather();