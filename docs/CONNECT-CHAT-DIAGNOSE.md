# Verbinden- und Chat-Kette in /app — Diagnose

Erhoben am 2026-08-28 gegen `feature/matchup-webapp`. Reine Diagnose ohne
Codeänderungen und ohne Testdaten in der DB. Ergebnis ist dieses Dokument.

Datei-Referenzen sind `pfad:zeile` — Zeilen sind ungefähr, aber im typischen
Editor direkt anspringbar.

---

## 1. Die Kette Schritt für Schritt

### a) A tippt „Verbinden"

Zwei Einstiegspunkte im /app-Bereich, beide gleichwertig:

| Ort | Datei:Zeile | Aktion |
|---|---|---|
| Grid-Karte im Discover | `src/app/app/components/subviews/BrowsePeople.tsx:101–107` | `connect(target)` — `supabase.from("likes").upsert({ from_user_id: A, to_user_id: B }, { onConflict: "from_user_id,to_user_id" })` |
| Volles Profil | `src/app/app/components/subviews/FullProfile.tsx:106–120` | dasselbe upsert |
| „Person suchen"-Auswahl | `src/app/app/components/subviews/SelectProfileBrowse.tsx:257` | ruft dieselbe `connect()`-Route |

Getroffene Tabelle: **`web.likes`** — Spalten `id, from_user_id, to_user_id,
created_at` (live via REST verifiziert). Upsert ist idempotent.

Direkt nach dem Insert wird geprüft, ob B bereits A geliked hat:

```
supabase.from("likes").select("id")
        .eq("from_user_id", target.id)
        .eq("to_user_id", profile.id).maybeSingle();
```

Falls ja: `ensureMatch(A, B)` (`src/lib/matchmaking.ts:8–26`) legt idempotent
eine Zeile in **`web.matches`** an (`user1_id`, `user2_id`, `is_active=true`).

### b) Wie erfährt B davon?

**Gar nicht in Echtzeit.** Suche im Repo:

- **Datenbank-Trigger**: keiner auf `likes` — `supabase/web_schema.sql` +
  `web_security_hardening_2.sql` legen weder Trigger noch NOTIFY an.
- **Realtime**: `supabase.channel(…)` mit `postgres_changes` gibt es nur für
  **`web.messages`** (`chat.ts:41`, `MatchesList.tsx:74`, `ChatDetail.tsx`).
  Für `likes` und `matches` **keine einzige Realtime-Subscription**
  (`grep "postgres_changes.*likes" src/` → 0 Treffer).
- **Edge Function**: es gibt keinen Ordner `supabase/functions/`.
- **Push**: siehe §3b — nicht implementiert.

**Konsequenz:** B sieht die Anfrage erst, wenn er selbst die App öffnet und
`refreshBadges()` (AppShell.tsx:245–271) oder `LikesTab.load` (LikesTab.tsx:22)
neu läuft — d. h. bei Tab-Wechsel, Seitenaufruf oder App-Start.

### c) Wo sieht B die Anfrage in der Oberfläche?

| Ort | Datei:Zeile | Wie |
|---|---|---|
| Zähler am Bottom-Tab „Matches" | `AppShell.tsx:245–271, 339` | `refreshBadges` zählt eingehende Likes ohne Match plus ungelesene Nachrichten und rendert `badges={{ matches: unreadCount + likeCount }}` |
| Reiter „Likes" (Anfragen) | `src/app/app/components/tabs/LikesTab.tsx:22–52` | `likes.select("*, from_user:profiles!likes_from_user_id_fkey(*)").eq("to_user_id", me)` — filtert Anfragen von Personen ohne bestehendes Match aus |
| Chat-Liste, oberer Abschnitt | `src/app/app/components/tabs/MatchesList.tsx:55–68` | zeigt dieselben pending Likes als „offene Anfragen" oberhalb der Match-Chats |

### d) B nimmt an

`LikesTab.tsx:60–75` (`likeBack`): upsert des Reverse-Likes plus
`ensureMatch()`. Dieselbe Route wie in a) — es wird kein separater
Accept-Status gepflegt; die Zustimmung IST das Reverse-Like.

Was ändert sich in der Datenbank:
1. Neue Zeile in **`web.likes`** (B → A).
2. Neue Zeile in **`web.matches`** (`user1_id`, `user2_id` alphabetisch
   sortiert, `is_active=true`).

Es gibt keine dedizierte „Anfrage"-Tabelle mit Status
(`pending/accepted/declined`) — die Zustimmung wird ausschließlich durch das
Vorhandensein einer Reverse-Zeile im Likes-Tisch ausgedrückt.

### e) Wo entsteht die Unterhaltung, und wie finden beide sie?

Es gibt **keine `conversations`-Tabelle**. Die Konversation ist implizit das
Match: `messages.match_id → matches.id`. Beide finden sie über den
Matches-Reiter (`MatchesList.tsx`), der alle aktiven Matches (`is_active=true`)
listet. Klick auf einen Match-Eintrag öffnet `ChatDetail.tsx`.

### f) A schreibt eine Nachricht

Getroffene Tabelle: **`web.messages`** — Spalten `id, match_id, sender_id,
content, is_read, created_at, delivered_at, read_at, client_message_id`
(live verifiziert).

Insert in `ChatDetail.tsx:185` bzw. `chat.ts:24`:

```
supabase.from("messages").insert({
  match_id, sender_id, content, client_message_id
});
```

`client_message_id` deduplifiziert die eigene Zeile gegen das Realtime-Echo.

Wie erfährt B davon:
- **Realtime**: `chat.ts:subscribeMessages(matchId, …)` und
  `MatchesList.tsx:74` (`all-messages:${me.id}`) abonnieren beide Inserts auf
  `web.messages`. Wenn B den Chat gerade offen hat → sofortige Anzeige. Wenn B
  nur die Chat-Liste offen hat → sofortiges Aktualisieren der Vorschau + der
  Zähler. Wenn B die App zu ist → nichts.

### g) „Ungelesen" zählen und zurücksetzen

- **Zählen**: `AppShell.tsx:265–270` —
  ```
  messages.select("id", { count: "exact", head: true })
          .eq("is_read", false).neq("sender_id", me);
  ```
  Der Zähler hängt an `refreshBadges`; er lädt bei Tab-Wechsel neu und wird
  nach jedem Send-Vorgang ebenfalls neu berechnet.
- **Zurücksetzen** beim Öffnen eines Chats: `chat.ts:markRead` / entsprechend
  in `ChatDetail.tsx` — `messages.update({ is_read: true, read_at: now })
  .eq("match_id", …).neq("sender_id", me).is("read_at", null)`.

---

## 2. RLS-Policies

Die Policies liegen in-repo (kein Live-`pg_policies`-Abzug nötig, da die
DB-Definitionen in `supabase/*.sql` gepflegt sind).

**Alle relevanten Tabellen haben RLS aktiviert** — `supabase/web_schema.sql`
aktiviert RLS pauschal auf jeder Tabelle. Die ursprüngliche „Blanko"-Policy
`web_authenticated_all (for all to authenticated using(true))` wurde durch
`web_security_hardening.sql` (Profile + Messages) und `_2.sql` (Rest)
gezielt ersetzt.

### 2.1 Policies je Tabelle

**`web.likes`** — aus `web_security_hardening_2.sql:28,47–50` (im do-Block):

| Op | Policy | Regel |
|---|---|---|
| SELECT | `likes_sel` | `using (true)` — **jede/r Eingeloggte sieht ALLE Likes** |
| INSERT | `likes_ins` | `with check (from_user_id = auth.uid())` ✓ |
| UPDATE | `likes_upd` | `using/with check (from_user_id = auth.uid())` ✓ |
| DELETE | `likes_del` | `using (from_user_id = auth.uid())` ✓ |

**`web.matches`** — `web_security_hardening_2.sql:76–84`:

| Op | Policy | Regel |
|---|---|---|
| SELECT | `web_matches_sel` | `auth.uid() in (user1_id, user2_id)` ✓ |
| INSERT | `web_matches_ins` | `with check (auth.uid() in (user1_id, user2_id))` ✓ |
| UPDATE | `web_matches_upd` | `auth.uid() in (user1_id, user2_id)` — beide Partner dürfen `is_active` togglen (Unmatch) |
| DELETE | `web_matches_del` | dasselbe |

**`web.messages`** — `web_security_hardening.sql:66–69`:

| Op | Policy | Regel |
|---|---|---|
| SELECT | `web_messages_select` | `web.is_my_match(match_id)` ✓ |
| INSERT | `web_messages_insert` | `with check (sender_id = auth.uid() and web.is_my_match(match_id))` ✓ |
| UPDATE | `web_messages_update` | `web.is_my_match(match_id)` — **beide Partner können JEDES Feld ändern**, nicht nur `is_read`/`read_at` |
| DELETE | `web_messages_delete` | `sender_id = auth.uid()` ✓ |

**`web.profiles`** — `web_security_hardening.sql:11–19` plus Trigger:

| Op | Policy | Regel |
|---|---|---|
| SELECT | `web_profiles_select` | `using (true)` — jeder Eingeloggte liest ALLE Spalten aller Profile |
| INSERT | `web_profiles_insert` | `with check (id = auth.uid())` ✓ |
| UPDATE | `web_profiles_update` | `id = auth.uid()` ✓ + Trigger `trg_protect_profile` schützt `is_verified`, `is_banned`, `is_seed`, `report_count` |
| DELETE | `web_profiles_delete` | `id = auth.uid()` ✓ |

`fcm_token`, `device_fingerprint`, `apple_id`, `google_id`, `latitude`,
`longitude`, `pause_reason` liegen NICHT in `profiles`, sondern in
**`web.profiles_private`** (live via REST verifiziert). Dort ist RLS auf
`user_id = auth.uid()` beschränkt (siehe `supabase/web_profiles_private.sql`).

**`web.blocks`** — analog zu likes (do-Block in `web_security_hardening_2.sql:30`):

| Op | Policy | Regel |
|---|---|---|
| SELECT | `blocks_sel` | `using (true)` — **jede/r sieht ALLE Blockierungen aller Nutzer** |
| INSERT | `blocks_ins` | `blocker_id = auth.uid()` ✓ |

### 2.2 Antworten auf die konkreten Fragen

- **Darf B die Anfrage von A überhaupt LESEN?** ✅ **JA.**
  Beleg: Policy `likes_sel` in `web_security_hardening_2.sql:47` erlaubt
  authentifizierten Nutzern jedes SELECT auf `web.likes`. B kann die von A
  gesendete Zeile also sehen — die Kette bricht an dieser Stelle NICHT.
  (Kollateral: theoretisch könnte JEDER angemeldete Nutzer sehen, dass A auf B
  geliked hat — siehe Befund §7.)

- **Kann jemand eine Anfrage im Namen eines anderen senden?** Nein — Policy
  `likes_ins` prüft `from_user_id = auth.uid()`.

- **Kann jemand Nachrichten aus fremden Unterhaltungen lesen?** Nein — Policy
  `web_messages_select` prüft `web.is_my_match(match_id)`, das nur wahr ist,
  wenn `auth.uid()` einer der beiden Match-Teilnehmer ist.

- **Kann jemand fremde Nachrichten als gelesen markieren oder löschen?**
  - Löschen: Nein — `web_messages_delete` prüft `sender_id = auth.uid()`.
  - Als gelesen markieren: **Ja, konstruktionsbedingt** — aber nur innerhalb
    des eigenen Matches. `web_messages_update` erlaubt allen Match-Partnern
    jedes Update. Das ist so gewollt (der Empfänger MUSS `is_read` auf den
    Nachrichten des Anderen setzen können), aber es öffnet die Tür, dass ein
    Match-Partner theoretisch auch `content`, `sender_id`, `created_at`
    umbiegt — siehe Befund §7.

---

## 3. Benachrichtigungen

### a) In-App

Sichtbarer Zähler existiert am unteren Tab „Matches": `AppShell.tsx:339`
rendert `badges={{ matches: unreadCount + likeCount }}`. Berechnung in
`refreshBadges` (`AppShell.tsx:245–271`) — zählt Anfragen ohne Match plus
`messages` mit `is_read=false, sender_id != me`.

**Aktualisiert sich ohne Neuladen?**
- Für **Nachrichten** ja: `MatchesList.tsx:74` hat ein Realtime-Abo
  `all-messages:${me}` und ruft nach jedem Insert `load()` — der Reload
  rechnet `refreshBadges` indirekt neu (bzw. der Chat-Preview aktualisiert).
- Für **eingehende Anfragen** nein: kein Realtime auf `likes`. Ohne
  Neuöffnen der App bleibt der Zähler stehen.

### b) Push

- **fcm_token wird beim Anmelden NICHT befüllt.** Suche im gesamten Repo:
  ```
  grep -rn "fcm_token" src/
    → nur zwei Treffer:
       src/lib/auth.tsx:142 → setzt fcm_token auf NULL beim Sign-Out
       src/lib/types.ts:62  → nur der Typ, keine Schreibstelle
  ```
  Kein `firebase-messaging`-Import, kein `getToken()`-Aufruf, kein
  Registrierungspfad. Die Spalte `profiles_private.fcm_token` bleibt für neue
  Web-Nutzer immer `NULL`.

- **Wer sendet die Push-Nachricht?** Niemand. Es gibt keinen Trigger
  (`grep "pg_notify\|firebase" supabase/*.sql` → 0), keinen Ordner
  `supabase/functions/` (Edge Functions), keine Server Action, die
  Firebase/APNs anspricht.

- **Werden `push_matches` / `push_messages` aus profiles abgefragt?** Nein —
  weil es keinen Sender gibt, wird auch nichts abgefragt. Die zwei Schalter
  in `Settings.tsx:62–63` sind nur Kosmetik.

- **Was passiert wenn kein Token vorhanden ist?** Nichts, weil ohnehin kein
  Send-Pfad existiert. Nicht mal ein „stiller Fehlschlag" — der Code
  probiert es gar nicht erst.

`public/sw.js` behandelt AUSSCHLIESSLICH PWA-Updates (Cache-Purge, Version-
Check). Kein `self.addEventListener('push', …)`, kein
`showNotification()`-Aufruf.

### c) E-Mail

Suche nach E-Mail-Benachrichtigungen bei Like/Nachricht: **keine.** Keine
Ressource in `src/lib/mail*`, kein Resend-Import im Connect/Chat-Pfad,
keine Supabase-Auth-E-Mail-Trigger für Nicht-Auth-Ereignisse.

### d) Antwort auf die Kernfrage

**Bekommt B in der Praxis eine Benachrichtigung?**
👉 **Nein — nicht ohne dass die App bereits offen ist.**

Solange B die App zu hat (Tab geschlossen, Browser im Hintergrund,
PWA nicht offen), erfährt B nichts. B muss die App zufällig öffnen —
dann triggert `AppShell` den Badge-Refresh und der Reiter „Matches"
zeigt eine 1.

Der einzige „Realtime"-Kanal ist Supabase-Realtime auf `messages`, aber
Supabase-Realtime läuft nur, während die App-Instanz einen offenen
WebSocket hat. Kein OS-Push, keine E-Mail, kein Web-Push.

---

## 4. Fehlerfälle

| Fall | Verhalten im Code | Bewertung |
|---|---|---|
| Zweimal dieselbe Anfrage | Upsert mit `onConflict: "from_user_id,to_user_id"` (`BrowsePeople.tsx:103`) | **sauber** — idempotent |
| Beide senden gleichzeitig | Beide `connect()`-Aufrufe finden beim Reverse-Check ihr eigenes Like schon in der DB und rufen `ensureMatch()` auf. `ensureMatch` (`matchmaking.ts:14–26`) macht `SELECT … maybeSingle()` gefolgt von `INSERT` — kein Upsert. Zwischen dem SELECT und dem INSERT kann eine echte Race passieren. Fällt der zweite INSERT durch, bekommt der Aufrufer `null` zurück und die UI zeigt keinen Match-Erfolg. Ob ein Unique-Constraint auf `(user1_id, user2_id)` existiert, hängt an `public.matches` (`web.matches (LIKE … INCLUDING ALL)`) — konnte ich per REST nicht direkt prüfen (**unklar**). Best-case: Unique-Constraint fängt es ab, der zweite Aufrufer bekommt `null`; worst-case: doppelte Match-Zeile. | **unklar / unbehandelt** |
| Anfrage an blockierte / pausierte / gesperrte Person | `BrowsePeople.tsx:45–61` filtert diese Nutzer bereits aus der Discover-Liste raus. `DiscoverTab.tsx:105–139` ebenso. `SelectProfileBrowse.tsx:113` ebenso. **Aber** `FullProfile.tsx:106` (direkter Profil-Aufruf per Link) hat **keinen Guard** — ein Like landet trotzdem in der DB. Der Empfänger würde ihn auch sehen, wenn er nicht pausiert wäre. | **unbehandelt** für den direkten Profil-Pfad |
| Empfänger löscht sein Konto | RPC `web.delete_my_account()` in `web_schema.sql`. Cascades hängen an den FK-Definitionen der Ursprungstabellen (`public.likes/matches/messages`). Wenn dort `ON DELETE CASCADE` gesetzt ist (Standard bei diesem App-Muster), verschwinden alle Likes/Matches/Messages sauber. **Unklar** ohne direkten Blick in die Constraints. | **unklar** |
| Nachricht senden nach Unmatch | `web_messages_insert` prüft nur `web.is_my_match(match_id)`, was NICHT auf `is_active=true` filtert. Ein Match auf `is_active=false` ist also technisch immer noch „meins" — die Policy lässt einen Insert durch. UI-seitig hat `ChatDetail.tsx:56` einen `active`-State, der das Send-Feld ausblendet, aber die Policy schützt nicht davor. | **UI-seitig sauber, Policy-seitig unbehandelt** |
| Kein Netz beim Senden | `chat.ts:sendMessage` / `ChatDetail.tsx:185` sind `supabase.from("messages").insert(…)`-Aufrufe ohne Retry, ohne Outbox-Queue, ohne Optimistic-UI-Rollback. Der Aufrufer bekommt `error`, aber es gibt keinen sichtbaren Umgang damit im Code. `ChatDetail` fängt den Return-Wert nicht auf — die Nachricht wäre still verloren. | **kritisch unbehandelt** |

---

## 5. Datenschutz

- **`select("*")` auf `profiles` im Verbinden-/Chat-Pfad**:
  | Datei:Zeile | Kontext |
  |---|---|
  | `src/lib/auth.tsx:87–92` | eigenes Profil beim Laden — `id = own`, kein Fremdleak |
  | `src/app/app/components/AppGuard.tsx:57` | eigenes Profil |
  | `src/app/app/components/tabs/ProfileTab.tsx:53, 59` | eigenes Profil |
  | `src/app/app/components/tabs/LikesTab.tsx:33` | **`profiles!likes_from_user_id_fkey(*)` — ALLE Spalten des Absenders werden an den Empfänger geliefert** |
  | `src/app/app/components/tabs/MatchesList.tsx:34–36` | begrenzt (`id, display_name, first_name, profile_image, last_active`) ✓ |
  | `src/app/app/components/subviews/ChatDetail.tsx:86` | **`user1:profiles!(*), user2:profiles!(*)` — ALLE Spalten beider Partner** |
  | `src/app/app/components/subviews/FullProfile.tsx:124` | Match-Objekt mit `*` — dasselbe |
  Sensible Felder, die dadurch mitgeliefert werden: `is_banned`, `is_seed`,
  `report_count`, `matches_rated`, `match_score`, `push_matches`,
  `push_messages`, `visibility_gender/age_*`. **Der frühere `fcm_token`-Leak
  besteht seit dem Sicherheits-Audit 2026-08 nicht mehr**, weil das Feld nach
  `profiles_private` verschoben wurde (per REST verifiziert). Trotzdem
  werden mehr Felder ausgeliefert, als die UI je anzeigt.

- **Werden in Anfragen/Chatlisten mehr Profildaten geladen als angezeigt?**
  Ja — siehe oben. `LikesTab`, `ChatDetail` und `FullProfile` laden mit `*`
  alle profile-Spalten des Gegenübers.

- **Sieht der Absender, ob und wann seine Nachricht gelesen wurde?**
  Ja, technisch: die Spalten `is_read` und `read_at` werden vom Empfänger
  gesetzt (`chat.ts:markRead`), und Absender-A liest `messages.*` mit allen
  Spalten (Realtime + `select("*")` in `ChatDetail.tsx:98`). Ob das im
  aktuellen UI visualisiert wird (Häkchen, Zeitstempel), habe ich per grep
  nicht eindeutig sehen können — **unklar**. Wenn nicht, ist die Information
  im Client-JSON und über DevTools lesbar. Ob das beabsichtigt ist, kann nur
  der Auftraggeber entscheiden.

---

## 6. Testanleitung für den Auftraggeber

**Was du brauchst:** zwei Testkonten (verschiedene E-Mail-Adressen), zwei
Geräte oder zwei Browser mit separaten Sessions (z. B. ein normales Fenster
und ein Inkognito-Fenster).

1. **Melde dich als Konto A** auf https://matchup-app.com/app an.
2. Öffne im Tab „Discover" ein anderes Profil (Konto B) und klicke auf
   **„Verbinden"**. Der Knopf sollte sich in „Angefragt ✓" ändern.
3. **Öffne im zweiten Fenster/Gerät die App** und melde dich als **Konto B**
   an.
4. Ohne die App neu zu laden, wechsle unten auf den Reiter **„Matches"**.
   Am Symbol sollte eine kleine Zahl „1" stehen. Wenn nicht, tippe einmal
   auf den Reiter — die Zahl erscheint spätestens jetzt.
5. Im Matches-Reiter erscheint ganz oben ein Bereich **„offene Anfragen"**
   mit dem Bild von Konto A. Klicke dort auf „Annehmen" (Häkchen).
   *→ Wenn Konto B die Anfrage nicht sieht, ist die Kette gebrochen.*
6. Konto A: aktualisiere die Seite. Der Match sollte jetzt in Matches
   auftauchen. Falls die App ein „Match!"-Popup zeigt, ist das ein Bonus,
   aber nicht Pflicht.
7. **Öffne den Chat** von Konto A → tippe eine Nachricht („Test 1") →
   Senden.
8. Auf Konto B sollte die Nachricht **innerhalb einer Sekunde erscheinen**,
   sofern Konto B den Chat gerade offen hat.
   *→ Kommt sie nicht: Realtime bricht. Prüfe die Netzwerkverbindung.*
9. Wenn Konto B nur die Chat-Liste (nicht den Chat selbst) offen hat: die
   Vorschau der letzten Nachricht und der Ungelesen-Zähler sollten sich
   ebenfalls sofort aktualisieren.
10. **Wichtig:** schließe die App bei Konto B komplett (Tab zu). Sende von
    Konto A eine weitere Nachricht. Öffne Konto B **eine Stunde später**
    wieder. **Erwartung nach dem heutigen Stand:** Konto B bekommt KEINE
    Push-Nachricht und KEINE E-Mail — die neue Nachricht sieht er erst,
    wenn er die App wieder öffnet.
11. Öffne den Chat bei Konto B → Ungelesen-Zähler springt auf 0.
12. Optional — teste den Fehlerfall: Ziehe kurz den Netzstecker (oder
    Flugmodus an) → tippe eine Nachricht → Senden. **Erwartung:** die
    Nachricht wird ohne sichtbare Fehlermeldung „geschluckt" — sie
    erscheint zwar kurz in der eigenen Ansicht, ist aber nach dem Neuladen
    weg. Ist ein bekanntes Loch (siehe Befund §7).

Falls Schritt **4 oder 5 scheitert** (Konto B sieht die Anfrage nicht),
öffne die Browser-DevTools → Netzwerk-Reiter und prüfe die Antwort auf
`GET .../rest/v1/likes?...&to_user_id=eq.<UUID von B>`. Wenn dort ein
`403` steht, ist RLS das Problem; wenn `200` mit leerer Liste, hat
Konto A gar keinen Like geschrieben.

---

## 7. Befund (sortiert nach Schwere)

### KRITISCH — die Kette funktioniert, aber ohne echte Benachrichtigung

1. **Push ist nicht implementiert.** `profiles_private.fcm_token` wird
   nirgendwo im Web-Code geschrieben; es gibt keine Edge Function, keinen
   Trigger, keinen Web-Push-Handler in `public/sw.js`. Ergebnis: **Empfänger
   erfahren von einer neuen Anfrage oder Nachricht nur, wenn sie die App
   zufällig öffnen.** Zu tun: Web-Push-Token-Registrierung + Sender-Pfad
   (Supabase Edge Function oder Server Action mit VAPID / FCM) plus SW-Push-
   Handler; alternativ E-Mail-Rückfall über Resend, wenn Push abgelehnt.
   Datei-Anker: `src/lib/auth.tsx:135–147` (Sign-Out setzt Token → nur
   halber Pfad); `public/sw.js` (aktuell nur PWA-Update); Spalten in
   `web.profiles_private` liegen bereit.

2. **Kein Realtime auf `likes`.** B erfährt selbst mit offener App nicht in
   Echtzeit von einer eingehenden Anfrage — der Zähler aktualisiert nur bei
   Tab-Wechsel (`AppShell.tsx:273–275`) oder Seiten-Reload. Zu tun: analog
   zu `MatchesList.tsx:74` ein `postgres_changes`-Abo auf
   `web.likes filter=to_user_id=eq.${me}` in AppShell, das
   `refreshBadges()` triggert.

3. **Nachrichten-Versand ohne Netz geht still verloren.**
   `ChatDetail.tsx:185` / `chat.ts:sendMessage` prüft den Rückgabewert des
   Supabase-Inserts nicht, es gibt keinen Retry und keine Outbox. Der Nutzer
   glaubt die Nachricht sei raus. Zu tun: Return `error` prüfen, bei Fehler
   optimistische Zeile mit „nochmal versuchen"-Zustand markieren, im
   Idealfall eine kleine lokale Queue (indexedDB) mit erneutem Versand
   sobald `navigator.onLine`.

### WICHTIG — funktioniert, aber unsicher/unzuverlässig

4. **`likes.SELECT using(true)`** — jede/r eingeloggte Nutzer/in kann JEDE
   Like-Zeile lesen, nicht nur die eigenen empfangenen. `blocks.SELECT
   using(true)` genauso: das Netzwerk aller Blockierungen ist öffentlich
   einsehbar. Zu tun in Anschluss-Etappe: `likes_sel` auf
   `(from_user_id = auth.uid() OR to_user_id = auth.uid())` einschränken,
   `blocks_sel` auf `(blocker_id = auth.uid() OR blocked_id = auth.uid())`.
   Datei: `supabase/web_security_hardening_2.sql:47` (do-Block).

5. **`web_messages_update using (is_my_match)`** ist zu weit. Erlaubt beiden
   Match-Partnern beliebige Änderungen am Inhalt fremder Nachrichten (nicht
   nur `is_read`/`read_at`). Zu tun: eigene Policy für den Lese-Flag
   (`is_read`, `read_at` — via `USING (is_my_match AND sender_id !=
   auth.uid())` und `WITH CHECK` derselbe) plus separate Policy nur für
   `sender_id = auth.uid()` für andere Felder. Datei:
   `supabase/web_security_hardening.sql:68`.

6. **`messages.INSERT` ohne `is_active`-Check.** Nach einem Unmatch (Match
   auf `is_active=false`) verhindert die UI zwar den Versand, aber die
   Policy erlaubt ihn weiter. Zu tun: `web.is_my_match(match_id)` um
   `AND is_active` erweitern, oder eine zweite Prüfung im INSERT-`with
   check`. Datei: `supabase/web_security_hardening.sql:52–67`.

7. **`profiles!(*)`-Joins im Client leaken 30+ Spalten** (u. a.
   `is_banned`, `report_count`, `is_seed`, `matches_rated`, `match_score`,
   `visibility_*`, `push_*`) an den anderen Nutzer. Zu tun: alle
   `profiles!(...)`-Selects im Verbinden-/Chat-Pfad auf explizite Spalten
   umstellen (`id, first_name, display_name, profile_image, last_active,
   age, gender, sports, skill_level, city, country`). Betroffen:
   `LikesTab.tsx:33`, `ChatDetail.tsx:86`, `FullProfile.tsx:124`.

8. **`ensureMatch`-Race** bei gleichzeitigem beiderseitigem Like. `SELECT →
   INSERT` ohne Upsert. Zu tun: `matches.upsert({user1_id, user2_id,
   is_active: true}, { onConflict: "user1_id,user2_id" })` — funktioniert
   nur, wenn ein Unique-Constraint auf `(user1_id, user2_id)` existiert
   (**unklar**, siehe §4). Vorher Constraint verifizieren, ggf. anlegen.
   Datei: `src/lib/matchmaking.ts:14–26`.

9. **`FullProfile.tsx:106 connect()` prüft weder Block noch Pause noch
   Bann.** Direktes Aufrufen eines Profils per Link erlaubt einem Nutzer,
   auch pausierten oder blockierten Personen ein Like zu schicken. Zu tun:
   dieselben Guards wie in `BrowsePeople` (blocks-Check + `is_paused,
   is_banned` prüfen) vor dem Insert.

### KLEIN — Schönheit / Wartbarkeit

10. **`auth.tsx:87 select("*")` auf eigenes Profil.** Kein Leak (eigene
    Zeile), aber schleift `is_banned`, `report_count`, `match_score` etc.
    unnötig durch den Client. Zu tun: auf konkrete Spaltenliste umstellen.

11. **Zwei Nachrichten-Sender-Funktionen mit derselben Signatur** —
    `chat.ts:sendMessage` und `tour.ts:88 sendMessage` (Team-Owner-Chat).
    Erhöht die Verwechslungsgefahr in Suchen und ist ein
    Refactoring-Kandidat. Kein akutes Problem.

12. **`Settings.tsx` bietet Schalter `push_matches` und `push_messages`**,
    obwohl kein Sender-Pfad sie liest — für den Nutzer eine Lüge. Zu tun:
    entweder Push implementieren (siehe KRITISCH #1) oder die Schalter
    ausblenden, bis er echt wirkt.

13. **Read-Receipts sind im DB-Modell (`messages.read_at`) vorhanden**,
    ob das UI sie darstellt, war per grep nicht eindeutig — **unklar**.
    Wenn sie nicht angezeigt werden, ist die Info trotzdem für den
    Absender im Client-JSON lesbar (`chat.ts:16 select("*")`). Entweder
    bewusst nutzen (Häkchen) oder Server-seitig raus-filtern.

---

*Diagnose abgeschlossen. Keine Änderungen an Produktivcode. Einzige neue
Datei: dieses Dokument.*
