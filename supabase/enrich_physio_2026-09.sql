-- Physio-Anreicherung (verifiziert, direkt von den Anbieterseiten via WebFetch; 09/2026).
-- Bereits auf Prod angewandt (Mgmt-API). CH-Physio ist meist Tarif/Kasse-basiert → Preise selten publiziert.
-- Preis NUR wo Praxis eine Selbstzahler-Rate publiziert (Physio Sports 85, Team Phoenix 60, Physiocap Genf 65).
-- Sonst Telefon/Kontakt gefüllt (coalesce = nur wenn leer). source='editorial' schützt vor Directory-Sync.
-- Nicht erreichbar/kein Preis: Court Care Barcelona (SSL), Physio Gstaad (DNS), Medbase/Schulthess (Grossklinik).

