# Asphaltkönig

Ein kleines 3D-Open-World-Spiel, das komplett im Browser läuft.

## Neu in Version 1.1

- direktere Fahrzeugbeschleunigung, Lenkung und Bewegung zu Fuß
- fünf lokal ausgelieferte MP3-Loops für Straßen-BGM und vier Radiosender
- texturierte Straßen, Gehwege, Betonflächen und Parks aus einem City-Tile-Atlas
- geringere Renderlast durch adaptive Pixelratio, getaktete Schatten und ein gedrosseltes HUD

## Spielen

[Asphaltkönig auf GitHub Pages starten](https://madd1in.github.io/asphaltkoenig/)

## Steuerung

- `W`, `A`, `S`, `D`: bewegen und lenken
- `Shift`: sprinten
- `E`: ein- und aussteigen
- `F`: schlagen
- `Leertaste`: Handbremse
- `H`: Hupe
- `R`: Radiosender wechseln
- `P`: Pause

## Lokaler Test

Unter Windows mit installiertem Google Chrome:

```powershell
npm install
node .\smoke-test.cjs
```

Der Smoke-Test lädt das Spiel in einem Headless-Browser, startet eine Runde und prüft Bewegung, Beschleunigung, Tile-Texturen, MP3-Metadaten und JavaScript-Laufzeitfehler.

Die MP3-Loops lassen sich deterministisch neu erzeugen:

```powershell
npm run generate:music
```

Das verwendete City-Tile-Atlas wurde für dieses Projekt mit OpenAI Imagegen erzeugt und anschließend als kompaktes JPEG eingebunden.
