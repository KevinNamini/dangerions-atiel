# Dangerions · Hall of Ascension

Öffentliche AION-2-Legionsrangliste für sieben Charaktere auf **Atiel · Europa · Asmodier**. Eigene Fantasy-Gestaltung, Siegerpodest, Charakterprofile und Tageschronik. Besucher benötigen keinen Login.

Website: https://dangerions-atiel.onrender.com/

## Betrieb

Render veröffentlicht den Ordner `dist/` als statische Website. Es ist kein Build und kein Server-Prozess nötig (`buildCommand: true`). Für die Darstellung sind alle Bilder, Schriftdateien und Skripte lokal enthalten.

Die Website lädt den neuesten Beobachtungsstand aus `data/history.json` in diesem Repository. Der mit der Veröffentlichung ausgelieferte Stand dient als Rückfall bei einem vorübergehenden Verbindungsfehler. Tageswerte können dadurch aktualisiert werden, ohne die Website neu zu veröffentlichen. Der Beobachtungszeitpunkt ist sichtbar; alte Werte werden nicht als Live-Messung ausgegeben.

## Erfassung

`python3 tools/update_roster.py` ruft die sieben öffentlichen Profile ab und erhält bis zu 366 Berliner Tagesstände. `data/history.json` ist das dauerhafte Archiv; `dist/data.js` die identische eingebettete Rückfallfassung. Erster echter Stand: **15. Oktober 2026**. Frühere Werte wurden nicht erfunden.

Die täglichen Hintergrundläufe sind über die mit Kevin eingerichtete ChatGPT-Automatisierung aktiviert, jeweils am Abend gegen 22 Uhr (Europe/Berlin). Das vollständige Verfahren steht in [AUTOMATION.md](AUTOMATION.md). Ohne einen aktivierten Zeitplan führt die Website selbst keine unbeaufsichtigte Erfassung aus. `scheduleEnabled` zeigt den eingerichteten Zustand an.

Bei Teilausfällen bleiben die letzten bekannten Beobachtungen mit ihrem ursprünglichen Datum erhalten. Fehlende Tage werden als Lücken behandelt. Wiederholte Abrufe am selben Tag aktualisieren einen bestehenden Tagesstand. Ausrüstungswechsel können auch zu einem niedrigeren Item-Level führen.

## Rangfolge

Rangfolge ausschließlich nach Item-Level, bei Gleichstand gemeinsamer Rang (1, 1, 3). Charakterlevel und Kampfkraft werden getrennt dargestellt. Erfasst: JKLee, NaminiLee, LordSanchez2, FumosLee, BrouceLee, SurfingLee und Roctopus. Das ist keine vollständige Mitgliederliste; keine Gildenleiter-Rolle wurde verifiziert. Alle sieben Charakterporträts sind vorhanden. Ein eigens gezeichnetes Kantor-Symbol liegt zusätzlich als Ersatzgrafik vor.

## Prüfen und exportieren

```sh
node tests/check-app.mjs
python3 tests/check-updater.py
python3 tools/export_standalone.py Dangerions.html
```

Die Prüfungen decken Rangfolge, Gleichstände, Profile, Ansichtswechsel, Tagesdifferenzen, fehlende Werte und den Erhalt der Chronik bei Quellenausfällen ab. Testdaten werden nie in den öffentlichen Datensatz übernommen. Eine exportierte HTML-Datei ist ein separat öffnbarer Schnappschuss.

## Herkunft

Inoffizielles Fanprojekt. Charakterbilder und Werte stammen aus den verlinkten öffentlichen NC-Profilen. AION 2 © NC Corporation. Die vom offiziellen Webauftritt verwendete öffentliche Schnittstelle benötigt keinen Login, ist aber nicht als stabile Entwickler-API dokumentiert.

Das Festungs-Artwork wurde eigens erzeugt; Schwingenwappen und Klassensymbole wurden als SVG gestaltet. Schriftarten: Cinzel und Manrope unter SIL Open Font License; Lizenzen in `licenses/`.
