# kumo — Choose your matcha tea

Statische Landingpage (HTML/CSS/JS, kein Build-Schritt) für einen Matcha-Konfigurator:
Frucht-Karten im Bogen-Karussell, der Becher wechselt je nach Sorte Farbe, Name und Preis.

- Intro-Animation (Becher, Karten steigen hinter dem Matcha-Berg auf, Headline Buchstabe für Buchstabe)
- Auto-Play, Klick auf Karte, Swipe/Drag, Pfeiltasten, horizontales Scrollen
- Warenkorb-Zähler über die Preis-Karte
- Scroll-Parallax: der Becher wandert beim Runterscrollen mit durch alle Abschnitte (Herkunft, Schichten, Sorten, Filialen) und dreht/neigt sich dabei; Hero-Ebenen und Deko bewegen sich in eigenen Geschwindigkeiten
- „Dive in“: der Becher wächst beim Scrollen bis er den ganzen Bildschirm füllt, mit aufsteigenden Blasen und 3D-Buchstaben-Animation
- Geglättete Render-Schleife (weiches Nachziehen), Laufband mit Scroll-Tempo-Neigung, Maus-Tilt am Becher, Spritzer beim Sortenwechsel, Fly-to-Cart mit schwebendem Mini-Warenkorb
- Sorten-Kacheln im Abschnitt „Pick your fruit“ ändern den Becher live
- Responsive (Desktop + Mobile), `prefers-reduced-motion` wird respektiert

**Live:** https://laudisa01.github.io/kumo-matcha/

Lokal starten:

```bash
python3 -m http.server 5178
```

## Credits

Layout nachempfunden dem Dribbble-Konzept „kumo“ von Kris Anfalova. Becher und Matcha-Berg sind eigene SVG-Grafiken;
die Fruchtfotos wurden freigestellt und stammen aus freien Quellen:

| Datei | Quelle | Lizenz |
|---|---|---|
| `strawberry.png`, `leaf.png` | rawpixel.com (Public Domain) | CC0 |
| `blackberry.png` | Wikimedia Commons, „Blackberry (Rubus fruticosus).jpg“ – Ivar Leidus | CC BY-SA 4.0 |
| `blueberry.png` | Wikimedia Commons, „Dish of blueberries.jpg“ – Petar Milošević (Ausschnitt) | CC BY-SA 4.0 |
| `cranberry.png` | Wikimedia Commons, „Cranberry whole.JPG“ – Bobolo94 | CC BY-SA 3.0 |

Die Bilder unter CC BY-SA sind freigestellt (verändert) und stehen unter derselben Lizenz.
