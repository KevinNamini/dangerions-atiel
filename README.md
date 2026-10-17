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

Ein fehlgeschlagener erneuter Abruf blendet bereits bestätigte Vergleichswerte nicht sofort aus. Die Anzeige verwendet die letzte verifizierte Beobachtung eines Spielers weiterhin, solange deren eigener Zeitstempel höchstens zwei Stunden alt ist. Das gilt gemeinsam für Rangliste, Chronik, Profile und Aufsteiger. Die Fehlerliste und unvollständigen Snapshots bleiben unverändert; alte Beobachtungen werden nicht als neue Abrufe gespeichert. Tatsächlich veraltete oder fehlende Werte verhindern weiterhin einen aktuellen Rangvergleich.

## Rangfolge

Rangfolge ausschließlich nach Item-Level, bei Gleichstand gemeinsamer Rang (1, 1, 3). Charakterlevel und Kampfkraft werden getrennt dargestellt. Erfasst: JKLee, NaminiLee, LordSanchez2, FumosLee, BrouceLee, SurfingLee, Roctopus und Stecher. Das ist keine vollständige Mitgliederliste; keine Gildenleiter-Rolle wurde verifiziert. Alle acht Charakterporträts sind vorhanden. Ein eigens gezeichnetes Kantor-Symbol liegt zusätzlich als Ersatzgrafik vor.

Stecher wurde am **16. Oktober 2026** ergänzt: Assassine, Level 26, Item-Level 249, bestätigt in beiden API-Sprachen und im sichtbaren Profil. Sein öffentliches Profil zeigt derzeit keine Legion an; die Aufnahme in diese Rangliste erfolgte auf Kevins Wunsch. Kevin hat anschließend den Spielstart vom **15.10.2026 um 23:00 Uhr (Europe/Berlin)** mit **Level 1 / Item-Level 0** ergänzt. Dieser historische Tageswert ist ausdrücklich als `user-reported` mit Kevin als Quelle und eigenem Erfassungszeitpunkt gekennzeichnet. Er zählt im Startvergleich, den Rangänderungen, dem Aufstiegsatlas, dem Legionsbuch und den Profilen; es wird kein öffentlicher Profilabruf und kein rückwirkender Stunden-Snapshot vorgetäuscht. Bei einem Startwert null entfällt die Prozentangabe. Stündliche Aktualisierungen erhalten diesen Eintrag.

## Prüfen und exportieren

Die Chronik ist als **Aufstiegsatlas** gestaltet: ein großer Einzelverlauf mit auswählbaren Tagesständen und acht eigene Mini-Verläufe. Die Spielerkarten und der anfängliche Fokus folgen dem absoluten Item-Level-Zuwachs im 24-Stunden-Vergleich, absteigend; Spieler ohne Vergleich stehen am Ende. Bei gleichem Zuwachs bleibt die Item-Level-Reihenfolge erhalten. Diese Sortierung gilt für jeden gewählten Zeitraum ausschließlich im Aufstiegsatlas; Podest und Rangliste bleiben nach aktuellem Item-Level sortiert. Die Änderungen in Rangliste und Atlas vergleichen den letzten verifizierten Stand mit dem zeitlich nächsten Snapshot von vor 24 Stunden (höchstens 65 Minuten Abweichung). Während der ersten 24 Stunden des Stundenarchivs nutzt die Anzeige ersatzweise den bereits gespeicherten Tagesstand vom Tag vor dem Beginn der stündlichen Erfassung: ausdrücklich als **vorläufiger Startvergleich**, mit tatsächlichem Zeitraum unter der Rangliste. Dadurch sind die vorhandenen Gewinne und Rangänderungen sofort sichtbar. Sobald ein passender echter 24-h-Snapshot vorliegt, wechseln Vergleich und Beschriftung automatisch auf 24 Stunden. Nach der Startphase bleiben fehlende Vergleiche leer. Rangwechsel benötigen vollständige Vergleichsgruppen, alte aktuelle Werte über zwei Stunden werden markiert. ±1 ist dezent, ±2/±3/±4+ erhalten abgestufte endliche Leuchtimpulse, bei reduzierter Bewegung ohne Animation. Die Standardansicht heißt während des Startvergleichs „Seit Start“, danach „24 h“, und nutzt echte Beobachtungszeiten; „7 Tage“, „30 Tage“ und „Alle“ Tagesstände, mit heute als laufendem Tag. Tagesänderungen im historischen Legionsbuch beziehen sich weiter auf den direkten Vortag; der Gewinn im großen Verlauf auf den ersten und letzten tatsächlich erfassten Wert des gewählten Zeitraums.

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
