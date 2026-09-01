-- Sicherheitsaudit 09/2026 — DB-Härtung (siehe Report).
-- Alles nur restriktiver; funktional neutral für legitime App-Flows.

-- 1) messages: Reaktionen + Lesestatus dürfen beide Match-Partner setzen (UPDATE-Policy
--    = is_my_match). Damit ein Partner NICHT den Inhalt/die Metadaten der FREMDEN
--    Nachricht fälschen kann, verbietet dieser Trigger das Ändern von content/sender_id/
--    match_id/created_at/client_message_id/edited_at an Zeilen, deren Absender man nicht ist.
--    Eigene Nachrichten (auth.uid() = sender) und Service-Role (auth.uid() null) sind frei.
create or replace function web.protect_message_content()
returns trigger language plpgsql security definer set search_path = web as $$
begin
  if auth.uid() is not null and auth.uid() is distinct from old.sender_id then
    if new.content is distinct from old.content
       or new.sender_id is distinct from old.sender_id
       or new.match_id is distinct from old.match_id
       or new.created_at is distinct from old.created_at
       or new.client_message_id is distinct from old.client_message_id
       or new.edited_at is distinct from old.edited_at then
      raise exception 'Nur der Absender darf Inhalt/Metadaten seiner Nachricht ändern';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_message_content on web.messages;
create trigger trg_protect_message_content before update on web.messages
  for each row execute function web.protect_message_content();

-- 2) tour_training_slot: SELECT war für anon (unangemeldet) offen (using true). Auf
--    authenticated einschränken — angemeldete Spieler sehen weiterhin alle Slots.
drop policy if exists tour_training_slot_read on web.tour_training_slot;
create policy tour_training_slot_read on web.tour_training_slot
  for select to authenticated using (true);

-- 3) anon-Grants auf personenbezogenen Tabellen entfernen (Defense-in-Depth). Diese
--    Tabellen haben KEINE anon-Policy, RLS verweigert anon also ohnehin — der Grant war
--    nur unsauber. Öffentliche Verzeichnisse (clubs/events/news/service_providers/
--    provider_reviews/tournaments/venues/waitlist) behalten ihren anon-Zugriff.
revoke all on
  web.messages, web.matches, web.likes, web.blocks, web.skips,
  web.reports, web.support_messages, web.support_tickets, web.warnings,
  web.group_messages, web.group_members
from anon;

notify pgrst, 'reload schema';
