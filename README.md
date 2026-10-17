# Dangerions · Hall of Ascension

Öffentliche AION-2-Legionsrangliste für acht Charaktere auf **Atiel · Europa · Asmodier**. Eigene Fantasy-Gestaltung, Siegerpodest, Charakterprofile und Stunden- sowie Tageschronik. Besucher benötigen keinen Login.

Website: https://dangerions-atiel.onrender.com/

## Betrieb

Render veröffentlicht den Ordner `dist/` als statische Website. Es ist kein Build und kein Server-Prozess nötig (`buildCommand: true`). Für die Darstellung sind alle Bilder, Schriftdateien und Skripte lokal enthalten.

Die Website lädt den neuesten Beobachtungsstand aus `data/history.json` in diesem Repository. Der mit der Veröffentlichung ausgelieferte Stand dient als Rückfall bei einem vorübergehenden Verbindungsfehler. Tageswerte können dadurch aktualisiert werden, ohne die Website neu zu veröffentlichen. Der Beobachtungszeitpunkt ist sichtbar; alte Werte werden nicht als Live-Messung ausgegeben.

## Erfassung

`python3 tools/update_roster.py` ruft die festgelegten öffentlichen Profile ab und erhält bis zu 366 Berliner Tagesstände. `snapshots` erhält zusätzlich 31 Tage echter Abrufe mit Zeitstempeln und angefragter Spielerliste; die feinere Historie beginnt am 16. Oktober 2026 ohne rückwirkend erfundene Punkte. `data/history.json` ist das dauerhafte Archiv; `dist/data.js` die identische eingebettete Rückfallfassung. Erster echter Stand: **15. Oktober 2026**. Frühere Werte wurden nicht erfunden.

Der bestehende Hintergrundlauf ist auf stündliche Erfassung jeweils um Minute 07 (Europe/Berlin) ausgelegt. Er nutzt weiterhin die bereits mit Kevin eingerichtete ChatGPT-Automatisierung; es gibt keinen zweiten parallelen Zeitplan. Das vollständige Verfahren steht in [AUTOMATION.md](AUTOMATION.md). Ohne einen aktivierten Zeitplan führt die Website selbst keine unbeaufsichtigte Erfassung aus. `scheduleEnabled` zeigt den eingerichteten Zustand an.

Bei Teilausfällen bleiben die letzten bekannten Beobachtungen mit ihrem ursprünglichen Datum erhalten. Fehlende Stunden und Tage bleiben im Datenarchiv ohne erfundene Werte. Die Diagramme verbinden die vorhandenen Messpunkte dagegen durchgehend, einschließlich der Schattierung unter der großen Kurve. Wiederholte Abrufe am selben Tag aktualisieren einen bestehenden Tagesstand. Ausrüstungswechsel können auch zu einem niedrigeren Item-Level führen.

Ein fehlgeschlagener erneuter Abruf blendet bestätigte Wochenveränderungen nicht aus. Sie beschreiben den letzten gespeicherten Stand; die frühere Zwei-Stunden-Grenze lässt sie nicht mehr verschwinden. Beobachtungen müssen innerhalb des Wochenfensters liegen und dürfen nicht vor ihrem Vergleichswert liegen. Die Fehlerliste, die ursprünglichen Zeitstempel und unvollständige Snapshots bleiben unverändert; alte Beobachtungen werden nicht als neue Abrufe gespeichert.

## Rangfolge

Rangfolge ausschließlich nach Item-Level, bei Gleichstand gemeinsamer Rang (1, 1, 3). Charakterlevel und Kampfkraft werden getrennt dargestellt. Erfasst: JKLee, NaminiLee, LordSanchez2, FumosLee, BrouceLee, SurfingLee, Roctopus und Stecher. Das ist keine vollständige Mitgliederliste; keine Gildenleiter-Rolle wurde verifiziert. Alle acht Charakterporträts sind vorhanden. Ein eigens gezeichnetes Kantor-Symbol liegt zusätzlich als Ersatzgrafik vor.

Stecher wurde am **16. Oktober 2026** ergänzt: Assassine, Level 26, Item-Level 249, bestätigt in beiden API-Sprachen und im sichtbaren Profil. Sein öffentliches Profil zeigt derzeit keine Legion an; die Aufnahme in diese Rangliste erfolgte auf Kevins Wunsch. Kevin hat anschließend den Spielstart vom **15.10.2026 um 23:00 Uhr (Europe/Berlin)** mit **Level 1 / Item-Level 0** ergänzt. Dieser historische Tageswert ist ausdrücklich als `user-reported` mit Kevin als Quelle und eigenem Erfassungszeitpunkt gekennzeichnet. Er zählt im Startvergleich, den Rangänderungen, dem Aufstiegsatlas, dem Legionsbuch und den Profilen; es wird kein öffentlicher Profilabruf und kein rückwirkender Stunden-Snapshot vorgetäuscht. Bei einem Startwert null entfällt die Prozentangabe. Stündliche Aktualisierungen erhalten diesen Eintrag.

## Prüfen und exportieren

Die Chronik ist als **Aufstiegsatlas** gestaltet: ein großer Einzelverlauf mit auswählbaren Tagesständen und acht Mini-Verläufe. Seit dem 17.10.2026 verwenden Rangliste, Profile, Aufsteiger und die Sortierung des Atlas den **Wochenvergleich**: sieben Berliner Kalendertage einschließlich des Tages von `updatedAt`, verglichen mit der frühesten vollständigen vorhandenen Gruppe in diesem Fenster. Solange die Erfassung kürzer als eine Woche läuft, heißt der Bezug „seit Start“. Ohne vollständige Vergleichsgruppe gibt es keine Rangbehauptung; individuelle Item-Level-Differenzen bleiben bei vorhandener Vergleichsbasis möglich. Die Quelle und der tatsächliche Zeitraum bleiben nachvollziehbar, ohne zusätzliche Textblöcke auf dem Handy. Unveränderte Ränge zeigen `±0`; ±1 ist dezent, ±2/±3/±4+ erhalten weiterhin abgestufte endliche Leuchtimpulse, bei reduzierter Bewegung ohne Animation.

Der Atlas startet mit **7 Tage** und sortiert nach absolutem Wochenzuwachs; fehlende Vergleiche stehen hinten und bei Gleichstand bleibt die Item-Level-Reihenfolge erhalten. Podest und Rangliste bleiben nach Item-Level sortiert. Die zusätzliche **24 h**-Ansicht behält echte Stundenwerte, ihren begrenzten Startvergleich und ihren eigenen Zeitraumgewinn. **30 Tage** und **Alle** bleiben Tagesverläufe. Der Wochenverlauf beginnt bei der tatsächlichen Vergleichsbeobachtung. Historische Tagesänderungen im Legionsbuch beziehen sich weiterhin auf den direkten Vortag. Das Archiv wird für diese Anzeigeänderung nicht verändert.

Große Kurve und Mini-Verläufe verbinden alle vorhandenen Messpunkte vom ersten bis zum letzten Punkt mit einer durchgezogenen Linie, auch über fehlende Stunden und Tage. Die große Kurve hat genau eine durchgehende Verlaufsfläche ohne getrennte Startschattierung. Zeitabstände bleiben proportional; Zwischenzeiten sind keine zusätzlichen Messungen. Messpunkte, Auswahl und Vergleichswerte bleiben auf die tatsächlich gespeicherten Beobachtungen beschränkt; ein einzelner Punkt erzeugt keine erfundene Entwicklung. Das große Diagramm hat eine eigene Skala; die Mini-Verläufe verwenden eine gemeinsame Skala für absolute Item-Level-Zuwächse. Neue Spieler erhalten nur dann einen früheren Startpunkt, wenn Kevin ihn ausdrücklich angibt und die Herkunft sichtbar gekennzeichnet ist. Das gespeicherte Archiv bleibt unverändert. Die Ansicht „Alle“ umfasst das vollständige vorhandene Archiv.

`dist/progress.js` berechnet den Zeitvergleich, `dist/rank-motion.css` enthält die Rangwechsel-Effekte. Die geöffnete Website prüft den Datenfeed alle fünf Minuten sowie beim Zurückkehren in den Tab, behält die ausgewählte Ansicht bei und unterbricht kein geöffnetes Profil. `dist/chronicle.js` und `dist/chronicle.css` enthalten Darstellung und Bedienung des Atlas. Das Datenformat ist abwärtskompatibel um `schemaVersion: 2`, `hourlyStartedAt` und `snapshots` erweitert.

```sh
node tests/check-app.mjs
node tests/check-progress.mjs
python3 tests/check-updater.py
python3 tools/export_standalone.py Dangerions.html
```

Die Prüfungen decken Rangfolge, Gleichstände, Profile, Ansichtswechsel, Tagesdifferenzen, fehlende Werte und den Erhalt der Chronik bei Quellenausfällen ab. Testdaten werden nie in den öffentlichen Datensatz übernommen. Eine exportierte HTML-Datei ist ein separat öffnbarer Schnappschuss.

## Herkunft

Inoffizielles Fanprojekt. Charakterbilder und Werte stammen aus den verlinkten öffentlichen NC-Profilen. AION 2 © NC Corporation. Die vom offiziellen Webauftritt verwendete öffentliche Schnittstelle benötigt keinen Login, ist aber nicht als stabile Entwickler-API dokumentiert.

Das Festungs-Artwork wurde eigens erzeugt; Schwingenwappen und Klassensymbole wurden als SVG gestaltet. Schriftarten: Cinzel und Manrope unter SIL Open Font License; Lizenzen in `licenses/`.
