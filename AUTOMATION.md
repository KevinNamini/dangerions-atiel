# Dangerions: tägliche Charakter-Erfassung

Diese Anweisung gehört ausschließlich zum von Kevin autorisierten öffentlichen Fanprojekt `KevinNamini/dangerions-atiel` auf Branch `main`. Der bestehende ChatGPT-Zeitplan erfasst die sieben festgelegten Charaktere täglich am Abend in Europe/Berlin. Keine weiteren Zeitpläne anlegen.

## Quellen und Ausgabe

- Offizielle öffentliche AION-2-Charakter-Schnittstelle: `https://aion2.plaync.com/api/character/info` mit `region=eu`, `serverId=2322` und den sieben Charakter-IDs aus `tools/update_roster.py`. Das Skript verwendet die kanonische Anfrage der offiziellen Charakterseite mit passendem Sprachkontext, fordert mit `Cache-Control: no-cache` eine erneute Prüfung an und gleicht `en-US` mit `de-DE` ab. Keine zusätzlichen Abfrageparameter ergänzen.
- Verbindlicher vorheriger Datenstand: `data/history.json` im aktuellsten `main`-Commit dieses Repositorys. Niemals eine alte Chat-Datei oder den lokalen Stand eines früheren Laufs als Ausgangspunkt verwenden.
- Ausgabe: `data/history.json` und die dazu identische Browser-Lesefassung `dist/data.js`. Keine anderen Dateien oder Einstellungen bei normalen Erfassungsläufen ändern.

## Ablauf

1. Das aktuelle Repository lesen beziehungsweise in ein frisches temporäres Verzeichnis klonen. Den aktuellen Branch-Commit als Vergleichsstand festhalten. `tools/update_roster.py` und `data/history.json` aus genau diesem Stand verwenden.
2. `python3 tools/update_roster.py` ausführen. Das Skript prüft Charakter-IDs, Namen, Server und Item-Level und übernimmt nur übereinstimmende frische englische und deutsche Profilantworten. Es setzt den passenden Sprachkontext und lehnt unvollständige Antworten ab, bei denen sämtliche Beschreibungen positiver Statistiken fehlen. Widersprüche gelten als Abruffehler; den alten Beobachtungszeitpunkt erhalten und keine der Antworten nach Höhe auswählen. Bestätigte niedrigere Werte sind erlaubt. Das Skript erhält vorhandene Tage, aktualisiert den letzten Stand pro Berliner Kalendertag und bewahrt bis zu 366 Tagesstände. Gleiche Tagesstände nie doppelt anlegen. Keine historischen Werte schätzen. Höchstens zwei gleichzeitige Profilabrufe, mit gesetzten Zeitlimits.
3. Bei API-Ausfällen oder Widersprüchen höchstens einmal erneut abrufen. Vor einer Veröffentlichung zusätzlich die sichtbaren offiziellen Charakterprofile aller erfolgreich abgerufenen Spieler im Browser abgleichen. Auf das geladene Charakterprofil und die Übersicht warten, Namen, Europa/Atiel und Gilde prüfen; den angezeigten Item-Level und das Charakterlevel mit den validierten API-Werten vergleichen. Ein API-Erfolg allein genügt nicht: Am 15.10.2026 lieferten sowohl Schnittstelle als auch sichtbare Seiten zeitweise unterschiedliche Zahlen. Keine Werte nach Höhe auswählen, keine alten Werte als neue Beobachtung übernehmen, keine Kampfkraft aus abgekürzten Browserwerten zurückrechnen. Falls eine Seite noch lädt oder widersprüchliche Werte zeigt, einmal frisch laden und erneut prüfen. Bleibt ein Widerspruch zwischen vollständiger API-Antwort und sichtbarem Profil bestehen, keinen neuen Commit erstellen und den konkreten Fehler melden; den letzten veröffentlichten Stand erhalten.

   Vollständiger API-Ausfall: nichts überschreiben. Bei einem Teilausfall (Exitcode 2) erfolgreiche, zusätzlich im Browser bestätigte Profile übernehmen; bei fehlgeschlagenen Profilen die vorherigen Werte, Beobachtungszeitpunkte und `failures` erhalten. Ein Abgleich darf niemals einen durch die Vollständigkeitsprüfung abgelehnten API-Wert wieder freigeben, nur weil derselbe fragwürdige Wert zeitweise auf der Website erscheint.
4. Die zwei erzeugten Textdateien als einen GitHub-Commit auf `main` speichern. Die verbundene GitHub-App bietet `create_tree`, `create_commit` und `update_ref`. Auf dem aktuellen Basis-Tree aufbauen und nur die zwei Datendateien ersetzen. `update_ref` mit dem vorher gelesenen `expected_sha` verwenden, ohne erzwungenes Überschreiben. Alternativ die reguläre authentifizierte Git-Verbindung verwenden, falls sie bereits vorhanden ist. Keine Zugangsdaten erzeugen, aus Browsern lesen oder in Dateien speichern.
5. Falls `main` zwischenzeitlich geändert wurde: frischen Stand einlesen und die neuen Beobachtungen in dessen Archiv zusammenführen; anschließend mit dem neuen erwarteten Branch-Stand speichern. Fremde Änderungen erhalten. Bei einem zweiten Konflikt abbrechen und den Fehler melden.
6. Die gespeicherte Fassung aus GitHub erneut lesen und `updatedAt`, Namen, Werte und Tagesanzahl mit dem erzeugten Ergebnis vergleichen. Die Website lädt `data/history.json` direkt und benötigt dafür keine Render-Veröffentlichung. Der öffentliche Daten-Cache kann einige Minuten nachlaufen.

## Regeln

- Ausschließlich JKLee, NaminiLee, LordSanchez2, FumosLee, BrouceLee, SurfingLee und Roctopus auf Atiel erfassen.
- Ausschließlich Item-Level bestimmt den Rang. Charakterlevel und Kampfkraft nicht vermischen.
- `scheduleEnabled` und sonstige Konfiguration beibehalten. Keine Gildenleiter-Rolle erfinden und keine vollständige Mitgliederliste behaupten.
- Bei einem erfolgreichen Routine-Lauf ist keine Nachricht an Kevin erforderlich. Bei blockiertem Zugriff oder fehlgeschlagener Speicherung den konkreten Fehler knapp melden. Keine E-Mails, Nachrichten an Gildenmitglieder oder externen Mitteilungen versenden.
- Keine Designänderung, keine neue Website und keine neue Automatisierung während einer Datenerfassung.
