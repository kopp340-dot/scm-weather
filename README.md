# SCM Live-Wetter Mattsee

Live-Wetter-Dashboard des **Segelclub Mattsee (SCM)**. Es zeigt aktuelle
Wind-, Böen- und Wetterdaten der GeoSphere-Messstation Mattsee in einer für
den Segelbetrieb optimierten Ansicht — mit Panorama-Kamerabild als Hintergrund.

Die Seite ist eine statische Web-App (HTML/CSS/JavaScript) und wird über
GitHub Pages ausgeliefert. Sie kann direkt von der SCM-Homepage verlinkt werden.

**Live-Seite:** https://kopp340-dot.github.io/scm-weather/

## Funktionen

### Wind
- **Live-Wind** in Knoten mit Beaufort-Anzeige
- **Farbliche Windampel** je nach Windstärke (blau/gelb/grün/orange/rot)
- **Windrose / Kompass** mit echten Skalenstrichen (Haupt-/Neben-/Feinstriche),
  hervorgehobenem Nord (N in Rot) und Pfeil in Windrichtung
- **Böen** (Windspitze) mit eigener Farbampel
- **Segelampel** mit Emoji-Farben passend zur Windstärke

### Segelampel (Schwellen)
| Anzeige | Windstärke | Farbe |
|---------|------------|------|
| 🔵 Zu wenig Wind | < 4 kt | blau |
| 🟡 Leichtwind | 4–8 kt | gelb |
| 🟢 Gute Segelbedingungen | 8–15 kt | grün |
| 🟠 Starkwind | 15–25 kt | orange |
| 🔴 Sturm | ab 25 kt | rot |

### Wetterdaten
- Temperatur, Luftfeuchte, Luftdruck, Niederschlag
- Zeitstempel in lokaler Zeit (Europe/Vienna)

### Hintergrund & Links
- **Panorama-Kamera** des Segelclub Mattsee als fixer Hintergrund
  (stündliche Aktualisierung)
- **Externe Links** unter der Segelampel:
  - Weitere Wind-Infos → https://www.segelclub-mattsee.at/8518-2/
  - Wasserstand & Temp. → https://www.salzburg.gv.at/wasser/hydro/#/Seen?station=203604
  - Wetterwarnungen → https://warnungen.zamg.at/

### Allgemein
- Automatische Aktualisierung der Wetterdaten alle 60 Sekunden
- Smartphone-optimiertes, responsives Layout
- Halbtransparente Karten, damit das Webcam-Bild durchscheint

## Datenquelle

[GeoSphere Austria](https://data.hub.geosphere.at) – Station Mattsee (`11152`),
Datensatz `tawes-v1-10min`. Abgefragte Parameter:

| Code | Bedeutung            |
|------|----------------------|
| TL   | Lufttemperatur       |
| FF   | Windgeschwindigkeit  |
| FFX  | Windspitze (Böen)    |
| DD   | Windrichtung         |
| RF   | Relative Feuchte     |
| P    | Luftdruck            |
| RR   | Niederschlag (10 min)|

**Hinweis:** GeoSphere misst am Standort Mattsee (11152) nur die Luft, keine
Wassertemperatur. Daher wird für Wasserstand/Temperatur auf die offizielle
Seite des Hydrographischen Dienstes Salzburg verlinkt.

## Webcam-Hintergrund

Das Panorama-Bild der SCM-Webcam wird von
`https://scmattsee.panocloud.webcam/current1.jpg` geladen und stündlich
über Cache-Busting (Zeitstempel an der URL) aktualisiert.

## Projektstruktur

```
index.html          HTML-Struktur der Seite
css/style.css       Layout, Design, Kompassrose, Transparenz
js/app.js           Datenabruf, Logik, Segelampel, Webcam
assets/logo/        SCM-Stander (Logo/Favicon)
.nojekyll           verhindert Jekyll-Build auf GitHub Pages
README.md           diese Dokumentation
```

## Deployment

Die Seite wird automatisch über **GitHub Pages** aus dem `main`-Branch
(`/root`) ausgeliefert. Nach jedem Merge baut GitHub neu und veröffentlicht
die Seite unter:

```
https://kopp340-dot.github.io/scm-weather/
```

## Verlinkung von der SCM-Homepage

Die SCM-Homepage kann direkt auf die Live-URL verlinken:

```html
<a href="https://kopp340-dot.github.io/scm-weather/">Live-Wetter am Mattsee</a>
```

## Version

Aktuell: **1.9**

## Lizenz

© 2026 Segelclub Mattsee. Nur für den internen Gebrauch des Vereins.
