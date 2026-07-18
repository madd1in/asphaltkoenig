# Asphaltkönig

Ein kleines 3D-Open-World-Spiel, das komplett im Browser läuft.

## Neu in Version 1.2

- acht zusätzliche lokale MP3-Tracks als standardmäßig aktives Shuffle-Radio ohne Wiederholungen
- deutsche Sprachausgabe für Missionsbriefings, Erfolge, Radio und Game Over (`V` schaltet sie um)
- ein zweites City-Tile-Atlas sowie 16 freigestellte Stadtmöbel-Sprites für abwechslungsreichere Viertel
- detailreichere Fahrzeugklassen und eine überarbeitete Spielerfigur
- Nitro-Boost auf `Q` samt HUD-Anzeige und „Now Playing“-Radioanzeige
- weiterhin optimierte Renderlast durch adaptive Pixelratio, getaktete Schatten und ein gedrosseltes HUD

## Spielen

[Asphaltkönig auf GitHub Pages starten](https://madd1in.github.io/asphaltkoenig/)

## Steuerung

- `W`, `A`, `S`, `D`: bewegen und lenken
- `Shift`: sprinten
- `E`: ein- und aussteigen
- `F`: schlagen
- `Leertaste`: Handbremse
- `Q`: Nitro
- `H`: Hupe
- `R`: Radiosender wechseln
- `V`: Sprachausgabe an/aus
- `P`: Pause

## Lokaler Test

Unter Windows mit installiertem Google Chrome:

```powershell
npm install
node .\smoke-test.cjs
```

Der Smoke-Test lädt das Spiel in einem Headless-Browser, startet eine Runde und prüft Bewegung, Beschleunigung, Nitro, Tile-/Sprite-Assets, Shuffle-Radio, MP3-Metadaten, Modellumfang und JavaScript-Laufzeitfehler.

Die MP3-Loops lassen sich deterministisch neu erzeugen:

```powershell
npm run generate:music
```

Die verwendeten City-Tile- und Sprite-Atlanten wurden für dieses Projekt mit OpenAI Imagegen erzeugt. Die Stadtmöbel wurden anschließend per Chroma-Key als transparentes PNG aufbereitet.
