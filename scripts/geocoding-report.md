# Geocodierung Turniere — SCHARFER LAUF

> Erzeugt von `scripts/geocode-tournaments.mjs`. Quelle: **Nominatim / OpenStreetMap**
> Richtlinie: https://operations.osmfoundation.org/policies/nominatim/ · Attribution "© OpenStreetMap contributors".
> Koordinaten sind eine **Ableitung** aus Stadt+Land → Claim-Quelle `nominatim`, confidence 0.6 (< Beobachtung 0.9).

## Zusammenfassung

| | Anzahl |
|---|---:|
| Turniere ohne Koordinaten | 611 |
| Distinkte Orte (Stadt+Land) | 309 |
| **abgefragt (fertig)** | 309 |
| noch offen (--limit) | 0 |
| aufgeloest | 174 |
| mehrdeutig | 127 |
| nicht gefunden | 8 |
| falsches Land | 0 |
| Fehler/keine Antwort | 0 |
| Netz-Abfragen in diesem Lauf | 117 (Cache: 192) |

**Wuerde geschrieben:** 612 Claims (je aufgeloestem Ort x Turnieranzahl x 2 Felder) fuer 174 Orte / 306 Turniere.

**Geschrieben:** 612 Claims ok, 0 Fehler (von 612).

## Stichprobe: 10 aufgeloeste Orte (zur Pruefung)

| Ort | Land | lat | lon | Turniere | OSM |
|---|---|---:|---:|---:|---|
| Singapore | SG | 1.35711 | 103.81950 | 8 | https://www.openstreetmap.org/relation/536780 |
| Mar Del Plata | AR | -37.99762 | -57.54821 | 1 | https://www.openstreetmap.org/relation/3402727 |
| Bol | HR | 43.26052 | 16.65202 | 4 | https://www.openstreetmap.org/relation/8777993 |
| KURSUMLIJSKA BANJA | RS | 43.05788 | 21.25505 | 6 | https://www.openstreetmap.org/relation/6946610 |
| Erwitte | DE | 51.61431 | 8.33967 | 1 | https://www.openstreetmap.org/relation/153399 |
| Kigali | RW | -1.95344 | 30.11401 | 2 | https://www.openstreetmap.org/relation/1708283 |
| Karlovy Vary | CZ | 50.23062 | 12.87014 | 1 | https://www.openstreetmap.org/relation/439482 |
| Nanao | JP | 37.05211 | 136.94646 | 1 | https://www.openstreetmap.org/relation/4800065 |
| Maanshan | CN | 31.68661 | 118.50484 | 5 | https://www.openstreetmap.org/relation/3260816 |
| Tsaghkadzor | AM | 40.51535 | 44.67215 | 2 | https://www.openstreetmap.org/way/1245249006 |

## Mehrdeutige Orte (NICHT uebernommen — bitte pruefen)

- **Santa Cruz, BO** (3 Turniere) — 2 verschiedene Orte:
  - -17.7834, -63.1821 · Santa Cruz de la Sierra, Provincia Andrés Ibáñez, Santa Cruz, Bolivia
  - -17.3333, -61.5000 · Santa Cruz, Bolivia
- **Orlando, US** (8 Turniere) — 2 verschiedene Orte:
  - 28.5421, -81.3790 · Orlando, Orange County, Florida, United States
  - 36.1489, -97.3781 · Orlando, Logan County, Oklahoma, United States
- **Pilar, AR** (1 Turniere) — 3 verschiedene Orte:
  - -34.4571, -58.9142 · Pilar, Partido del Pilar, Buenos Aires, Argentina
  - -31.6814, -63.8824 · Pilar, Municipio de Pilar, Pedanía Pilar, Departamento Río Segundo, Córdoba, X5972, Argentina
  - -31.4401, -61.2598 · Municipio de Pilar, Departamento Las Colonias, Santa Fe, S3085, Argentina
- **Wuning, CN** (13 Turniere) — 2 verschiedene Orte:
  - 29.2778, 115.0476 · Wuning County, Jiujiang, Jiangxi, China
  - 37.3673, 121.5560 · Wuning, Muping District, Yantai, Shandong, 264100, China
- **Las Vegas, US** (2 Turniere) — 2 verschiedene Orte:
  - 36.1674, -115.1484 · Las Vegas, Clark County, Nevada, United States
  - 35.5939, -105.2239 · Las Vegas, San Miguel County, New Mexico, United States
- **Savannah, US** (2 Turniere) — 5 verschiedene Orte:
  - 32.0790, -81.0921 · Savannah, Chatham County, Georgia, United States
  - 35.2248, -88.2492 · Savannah, Hardin County, West Tennessee, Tennessee, United States
  - 39.9414, -94.8299 · Savannah, Andrew County, Missouri, 64485, United States
  - 43.0673, -76.7597 · Town of Savannah, Wayne County, New York, United States
  - 40.9653, -82.3652 · Savannah, Clear Creek Township, Ashland County, Ohio, 44874, United States
- **Morelia, MX** (3 Turniere) — 3 verschiedene Orte:
  - 19.6546, -101.2624 · Morelia, Michoacán, Mexico
  - 16.3086, -91.8673 · Morelia, Chiapas, Mexico
  - 31.9053, -112.9131 · Morelia, General Plutarco Elías Calles, Sonora, Mexico
- **Tigre, AR** (3 Turniere) — 3 verschiedene Orte:
  - -34.4235, -58.5818 · Tigre, Luis García, Tigre, Partido de Tigre, Buenos Aires, 1648, Argentina
  - -33.0305, -60.5950 · Tigre, Villa Gobernador Gálvez, Municipio de Villa Gobernador Gálvez, Gran Rosario, Departamento Rosario, Santa Fe, S2124, Argentina
  - -42.4612, -71.7706 · Tigre, Departamento Cushamen, Chubut, Argentina
- **São Paulo, BR** (4 Turniere) — 3 verschiedene Orte:
  - -23.5507, -46.6334 · São Paulo, Southeast Region, Brazil
  - -1.2043, -47.1584 · São Paulo, Capanema, Pará, North Region, 68700-540, Brazil
  - -22.0703, -48.4334 · São Paulo, Southeast Region, Brazil
- **Campulung, RO** (1 Turniere) — 3 verschiedene Orte:
  - 45.2698, 25.0439 · Câmpulung, Argeș, Romania
  - 47.5298, 25.5597 · Câmpulung Moldovenesc, Suceava, 725100, Romania
  - 47.9606, 23.7621 · Câmpulung la Tisa, Maramureș, 437080, Romania
- **Sunrise, US** (2 Turniere) — 5 verschiedene Orte:
  - 26.1667, -80.2788 · Sunrise, Broward County, Florida, United States
  - 60.8710, -149.4736 · Sunrise, Kenai Peninsula Borough, Alaska, United States
  - 45.5469, -92.8549 · Sunrise, Sunrise Township, Chisago County, Minnesota, United States
  - 42.3302, -104.7055 · Sunrise, Platte County, Wyoming, 82215, United States
  - 38.1926, -79.8137 · Sunrise, Bath County, Virginia, United States
- **Lakewood, US** (3 Turniere) — 5 verschiedene Orte:
  - 39.7086, -105.0847 · Lakewood, Jefferson County, Colorado, United States
  - 33.8503, -118.1172 · Lakewood, Los Angeles County, California, United States
  - 41.4820, -81.7982 · Lakewood, Cuyahoga County, Ohio, 44107, United States
  - 47.1718, -122.5185 · Lakewood, Pierce County, Washington, United States
  - 40.0941, -74.2150 · Lakewood Township, Ocean County, New Jersey, 08701, United States
- **Metepec, MX** (1 Turniere) — 2 verschiedene Orte:
  - 19.2511, -99.5937 · Metepec, State of Mexico, Mexico
  - 20.2587, -98.3447 · Metepec, Hidalgo, Mexico
- **Lima, PE** (12 Turniere) — 2 verschiedene Orte:
  - -12.0460, -77.0306 · Lima, Province of Lima, Lima Metropolitan Area, Lima, 15001, Peru
  - -12.2001, -76.2851 · Lima, Peru
- **Louisville, US** (2 Turniere) — 5 verschiedene Orte:
  - 38.2542, -85.7594 · Louisville, Jefferson County, Kentucky, United States
  - 39.9778, -105.1319 · Louisville, Boulder County, Colorado, 80027, United States
  - 33.0015, -82.4112 · Louisville, Jefferson County, Georgia, 30434, United States
  - 38.7723, -88.5025 · Louisville, Louisville Township, Clay County, Illinois, United States
  - 33.1235, -89.0532 · Louisville, Winston County, Mississippi, 39339, United States
- **Belem, BR** (2 Turniere) — 4 verschiedene Orte:
  - -1.4506, -48.4682 · Belém, Pará, North Region, Brazil
  - -6.6968, -35.5370 · Belém, Paraíba, Northeast Region, Brazil
  - -9.5715, -36.4928 · Belém, Alagoas, Northeast Region, 57630-000, Brazil
  - -23.5349, -46.5949 · Belém, São Paulo, Southeast Region, Brazil
- **Kunshan, CN** (1 Turniere) — 3 verschiedene Orte:
  - 31.3869, 120.9765 · Kunshan, Suzhou City, Jiangsu, China
  - 31.0278, 117.5880 · Kunshan, Wuwei, Wuhu, Anhui, 238300, China
  - 33.8000, 114.5458 · Kunshan Subdistrict, Xihua County, Zhoukou, Henan, China
- **Norman, US** (3 Turniere) — 5 verschiedene Orte:
  - 35.2226, -97.4395 · Norman, Cleveland County, Oklahoma, United States
  - 47.3194, -96.4626 · Norman County, Minnesota, United States
  - 34.4566, -93.6816 · Norman, Montgomery County, Arkansas, 71960, United States
  - 35.1706, -79.7228 · Norman, Richmond County, North Carolina, 28367, United States
  - 40.4788, -98.7921 · Norman, Kearney County, Nebraska, United States
- **Gwangju, KR** (2 Turniere) — 2 verschiedene Orte:
  - 35.1558, 126.8306 · Gwangju, Jeonnam-Gwangju Special Metropolitan City, South Korea
  - 37.4291, 127.2552 · Gwangju-si, Gyeonggi, South Korea
- **Querétaro, MX** (1 Turniere) — 2 verschiedene Orte:
  - 20.8052, -99.8837 · Querétaro, Mexico
  - 20.5923, -100.3917 · Santiago de Querétaro, Municipio de Querétaro, Querétaro, 76000, Mexico
- **Edmond, US** (1 Turniere) — 3 verschiedene Orte:
  - 35.6571, -97.4649 · Edmond, Oklahoma County, Oklahoma, United States
  - 39.6272, -99.8226 · Edmond, Norton County, Kansas, United States
  - 38.0623, -81.0273 · Edmond, Fayette County, West Virginia, 25837, United States
- **Córdoba, AR** (2 Turniere) — 2 verschiedene Orte:
  - -31.4167, -64.1834 · Cordoba, Municipio de Córdoba, Pedanía Capital, Departamento Capital, Córdoba, X5000, Argentina
  - -32.0222, -63.9699 · Córdoba, Argentina
- **Luján, AR** (3 Turniere) — 5 verschiedene Orte:
  - -34.5662, -59.1153 · Luján, Partido de Luján, Buenos Aires, 6700, Argentina
  - -32.3645, -65.9330 · Luján, Municipio de Luján, Ayacucho, San Luis, Argentina
  - -38.7068, -62.2995 · Luján, Bahía Blanca, Cuartel II, Partido de Bahía Blanca, Buenos Aires, Argentina
  - -31.2458, -61.4678 · Luján, Rafaela, Municipio de Rafaela, Departamento Castellanos, Santa Fe, S2300, Argentina
  - -36.9019, -60.3122 · Luján, Partido de Olavarría, Buenos Aires, Argentina
- **Nansha, CN** (2 Turniere) — 4 verschiedene Orte:
  - 22.8048, 113.5199 · Nansha District, Guangzhou City, Guangdong, China
  - 9.5453, 112.8870 · Nansha District, Sansha, Hainan, 573299, China
  - 32.1735, 120.2183 · Nansha, Taizhou, Jiangsu, 225300, China
  - 23.2281, 102.8243 · Nansha, Yuanyang County, Honghe, Yunnan, China
- **Radom, PL** (1 Turniere) — 2 verschiedene Orte:
  - 51.4167, 21.1607 · Radom, Masovian Voivodeship, Poland
  - 52.8517, 16.7492 · Radom, gmina Ryczywół, Oborniki County, Greater Poland Voivodeship, Poland
- **Luan, CN** (2 Turniere) — 2 verschiedene Orte:
  - 39.7630, 118.6588 · Luanzhou City, Tangshan, Hebei, China
  - 49.2125, 119.7370 · Hulunbuir, Inner Mongolia, China
- **La Paz, BO** (2 Turniere) — 2 verschiedene Orte:
  - -16.4955, -68.1336 · La Paz, Provincia Pedro Domingo Murillo, La Paz, Bolivia
  - -15.0000, -68.3333 · La Paz, Bolivia
- **Bakersfield, US** (3 Turniere) — 3 verschiedene Orte:
  - 35.3739, -119.0195 · Bakersfield, Kern County, California, United States
  - 44.7821, -72.8016 · Bakersfield, Franklin County, Vermont, 05441, United States
  - 36.5226, -92.1427 · Bakersfield, Ozark County, Missouri, United States
- **Knoxville, US** (2 Turniere) — 5 verschiedene Orte:
  - 35.9604, -83.9210 · Knoxville, Knox County, East Tennessee, Tennessee, United States
  - 41.3184, -93.0971 · Knoxville, Knoxville Township, Marion County, Iowa, United States
  - 32.7218, -83.9954 · Knoxville, Crawford County, Georgia, United States
  - 35.3817, -93.3640 · Knoxville, Johnson County, Arkansas, 72845, United States
  - 40.9084, -90.2848 · Knoxville, Knox County, Illinois, United States
- **Hinode, JP** (2 Turniere) — 4 verschiedene Orte:
  - 35.7423, 139.2575 · Hinode, Nishitama District, Tokyo, Japan
  - 35.6442, 139.9289 · Hinode, Urayasu, Chiba Prefecture, 279-0013, Japan
  - 33.2781, 130.2959 · Hinode, Saga, Saga Prefecture, 849-0925, Japan
  - 36.2478, 139.4073 · Hinode, Oizumi, Ora County, Gunma Prefecture, 370-0517, Japan
- **Vancouver, CA** (1 Turniere) — 2 verschiedene Orte:
  - 49.2609, -123.1140 · Vancouver, Metro Vancouver Regional District, British Columbia, Canada
  - 49.5929, -125.7026 · Vancouver Island, British Columbia, Canada
- **Villahermosa, MX** (2 Turniere) — 3 verschiedene Orte:
  - 17.9885, -92.9366 · Villahermosa, Centro, Tabasco, Mexico
  - 16.7209, -93.2586 · Villahermosa (Reymundo Enríquez), Ocozocoautla de Espinosa, Chiapas, Mexico
  - 16.2602, -93.5042 · Villahermosa, Villaflores, Chiapas, Mexico
- **Coquimbo, CL** (2 Turniere) — 2 verschiedene Orte:
  - -30.7547, -70.9006 · Coquimbo Region, Chile
  - -29.9532, -71.3380 · Coquimbo, Provincia de Elqui, Coquimbo Region, Chile
- **Hillcrest, ZA** (6 Turniere) — 5 verschiedene Orte:
  - -29.7756, 30.7656 · Hillcrest, eThekwini Metropolitan Municipality, KwaZulu-Natal, 3651, South Africa
  - -25.7581, 28.2418 · Hillcrest, Tshwane Ward 56, Pretoria, City of Tshwane Metropolitan Municipality, Gauteng, 0083, South Africa
  - -33.6600, 18.9953 · Hillcrest, Drakenstein Ward 7, Wellington, Drakenstein Local Municipality, Cape Winelands District Municipality, Western Cape, 7654, South Africa
  - -31.5783, 28.8065 · Hillcrest, King Sabata Dalindyebo Ward 9, Mthatha, King Sabata Dalindyebo Local Municipality, O.R. Tambo District Municipality, Eastern Cape, 7142, South Africa
  - -34.0465, 18.3655 · Hillcrest, Cape Town Ward 74, Hout Bay, City of Cape Town, Western Cape, 7872, South Africa
- **Swan Hill, AU** (2 Turniere) — 4 verschiedene Orte:
  - -35.3391, 143.5588 · Swan Hill, Victoria, 3585, Australia
  - -33.8951, 120.5596 · Swan Hill, Western Australia, Australia
  - -30.3773, 150.5278 · Swan Hill, Barraba, New South Wales, 2347, Australia
  - -24.6031, 145.9395 · Swan Hill, Mount Enniskillen, Queensland, 4472, Australia
- **Fairfield, US** (1 Turniere) — 5 verschiedene Orte:
  - 39.7886, -82.6419 · Fairfield County, Ohio, United States
  - 38.2494, -122.0400 · Fairfield, Solano County, California, United States
  - 41.1412, -73.2637 · Fairfield, Greater Bridgeport Planning Region, Connecticut, United States
  - 31.7244, -96.1649 · Fairfield, Freestone County, Texas, 75840, United States
  - 34.4092, -81.1131 · Fairfield County, South Carolina, United States
- **Lambermont, BE** (1 Turniere) — 3 verschiedene Orte:
  - 50.8429, 4.3655 · Lambermont, Rue Lambermont - Lambermontstraat, Royal Quarter, Pentagon, Brussels, Brussels-Capital, 1000, Belgium
  - 50.5873, 5.8351 · Lambermont, Verviers, Liège, Wallonia, 4800, Belgium
  - 49.7052, 5.1910 · Lambermont, Florenville, Virton, Luxembourg, Wallonia, 6820, Belgium
- **Luzhou, CN** (2 Turniere) — 3 verschiedene Orte:
  - 28.5298, 105.5383 · Luzhou, Sichuan, China
  - 36.2622, 113.0848 · Luzhou District, Changzhi City, Shanxi, China
  - 23.3688, 114.5196 · Luzhou, Huicheng District, Huizhou, Guangdong, China
- **Jingshan, CN** (2 Turniere) — 4 verschiedene Orte:
  - 31.0161, 113.1281 · Jingshan City, Jingmen, Jingshan, Hubei, 431800, China
  - 30.3775, 119.8606 · Jingshan, Yuhang District, Hangzhou City, Zhejiang, 311116, China
  - 31.3150, 118.4469 · Jingshan Subdistrict, Jinghu District, Wuhu, Anhui, China
  - 39.9254, 116.4043 · Jingshan Subdistrict, 首都功能核心区, Dongcheng District, Beijing, 100010, China
- **Mistelbach, AT** (1 Turniere) — 2 verschiedene Orte:
  - 48.5695, 16.5720 · Mistelbach, Bezirk Mistelbach, Lower Austria, Austria
  - 48.6656, 14.9328 · Mistelbach, Großschönau, Bezirk Gmünd, Lower Austria, 3922, Austria
- **Naples, US** (6 Turniere) — 4 verschiedene Orte:
  - 26.1422, -81.7943 · Naples, Collier County, Florida, United States
  - 33.2032, -94.6802 · Naples, Morris County, Texas, 75568, United States
  - 42.6161, -77.4030 · Town of Naples, Ontario County, New York, 14512, United States
  - 43.9695, -70.6051 · Naples, Cumberland County, Maine, 04055, United States
- **Jinan, CN** (2 Turniere) — 2 verschiedene Orte:
  - 36.6520, 117.1138 · Jinan, Shandong, China
  - 31.7518, 116.5342 · Jin'an District, Lu'an, Anhui, China
- **Villavicencio, CO** (1 Turniere) — 2 verschiedene Orte:
  - 4.1115, -73.4968 · Villavicencio, Meta, RAP (Especial) Central, Colombia
  - 4.8112, -75.6841 · Villavicencio, AMCO, Area Metropolitana Centro Occidente, Pereira, Risaralda, RAP Eje Cafetero, Colombia
- **Rio de Janeiro, BR** (2 Turniere) — 2 verschiedene Orte:
  - -22.9110, -43.2094 · Rio de Janeiro, Southeast Region, Brazil
  - -22.2753, -42.4194 · Rio de Janeiro, Southeast Region, Brazil
- **Lincoln, US** (3 Turniere) — 5 verschiedene Orte:
  - 40.8089, -96.7078 · Lincoln, Lancaster County, Nebraska, United States
  - 33.7877, -82.4508 · Lincoln County, Georgia, 30817, United States
  - 39.0605, -90.9594 · Lincoln County, Missouri, United States
  - 35.4866, -81.2063 · Lincoln County, North Carolina, United States
  - 38.9208, -103.4885 · Lincoln County, Colorado, United States
- **San Luis Potosí, MX** (2 Turniere) — 2 verschiedene Orte:
  - 22.5000, -100.4949 · San Luis Potosí, Mexico
  - 22.1516, -100.9764 · San Luis Potosí City, Municipio de San Luis Potosí, San Luis Potosí, 78000, Mexico
- **Curitiba, BR** (2 Turniere) — 2 verschiedene Orte:
  - -25.4296, -49.2713 · Curitiba, Paraná, South Region, Brazil
  - -9.6604, -37.7896 · Canindé de São Francisco, Sergipe, Northeast Region, 49820-000, Brazil
- **Irvine, US** (1 Turniere) — 4 verschiedene Orte:
  - 33.6857, -117.8260 · Irvine, Orange County, California, United States
  - 37.7006, -83.9738 · Irvine, Estill County, Kentucky, United States
  - 29.4055, -82.2512 · Irvine, Marion County, Florida, 34686, United States
  - 41.8392, -79.2684 · Irvine, Brokenstraw Township, Warren County, Pennsylvania, 16329, United States
- **Zamora, MX** (1 Turniere) — 2 verschiedene Orte:
  - 19.9829, -102.2836 · Zamora, Michoacán, 59670, Mexico
  - 16.3323, -90.7653 · Zamora Pico de Oro, Marqués de Comillas, Chiapas, Mexico
- **Huntsville, US** (1 Turniere) — 5 verschiedene Orte:
  - 34.7298, -86.5859 · Huntsville, Madison County, Alabama, United States
  - 30.7235, -95.5508 · Huntsville, Walker County, Texas, United States
  - 36.0884, -93.7375 · Huntsville, Madison County, Arkansas, United States
  - 39.4406, -92.5452 · Huntsville, Randolph County, Missouri, 65259, United States
  - 36.4092, -84.4907 · Huntsville, Scott County, East Tennessee, Tennessee, United States
- **Tyler, US** (2 Turniere) — 4 verschiedene Orte:
  - 32.3513, -95.3011 · Tyler, Smith County, Texas, United States
  - 30.7564, -94.3985 · Tyler County, Texas, United States
  - 39.4553, -80.8682 · Tyler County, West Virginia, United States
  - 44.2783, -96.1348 · Tyler, Lincoln County, Minnesota, United States
- **Guiyang, CN** (3 Turniere) — 2 verschiedene Orte:
  - 26.5878, 106.7087 · Guiyang, Guizhou, China
  - 25.8728, 112.6287 · Guiyang County, Chenzhou, Hunan, 424400, China
- **Yokohama, JP** (3 Turniere) — 2 verschiedene Orte:
  - 35.4503, 139.6344 · Yokohama, Kanagawa Prefecture, 231-0017, Japan
  - 41.0831, 141.2478 · Yokohama, Kamikita County, Aomori Prefecture, Japan
- **Perth, AU** (2 Turniere) — 2 verschiedene Orte:
  - -31.9559, 115.8606 · Perth, Western Australia, 6000, Australia
  - -41.5730, 147.1720 · Perth, Tasmania, 7300, Australia
- **Vale do Lobo, PT** (6 Turniere) — 2 verschiedene Orte:
  - 40.6048, -8.2416 · Vale do Lobo, São João do Monte e Mosteirinho, Tondela, Viseu, 3475-072, Portugal
  - 39.6707, -8.5206 · Vale do Lobo, Tacoaria, Seiça, Ourém, Santarém, Portugal
- **Columbus, US** (3 Turniere) — 5 verschiedene Orte:
  - 39.9623, -83.0007 · Columbus, Sharon, Franklin County, Ohio, United States
  - 32.4611, -84.9880 · Columbus, Muscogee County, Georgia, United States
  - 34.2814, -78.6666 · Columbus County, North Carolina, United States
  - 39.2014, -85.9214 · Columbus, Bartholomew County, Indiana, United States
  - 33.4957, -88.4273 · Columbus, Lowndes County, Mississippi, 39703, United States
- **Szczawno, PL** (1 Turniere) — 5 verschiedene Orte:
  - 51.4389, 18.7943 · Szczawno, gmina Burzenin, Sieradz County, Łódź Voivodeship, Poland
  - 53.2244, 14.5272 · Szczawno, Żórawie, gmina Gryfino, Gryfino County, West Pomeranian Voivodeship, 74-100, Poland
  - 53.0336, 19.6571 · Szczawno, gmina Skrwilno, Rypin County, Kuyavian-Pomeranian Voivodeship, 87-510, Poland
  - 52.0254, 15.2176 · Szczawno, gmina Dąbie, Krosno Odrzańskie County, Lubusz Voivodeship, 66-615, Poland
  - 50.8219, 16.2853 · Szczawno, Szczawienko, Wałbrzych, Lower Silesian Voivodeship, 58-314, Poland
- **Champaign, US** (4 Turniere) — 2 verschiedene Orte:
  - 40.1165, -88.2431 · Champaign, Champaign County, Illinois, United States
  - 40.1727, -83.7702 · Champaign County, Ohio, United States
- **Yerba Buena, AR** (2 Turniere) — 2 verschiedene Orte:
  - -26.8122, -65.2982 · Yerba Buena, Departamento Yerba Buena, Tucumán, T4107, Argentina
  - -29.0060, -65.4630 · Yerba Buena, Municipio de Ancasti, Departamento Ancasti, Catamarca, K4701, Argentina
- **San Diego, US** (8 Turniere) — 2 verschiedene Orte:
  - 32.7174, -117.1628 · San Diego, San Diego County, California, United States
  - 27.7639, -98.2389 · San Diego, Duval County, Texas, United States
- **Haren, NL** (2 Turniere) — 2 verschiedene Orte:
  - 53.1710, 6.6061 · Haren, Groningen, Netherlands
  - 51.7997, 5.5836 · Haren, Oss, North Brabant, Netherlands
- **Columbus,, US** (1 Turniere) — 5 verschiedene Orte:
  - 39.9623, -83.0007 · Columbus, Sharon, Franklin County, Ohio, United States
  - 32.4611, -84.9880 · Columbus, Muscogee County, Georgia, United States
  - 34.2814, -78.6666 · Columbus County, North Carolina, United States
  - 39.2014, -85.9214 · Columbus, Bartholomew County, Indiana, United States
  - 33.4957, -88.4273 · Columbus, Lowndes County, Mississippi, 39703, United States
- **Sherbrooke, CA** (2 Turniere) — 4 verschiedene Orte:
  - 45.4033, -71.8890 · Sherbrooke, Estrie, Quebec, Canada
  - 53.5761, -113.5476 · Sherbrooke, Western Mature Area, Edmonton, Alberta, T5L 2L4, Canada
  - 46.4219, -63.7602 · Sherbrooke, Rural Municipality of Sherbrooke, Prince County, Prince Edward Island, Canada
  - 45.1439, -61.9806 · Sherbrooke, St. Mary's District Municipality, Guysborough County, Nova Scotia, B0J 3C0, Canada
- **Bolzano, IT** (2 Turniere) — 2 verschiedene Orte:
  - 46.6559, 11.2302 · South Tyrol, Trentino – Alto Adige/Südtirol, Italy
  - 46.1639, 12.1868 · Bolzano Bellunese, Belluno, Veneto, 32100, Italy
- **Cipolletti, AR** (1 Turniere) — 3 verschiedene Orte:
  - -38.9313, -67.9906 · Municipio de Cipolletti, Departamento General Roca, Río Negro, R8324, Argentina
  - -39.0913, -67.1156 · Cipolletti, Villa Regina, Municipio de Villa Regina, Departamento General Roca, Río Negro, Argentina
  - -31.4981, -68.5690 · Barrio Cipolletti, Chimbas, San Juan, Argentina
- **Slobozia, RO** (1 Turniere) — 4 verschiedene Orte:
  - 44.5636, 27.3618 · Slobozia, Ialomița, 920058, Romania
  - 44.5214, 25.2381 · Slobozia, Argeș, Romania
  - 43.8562, 25.9101 · Slobozia, Giurgiu, 087210, Romania
  - 46.4749, 27.3111 · Slobozia, Stănișești, Bacău, 607592, Romania
- **Luanda, AO** (5 Turniere) — 2 verschiedene Orte:
  - -8.8273, 13.2440 · Luanda, Municipality of Luanda, Luanda Province, Angola
  - -9.5180, 13.5357 · Luanda Province, Angola
- **Salta, AR** (1 Turniere) — 2 verschiedene Orte:
  - -25.2270, -64.5912 · Salta, Argentina
  - -24.7893, -65.4103 · Salta, Capital, Salta, Argentina
- **Cary, US** (2 Turniere) — 5 verschiedene Orte:
  - 35.7883, -78.7812 · Cary, Wake County, North Carolina, United States
  - 42.2091, -88.2400 · Cary, McHenry County, Illinois, 60013, United States
  - 32.8060, -90.9268 · Cary, Sharkey County, Mississippi, 39054, United States
  - 44.4772, -90.2568 · Town of Cary, Wood County, Wisconsin, 54466, United States
  - 39.7070, -86.8231 · Cary, Putnam County, Indiana, United States
- **Lajeado, BR** (1 Turniere) — 3 verschiedene Orte:
  - -29.4672, -51.9624 · Lajeado, Rio Grande do Sul, South Region, Brazil
  - -9.7549, -48.3564 · Lajeado, Tocantins, North Region, 77645-000, Brazil
  - -23.5362, -46.4100 · Lajeado, São Paulo, Southeast Region, Brazil
- **Maringá, BR** (3 Turniere) — 4 verschiedene Orte:
  - -23.4253, -51.9382 · Maringá, Paraná, South Region, Brazil
  - -23.2275, -46.8797 · Maringá, Jundiaí, São Paulo, Southeast Region, 13210-090, Brazil
  - -19.7610, -47.8841 · Maringá, Uberaba, Minas Gerais, Southeast Region, 38040-450, Brazil
  - -22.3259, -44.5769 · Maringá, Bocaina de Minas, Minas Gerais, Southeast Region, 27553-970, Brazil
- **Saguenay, CA** (1 Turniere) — 2 verschiedene Orte:
  - 48.4060, -71.0692 · Saguenay, Saguenay–Lac-Saint-Jean, Quebec, Canada
  - 50.3238, -71.8217 · Saguenay–Lac-Saint-Jean, Quebec, Canada
- **Lexington, US** (4 Turniere) — 5 verschiedene Orte:
  - 38.0464, -84.4970 · Lexington, Fayette County, Kentucky, United States
  - 37.7840, -79.4428 · Lexington, Virginia, United States
  - 42.4473, -71.2245 · Lexington, Middlesex County, Massachusetts, United States
  - 35.8240, -80.2534 · Lexington, Davidson County, North Carolina, 27792, United States
  - 33.8987, -81.2751 · Lexington County, South Carolina, United States
- **Brownsburg, US** (1 Turniere) — 4 verschiedene Orte:
  - 39.8444, -86.3969 · Brownsburg, Hendricks County, Indiana, 46112, United States
  - 38.2679, -80.0753 · Brownsburg, Pocahontas County, West Virginia, 24954, United States
  - 37.9285, -79.3192 · Brownsburg, Rockbridge County, Virginia, 24415, United States
  - 40.3182, -74.9202 · Brownsburg, Upper Makefield Township, Bucks County, Pennsylvania, 18977, United States
- **Chacabuco, AR** (1 Turniere) — 5 verschiedene Orte:
  - -32.7415, -65.2061 · Chacabuco, San Luis, Argentina
  - -34.6424, -60.4709 · Chacabuco, Partido de Chacabuco, Buenos Aires, 6740, Argentina
  - -34.8057, -58.2924 · Chacabuco, San Juan Bautista, Partido de Florencio Varela, Buenos Aires, Argentina
  - -31.5301, -68.5672 · Barrio Chacabuco, Desamparados, San Juan, Capital, San Juan, Argentina
  - -31.0904, -59.3248 · Chacabuco, Junta de Gobierno de Yeso Oeste, Distrito Yeso, Departamento La Paz, Entre Ríos Province, Argentina
- **Redding, US** (1 Turniere) — 4 verschiedene Orte:
  - 40.5864, -122.3917 · Redding, Shasta County, California, United States
  - 40.6046, -94.3876 · Redding, Ringgold County, Iowa, 50860, United States
  - 41.3029, -73.3834 · Redding, Western Connecticut Planning Region, Connecticut, United States
  - 38.7745, -86.5039 · Redding, Lawrence County, Indiana, 47446, United States
- **Antofagasta, CL** (2 Turniere) — 2 verschiedene Orte:
  - -23.6464, -70.3980 · Antofagasta, Provincia de Antofagasta, Antofagasta Region, Chile
  - -23.6041, -69.0843 · Antofagasta Region, Chile
- **Timaru, NZ** (2 Turniere) — 2 verschiedene Orte:
  - -44.3930, 171.2510 · Timaru, Timaru District, Canterbury, 7910, New Zealand
  - -44.5403, 169.3126 · Timaru River, Queenstown-Lakes District, Otago, New Zealand
- **Wichita, US** (2 Turniere) — 3 verschiedene Orte:
  - 37.6922, -97.3375 · Wichita, Sedgwick County, Kansas, United States
  - 33.9517, -98.7089 · Wichita County, Texas, United States
  - 38.4482, -101.3353 · Wichita County, Kansas, United States
- **Rochester, US** (2 Turniere) — 5 verschiedene Orte:
  - 43.1573, -77.6152 · City of Rochester, Monroe County, New York, United States
  - 44.0234, -92.4630 · Rochester, Olmsted County, Minnesota, United States
  - 43.3051, -70.9754 · Rochester, Strafford County, New Hampshire, United States
  - 42.6806, -83.1338 · Rochester, Oakland County, Michigan, 48307, United States
  - 41.0649, -86.2160 · Rochester, Fulton County, Indiana, 46975, United States
- **Harlingen, US** (2 Turniere) — 2 verschiedene Orte:
  - 26.1908, -97.6961 · Harlingen, Cameron County, Texas, 78550, United States
  - 40.4476, -74.6624 · Harlingen, Montgomery Township, Somerset County, New Jersey, 08502, United States
- **Newport, US** (2 Turniere) — 5 verschiedene Orte:
  - 41.4900, -71.3138 · Newport, Newport County, Rhode Island, 02840, United States
  - 39.0889, -84.4920 · Newport, Campbell County, Kentucky, 41071, United States
  - 44.6368, -124.0534 · Newport, Lincoln County, Oregon, United States
  - 44.9367, -72.2056 · Newport, Orleans County, Vermont, 05855, United States
  - 35.6067, -91.2830 · Newport, Jackson County, Arkansas, United States
- **Offenbach, DE** (1 Turniere) — 2 verschiedene Orte:
  - 50.1055, 8.7611 · Offenbach am Main, Hesse, Germany
  - 49.1960, 8.1928 · Offenbach an der Queich, Landkreis Südliche Weinstraße, Rhineland-Palatinate, 76877, Germany
- **Edwardsville, US** (2 Turniere) — 5 verschiedene Orte:
  - 38.8114, -89.9532 · Edwardsville, Madison County, Illinois, United States
  - 39.0611, -94.8197 · Edwardsville, Wyandotte County, Kansas, 66113, United States
  - 33.7073, -85.5091 · Edwardsville, Cleburne County, Alabama, 36261, United States
  - 41.2678, -75.9085 · Edwardsville, Luzerne County, Pennsylvania, United States
  - 39.3370, -84.0274 · Edwardsville, Harlan Township, Warren County, Ohio, United States
- **Sumter, US** (2 Turniere) — 4 verschiedene Orte:
  - 28.6690, -82.0764 · Sumter County, Florida, United States
  - 32.0485, -84.1862 · Sumter County, Georgia, United States
  - 32.5235, -88.1838 · Sumter County, Alabama, United States
  - 33.9204, -80.3415 · Sumter, Sumter County, South Carolina, United States
- **Buenos Aires, AR** (3 Turniere) — 2 verschiedene Orte:
  - -34.6096, -58.3888 · Buenos Aires, Comuna 1, Autonomous City of Buenos Aires, Argentina
  - -36.3790, -60.3856 · Buenos Aires, Argentina
- **Ithaca, US** (1 Turniere) — 4 verschiedene Orte:
  - 42.4374, -76.5484 · Town of Ithaca, Tompkins County, New York, United States
  - 43.2917, -84.6075 · Ithaca, Gratiot County, Michigan, United States
  - 39.9373, -84.5533 · Ithaca, Darke County, Ohio, United States
  - 41.1583, -96.5405 · Ithaca, Wahoo Township, Saunders County, Nebraska, United States
- **Claremont, US** (1 Turniere) — 5 verschiedene Orte:
  - 34.0967, -117.7198 · Claremont, Los Angeles County, California, 91711, United States
  - 43.3728, -72.3383 · Claremont, Sullivan County, New Hampshire, United States
  - 37.2279, -76.9641 · Claremont, Surry County, Virginia, 23899, United States
  - 45.6719, -98.0157 · Claremont, Claremont Township, Brown County, South Dakota, United States
  - 37.9185, -81.0507 · Claremont, Fayette County, West Virginia, 25936, United States
- **Porto Velho, BR** (2 Turniere) — 3 verschiedene Orte:
  - -8.7495, -63.8735 · Porto Velho, Rondônia, North Region, Brazil
  - -22.8366, -43.0914 · Porto Velho, Neves, São Gonçalo, Rio de Janeiro, Southeast Region, Brazil
  - -23.6180, -48.0879 · Porto Velho, Itapetininga, São Paulo, Southeast Region, 18207-720, Brazil
- **Wuxi, CN** (2 Turniere) — 2 verschiedene Orte:
  - 31.5777, 120.2953 · Wuxi City, Jiangsu, 214000, China
  - 31.5059, 109.3448 · Wuxi County, Chongqing, China
- **Trnava, SK** (2 Turniere) — 2 verschiedene Orte:
  - 48.3768, 17.5858 · Trnava, District of Trnava, Region of Trnava, Slovakia
  - 48.8167, 21.9335 · Trnava pri Laborci, District of Michalovce, Region of Košice, Slovakia
- **Pensacola, US** (2 Turniere) — 2 verschiedene Orte:
  - 30.4213, -87.2169 · Pensacola, Escambia County, Florida, United States
  - 36.4558, -95.1290 · Pensacola, Mayes County, Oklahoma, United States
- **São Leopoldo, BR** (1 Turniere) — 2 verschiedene Orte:
  - -29.7544, -51.1516 · São Leopoldo, Rio Grande do Sul, South Region, Brazil
  - -4.3819, -69.7073 · São Leopoldo, Benjamin Constant, Amazonas, North Region, Brazil
- **San Rafael, US** (1 Turniere) — 4 verschiedene Orte:
  - 37.9748, -122.5317 · San Rafael, Marin County, California, United States
  - 35.1123, -107.8824 · San Rafael, Cibola County, New Mexico, 87051, United States
  - 31.7373, -112.0243 · San Rafael, Chukut Kuk District, Pima County, Arizona, United States
  - 33.4669, -117.5957 · San Rafael, San Clemente, Orange County, California, 92673, United States
- **Yecla, ES** (1 Turniere) — 2 verschiedene Orte:
  - 38.6136, -1.1158 · Yecla, Altiplano, Region of Murcia, 30510, Spain
  - 40.9596, -6.4882 · Yecla de Yeltes, Salamanca, Castile and León, Spain
- **Criciúma, BR** (1 Turniere) — 2 verschiedene Orte:
  - -28.6790, -49.3696 · Criciúma, Santa Catarina, South Region, Brazil
  - -20.2176, -41.6192 · Criciúma, Ibatiba, Espírito Santo, Southeast Region, Brazil
- **Santa Fe, AR** (1 Turniere) — 2 verschiedene Orte:
  - -30.3155, -61.1645 · Santa Fe, Argentina
  - -31.6187, -60.7020 · Santa Fe, Departamento La Capital, Santa Fe, S3000, Argentina
- **Essen, DE** (1 Turniere) — 2 verschiedene Orte:
  - 51.4582, 7.0158 · Essen, North Rhine-Westphalia, Germany
  - 52.7222, 7.9356 · Essen (Oldenburg), Cloppenburg district, Lower Saxony, 49632, Germany
- **Villa María, AR** (4 Turniere) — 5 verschiedene Orte:
  - -32.4106, -63.2436 · Villa María, Municipio de Villa María, Pedanía Villa María, Departamento General San Martín, Córdoba, X5900, Argentina
  - -38.9684, -68.0632 · Villa María, Neuquén, Municipio de Neuquén, Departamento Confluencia, Neuquén, Argentina
  - -33.3488, -60.2326 · Villa María, San Nicolás de los Arroyos, Partido de San Nicolás, Buenos Aires, Argentina
  - -27.4451, -58.9977 · Villa María, Resistencia, Municipio de Resistencia, Departamento San Fernando, Chaco, Argentina
  - -34.5320, -59.1209 · Villa María, Luján, Partido de Luján, Buenos Aires, 6700, Argentina
- **Leme, BR** (1 Turniere) — 4 verschiedene Orte:
  - -22.1845, -47.3853 · Leme, São Paulo, Southeast Region, Brazil
  - -22.9617, -43.1669 · Leme, Rio de Janeiro, Southeast Region, Brazil
  - -7.0137, -42.1192 · Leme, Oeiras, Piauí, Northeast Region, 64500-000, Brazil
  - -19.9867, -44.4281 · Mateus Leme, Minas Gerais, Southeast Region, 35670-000, Brazil
- **Cleveland, US** (2 Turniere) — 5 verschiedene Orte:
  - 41.4997, -81.6937 · Cleveland, Cuyahoga County, Ohio, United States
  - 35.2302, -97.3109 · Cleveland County, Oklahoma, United States
  - 33.7440, -90.7248 · Cleveland, Bolivar County, Mississippi, 38732, United States
  - 33.8847, -92.1725 · Cleveland County, Arkansas, United States
  - 35.1595, -84.8766 · Cleveland, Bradley County, East Tennessee, Tennessee, United States
- **Quinta do Lago, PT** (1 Turniere) — 3 verschiedene Orte:
  - 37.8037, -8.6849 · Quinta do Lago, Cercal, Santiago do Cacém, Setúbal, 7555-019, Portugal
  - 38.8252, -9.2635 · Quinta do Lago, Almornos, Aruil de Baixo, Almargem do Bispo, Sintra, Lisbon, Portugal
  - 37.0462, -8.0190 · Quinta do Lago, Almancil, Loulé, Faro, 8135-024, Portugal
- **Durham, US** (1 Turniere) — 4 verschiedene Orte:
  - 35.9967, -78.9018 · Durham, Durham County, North Carolina, United States
  - 43.1214, -70.9177 · Durham, Strafford County, New Hampshire, 03824, United States
  - 38.4851, -97.2282 · Durham, Marion County, Kansas, 67438, United States
  - 41.4818, -72.6812 · Durham, Lower Connecticut River Valley Planning Region, Connecticut, 06422, United States
- **Austin, US** (2 Turniere) — 5 verschiedene Orte:
  - 30.2711, -97.7437 · Austin, Travis County, Texas, United States
  - 29.8916, -96.2443 · Austin County, Texas, United States
  - 43.6680, -92.9746 · Austin, Mower County, Minnesota, 55912, United States
  - 39.4930, -117.0714 · Austin, Lander County, Nevada, United States
  - 34.9984, -91.9838 · Austin, Lonoke County, Arkansas, 72007, United States
- **Bistrita, RO** (1 Turniere) — 4 verschiedene Orte:
  - 47.1327, 24.4964 · Bistrița, Bistrița-Năsăud, 420048, Romania
  - 47.0958, 25.9468 · Bistrița, Romania
  - 45.1736, 24.0467 · Bistrița, Costești, Vâlcea, 247116, Romania
  - 44.5851, 22.7876 · Bistrița, Hinova, Mehedinți, 227246, Romania
- **Maceió, BR** (1 Turniere) — 2 verschiedene Orte:
  - -9.6477, -35.7339 · Maceió, Alagoas, Northeast Region, Brazil
  - -22.9143, -43.0695 · Maceió, Região Pendotiba, Niterói, Rio de Janeiro, Southeast Region, Brazil
- **Urbana, US** (1 Turniere) — 4 verschiedene Orte:
  - 40.1117, -88.2073 · Urbana, Champaign County, Illinois, United States
  - 40.1084, -83.7524 · Urbana, Champaign County, Ohio, 43078, United States
  - 42.2238, -91.8755 · Urbana, Polk Township, Benton County, Iowa, 52345, United States
  - 39.3206, -77.3416 · Urbana, Frederick County, Maryland, 21704, United States
- **Solapur, IN** (1 Turniere) — 2 verschiedene Orte:
  - 17.8499, 75.2763 · Solapur District, Maharashtra, India
  - 17.6700, 75.9008 · Solapur, Solapur North, Solapur District, Maharashtra, 413001, India
- **Little Rock, US** (2 Turniere) — 5 verschiedene Orte:
  - 34.7465, -92.2896 · Little Rock, Big Rock Township, Pulaski County, Arkansas, United States
  - 43.4440, -95.8832 · Little Rock, Lyon County, Iowa, United States
  - 41.7177, -88.5770 · Little Rock, Little Rock Township, Kendall County, Illinois, United States
  - 32.5260, -89.0253 · Little Rock, Newton County, Mississippi, 39337, United States
  - 34.4766, -79.4031 · Little Rock, Dillon County, South Carolina, United States
- **Sao Luis, BR** (1 Turniere) — 3 verschiedene Orte:
  - -2.5295, -44.2964 · São Luís, Maranhão, Northeast Region, Brazil
  - -3.7654, -64.1135 · Sao Luis, Coari, Amazonas, North Region, 69460-000, Brazil
  - 4.4255, -61.1415 · Sao Luis, Pacaraima, Roraima, North Region, Brazil
- **Sibenik, HR** (1 Turniere) — 2 verschiedene Orte:
  - 43.7341, 15.8945 · Grad Šibenik, Šibenik-Knin County, Croatia
  - 45.8121, 17.1830 · Sibenik, Općina Veliki Grđevac, Bjelovar-Bilogora County, Croatia
- **Fayetteville, US** (2 Turniere) — 5 verschiedene Orte:
  - 36.0626, -94.1574 · Fayetteville, Washington County, Arkansas, United States
  - 35.0526, -78.8783 · Fayetteville, Cumberland County, North Carolina, United States
  - 33.4487, -84.4549 · Fayetteville, Fayette County, Georgia, United States
  - 29.9052, -96.6751 · Fayetteville, Fayette County, Texas, United States
  - 38.3775, -89.7954 · Fayetteville, Saint Clair County, Illinois, United States
- **Phoenix, US** (2 Turniere) — 5 verschiedene Orte:
  - 33.4484, -112.0741 · Phoenix, Maricopa County, Arizona, United States
  - 41.6147, -87.6324 · Phoenix, Thornton Township, Cook County, Illinois, United States
  - 43.2309, -76.3002 · Village of Phoenix, Town of Schroeppel, Oswego County, New York, United States
  - 42.2740, -122.8153 · Phoenix, Jackson County, Oregon, 97535, United States
  - 39.5164, -76.6178 · Phoenix, Baltimore County, Maryland, 21030, United States
- **Dallas, US** (2 Turniere) — 4 verschiedene Orte:
  - 32.7763, -96.7969 · Dallas, Dallas County, Texas, United States
  - 41.6744, -94.0394 · Dallas County, Iowa, United States
  - 37.6833, -93.0219 · Dallas County, Missouri, United States
  - 32.3118, -87.1047 · Dallas County, Alabama, United States
- **Winnipeg, CA** (2 Turniere) — 2 verschiedene Orte:
  - 49.8955, -97.1385 · Winnipeg, Manitoba, Canada
  - 52.1190, -97.9692 · Lake Winnipeg, Manitoba, Canada
- **Suzhou, CN** (1 Turniere) — 3 verschiedene Orte:
  - 31.3111, 120.6213 · Suzhou City, Jiangsu, China
  - 33.6482, 116.9588 · Suzhou, Anhui, China
  - 39.5785, 98.8123 · Suzhou District, Jiuquan Prefecture, Gansu, 735000, China
- **Berkeley, US** (1 Turniere) — 5 verschiedene Orte:
  - 37.8708, -122.2729 · Berkeley, Alameda County, California, United States
  - 39.4535, -78.0396 · Berkeley County, West Virginia, United States
  - 33.1596, -79.9070 · Berkeley County, South Carolina, United States
  - 41.8889, -87.9034 · Berkeley, Proviso Township, Cook County, Illinois, 60163, United States
  - 38.7545, -90.3312 · Berkeley, Saint Louis County, Missouri, 63134, United States
- **Azul, AR** (1 Turniere) — 2 verschiedene Orte:
  - -36.7775, -59.8634 · Azul, Partido de Azul, Buenos Aires, B7300, Argentina
  - -22.7059, -62.3489 · Azul, Municipio de Santa Victoria Este, Rivadavia, Salta, Argentina
- **Anning, CN** (2 Turniere) — 3 verschiedene Orte:
  - 24.8377, 102.4027 · Anning City, Kunming, Yunnan, 650300, China
  - 36.1199, 103.6756 · Anning District, Lanzhou Prefecture, Gansu, 730079, China
  - 27.9649, 102.1894 · Anning, Xichang City, Liangshan, Sichuan, China
- **Villa Constitución, AR** (1 Turniere) — 2 verschiedene Orte:
  - -33.2272, -60.3298 · Municipio de Villa Constitución, Departamento Constitución, Santa Fe, Argentina
  - -34.6722, -58.4234 · Villa Constitución, Valentín Alsina, Partido de Lanús, Buenos Aires, Argentina
- **Jiujiang, CN** (1 Turniere) — 5 verschiedene Orte:
  - 29.3886, 115.3820 · Jiujiang, Jiangxi, China
  - 29.6654, 115.9475 · Jiujiang, Xunyang District, Jiujiang, Jiangxi, China
  - 31.3718, 118.3860 · Jiujiang District, Wuhu, Anhui, China
  - 22.8343, 112.9882 · Jiujiang, Nanhai District, Foshan, Guangdong, 520203, China
  - 30.6223, 103.9134 · Jiujiang, Shuangliu District, Chengdu, Sichuan, China
- **Itajaí, BR** (1 Turniere) — 3 verschiedene Orte:
  - -26.9047, -48.6553 · Itajaí, Santa Catarina, South Region, Brazil
  - -14.9564, -40.1742 · Itajaí, Nova Canaã, Bahia, Northeast Region, Brazil
  - -13.7573, -39.1528 · Itajaí, Ituberá, Bahia, Northeast Region, 45435-000, Brazil
- **Cochabamba, BO** (1 Turniere) — 2 verschiedene Orte:
  - -17.4012, -66.1676 · Cochabamba, Juan De La Rosa, Molle, Cochabamba, Cercado, Cochabamba, Bolivia
  - -17.3330, -65.5011 · Cochabamba, Bolivia
- **Templeton, US** (1 Turniere) — 4 verschiedene Orte:
  - 41.9185, -94.9430 · Templeton, Eden Township, Carroll County, Iowa, United States
  - 42.5557, -72.0674 · Templeton, Worcester County, Massachusetts, United States
  - 35.5605, -120.7008 · Templeton, San Luis Obispo County, California, 93465, United States
  - 40.9173, -79.4609 · Templeton, Mahoning, Pine Township, Armstrong County, Pennsylvania, 16259, United States
- **Redbridge, GB** (1 Turniere) — 2 verschiedene Orte:
  - 51.5763, 0.0454 · Redbridge, Eastern Avenue, Redbridge, London Borough of Redbridge, Greater London, England, IG4 5DQ, United Kingdom
  - 50.9205, -1.4687 · Redbridge, Southampton, England, SO15 0LQ, United Kingdom
- **Allershausen, DE** (1 Turniere) — 2 verschiedene Orte:
  - 48.4334, 11.6001 · Allershausen, Allershausen (VGem), Landkreis Freising, Bavaria, 85391, Germany
  - 51.6508, 9.6511 · Allershausen, Uslar, Landkreis Northeim, Lower Saxony, Germany
- **Tauranga, NZ** (1 Turniere) — 3 verschiedene Orte:
  - -37.6859, 176.1675 · Tauranga, Tauranga City, Bay of Plenty, 3110, New Zealand
  - -38.3236, 177.1223 · Tauranga River, Whakatāne District, Bay of Plenty, New Zealand
  - -39.2852, 176.0102 · Tauranga, Rangitīkei District, Manawatū-Whanganui, New Zealand

## Nicht gefunden

- Sharm ElSheikh, EG (24 Turniere)
- Tsaghkadzor (Cancelled), AM (2 Turniere)
- Nouméa, NC (2 Turniere)
- Berlin (Cancelled), DE (1 Turniere)
- Qian Daohu, CN (2 Turniere)
- Ismaning (Cancelled), DE (1 Turniere)
- Hong Kong, HK (2 Turniere)
- Harmon, GU (2 Turniere)

## Falsches Land (Treffer lag ausserhalb des angegebenen Landes)

Keine.

## Fehler / keine Antwort

Keine.

## Alle aufgeloesten Orte

| Ort | Land | lat | lon | Turniere |
|---|---|---:|---:|---:|
| Singapore | SG | 1.35711 | 103.81950 | 8 |
| Mar Del Plata | AR | -37.99762 | -57.54821 | 1 |
| Bol | HR | 43.26052 | 16.65202 | 4 |
| KURSUMLIJSKA BANJA | RS | 43.05788 | 21.25505 | 6 |
| Erwitte | DE | 51.61431 | 8.33967 | 1 |
| Kigali | RW | -1.95344 | 30.11401 | 2 |
| Karlovy Vary | CZ | 50.23062 | 12.87014 | 1 |
| Nanao | JP | 37.05211 | 136.94646 | 1 |
| Maanshan | CN | 31.68661 | 118.50484 | 5 |
| Tsaghkadzor | AM | 40.51535 | 44.67215 | 2 |
| Pazardzhik | BG | 42.14868 | 24.15319 | 1 |
| Hilton Head Island | US | 32.16185 | -80.75126 | 1 |
| Mumbai | IN | 19.05500 | 72.86920 | 1 |
| Krakow | PL | 50.06195 | 19.93686 | 2 |
| Monastir | TN | 35.77076 | 10.82805 | 20 |
| Prague | CZ | 50.08747 | 14.42125 | 1 |
| Hurghada | EG | 27.22256 | 33.83071 | 8 |
| Paris | FR | 48.85889 | 2.32004 | 2 |
| Villeneuve d'Ascq | FR | 50.61932 | 3.13140 | 1 |
| Antalya | TR | 36.88657 | 30.70302 | 16 |
| Nakhon Pathom | TH | 13.89184 | 100.01657 | 6 |
| Lagos | NG | 6.45506 | 3.39418 | 4 |
| Oldenzaal | NL | 52.31166 | 6.92416 | 2 |
| Heraklion | GR | 35.33908 | 25.13328 | 14 |
| Birmingham | GB | 52.49490 | -1.85184 | 1 |
| Pecs | HU | 46.07651 | 18.22803 | 1 |
| New Braunfels, TX | US | 29.70283 | -98.12573 | 1 |
| Hilton Head Island, SC | US | 32.16185 | -80.75126 | 1 |
| Liberec | CZ | 50.77026 | 15.05839 | 1 |
| PIROT | RS | 43.15473 | 22.58650 | 1 |
| Wollongong | AU | -34.42781 | 150.89305 | 2 |
| Szabolcsveresmart | HU | 48.29244 | 22.01981 | 2 |
| Barueri | BR | -23.51122 | -46.87646 | 1 |
| Lausanne | CH | 46.52183 | 6.63270 | 1 |
| Poitiers | FR | 46.58026 | 0.34020 | 1 |
| Setúbal | PT | 38.52418 | -8.89323 | 1 |
| Grodzisk Mazowiecki | PL | 52.10662 | 20.63134 | 1 |
| Montreal | CA | 45.50318 | -73.56981 | 1 |
| SANTANDER | ES | 43.46189 | -3.81003 | 1 |
| Nonthaburi | TH | 13.86109 | 100.34568 | 2 |
| Madrid | ES | 40.41678 | -3.70351 | 2 |
| Bali | ID | -8.22713 | 115.19192 | 4 |
| Santa Margherita di Pula | IT | 38.95810 | 8.95927 | 12 |
| Las Vegas, NV | US | 36.16743 | -115.14841 | 2 |
| San Gregorio di Catania | IT | 37.56525 | 15.11179 | 2 |
| VISERBA DI RIMINI | IT | 44.08514 | 12.53486 | 1 |
| Idanha-a-Nova | PT | 39.92609 | -7.24364 | 1 |
| Tanagura | JP | 37.02991 | 140.37955 | 1 |
| Pécs | HU | 46.07651 | 18.22803 | 1 |
| Tianjin | CN | 39.30326 | 117.41636 | 3 |
| Stara Zagora | BG | 42.42481 | 25.62575 | 1 |
| Täby | SE | 59.46705 | 18.06585 | 1 |
| Bucharest | RO | 44.43614 | 26.10268 | 1 |
| Ann Arbor | US | 42.28137 | -83.74846 | 1 |
| Pontevedra | ES | 42.42806 | -8.60414 | 1 |
| Kyoto | JP | 35.01158 | 135.76814 | 1 |
| Bradenton, FL | US | 27.49893 | -82.57482 | 1 |
| Taipei | TW | 25.03752 | 121.56368 | 2 |
| Verbier | CH | 46.09610 | 7.22868 | 2 |
| Sintra | PT | 38.83554 | -9.35224 | 2 |
| Trois-Rivières | CA | 46.34323 | -72.54285 | 1 |
| Maceio | BR | -9.64768 | -35.73393 | 1 |
| Rabat | MA | 34.02185 | -6.84089 | 1 |
| Cherbourg-en-Cotentin | FR | 49.64253 | -1.62496 | 1 |
| Plovdiv | BG | 42.14185 | 24.74993 | 2 |
| Lexington, SC | US | 33.89868 | -81.27505 | 1 |
| Mazatlan | MX | 23.20358 | -106.42084 | 1 |
| Buzau | RO | 45.26926 | 26.77482 | 1 |
| Nevers | FR | 46.98766 | 3.15772 | 1 |
| Tamworth | AU | -31.09007 | 150.92902 | 2 |
| Shenyang | CN | 41.80261 | 123.42791 | 1 |
| Lousada | PT | 41.27738 | -8.28263 | 2 |
| Alcala de Henares | ES | 40.48195 | -3.36398 | 1 |
| Baku | AZ | 40.37559 | 49.83280 | 2 |
| Incheon | KR | 37.45600 | 126.70520 | 1 |
| Rodez | FR | 44.35114 | 2.57285 | 1 |
| Burgas | BG | 42.49366 | 27.47213 | 3 |
| REUS | ES | 41.15556 | 1.10761 | 1 |
| Sabadell | ES | 41.54608 | 2.10832 | 1 |
| Båstad | SE | 56.42690 | 12.86088 | 1 |
| Quebec City | CA | 46.81374 | -71.20841 | 1 |
| Fiano Romano | IT | 42.17191 | 12.59273 | 1 |
| Wrexham | GB | 53.04651 | -2.99379 | 1 |
| Évora | PT | 38.57077 | -7.90928 | 1 |
| Huamantla | MX | 19.32333 | -97.91457 | 2 |
| Leiria | PT | 39.74379 | -8.80711 | 1 |
| Wagga Wagga | AU | -35.11500 | 147.36778 | 2 |
| Telavi | GE | 41.91972 | 45.47032 | 2 |
| Tallahassee | US | 30.43808 | -84.28093 | 1 |
| VALENCIA | ES | 39.46971 | -0.37634 | 1 |
| Hradec Kralove | CZ | 50.20921 | 15.83275 | 1 |
| Brasov | RO | 45.65251 | 25.61057 | 2 |
| Székesfehérvár | HU | 47.19102 | 18.41081 | 1 |
| Baza | ES | 37.42816 | -2.84755 | 1 |
| Wanfercée-Baulet | BE | 50.47587 | 4.58157 | 1 |
| Slovenj Gradec | SI | 46.50914 | 15.07907 | 1 |
| Weston, FL | US | 26.10034 | -80.39951 | 1 |
| Selva Gardena | IT | 46.55519 | 11.76010 | 2 |
| Asuncion | PY | -25.28005 | -57.63438 | 1 |
| Boca Raton | US | 26.35869 | -80.08310 | 1 |
| Tashkent | UZ | 41.31234 | 69.27871 | 2 |
| Plaisir | FR | 48.81740 | 1.94764 | 1 |
| Reims | FR | 49.25779 | 4.03193 | 1 |
| Brisbane | AU | -27.46896 | 153.02350 | 1 |
| Adelaide | AU | -34.92818 | 138.59993 | 1 |
| Vienna | AT | 48.20835 | 16.37250 | 1 |
| Loule | PT | 37.13995 | -8.02332 | 1 |
| Chihuahua | MX | 28.50000 | -106.00000 | 1 |
| Sapporo | JP | 43.06194 | 141.35429 | 1 |
| Lesa (NO) | IT | 45.82964 | 8.56486 | 1 |
| Columbia, SC | US | 34.00075 | -81.03523 | 1 |
| Cap d'Agde | FR | 43.28454 | 3.51178 | 2 |
| Chisinau | MD | 47.02451 | 28.83229 | 2 |
| Constanta | RO | 44.17672 | 28.65076 | 1 |
| Bytom | PL | 50.36529 | 18.87226 | 1 |
| Alcalá de Henares | ES | 40.48195 | -3.36398 | 1 |
| Arad | RO | 46.17538 | 21.31963 | 1 |
| Funchal | PT | 32.64965 | -16.90868 | 1 |
| Glasgow | GB | 55.86115 | -4.25017 | 1 |
| ISTANBUL | TR | 41.00638 | 28.97587 | 1 |
| Lagos | PT | 37.10280 | -8.67287 | 1 |
| Yinchuan | CN | 38.48717 | 106.22666 | 1 |
| Quito | EC | -0.22016 | -78.51233 | 2 |
| Casablanca | MA | 33.59451 | -7.62003 | 1 |
| Oviedo | ES | 43.35335 | -5.87951 | 1 |
| Falun | SE | 60.60701 | 15.63231 | 1 |
| villena | ES | 38.63610 | -0.86597 | 1 |
| Bologna | IT | 44.49382 | 11.34263 | 1 |
| TRIESTE | IT | 45.64965 | 13.77728 | 1 |
| Las Palmas de Gran Canaria | ES | 28.12887 | -15.43490 | 1 |
| Guadalajara | MX | 20.67204 | -103.33840 | 1 |
| Trelew | AR | -43.25312 | -65.30944 | 2 |
| MELILLA | ES | 35.29187 | -2.94090 | 2 |
| Marsa | MT | 35.88289 | 14.49449 | 2 |
| Hamamatsu | JP | 34.71098 | 137.72594 | 1 |
| Varna | BG | 43.20739 | 27.91667 | 1 |
| Port St. Lucie, FL | US | 27.29393 | -80.35033 | 1 |
| Seville | ES | 37.38863 | -5.99534 | 1 |
| Campos do Jordão | BR | -22.73830 | -45.59038 | 1 |
| Sheffield | GB | 53.38066 | -1.47023 | 1 |
| Stillwater, OK | US | 36.11563 | -97.05857 | 1 |
| Saint-Palais-sur-Mer | FR | 45.64288 | -1.08600 | 1 |
| Forbach | FR | 49.18628 | 6.89586 | 1 |
| Urayasu | JP | 35.65391 | 139.90256 | 1 |
| Maribor | SI | 46.55764 | 15.64559 | 1 |
| Meerbusch | DE | 51.26522 | 6.67610 | 1 |
| POZZUOLI | IT | 40.82264 | 14.12191 | 1 |
| Torelló | ES | 42.04783 | 2.26434 | 1 |
| Sydney | AU | -33.86984 | 151.20828 | 1 |
| Sarreguemines | FR | 49.10948 | 7.07089 | 1 |
| Poznan | PL | 52.40066 | 16.91973 | 1 |
| Yeongwol | KR | 37.18350 | 128.46198 | 2 |
| Paranavaí | BR | -23.08165 | -52.46172 | 1 |
| Zlatibor | RS | 43.67424 | 19.61246 | 1 |
| Ortisei | IT | 46.57521 | 11.67214 | 1 |
| yanagawa city | JP | 33.15532 | 130.40052 | 1 |
| Bagnères-de-Bigorre | FR | 43.06582 | 0.15309 | 1 |
| Ithaca, NY | US | 42.43742 | -76.54837 | 1 |
| San Diego, CA | US | 32.71742 | -117.16277 | 1 |
| Ueberlingen | DE | 47.76645 | 9.16051 | 1 |
| Darwin | AU | -12.46044 | 130.84105 | 2 |
| Budapest | HU | 47.49788 | 19.04024 | 1 |
| Pardubice | CZ | 50.03858 | 15.77914 | 1 |
| João Pessoa | BR | -7.12160 | -34.88203 | 2 |
| Gijon | ES | 43.54494 | -5.66275 | 1 |
| Nules | ES | 39.85323 | -0.15501 | 1 |
| Toronto | CA | 43.65348 | -79.38393 | 1 |
| Dijon | FR | 47.32158 | 5.04147 | 1 |
| Badalona | ES | 41.44935 | 2.24825 | 1 |
| LOGROÑO | ES | 42.46612 | -2.43967 | 1 |
| Zaragoza | ES | 41.69158 | -0.91013 | 1 |
| Le Neubourg | FR | 49.14956 | 0.90417 | 1 |
| Ceuta | ES | 35.88836 | -5.30414 | 1 |
| Petange | LU | 49.55049 | 5.85725 | 1 |

## Hinweise

- Trockenlauf ist Voreinstellung. Scharf: `--write`. Danach `resolve-tournaments.mjs --write` schreibt aus den Claims in den Stamm.
- Idempotenz: Claims upsert onConflict (tournament_id,field_name,source,field_value) ignoreDuplicates; ROHtreffer in scripts/.geocode-cache.json gecacht.
- Rate-Limit: >= 1100 ms je Netz-Anfrage, Einzel-Thread. Mehrdeutige/fehlende Orte werden gelistet, nicht geraten.
- Mehrdeutigkeit: Treffer >50 km auseinander gelten als verschiedene Orte; nähere OSM-Knoten derselben Stadt werden zusammengeführt.
