# Asphaltkönig

Ein kleines 3D-Open-World-Spiel, das komplett im Browser läuft.

## Neu in Version 1.5.10

- präzisere Desktop-Lenkung mit kurzer Eingaberampe, sauberem Rückstellen und geschwindigkeitsabhängiger Maximalwirkung
- höhere Fahrzeughaltbarkeit: Sportwagen 48, Zivilfahrzeuge 60, Polizei 68 und Vans 84 HP
- 28 % Schutz für das aktuell gefahrene Auto sowie gedeckelte Schadensspitzen bei Wänden, Kollisionen, Explosionen und Landungen
- neue Desktop-Regressionstests prüfen Lenkaufbau, Kurvenwinkel, Nachlauf und das Überleben von fünf schweren Treffern

## Neu in Version 1.5.9

- stärkere digitale Mobile-Lenkung bei niedrigem und mittlerem Tempo für engere Kurven
- moderat erhöhte Hochgeschwindigkeitslenkung, weiterhin klar begrenzt gegen Übersteuern
- Regressionstests verlangen jetzt mehr Kurvenwinkel bei unverändert sicherem Hochgeschwindigkeitskorridor

## Neu in Version 1.5.8

- `BREMSE` sitzt im Auto jetzt direkt links neben `GAS` in der untersten rechten Button-Reihe
- deutlich größere und höhere `LINKS/RECHTS`-Lenktasten für sichereres Treffen mit dem Daumen
- `HUPE` befindet sich im linken Fahrblock neben `AUSSTEIGEN`; Fußgängersteuerung bleibt unverändert
- Layout-Regressionstest prüft Pedalreihenfolge und Mindestgröße der Lenktasten

## Neu in Version 1.5.7

- eigene Mobile-Steuerung zu Fuß mit Analogstick sowie `SPRINT`, `AKTION` und großem `EINSTEIGEN`-Button
- separate Fahransicht mit `NITRO`, `DRIFT`, `HUPE` und `GAS` rechts sowie Lenken/Bremse/Aussteigen links
- UI wechselt beim Ein- und Aussteigen automatisch zwischen beiden vollständig getrennten Button-Sets
- Regressionstests prüfen Sichtbarkeit und Hold/Release-Verhalten beider Steuerungsmodi

## Neu in Version 1.5.6

- `GAS` sitzt jetzt fest in der untersten rechten Position der Mobile-Fahrsteuerung
- `EIN/AUS` wurde in den linken Fahrblock neben `BREMSE` verschoben
- Layout-Regressionstest prüft Position und Bedienbarkeit des Gasbuttons im Mobile-Viewport

## Neu in Version 1.5.5

- feste Mobile-Fahrbuttons für `LINKS`, `RECHTS`, `BREMSE` und `GAS` ersetzen den Analogstick im Auto
- geschwindigkeitsabhängig begrenzte Button-Lenkung verhindert Übersteuern und stoppt sofort beim Loslassen
- der Analogstick bleibt zu Fuß erhalten und kann beim Einsteigen keine versteckte Restlenkung erzeugen
- Multi-Touch erlaubt gleichzeitig Gas und Lenkung; neue Regressionstests prüfen Halten, Loslassen und Eingabelatenz

## Neu in Version 1.5.4

- getrennte Kennlinien für Lenkung und Gas: präzise kleine Lenkkorrekturen bei weiterhin direkter Beschleunigung
- ruhige, nahezu lineare Lenkmitte mit voller Auslenkung am äußeren Stickbereich
- stärker begrenzte Giergeschwindigkeit bei hohem Tempo gegen leichtes Übersteuern
- Regressionstests prüfen Lenkpräzision, Gasansprache sowie Kurvenwinkel bei Mittel- und Hochgeschwindigkeit

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
