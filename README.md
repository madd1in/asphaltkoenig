# Asphaltkönig

Ein kleines 3D-Open-World-Spiel, das komplett im Browser läuft.

## Neu in Version 1.5.3

- geschwindigkeitsabhängige Touch-Lenkung verhindert Übersteuern bei höherem Tempo
- ausgewogener Lenkkorridor: direkt beim Anfahren, progressiv ruhiger auf schnellen Geraden
- leicht weichere Seitenführung und Kameranachführung ohne die Eingabeverzögerung zurückzubringen
- Regressionstest prüft jetzt getrennt Niedrig-/Mitteltempo und Hochgeschwindigkeitslenkung

## Neu in Version 1.5.2

- neues Direct-Drive-Profil für Touch: deutlich schnellere Niedrigtempo-Lenkung und direktere Beschleunigung/Bremse
- stärkere Seitenführung reduziert das schwammige Nachschieben des Fahrzeugs
- spürbare Motorbremse nach dem Loslassen des Sticks statt langem Weiterrollen
- nochmals kleinere 2,5-%-Totzone und strafferes Mobile-Kamerafolgen

## Neu in Version 1.5.1

- direktere Touch-Kurve mit nur noch 5,5 % Totzone und stärkerer Reaktion im mittleren Stickbereich
- deutlich bessere Lenkwirkung beim Anfahren sowie schnelleres Kamerafolgen auf Mobilgeräten
- Coalesced-/Raw-Pointer-Samples reduzieren veraltete Touchpositionen zwischen zwei Frames
- mobile Blur-Effekte entfallen, um zusätzliche Compositing-Latenz zu vermeiden

## Neu in Version 1.5

- analoge Touch-Steuerung zum Laufen, Sprinten, Beschleunigen, Bremsen und Lenken
- mobile Buttons für Nitro, Drift, Ein-/Aussteigen, Kontextaktion, Radio, Nebenjob, Tuning und Pause
- responsives Hoch-/Querformat-Layout mit Safe-Area-Unterstützung und einem Touch-tauglichen Pause-Menü
- automatisches Mobile-Profil mit reduzierter Pixelratio, deaktivierten Schatten, kürzerem Sichtbereich und kleineren Effekt-/NPC-Budgets
- inaktive Bremsspuren werden nicht mehr gerendert; dadurch nochmals deutlich weniger Draw Calls auf Desktop und Mobile

## Neu in Version 1.4

- Gebäude, Parkbäume, Neonschilder, Litfaßsäulen und Blitzer werden in wenigen GPU-Batches gezeichnet
- entfernte Fahrzeuge, Passanten, Pickups, Kronen und Stadtmöbel nutzen im Performance-Modus aggressiveres Distanz-LOD
- die Simulation holt langsame Frames besser nach; Verkehr, Passanten und HUD arbeiten dabei mit angepassten Update-Raten
- gegenüber Version 1.3 nochmals rund 31 % weniger Draw Calls und 63 % weniger Geometrien im Software-Fallback

## Neu in Version 1.3

- adaptiver Performance-Modus: Auf langsamen Geräten werden Schatten deaktiviert und die interne Auflösung behutsam auf 85 % reduziert
- Distanz-LOD für Autos, Passanten, Gebäude, Bäume und Stadtmöbel sowie gedrosselte Hintergrundsimulation
- gebündelte Stadtflächen und Dächer plus gemeinsam genutzte Geometrien für Fahrzeuge und Figuren
- im CPU-/Software-Fallback rund 54 % weniger Draw Calls, 77 % weniger Geometrien und mehr als doppelte Bildrate

## Neu in Version 1.2.1

- fairere Polizeiverfolgung: weniger Einheiten, gestaffelte Verstärkung und deutlich seltenerer Rammschaden
- schnellere Abkühlung des Fahndungslevels sowie eine längere Festnahmezeit zu Fuß
- Shuffle Radio startet ruhig mit „Boulevard Heat Loop“ und blendet sanfter ein

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

Auf Smartphones erscheint nach dem Start automatisch die Touch-Steuerung. Der linke Stick arbeitet analog; weit nach vorne schieben aktiviert beim Laufen automatisch den Sprint.

## Lokaler Test

Unter Windows mit installiertem Google Chrome:

```powershell
npm install
node .\smoke-test.cjs
```

Der Smoke-Test lädt das Spiel in einem Headless-Browser, startet eine Runde und prüft Bewegung, Beschleunigung, Nitro, Tile-/Sprite-Assets, Shuffle-Radio, MP3-Metadaten, Modellumfang, das adaptive Performance-Budget und JavaScript-Laufzeitfehler.

Die MP3-Loops lassen sich deterministisch neu erzeugen:

```powershell
npm run generate:music
```

Die verwendeten City-Tile- und Sprite-Atlanten wurden für dieses Projekt mit OpenAI Imagegen erzeugt. Die Stadtmöbel wurden anschließend per Chroma-Key als transparentes PNG aufbereitet.
