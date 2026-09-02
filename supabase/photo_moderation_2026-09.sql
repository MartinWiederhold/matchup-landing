-- Paket 3: Foto-Moderation. Admin kann ein Profil pausieren mit der Auflage „echtes
-- Foto hochladen". Das Flag pause_requires_photo darf der Nutzer NICHT selbst löschen
-- (sonst wäre die Auflage umgehbar) — nur Service-Role (Admin bzw. die Freischalt-Route
-- nach echtem Foto-Upload) setzt/löscht es. is_paused bleibt user-seitig (Self-Pause).
alter table web.profiles add column if not exists pause_requires_photo boolean not null default false;

-- Guard-Trigger erweitern: pause_requires_photo für authenticated/anon einfrieren
-- (Rest unverändert). Service-Role & SECURITY-DEFINER umgehen den current_user-Zweig.
create or replace function web.guard_profile_cols()
returns trigger language plpgsql as $function$
begin
  if current_user in ('authenticated','anon') then
    if tg_op = 'UPDATE' then
      new.is_verified          := old.is_verified;
      new.is_banned            := old.is_banned;
      new.match_score          := old.match_score;
      new.matches_rated        := old.matches_rated;
      new.is_seed              := old.is_seed;
      new.pause_requires_photo := old.pause_requires_photo;
    else
      new.is_verified          := false;
      new.is_banned            := false;
      new.match_score          := coalesce(new.match_score, 1000);
      new.matches_rated        := 0;
      new.is_seed              := false;
      new.pause_requires_photo := false;
    end if;
  end if;
  return new;
end $function$;

notify pgrst, 'reload schema';
