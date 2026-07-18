# Asphaltkönig

Ein kleines 3D-Open-World-Spiel, das komplett im Browser läuft.

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
node .\smoke-test.cjs
```

Der Smoke-Test lädt das Spiel in einem Headless-Browser, startet eine Runde, simuliert Bewegung und prüft auf JavaScript-Laufzeitfehler.
