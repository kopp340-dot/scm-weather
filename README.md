# SCM Live-Wetter Mattsee

Live-Wetter-Dashboard des **Segelclub Mattsee (SCM)**. Es zeigt aktuelle
Wind-, Böen- und Wetterdaten der GeoSphere-Messstation Mattsee in einer für
den Segelbetrieb optimierten Ansicht.

Die Seite ist eine statische Web-App (HTML/CSS/JavaScript) und wird über
GitHub Pages ausgeliefert, sodass sie direkt von der SCM-Homepage verlinkt
werden kann.

## Funktionen

- **Live-Wind** in Knoten mit Beaufort-Anzeige und farblicher Windampel
- **Windrose** mit Pfeil in Windrichtung und Himmelsrichtung (N, NO, O, …)
- **Böen** als Windspitze
- **Segelampel** (zu wenig Wind / Leichtwind / gute Segelbedingungen / Starkwind)
- **Wetterdaten**: Temperatur, Luftfeuchte, Luftdruck, Niederschlag
- **Automatische Aktualisierung** alle 60 Sekunden
- Smartphone-optimiertes Layout

## Datenquelle

[GeoSphere Austria](https://data.hub.geosphere.at) – Station Mattsee (`11152`),
Datensatz `tawes-v1-10min`. Abgefragte Parameter:

| Code | Bedeutung            |
|------|----------------------|
| TL   | Lufttemperatur       |
| FF   | Windgeschwindigkeit  |
| FFX  | Windspitze (Böen)    |
| DD   | Windrichtung         |
| RF   | Relative Feuchte    |
| P    | Luftdruck            |
| RR   | Niederschlag (10 min) |

## Struktur

```
index.html          HTML-Struktur der Seite
css/style.css       Layout und Design
js/app.js           Datenabruf und Logik
assets/logo/        SCM-Stander (Logo/Favicon)
```

## Verlinkung von der SCM-Homepage

Nach Aktivierung von GitHub Pages ist die Seite unter

```
https://kopp340-dot.github.io/scm-weather/
```

erreichbar und kann von der SCM-Homepage verlinkt werden.

## Lizenz

© 2026 Segelclub Mattsee. Nur für den internen Gebrauch des Vereins.
