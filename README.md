# SCM Live-Wetter Mattsee

Live-Wetter-Dashboard des **Segelclub Mattsee (SCM)**. Es zeigt aktuelle
Wind-, Böen- und Wetterdaten der GeoSphere-Messstation Mattsee in einer für
den Segelbetrieb optimierten Ansicht – mit Panorama-Kamerabild als Hintergrund.

Die Seite ist eine statische Web-App (HTML/CSS/JavaScript) und wird über
GitHub Pages ausgeliefert. Sie ist als iframe im rechten Fenster der
SCM-Homepage eingebettet und funktioniert auch auf dem Smartphone (Vollbild).

**Live-Seite:** https://kopp340-dot.github.io/scm-weather/

## Funktionen

### Wind
- **Live-Wind** in Knoten mit Beaufort-Anzeige
- **Farbliche Windampel** je nach Windstärke (Windfinder-ähnliche Farben: hellblau, blau, hellgrün, gelb, orange, rot, dunkelrot)
- **Windrose / Kompass** mit echten Skalenstrichen (Haupt-/Neben-/Feinstriche),
  hervorgehobenem Nord (N in Rot) und Pfeil in Windrichtung
- **Böen** (Windspitze) mit eigener Farbampel (gleiche Schwellen wie Wind: Windstille – Böen, Leichtwind – Böen, Ideal – Böen, etc.)
- **Segelampel** mit Windfinder-Farben (bis 50 kt) und angepassten Texten, **zweifarbig bei abweichenden Böen** (Gradient von Wind- zu Böenfarbe)
- **Wind-Trend** (↑/↓/→) für die letzte Stunde (grün = Wind nimmt zu, rot = Wind nimmt ab, grau = stabil)

### Segelampel (Schwellen)
| Anzeige | Windstärke | Farbe |
|---------|------------|------|
| Windstille | < 3 kt | Hellblau (`#e6f7ff`) |
| Leichtwind | 3–10 kt | Blau (`#0099ff`) |
| Ideal | 10–15 kt | Hellgrün (`#00ff99`) |
| Frischer Wind | 15–20 kt | Gelb (`#ffff00`) |
| Starkwind | 20–25 kt | Orange (`#ff9900`) |
| Warnung | 25–30 kt | Rot (`#ff3300`) |
| Sturm | ≥ 30 kt | Dunkelrot (`#cc0000`) |

### Wetterdaten
- Temperatur, Luftfeuchte, Luftdruck, Niederschlag
- Zeitstempel in lokaler Zeit (Europe/Vienna)

### Hintergrund & Links
- **Panorama-Kamera** des Segelclub Mattsee als fixer Hintergrund
  (stündliche Aktualisierung)
- **Externe Links** unter der Segelampel:
  - Weitere Wind-Infos → https://luke-ff.github.io/GeosphereGraph/ (Windfinder-ähnliches Dashboard)
  - Wasserstand & Temp. → https://www.salzburg.gv.at/wasser/hydro/#/Seen?station=203604
  - Wetterwarnungen → https://warnungen.zamg.at/

### Allgemein
- Automatische Aktualisierung der Wetterdaten **2 Minuten nach jedem 10-Minuten-Zeitpunkt**
- Responsives Layout (Desktop, Tablet, Smartphone)
- Halbtransparente Karten, damit das Webcam-Bild durchscheint
- iframe-tauglich (volle Breite, kein Frame-Sperre)

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

## Einbindung in die SCM-Homepage

Die Wetterseite ist als iframe im rechten Fenster der SCM-Homepage eingebettet
(Menüpunkt „Live-Wetter Mattsee“, vormals „Wetterdaten Geosphere Mattsee“).

### Iframe-Code

```html
<iframe src="https://kopp340-dot.github.io/scm-weather/"
        width="100%" height="800"
        style="border:0;"
        loading="lazy"
        title="SCM Live-Wetter Mattsee">
</iframe>
```

### Smartphone

Auf dem Smartphone öffnet sich die Seite im **Vollbild** (Menü ist oben
rechts als Hamburger-Dropdown). Das Layout skaliert automatisch:
- ≤600px: Header untereinander, Windrose 200px
- ≤430px: zusätzlich verkleinerte Windrose (170px), Links untereinander

### Technische Hinweise
- Die Seite ist iframe-tauglich (GitHub Pages sendet keinen Frame-Sperre-Header)
- Externe Links öffnen in neuem Tab (`target="_blank"`)
- GeoSphere-API erlaubt CORS, Datenabruf funktioniert aus dem iframe
- Webcam-Bild lädt ohne CORS-Beschränkung

## Projektstruktur

```
index.html          HTML-Struktur der Seite
css/style.css       Layout, Design, Kompassrose, Transparenz, Responsive
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

## Verlinkung

Die SCM-Homepage nutzt die iframe-Einbindung (siehe oben). Für einen
einfachen Menülink reicht auch:

```html
<a href="https://kopp340-dot.github.io/scm-weather/">Live-Wetter am Mattsee</a>
```

## Version

Aktuell: **3.21**

## Changelog

### v3.21 (2026)
- GeoSphere-Daten werden 2 Minuten nach jedem 10-Minuten-Update geladen
- Countdown und Cache folgen demselben Aktualisierungszeitpunkt

### v3.6 (2025)
- Segelampel-Farben und -Texte an Windfinder angepasst (bis 50 kt)
- Link "Weitere Wind-Infos" auf Lukes GeosphereGraph-Dashboard aktualisiert
- **Zweifarbige Segelampel** bei abweichenden Böen (Gradient)
- **Wind-Trend-Anzeige** (↑/↓/→) für die letzte Stunde
- Datenabruf auf **2 Minuten nach jedem 10-Minuten-Update** angepasst

### v2.0 (2025)
- Erste stabile Version mit GeoSphere-Daten, Segelampel, Windrose und Webcam-Hintergrund

## Lizenz

© 2026 Segelclub Mattsee. Nur für den internen Gebrauch des Vereins.
