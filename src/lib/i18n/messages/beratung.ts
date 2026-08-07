export const beratung = {
  de: {
    // ── Tabs ───────────────────────────────────────────────────────────
    tabGeneral: "Beratung allgemein",
    tabStringing: "Bespannung",
    tabFinder: "Schläger-Finder",

    // ── Schläger-Finder ────────────────────────────────────────────────
    finderIntro: "Beantworte ein paar Fragen — wir empfehlen dir passende Schläger und erklären warum.",
    finderStart: "Los geht's",
    finderStep: "Frage {n} von {total}",
    finderBack: "Zurück",
    finderDontKnow: "Weiss ich nicht",
    finderShowResults: "Empfehlungen zeigen",
    finderRestart: "Neu starten",
    finderResultTitle: "Deine Empfehlungen",
    finderResultSub: "Auf Basis deiner Angaben — sortiert nach Passung.",
    finderMatch: "Passung",
    finderConfidence: "Datensicherheit",
    finderWhy: "Warum passend",
    finderWatch: "Darauf achten",
    finderExcludedNote: "{n} Rahmen wurden als ungeeignet für dein Profil ausgeschlossen.",
    psTitle: "Bevor du den Schläger wechselst",
    psFirstTry: "Zuerst günstig probieren",
    psThenConsider: "Erst danach: Ausrüstung anpassen",
    psMedical: "Kein medizinischer Rat — bei anhaltenden Arm-/Schulterbeschwerden ärztlichen bzw. physiotherapeutischen Rat einholen.",
    compareShow: "Top 3 vergleichen",
    compareHide: "Vergleich ausblenden",
    compareTitle: "Deine Top 3 im Vergleich",
    spec_headSize: "Kopfgrösse", spec_weight: "Gewicht", spec_stiffness: "Steifigkeit (RA)", spec_pattern: "Besaitungsbild",
    finderDemoNote: "Demo-Daten: Spezifikationen aus öffentlichen Herstellerangaben, Charakter-Bewertung redaktionell geschätzt. Keine Kaufberatung, keine medizinische Beratung.",
    finderMethodikLink: "Wie entstehen diese Empfehlungen?",
    // Methodik-Seite
    methodikTitle: "Wie wir beraten",
    methodikSub: "Transparenz statt Werbetext — so entstehen unsere Empfehlungen.",
    m1Title: "Nachvollziehbare Regeln, kein Zufall",
    m1Body: "Die Empfehlungen berechnet eine feste, versionierte Regel-Logik aus deinen Antworten und strukturierten Produktdaten — kein Black-Box-Algorithmus. Gleiche Angaben ergeben immer dasselbe Ergebnis. Aus deinen Antworten leiten wir Prioritäten (z.B. Kontrolle, Komfort, Spin) ab, gewichten die Eigenschaften jedes Schlägers und ziehen Punkte ab, wo es Zielkonflikte oder Unsicherheiten gibt.",
    m2Title: "Passung und Datensicherheit sind zwei Dinge",
    m2Body: "Der Match-Wert sagt, wie gut ein Modell zu deinen Prioritäten passt. Die Datensicherheit sagt, wie belastbar die zugrunde liegenden Daten sind. Beide zeigen wir getrennt — ein hoher Match auf dünner Datenbasis ist bewusst nicht dasselbe wie ein hoher Match auf gesicherten Angaben.",
    m3Title: "Datenquellen & Ehrlichkeit",
    m3Body: "Technische Spezifikationen stammen aus öffentlichen Herstellerangaben. Die Charakter-Bewertungen (Power, Kontrolle …) sind aktuell redaktionelle Einschätzungen und als Demo markiert — keine Laborwerte. Saitenspannung geben wir immer als Bereich an, nie als fixe Zahl. Wir erfinden keine Produkt- oder Profi-Daten.",
    m4Title: "Was wir nicht tun",
    m4Body: "Keine Kaufberatung um jeden Preis: risikoarme Tipps (Spannung, Saite, Technik) kommen vor einem Neukauf. Verkaufszahlen oder Popularität verzerren die Bewertung nicht. Und Gesundheitshinweise sind keine medizinische Diagnose — bei Beschwerden bitte fachlichen Rat einholen.",
    methodikVersion: "Regel-Version: {v} · Datenstand: Demo",
    methodikBack: "Zurück zur Beratung",
    conf_high: "hoch", conf_medium: "mittel", conf_low: "niedrig",
    // Achsen-Labels
    axis_power: "Power", axis_control: "Kontrolle", axis_spin: "Spin", axis_comfort: "Komfort",
    axis_stability: "Stabilität", axis_maneuverability: "Handlichkeit", axis_forgiveness: "Fehlerverzeihung",
    axis_durability: "Haltbarkeit", axis_tensionMaintenance: "Spannungshaltung", axis_feel: "Gefühl",
    // Saiten-/Spannungs-Sektion
    stringSectionTitle: "Passende Besaitung",
    stringSectionSub: "Auf Basis deiner Angaben — Saite und Spannung als Startpunkt.",
    tensionLabel: "Empfohlene Spannung",
    tensionRange: "{min}–{max} kg",
    stringDisclaimer: "Spannung ist ein Startbereich, kein fixer Wert — vom Belag, Ballgefühl und Besaiter abhängig. Kein medizinischer Rat: bei Arm-/Schulterbeschwerden fachlichen Rat einholen.",
    mat_polyester: "Polyester", mat_multifilament: "Multifilament", mat_natural_gut: "Naturdarm", mat_synthetic_gut: "Synthetikdarm",
    // Fragen + Optionen
    q_level: "Wie schätzt du dein Spielniveau ein?",
    q_level_beginner: "Anfänger", q_level_intermediate: "Fortgeschritten", q_level_advanced: "Erfahren", q_level_competitive: "Turnier/Wettkampf",
    q_swing: "Wie schwingst du?",
    q_swing_compact: "Kurz & kompakt", q_swing_moderate: "Mittel", q_swing_full: "Voll & lang",
    q_goal: "Was ist dir am wichtigsten?",
    q_goal_power: "Mehr Power", q_goal_control: "Mehr Kontrolle", q_goal_spin: "Mehr Spin", q_goal_comfort: "Komfort/armschonend", q_goal_allround: "Ausgewogen",
    q_playstyle: "Wie spielst du am liebsten?",
    q_playstyle_baseline: "Von der Grundlinie", q_playstyle_allcourt: "Allcourt", q_playstyle_servevolley: "Serve & Volley", q_playstyle_defensive: "Defensiv/läuferisch",
    q_arm: "Hast du empfindliche Arme/Schulter?",
    q_arm_none: "Nein", q_arm_some: "Etwas", q_arm_high: "Ja, empfindlich",
    q_problem: "Grösstes Problem mit deinem aktuellen Schläger?",
    q_problem_none: "Kein bestimmtes", q_problem_flies_long: "Bälle fliegen zu lang", q_problem_no_control: "Zu wenig Kontrolle", q_problem_arm_pain: "Armschmerzen", q_problem_too_heavy: "Zu schwer/träge", q_problem_no_spin: "Zu wenig Spin",

    // ── Page (Hero + Inhalt) ───────────────────────────────────────────
    heroAlt: "Beratung",
    heroEyebrow: "Persönliche Beratung",
    heroTitle: "Finde dein perfektes Setup",
    heroSubtitle:
      "Individuelle Schlägerberatung oder die Bespannung deiner Stars — wähle, was du brauchst.",
    privacyNote:
      "Deine Angaben werden vertraulich behandelt und ausschließlich zur persönlichen Beratung verwendet.",
    block1Title: "Welcher Sport passt zu dir?",
    block1Text:
      "Tennis, Padel oder Pickleball — jede Sportart hat ihren eigenen Reiz. Wir helfen dir herauszufinden, welche am besten zu deinem Spielstil, deiner Fitness und deinen Zielen passt.",
    block2Title: "Der richtige Schläger",
    block2Text:
      "Gewicht, Balance, Bespannung, Griffstärke — die Wahl des richtigen Schlägers macht den Unterschied. Basierend auf deinem Level und Spielstil geben wir individuelle Empfehlungen.",
    block3Title: "Training & Coaching",
    block3Text:
      "Finde Coaches, Trainingsgruppen und Kursangebote in deiner Nähe. Ob Anfänger-Kurs oder Intensiv-Training — wir verbinden dich mit den richtigen Leuten.",

    // ── Wizard: Kopf / Navigation ──────────────────────────────────────
    wizardTitle: "Persönliche Schlägerberatung",
    requestSent: "Anfrage gesendet",
    stepOf: "Schritt {current} von {total} · {label}",
    closeAria: "Schließen",
    thanks: "Danke, {name}!",
    doneText:
      "Wir haben deine Anfrage erhalten und melden uns innerhalb von 24 Stunden mit einer persönlichen Schläger-Empfehlung bei dir.",
    newRequest: "Neue Anfrage",
    btnBack: "Zurück",
    btnNext: "Weiter",
    btnSend: "Anfrage senden",

    // Wizard: Schritt-Titel
    stepProfile: "Sport & Profil",
    stepStyle: "Spielstil",
    stepRacket: "Schläger & Saite",
    stepBody: "Körper",
    stepBudget: "Bedarf & Budget",
    stepContact: "Kontakt & Abschluss",

    // Wizard: Validierung
    errRequired: "Bitte Vorname, Nachname und E-Mail ausfüllen.",
    errEmail: "Bitte eine gültige E-Mail-Adresse eingeben.",
    errConsent: "Bitte stimme der Verarbeitung deiner Angaben zu.",
    hintMulti: "Mehrfachauswahl möglich",

    // Schritt 1: Sport & Profil
    qSport: "Für welche Sportart suchst du Beratung?",
    optTennis: "Tennis",
    optPadel: "Padel",
    optPickleball: "Pickleball",
    qExperience: "Wie lange spielst du bereits?",
    optExpBeginner: "Anfänger (0–1 Jahr)",
    optExpHobby: "Hobbyspieler",
    optExpAdvanced: "Fortgeschritten",
    optExpTournament: "Turnierspieler",
    optExpCoach: "Coach / Trainer",
    qFrequency: "Wie oft spielst du?",
    optFreqMonth: "1× pro Monat",
    optFreqWeek: "1× pro Woche",
    optFreqWeek23: "2–3× pro Woche",
    optFreqWeek4: "4×+ pro Woche",
    qSurface: "Wo spielst du hauptsächlich?",
    optIndoor: "Indoor",
    optOutdoor: "Outdoor",
    optBoth: "Beides",
    qMatches: "Spielst du Matches / Turniere?",
    optYes: "Ja",
    optNo: "Nein",
    optOccasionally: "Gelegentlich",

    // Schritt 2: Spielstil
    qStyle: "Wie würdest du deinen Spielstil beschreiben?",
    optStyleDefensive: "Defensiv / kontrolliert",
    optStyleAllround: "Allround",
    optStyleAggressive: "Aggressiv / offensiv",
    optStyleSpin: "Viel Spin",
    optStyleFlat: "Flaches Spiel",
    optStyleNet: "Netzspieler / Volley",
    qPriorities: "Was ist dir am wichtigsten?",
    optPrioPower: "Mehr Power",
    optPrioControl: "Mehr Kontrolle",
    optPrioSpin: "Mehr Spin",
    optPrioComfort: "Mehr Komfort",
    optPrioStrain: "Weniger Belastung (Arm / Schulter)",
    optPrioPrecision: "Mehr Präzision",
    optPrioSweetspot: "Größerer Sweetspot",

    // Schritt 3: Schläger & Saite
    qCurBrand: "Aktuelle Marke",
    qCurModel: "Aktuelles Modell (optional)",
    qCurWeight: "Schlägergewicht (wenn bekannt)",
    qGrip: "Griffstärke (wenn bekannt)",
    optGripUnknown: "Weiß nicht",
    qString: "Aktuelle Saite",
    qTension: "Härte / Spannung (kg)",
    qRestring: "Wie oft bespannst du neu?",
    optRestringRare: "Sehr selten",
    optRestringMonths: "Alle paar Monate",
    optRestringRegular: "Regelmäßig",
    optRestringUnknown: "Weiß nicht",

    // Schritt 4: Körper
    qAge: "Alter",
    optAgeChild: "Kind (unter 12)",
    optAgeTeen: "Jugendlich (12–17)",
    optAgeAdult: "Erwachsen (18+)",
    qHeight: "Körpergröße (cm)",
    qWeight: "Gewicht (kg, optional)",
    qHand: "Dominante Hand",
    optHandRight: "Rechts",
    optHandLeft: "Links",

    // Schritt 5: Bedarf & Budget
    qIssues: "Hast du aktuell Beschwerden?",
    optIssueNone: "Keine",
    optIssueTennisElbow: "Tennisarm",
    optIssueWrist: "Handgelenk",
    optIssueShoulder: "Schulter",
    optIssueElbow: "Ellbogen",
    optIssueOther: "Sonstiges",
    qIssuesText: "Falls ja, bitte kurz beschreiben",
    qReason: "Warum möchtest du wechseln?",
    optReasonFit: "Mein Schläger passt nicht mehr",
    optReasonUpgrade: "Ich brauche ein Upgrade",
    optReasonPain: "Ich habe Schmerzen",
    optReasonImprove: "Ich möchte mein Spiel verbessern",
    optReasonOld: "Mein Schläger ist alt",
    optReasonFirst: "Ich suche meinen ersten Schläger",
    qBudget: "Welches Budget hast du?",
    optBudgetUnder100: "Unter 100 CHF",
    optBudget100: "100–180 CHF",
    optBudget180: "180–250 CHF",
    optBudget250: "250+ CHF",
    optBudgetOpen: "Offen für Empfehlung",

    // Schritt 6: Kontakt & Abschluss
    contactIntro:
      "Fast geschafft! Wohin dürfen wir deine persönliche Empfehlung schicken?",
    qFirstName: "Vorname *",
    qLastName: "Nachname *",
    qEmail: "E-Mail *",
    qPhone: "Telefon / WhatsApp (optional)",
    qNotes: "Gibt es noch etwas, das wir wissen sollten?",
    hintNotes: "z. B. Lieblingsmarken, No-Gos, Ziele, spezielle Wünsche",
    consent:
      "Ich bin damit einverstanden, dass meine Angaben zur persönlichen Beratung gespeichert und verarbeitet werden. *",

    // ── Bespannungs-Konfigurator ───────────────────────────────────────
    stringingTitle: "Spiele wie die Profis",
    stringingSubtitle:
      "Wähle das Setup deines Lieblingsspielers — wir zeigen dir die exakte Saite & Spannung und besaiten deinen Schläger genau so.",
    tourAtp: "Herren · ATP",
    tourWta: "Damen · WTA",
    own: "Eigenes",
    placeholderHint:
      "Tippe links auf einen Spieler — Saite, Spannung und Details erscheinen sofort hier.",

    // Setup-Detail
    yourSetup: "Dein perfektes Setup",
    rowString: "Saite",
    rowTension: "Spannung",
    rowBrand: "Schläger-Marke",
    priceIncludes: "inkl. Premium-Saite & Bespannung",
    orderWithSetup: "Mit diesem Setup bestellen →",
    alcarazShopCta: "Komplettes Alcaraz-Setup im Shop ansehen",

    // Bestell-Bestätigung
    orderCreated: "Besaitungs-Auftrag erstellt",
    orderConfirmPre: "Dein Schläger wird im ",
    orderConfirmPost: "-Setup besaitet:",
    orderShip:
      "Schick uns deinen Schläger ein — wir besaiten ihn exakt nach diesen Settings und schicken ihn spielfertig zurück.",
    chooseAnother: "Weiteres Setup wählen",

    // Eigenes-Setup-Anfrageformular
    reqError: "Bitte Name, E-Mail und dein Wunsch-Setup ausfüllen.",
    reqSent: "Anfrage gesendet, {name}!",
    reqSentText:
      "Wir melden uns mit einer Empfehlung zu deinem Wunsch-Setup „{wish}\" und einem passenden Angebot.",
    reqTitle: "Eigenes Setup anfragen",
    reqSubtitle:
      "Anderer Lieblingsspieler oder eigene Vorstellung? Sag uns, was du spielst — wir finden dein Setup.",
    reqName: "Name *",
    reqEmail: "E-Mail *",
    reqWish: "Wunsch-Setup / Spieler *",
    reqWishPlaceholder: "z. B. wie Rafael Nadal, oder: viel Spin & armschonend",
    reqNote: "Anmerkung (optional)",
    reqCancel: "Abbrechen",
    reqSend: "Anfrage senden",

    // Eigenschaften (Setup-Traits)
    traitAggressive: "Aggressiv",
    traitAllround: "Allround",
    traitArmFriendly: "Armschonend",
    traitServe: "Aufschlag",
    traitOneHandedBackhand: "Einhand-Rückhand",
    traitExtremeSpin: "Extremer Spin",
    traitFlatGame: "Flaches Spiel",
    traitEarlyGame: "Frühes Spiel",
    traitDurability: "Haltbarkeit",
    traitComfort: "Komfort",
    traitControl: "Kontrolle",
    traitMaxPower: "Maximale Power",
    traitMaxSpin: "Maximaler Spin",
    traitPower: "Power",
    traitPrecision: "Präzision",
    traitClay: "Sandplatz",
    traitSpeed: "Speed",
    traitSpin: "Spin",
    traitStopSlice: "Stop & Slice",
    traitPace: "Tempo",
    traitTopspin: "Topspin",
    traitTouchFeel: "Touch & Gefühl",
    traitTouch: "Touch",
    traitVariation: "Variation",

    // Spielanweisungen je Profi-Setup
    instr_alcaraz:
      "Voll-Polyester für aggressives Topspin-Spiel. Für fortgeschrittene Spieler mit langen, schnellen Schwüngen.",
    instr_sinner:
      "Glattes Polyester für flaches, druckvolles Spiel mit sauberer Kontrolle. Für hartes, frühes Spiel.",
    instr_zverev:
      "Weiches Polyester bei niedriger Spannung — viel Power und Armschonung bei stabiler Kontrolle.",
    instr_djokovic:
      "Hybrid für maximale Ballkontrolle bei hohem Komfort — für präzises, defensiv-stabiles Grundlinienspiel.",
    instr_medvedev:
      "Kontrolliertes Polyester für flaches, präzises Spiel von tief hinter der Grundlinie.",
    instr_fritz:
      "Kantiges Polyester für druckvolle Aufschläge und Spin. Für offensives, kraftvolles Spiel.",
    instr_ruud:
      "Komfortables Polyester mit viel Spin — ideal für drehungsreiches Grundlinienspiel, besonders auf Sand.",
    instr_rublev:
      "Robustes Polyester für volle Schläge mit Spin und Power. Für kompromisslos offensives Spiel.",
    instr_tsitsipas:
      "Tour-Klassiker aus Polyester für Spin und Kontrolle — perfekt für variantenreiches Allcourt-Spiel.",
    instr_dimitrov:
      "Hybrid aus Naturdarm und Polyester für elegantes, gefühlvolles Allround-Spiel mit viel Touch.",
    instr_federer:
      "Premium-Hybrid aus Naturdarm und Polyester — weiches, kontrolliertes Spielgefühl mit viel Touch am Netz.",
    instr_sabalenka:
      "Steifes Polyester bei hoher Spannung für kompromisslose Power und flache, harte Schläge. Für kräftiges, offensives Spiel.",
    instr_swiatek:
      "Dünnes, kantiges Polyester für massiven Topspin und Kontrolle bei hoher Spannung. Für drehungsreiches, aktives Grundlinienspiel.",
    instr_gauff:
      "Glattes Polyester für eine Mischung aus Spin und Speed — vielseitig für schnelles, athletisches Allcourt-Spiel.",
    instr_rybakina:
      "Komfortables Polyester mit gutem Ballspeed — ideal für druckvolle Aufschläge und flache, harte Grundschläge.",
    instr_pegula:
      "Kontrolliertes Polyester für früh genommene, präzise Bälle. Für taktisch sauberes Grundlinienspiel.",
    instr_zheng:
      "Tour-Klassiker aus Polyester für die Balance aus Power und Spin. Für kraftvolles, offensives Spiel.",
    instr_paolini:
      "Weiches Polyester für Spin und Tempo bei gutem Komfort — passend für schnelles, bewegliches Spiel.",
    instr_keys:
      "Halbweiches Polyester für enorme Power bei stabiler Kontrolle. Für aggressives, hart schlagendes Spiel.",
    instr_krejcikova:
      "Hybrid aus Naturdarm und Polyester für gefühlvolles, variantenreiches Spiel mit viel Touch.",
    instr_ostapenko:
      "Kontrolliertes Polyester für extrem flaches, frühes und kraftvolles Spiel. Für kompromisslose Offensive.",
    instr_jabeur:
      "Naturdarm-Hybrid für maximales Gefühl und Variation — perfekt für kreatives Spiel mit Stops, Slice und Winkeln.",
    instr_collins:
      "Polyester mit gutem Ballspeed für flaches, aggressives Spiel von der Grundlinie. Für offensive Spielerinnen.",
  },
  en: {
    // ── Tabs ───────────────────────────────────────────────────────────
    tabGeneral: "General advice",
    tabStringing: "Stringing",
    tabFinder: "Racket finder",

    // ── Racket finder ──────────────────────────────────────────────────
    finderIntro: "Answer a few questions — we'll recommend matching rackets and explain why.",
    finderStart: "Get started",
    finderStep: "Question {n} of {total}",
    finderBack: "Back",
    finderDontKnow: "Not sure",
    finderShowResults: "Show recommendations",
    finderRestart: "Start over",
    finderResultTitle: "Your recommendations",
    finderResultSub: "Based on your answers — sorted by fit.",
    finderMatch: "Match",
    finderConfidence: "Data confidence",
    finderWhy: "Why it fits",
    finderWatch: "Watch out for",
    finderExcludedNote: "{n} frames were excluded as unsuitable for your profile.",
    psTitle: "Before you switch rackets",
    psFirstTry: "Try these low-cost fixes first",
    psThenConsider: "Only then: adjust your equipment",
    psMedical: "Not medical advice — for persistent arm/shoulder issues, consult a doctor or physiotherapist.",
    compareShow: "Compare top 3",
    compareHide: "Hide comparison",
    compareTitle: "Your top 3 compared",
    spec_headSize: "Head size", spec_weight: "Weight", spec_stiffness: "Stiffness (RA)", spec_pattern: "String pattern",
    finderDemoNote: "Demo data: specs from public manufacturer figures, character ratings editorially estimated. Not purchase or medical advice.",
    finderMethodikLink: "How are these recommendations made?",
    methodikTitle: "How we advise",
    methodikSub: "Transparency over marketing copy — here's how our recommendations are made.",
    m1Title: "Traceable rules, not chance",
    m1Body: "Recommendations are computed by fixed, versioned rule logic from your answers and structured product data — not a black-box algorithm. The same answers always produce the same result. From your answers we derive priorities (e.g. control, comfort, spin), weight each racket's properties, and deduct points where there are trade-offs or uncertainty.",
    m2Title: "Match and data confidence are two things",
    m2Body: "The match value says how well a model fits your priorities. Data confidence says how reliable the underlying data is. We show both separately — a high match on thin data is deliberately not the same as a high match on solid figures.",
    m3Title: "Data sources & honesty",
    m3Body: "Technical specs come from public manufacturer figures. The character ratings (power, control …) are currently editorial estimates and marked as demo — not lab measurements. String tension is always given as a range, never a fixed number. We do not invent product or pro data.",
    m4Title: "What we don't do",
    m4Body: "No selling at any cost: low-risk tips (tension, string, technique) come before a new purchase. Sales figures or popularity don't skew the rating. And health notes are not a medical diagnosis — for issues, please seek professional advice.",
    methodikVersion: "Rules version: {v} · Data status: demo",
    methodikBack: "Back to advice",
    conf_high: "high", conf_medium: "medium", conf_low: "low",
    axis_power: "Power", axis_control: "Control", axis_spin: "Spin", axis_comfort: "Comfort",
    axis_stability: "Stability", axis_maneuverability: "Maneuverability", axis_forgiveness: "Forgiveness",
    axis_durability: "Durability", axis_tensionMaintenance: "Tension keeping", axis_feel: "Feel",
    stringSectionTitle: "Matching string setup",
    stringSectionSub: "Based on your answers — string and tension as a starting point.",
    tensionLabel: "Recommended tension",
    tensionRange: "{min}–{max} kg",
    stringDisclaimer: "Tension is a starting range, not a fixed value — depends on surface, feel and stringer. Not medical advice: for arm/shoulder issues, consult a professional.",
    mat_polyester: "Polyester", mat_multifilament: "Multifilament", mat_natural_gut: "Natural gut", mat_synthetic_gut: "Synthetic gut",
    q_level: "How would you rate your level?",
    q_level_beginner: "Beginner", q_level_intermediate: "Intermediate", q_level_advanced: "Advanced", q_level_competitive: "Competitive",
    q_swing: "How do you swing?",
    q_swing_compact: "Short & compact", q_swing_moderate: "Medium", q_swing_full: "Full & long",
    q_goal: "What matters most to you?",
    q_goal_power: "More power", q_goal_control: "More control", q_goal_spin: "More spin", q_goal_comfort: "Comfort/arm-friendly", q_goal_allround: "Balanced",
    q_playstyle: "How do you like to play?",
    q_playstyle_baseline: "From the baseline", q_playstyle_allcourt: "All-court", q_playstyle_servevolley: "Serve & volley", q_playstyle_defensive: "Defensive/counter",
    q_arm: "Do you have a sensitive arm/shoulder?",
    q_arm_none: "No", q_arm_some: "Somewhat", q_arm_high: "Yes, sensitive",
    q_problem: "Biggest issue with your current racket?",
    q_problem_none: "Nothing specific", q_problem_flies_long: "Balls fly too long", q_problem_no_control: "Too little control", q_problem_arm_pain: "Arm pain", q_problem_too_heavy: "Too heavy/slow", q_problem_no_spin: "Too little spin",

    // ── Page (Hero + content) ──────────────────────────────────────────
    heroAlt: "Advice",
    heroEyebrow: "Personal advice",
    heroTitle: "Find your perfect setup",
    heroSubtitle:
      "Individual racket advice or your stars' stringing — pick what you need.",
    privacyNote:
      "Your details are treated confidentially and used solely for personal advice.",
    block1Title: "Which sport suits you?",
    block1Text:
      "Tennis, padel or pickleball — each sport has its own appeal. We help you figure out which one best fits your playing style, fitness and goals.",
    block2Title: "The right racket",
    block2Text:
      "Weight, balance, stringing, grip size — choosing the right racket makes all the difference. Based on your level and playing style, we give individual recommendations.",
    block3Title: "Training & coaching",
    block3Text:
      "Find coaches, training groups and courses near you. Whether a beginner course or intensive training — we connect you with the right people.",

    // ── Wizard: header / navigation ────────────────────────────────────
    wizardTitle: "Personal racket advice",
    requestSent: "Request sent",
    stepOf: "Step {current} of {total} · {label}",
    closeAria: "Close",
    thanks: "Thank you, {name}!",
    doneText:
      "We've received your request and will get back to you within 24 hours with a personal racket recommendation.",
    newRequest: "New request",
    btnBack: "Back",
    btnNext: "Next",
    btnSend: "Send request",

    // Wizard: step titles
    stepProfile: "Sport & profile",
    stepStyle: "Playing style",
    stepRacket: "Racket & string",
    stepBody: "Body",
    stepBudget: "Needs & budget",
    stepContact: "Contact & finish",

    // Wizard: validation
    errRequired: "Please fill in first name, last name and email.",
    errEmail: "Please enter a valid email address.",
    errConsent: "Please agree to the processing of your details.",
    hintMulti: "Multiple selection possible",

    // Step 1: Sport & profile
    qSport: "Which sport are you looking for advice on?",
    optTennis: "Tennis",
    optPadel: "Padel",
    optPickleball: "Pickleball",
    qExperience: "How long have you been playing?",
    optExpBeginner: "Beginner (0–1 year)",
    optExpHobby: "Recreational player",
    optExpAdvanced: "Advanced",
    optExpTournament: "Tournament player",
    optExpCoach: "Coach / trainer",
    qFrequency: "How often do you play?",
    optFreqMonth: "Once a month",
    optFreqWeek: "Once a week",
    optFreqWeek23: "2–3× a week",
    optFreqWeek4: "4×+ a week",
    qSurface: "Where do you mainly play?",
    optIndoor: "Indoor",
    optOutdoor: "Outdoor",
    optBoth: "Both",
    qMatches: "Do you play matches / tournaments?",
    optYes: "Yes",
    optNo: "No",
    optOccasionally: "Occasionally",

    // Step 2: Playing style
    qStyle: "How would you describe your playing style?",
    optStyleDefensive: "Defensive / controlled",
    optStyleAllround: "All-round",
    optStyleAggressive: "Aggressive / offensive",
    optStyleSpin: "Lots of spin",
    optStyleFlat: "Flat game",
    optStyleNet: "Net player / volley",
    qPriorities: "What matters most to you?",
    optPrioPower: "More power",
    optPrioControl: "More control",
    optPrioSpin: "More spin",
    optPrioComfort: "More comfort",
    optPrioStrain: "Less strain (arm / shoulder)",
    optPrioPrecision: "More precision",
    optPrioSweetspot: "Larger sweet spot",

    // Step 3: Racket & string
    qCurBrand: "Current brand",
    qCurModel: "Current model (optional)",
    qCurWeight: "Racket weight (if known)",
    qGrip: "Grip size (if known)",
    optGripUnknown: "Don't know",
    qString: "Current string",
    qTension: "Tension (kg)",
    qRestring: "How often do you restring?",
    optRestringRare: "Very rarely",
    optRestringMonths: "Every few months",
    optRestringRegular: "Regularly",
    optRestringUnknown: "Don't know",

    // Step 4: Body
    qAge: "Age",
    optAgeChild: "Child (under 12)",
    optAgeTeen: "Teen (12–17)",
    optAgeAdult: "Adult (18+)",
    qHeight: "Height (cm)",
    qWeight: "Weight (kg, optional)",
    qHand: "Dominant hand",
    optHandRight: "Right",
    optHandLeft: "Left",

    // Step 5: Needs & budget
    qIssues: "Do you currently have any complaints?",
    optIssueNone: "None",
    optIssueTennisElbow: "Tennis elbow",
    optIssueWrist: "Wrist",
    optIssueShoulder: "Shoulder",
    optIssueElbow: "Elbow",
    optIssueOther: "Other",
    qIssuesText: "If so, please describe briefly",
    qReason: "Why do you want to switch?",
    optReasonFit: "My racket no longer fits",
    optReasonUpgrade: "I need an upgrade",
    optReasonPain: "I have pain",
    optReasonImprove: "I want to improve my game",
    optReasonOld: "My racket is old",
    optReasonFirst: "I'm looking for my first racket",
    qBudget: "What's your budget?",
    optBudgetUnder100: "Under 100 CHF",
    optBudget100: "100–180 CHF",
    optBudget180: "180–250 CHF",
    optBudget250: "250+ CHF",
    optBudgetOpen: "Open to a recommendation",

    // Step 6: Contact & finish
    contactIntro:
      "Almost done! Where should we send your personal recommendation?",
    qFirstName: "First name *",
    qLastName: "Last name *",
    qEmail: "Email *",
    qPhone: "Phone / WhatsApp (optional)",
    qNotes: "Is there anything else we should know?",
    hintNotes: "e.g. favorite brands, no-gos, goals, special requests",
    consent:
      "I agree that my details may be stored and processed for personal advice. *",

    // ── Stringing configurator ─────────────────────────────────────────
    stringingTitle: "Play like the pros",
    stringingSubtitle:
      "Pick your favorite player's setup — we show you the exact string & tension and string your racket just like it.",
    tourAtp: "Men · ATP",
    tourWta: "Women · WTA",
    own: "Custom",
    placeholderHint:
      "Tap a player on the left — string, tension and details appear here instantly.",

    // Setup detail
    yourSetup: "Your perfect setup",
    rowString: "String",
    rowTension: "Tension",
    rowBrand: "Racket brand",
    priceIncludes: "incl. premium string & stringing",
    orderWithSetup: "Order with this setup →",
    alcarazShopCta: "See the full Alcaraz setup in the shop",

    // Order confirmation
    orderCreated: "Stringing order created",
    orderConfirmPre: "Your racket will be strung in the ",
    orderConfirmPost: " setup:",
    orderShip:
      "Send us your racket — we string it exactly to these settings and send it back ready to play.",
    chooseAnother: "Choose another setup",

    // Custom setup request form
    reqError: "Please fill in name, email and your desired setup.",
    reqSent: "Request sent, {name}!",
    reqSentText:
      "We'll get back to you with a recommendation for your desired setup “{wish}” and a suitable offer.",
    reqTitle: "Request a custom setup",
    reqSubtitle:
      "A different favorite player or your own idea? Tell us how you play — we'll find your setup.",
    reqName: "Name *",
    reqEmail: "Email *",
    reqWish: "Desired setup / player *",
    reqWishPlaceholder: "e.g. like Rafael Nadal, or: lots of spin & arm-friendly",
    reqNote: "Note (optional)",
    reqCancel: "Cancel",
    reqSend: "Send request",

    // Properties (setup traits)
    traitAggressive: "Aggressive",
    traitAllround: "All-round",
    traitArmFriendly: "Arm-friendly",
    traitServe: "Serve",
    traitOneHandedBackhand: "One-handed backhand",
    traitExtremeSpin: "Extreme spin",
    traitFlatGame: "Flat game",
    traitEarlyGame: "Early game",
    traitDurability: "Durability",
    traitComfort: "Comfort",
    traitControl: "Control",
    traitMaxPower: "Maximum power",
    traitMaxSpin: "Maximum spin",
    traitPower: "Power",
    traitPrecision: "Precision",
    traitClay: "Clay court",
    traitSpeed: "Speed",
    traitSpin: "Spin",
    traitStopSlice: "Drop shot & slice",
    traitPace: "Pace",
    traitTopspin: "Topspin",
    traitTouchFeel: "Touch & feel",
    traitTouch: "Touch",
    traitVariation: "Variation",

    // Per-pro setup instructions
    instr_alcaraz:
      "Full polyester for aggressive topspin play. For advanced players with long, fast swings.",
    instr_sinner:
      "Smooth polyester for flat, powerful play with clean control. For hard, early ball-striking.",
    instr_zverev:
      "Soft polyester at low tension — plenty of power and arm protection with stable control.",
    instr_djokovic:
      "Hybrid for maximum ball control with high comfort — for precise, defensively solid baseline play.",
    instr_medvedev:
      "Controlled polyester for flat, precise play from deep behind the baseline.",
    instr_fritz:
      "Edgy polyester for powerful serves and spin. For offensive, forceful play.",
    instr_ruud:
      "Comfortable polyester with lots of spin — ideal for spin-heavy baseline play, especially on clay.",
    instr_rublev:
      "Robust polyester for full swings with spin and power. For uncompromisingly offensive play.",
    instr_tsitsipas:
      "Tour classic polyester for spin and control — perfect for varied all-court play.",
    instr_dimitrov:
      "Natural gut and polyester hybrid for elegant, feel-rich all-round play with lots of touch.",
    instr_federer:
      "Premium hybrid of natural gut and polyester — soft, controlled feel with lots of touch at the net.",
    instr_sabalenka:
      "Stiff polyester at high tension for uncompromising power and flat, hard shots. For powerful, offensive play.",
    instr_swiatek:
      "Thin, edgy polyester for massive topspin and control at high tension. For spin-heavy, active baseline play.",
    instr_gauff:
      "Smooth polyester for a mix of spin and speed — versatile for fast, athletic all-court play.",
    instr_rybakina:
      "Comfortable polyester with good ball speed — ideal for powerful serves and flat, hard groundstrokes.",
    instr_pegula:
      "Controlled polyester for early-taken, precise balls. For tactically clean baseline play.",
    instr_zheng:
      "Tour classic polyester for the balance of power and spin. For powerful, offensive play.",
    instr_paolini:
      "Soft polyester for spin and pace with good comfort — suited to fast, mobile play.",
    instr_keys:
      "Semi-soft polyester for huge power with stable control. For aggressive, hard-hitting play.",
    instr_krejcikova:
      "Natural gut and polyester hybrid for feel-rich, varied play with lots of touch.",
    instr_ostapenko:
      "Controlled polyester for extremely flat, early and powerful play. For uncompromising offense.",
    instr_jabeur:
      "Natural gut hybrid for maximum feel and variation — perfect for creative play with drop shots, slice and angles.",
    instr_collins:
      "Polyester with good ball speed for flat, aggressive baseline play. For offensive players.",
  },
};
