// Alcaraz-Setup-Seite (/shop/setup/alcaraz) — DE + EN zusammen gepflegt.
// Werte 1:1 aus ~/Downloads/alcaraz-setup.md (Stand Aug 2026). Nichts erfunden.
// Spezifikationen als mehrzeilige Strings „Label · Wert" (die Komponente splittet
// an "\n" und " · "), damit DE/EN vollständig übersetzt sind.
export const alcaraz = {
  de: {
    eyebrow: "Matchup Shop · Pro-Setup",
    title: "Das Setup von Carlos Alcaraz",
    intro:
      "Alcaraz' Equipment ist überraschend unspektakulär: ein fast serienmäßiger Babolat Pure Aero 98, nur 5 g extra am Schaft. Realistisch nachbaubar.",
    priceStand: "Preise als Richtwerte, Stand August 2026 — sie ändern sich saisonal.",
    buyway: "Kaufweg: der Warenkorb dieses Shops (Demo).",

    coreBadge: "Kern",
    coreTitle: "Die drei Dinge, die zählen",
    coreNote:
      "Schläger, Saite, Overgrip — das ist der eigentliche Kauf, rund 90 % des Setups. Der Rest ist Kosmetik.",
    cosmeticTitle: "Schuhe",

    addOne: "In den Warenkorb",
    addAll: "Komplettes Setup in den Warenkorb",
    priceOnRequest: "Preis auf Anfrage",

    // Kategorie-Labels
    cat_tennis: "Schläger",
    cat_gear: "Zubehör",
    cat_apparel: "Schuhe",

    // Preis-Etiketten
    price_racket: "ca. 217–300 €",
    price_string: "ca. 13 € (12-m-Set)",
    price_overgrip: "ca. 10 € (3er) · 28,95 € (12er)",
    price_shoe_hard: "169,99 €",
    price_shoe_hyper: "179,99 €",
    price_shoe_prm: "118,99 € statt 169,99 € (−30 %)",

    // Kompakte Datenzeile auf der Karte (Shop-Stil, wie „300g · 100in² · 16×19")
    sub_racket: "98 in² · 305 g · 16×20 · L4",
    sub_string: "1,30 mm · schwarz · voller Bezug",
    sub_overgrip: "0,4 mm · weiss",
    sub_basisgriff: "Leder · unter dem Overgrip",
    sub_shoe_hard: "Hartplatz · Herren",
    sub_shoe_hyper: "Hartplatz · Herren",
    sub_shoe_prm: "Sandplatz · Herren",
    sub_bag: "12 Schläger · 85 L · 3 Fächer",
    techTitle: "Technische Daten",
    setupPart: "Teil von Alcaraz’ Setup",
    backToSetup: "Zum Alcaraz-Setup",
    shoe_sale_note: "Aktionspreis — Aktionen laufen aus. Stand August 2026.",

    // Spezifikationen
    racket_specs:
      "Kopfgröße · 98 in² (632 cm²)\nGewicht (Retail) · 305 g\nAlcaraz-Custom · +5 g Bleiband → 307 g\nBesaitungsbild · 16 × 20\nProfil · 21-23-21 mm\nLänge · 685 mm / 27\"\nGriffgröße · L4\nBalance · ca. 6 pts kopflastig\nSwingweight · sub-325\nSteifigkeit · RA 66 (Gen9)",
    string_specs:
      "Saite · Babolat RPM Team\nStärke · 1,30 mm (16 gauge)\nFarbe · Schwarz\nAufbau · Voller Bezug – kein Hybrid\nSpannung längs · 25 kg (55 lbs)\nSpannung quer · 23–24 kg (51–53 lbs)",
    overgrip_specs:
      "Modell · VS Original / VS Grip Original\nFarbe · Weiss\nDicke · 0,4 mm (dünnstes am Markt)",
    basisgriff_specs:
      "Typ · Leder-Basisgriffband (Natural)\nFunktion · Liegt unter dem Overgrip\nWirkung · Gewicht im Griff + direktes Feedback",
    shoe_hard_specs:
      "Modell · Nike Vapor 12\nEinsatz · Hartplatz\nPassform · Herren",
    shoe_hyper_specs:
      "Modell · Nike Vapor 12 Hypersmash\nEinsatz · Hartplatz\nPassform · Herren",
    shoe_prm_specs:
      "Modell · Nike Zoom Vapor 12 PRM\nEinsatz · Sandplatz\nPassform · Herren",
    bag_specs:
      "Modell · Babolat RH12 Pure Aero\nKapazität · 12 Schläger · 85 L\nFächer · 3 isolierte Fächer\nFarben · Metallic Grey / Black / Fluo Yellow",

    // Spannungswarnung — direkt an der Saiten-Karte (der ehrlichste Teil des Dokuments)
    tensionWarnTitle: "Wichtig — nicht die Tour-Spannung kopieren",
    tensionWarnText:
      "25 kg mit einer Poly ist für Amateurarme oft der direkte Weg zum Tennisarm. Starte bei 22–23 kg — oder besser ein Hybrid (RPM Team längs, Multifilament quer): gleicher Spin-Charakter, deutlich mehr Komfort.",

    // Unsicherheiten
    uncertaintiesTitle: "Unsicherheiten — ehrlich gekennzeichnet",
    unc_prostock:
      "Pro-Stock-Frage: Ob unter dem Paint Job der alte Pure-Aero-VS-2020-Mould steckt, ist eine Enthusiasten-Debatte. Es gibt kein offizielles Spec-Sheet seines Match-Rahmens.",
    unc_cross:
      "Quer-Spannung: Quellen nennen 23 oder 24 kg. Längs ~25 kg ist konsistent und für die Australian Open 2026 bestätigt.",
    unc_overgrip:
      "Overgrip: Match-Angabe (VS Original) vs. Händler-Bundle (Pro Tour 2.0 Comfort) — kleine Abweichung.",
    unc_damper:
      "Dämpfer: Die Mehrheit der Quellen sagt „keiner“; eine Minderheitsquelle behauptet einen Custom Damp.",

    // „Kein Dämpfer“ — Info, kein Artikel
    damperTitle: "Kein Dämpfer",
    damperText:
      "Alcaraz spielt ohne Vibrationsdämpfer — nichts zu kaufen. Steht hier bewusst als Information, nicht als Produkt.",
  },
  en: {
    eyebrow: "Matchup Shop · Pro setup",
    title: "Carlos Alcaraz's setup",
    intro:
      "Alcaraz's equipment is surprisingly unspectacular: an almost stock Babolat Pure Aero 98, just 5 g extra in the shaft. Realistic to replicate.",
    priceStand: "Prices are guide values, as of August 2026 — they change seasonally.",
    buyway: "How to buy: this shop's cart (demo).",

    coreBadge: "Core",
    coreTitle: "The three things that matter",
    coreNote:
      "Racket, string, overgrip — that's the actual purchase, about 90 % of the setup. The rest is cosmetics.",
    cosmeticTitle: "Shoes",

    addOne: "Add to cart",
    addAll: "Add the full setup to cart",
    priceOnRequest: "Price on request",

    cat_tennis: "Racket",
    cat_gear: "Accessories",
    cat_apparel: "Shoes",

    price_racket: "approx. €217–300",
    price_string: "approx. €13 (12 m set)",
    price_overgrip: "approx. €10 (3-pack) · €28.95 (12-pack)",
    price_shoe_hard: "€169.99",
    price_shoe_hyper: "€179.99",
    price_shoe_prm: "€118.99 instead of €169.99 (−30%)",

    // Compact data line on the card (shop style, like "300g · 100in² · 16×19")
    sub_racket: "98 in² · 305 g · 16×20 · L4",
    sub_string: "1.30 mm · black · full bed",
    sub_overgrip: "0.4 mm · white",
    sub_basisgriff: "Leather · under the overgrip",
    sub_shoe_hard: "Hard court · men",
    sub_shoe_hyper: "Hard court · men",
    sub_shoe_prm: "Clay court · men",
    sub_bag: "12 rackets · 85 L · 3 compartments",
    techTitle: "Technical data",
    setupPart: "Part of Alcaraz’s setup",
    backToSetup: "Back to the Alcaraz setup",
    shoe_sale_note: "Sale price — promotions end. As of August 2026.",

    racket_specs:
      "Head size · 98 in² (632 cm²)\nWeight (retail) · 305 g\nAlcaraz custom · +5 g lead tape → 307 g\nString pattern · 16 × 20\nBeam · 21-23-21 mm\nLength · 685 mm / 27\"\nGrip size · L4\nBalance · approx. 6 pts head-light\nSwingweight · sub-325\nStiffness · RA 66 (Gen9)",
    string_specs:
      "String · Babolat RPM Team\nGauge · 1.30 mm (16 gauge)\nColour · Black\nBuild · Full bed – no hybrid\nTension main · 25 kg (55 lbs)\nTension cross · 23–24 kg (51–53 lbs)",
    overgrip_specs:
      "Model · VS Original / VS Grip Original\nColour · White\nThickness · 0.4 mm (thinnest on the market)",
    basisgriff_specs:
      "Type · Leather base grip (natural)\nFunction · Sits under the overgrip\nEffect · Weight in the handle + direct feedback",
    shoe_hard_specs:
      "Model · Nike Vapor 12\nUse · Hard court\nFit · Men",
    shoe_hyper_specs:
      "Model · Nike Vapor 12 Hypersmash\nUse · Hard court\nFit · Men",
    shoe_prm_specs:
      "Model · Nike Zoom Vapor 12 PRM\nUse · Clay court\nFit · Men",
    bag_specs:
      "Model · Babolat RH12 Pure Aero\nCapacity · 12 rackets · 85 L\nCompartments · 3 insulated compartments\nColours · Metallic Grey / Black / Fluo Yellow",

    tensionWarnTitle: "Important — don't copy the tour tension",
    tensionWarnText:
      "25 kg with a poly is often the direct route to tennis elbow for amateur arms. Start at 22–23 kg — or better a hybrid (RPM Team mains, multifilament crosses): same spin character, far more comfort.",

    uncertaintiesTitle: "Uncertainties — honestly flagged",
    unc_prostock:
      "Pro-stock question: whether the old Pure Aero VS 2020 mould hides under the paint job is an enthusiast debate. There is no official spec sheet for his match frame.",
    unc_cross:
      "Cross tension: sources say 23 or 24 kg. Mains at ~25 kg are consistent and confirmed for the 2026 Australian Open.",
    unc_overgrip:
      "Overgrip: match spec (VS Original) vs. retailer bundle (Pro Tour 2.0 Comfort) — a small discrepancy.",
    unc_damper:
      "Dampener: the majority of sources say “none”; a minority source claims a custom damp.",

    damperTitle: "No dampener",
    damperText:
      "Alcaraz plays without a vibration dampener — nothing to buy. Shown here deliberately as information, not as a product.",
  },
};
