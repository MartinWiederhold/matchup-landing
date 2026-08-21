# Geocodierung Turniere — SCHARFER LAUF

> Erzeugt von `scripts/geocode-tournaments.mjs`. Quelle: **Nominatim / OpenStreetMap**
> Richtlinie: https://operations.osmfoundation.org/policies/nominatim/ · Attribution "© OpenStreetMap contributors".
> Koordinaten sind eine **Ableitung** aus Stadt+Land → Claim-Quelle `nominatim`, confidence 0.6 (< Beobachtung 0.9).

## Zusammenfassung

| | Anzahl |
|---|---:|
| Turniere ohne Koordinaten | 651 |
| Distinkte Orte (Stadt+Land) | 381 |
| **abgefragt (fertig)** | 381 |
| noch offen (--limit) | 0 |
| aufgeloest | 215 |
| mehrdeutig | 154 |
| nicht gefunden | 12 |
| falsches Land | 0 |
| Fehler/keine Antwort | 0 |
| Netz-Abfragen in diesem Lauf | 0 (Cache: 381) |

**Wuerde geschrieben:** 638 Claims (je aufgeloestem Ort x Turnieranzahl x 2 Felder) fuer 215 Orte / 319 Turniere.

**Geschrieben:** 638 Claims ok, 0 Fehler (von 638).

## Stichprobe: 10 aufgeloeste Orte (zur Pruefung)

| Ort | Land | lat | lon | Turniere | OSM |
|---|---|---:|---:|---:|---|
| Augsburg | DE | 48.36903 | 10.89795 | 1 | https://www.openstreetmap.org/relation/62407 |
| Kreuzlingen | CH | 47.64644 | 9.17256 | 1 | https://www.openstreetmap.org/relation/1684537 |
| Accra | GH | 5.55711 | -0.20124 | 6 | https://www.openstreetmap.org/relation/12803764 |
| Phan Thiet | VN | 10.94184 | 108.08231 | 2 | https://www.openstreetmap.org/node/2283324650 |
| Loughborough | GB | 52.77239 | -1.20780 | 3 | https://www.openstreetmap.org/node/10021975 |
| Repentigny | CA | 45.73261 | -73.45283 | 1 | https://www.openstreetmap.org/relation/7706380 |
| Bulawayo | ZW | -20.10539 | 28.54269 | 2 | https://www.openstreetmap.org/relation/3337019 |
| Cholpon-Ata | KG | 42.64171 | 77.06652 | 2 | https://www.openstreetmap.org/way/123651264 |
| San Pedro Sula | HN | 15.50535 | -88.02508 | 1 | https://www.openstreetmap.org/relation/6057211 |
| Shenzhen | CN | 22.54457 | 114.05454 | 1 | https://www.openstreetmap.org/relation/3464353 |

## Mehrdeutige Orte (NICHT uebernommen — bitte pruefen)

- **Santa Cruz, BO** (4 Turniere) — 2 verschiedene Orte:
  - -17.7834, -63.1821 · Santa Cruz de la Sierra, Provincia Andrés Ibáñez, Santa Cruz, Bolivia
  - -17.3333, -61.5000 · Santa Cruz, Bolivia
- **Orlando, US** (9 Turniere) — 2 verschiedene Orte:
  - 28.5421, -81.3790 · Orlando, Orange County, Florida, United States
  - 36.1489, -97.3781 · Orlando, Logan County, Oklahoma, United States
- **Pilar, AR** (1 Turniere) — 3 verschiedene Orte:
  - -34.4571, -58.9142 · Pilar, Partido del Pilar, Buenos Aires, Argentina
  - -31.6814, -63.8824 · Pilar, Municipio de Pilar, Pedanía Pilar, Departamento Río Segundo, Córdoba, X5972, Argentina
  - -31.4401, -61.2598 · Municipio de Pilar, Departamento Las Colonias, Santa Fe, S3085, Argentina
- **Wuning, CN** (14 Turniere) — 2 verschiedene Orte:
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
- **São Paulo, BR** (5 Turniere) — 3 verschiedene Orte:
  - -23.5507, -46.6334 · São Paulo, Southeast Region, Brazil
  - -1.2043, -47.1584 · São Paulo, Capanema, Pará, North Region, 68700-540, Brazil
  - -22.0703, -48.4334 · São Paulo, Southeast Region, Brazil
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
- **Metepec, MX** (3 Turniere) — 2 verschiedene Orte:
  - 19.2511, -99.5937 · Metepec, State of Mexico, Mexico
  - 20.2587, -98.3447 · Metepec, Hidalgo, Mexico
- **Lima, PE** (13 Turniere) — 2 verschiedene Orte:
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
- **Trnava, SK** (1 Turniere) — 2 verschiedene Orte:
  - 48.3768, 17.5858 · Trnava, District of Trnava, Region of Trnava, Slovakia
  - 48.8167, 21.9335 · Trnava pri Laborci, District of Michalovce, Region of Košice, Slovakia
- **Ponts de Ce, FR** (1 Turniere) — 2 verschiedene Orte:
  - 47.4252, -0.5257 · Château des Ponts de Cé, Rue Charles de Gaulle, La Filerie, Les Ponts-de-Cé, Angers, Maine-et-Loire, Pays de la Loire, Metropolitan France, 49130, France
  - 50.7184, 1.6135 · Rue des Deux Ponts, Bréquerecque, Boulogne-sur-Mer, Pas-de-Calais, Hauts-de-France, Metropolitan France, 62200, France
- **Heiveld, BE** (1 Turniere) — 2 verschiedene Orte:
  - 50.7950, 5.5331 · Heiveld, Genoelselderen, Riemst, Tongeren, Limburg, Flanders, 3770, Belgium
  - 51.1423, 4.3887 · Heiveld, Bruynenbaert, Ysselaar, Aartselaar, Antwerp, Flanders, 2630, Belgium
- **Kunshan, CN** (1 Turniere) — 3 verschiedene Orte:
  - 31.3869, 120.9765 · Kunshan, Suzhou City, Jiangsu, China
  - 31.0278, 117.5880 · Kunshan, Wuwei, Wuhu, Anhui, 238300, China
  - 33.8000, 114.5458 · Kunshan Subdistrict, Xihua County, Zhoukou, Henan, China
- **Panama, PA** (4 Turniere) — 3 verschiedene Orte:
  - 8.5596, -81.1308 · Panama
  - 8.9714, -79.5342 · Panama City, Calidonia, Distrito de Panamá, Panamá Province, 0843, Panama
  - 8.1942, -79.1925 · Panamá Province, Panama
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
- **Dallas, US** (3 Turniere) — 4 verschiedene Orte:
  - 32.7763, -96.7969 · Dallas, Dallas County, Texas, United States
  - 41.6744, -94.0394 · Dallas County, Iowa, United States
  - 37.6833, -93.0219 · Dallas County, Missouri, United States
  - 32.3118, -87.1047 · Dallas County, Alabama, United States
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
- **Luan, CN** (2 Turniere) — 2 verschiedene Orte:
  - 39.7630, 118.6588 · Luanzhou City, Tangshan, Hebei, China
  - 49.2125, 119.7370 · Hulunbuir, Inner Mongolia, China
- **La Paz, BO** (3 Turniere) — 2 verschiedene Orte:
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
- **Silla, ES** (1 Turniere) — 2 verschiedene Orte:
  - 39.3632, -0.4113 · Silla, l'Horta Sud, Valencia, Valencian Community, 46460, Spain
  - 36.6991, -5.4941 · Silla, Ubrique, Sierra de Cádiz, Cádiz, Andalusia, 11600, Spain
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
- **Minneapolis, US** (1 Turniere) — 2 verschiedene Orte:
  - 44.9773, -93.2655 · Minneapolis, Hennepin County, Minnesota, United States
  - 39.1224, -97.7087 · Minneapolis, Ottawa County, Kansas, United States
- **Serra Negra, BR** (1 Turniere) — 4 verschiedene Orte:
  - -22.6126, -46.7000 · Serra Negra, São Paulo, Southeast Region, Brazil
  - -19.8807, -44.2432 · Serra Negra, Esmeraldas, Minas Gerais, Southeast Region, 32618-488, Brazil
  - -21.6479, -45.4952 · Serra Negra, Elói Mendes, Minas Gerais, Southeast Region, Brazil
  - -21.4551, -44.8790 · Serra Negra, Ingaí, Minas Gerais, Southeast Region, Brazil
- **Rajshahi, BD** (1 Turniere) — 2 verschiedene Orte:
  - 24.6285, 89.0377 · Rajshahi Division, Bangladesh
  - 24.3716, 88.5921 · Rajshahi, Rajshahi District, Rajshahi Division, 6000, Bangladesh
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
- **JAIPUR, IN** (1 Turniere) — 2 verschiedene Orte:
  - 26.9155, 75.8190 · Jaipur, Jaipur Municipal Corporation, Jaipur Tehsil, Jaipur, Rajasthan, 302001, India
  - 23.4732, 86.1364 · Jaipur, Purulia, West Bengal, India
- **Guatemala, GT** (2 Turniere) — 2 verschiedene Orte:
  - 15.5856, -90.3458 · Guatemala
  - 14.6416, -90.5133 · Guatemala City, Zona 2, Guatemala Department, Guatemala
- **Naples, US** (6 Turniere) — 4 verschiedene Orte:
  - 26.1422, -81.7943 · Naples, Collier County, Florida, United States
  - 33.2032, -94.6802 · Naples, Morris County, Texas, 75568, United States
  - 42.6161, -77.4030 · Town of Naples, Ontario County, New York, 14512, United States
  - 43.9695, -70.6051 · Naples, Cumberland County, Maine, 04055, United States
- **Jinan, CN** (2 Turniere) — 2 verschiedene Orte:
  - 36.6520, 117.1138 · Jinan, Shandong, China
  - 31.7518, 116.5342 · Jin'an District, Lu'an, Anhui, China
- **Meknes, MA** (1 Turniere) — 2 verschiedene Orte:
  - 33.8984, -5.5322 · Meknes, Pachalik de Meknes, Meknès Prefecture, Fez-Meknes, Morocco
  - 33.8333, -4.8556 · Fez-Meknes, Morocco
- **Villavicencio, CO** (1 Turniere) — 2 verschiedene Orte:
  - 4.1115, -73.4968 · Villavicencio, Meta, RAP (Especial) Central, Colombia
  - 4.8112, -75.6841 · Villavicencio, AMCO, Area Metropolitana Centro Occidente, Pereira, Risaralda, RAP Eje Cafetero, Colombia
- **Eau Claire, US** (1 Turniere) — 3 verschiedene Orte:
  - 44.8113, -91.4985 · Eau Claire, Eau Claire County, Wisconsin, United States
  - 41.1362, -79.7981 · Eau Claire, Butler County, Pennsylvania, 16030, United States
  - 41.9850, -86.2997 · Eau Claire, Berrien County, Michigan, United States
- **Rio de Janeiro, BR** (3 Turniere) — 2 verschiedene Orte:
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
- **Armenia, CO** (1 Turniere) — 2 verschiedene Orte:
  - 4.4920, -75.7414 · Armenia, Capital, Quindío, RAP Eje Cafetero, Colombia
  - 6.1562, -75.7870 · Armenia, Occidente, Antioquia, RAP del Agua y la Montaña, 055860, Colombia
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
- **Perth, AU** (4 Turniere) — 2 verschiedene Orte:
  - -31.9559, 115.8606 · Perth, Western Australia, 6000, Australia
  - -41.5730, 147.1720 · Perth, Tasmania, 7300, Australia
- **Veli Losinj, HR** (1 Turniere) — 2 verschiedene Orte:
  - 44.5211, 14.5017 · Veli Lošinj, Grad Mali Lošinj, Primorje-Gorski Kotar County, 51551, Croatia
  - 43.0723, 16.2260 · Veli Lošinj, Grad Vis, Split-Dalmatia County, 21480, Croatia
- **Columbus, US** (3 Turniere) — 5 verschiedene Orte:
  - 39.9623, -83.0007 · Columbus, Sharon, Franklin County, Ohio, United States
  - 32.4611, -84.9880 · Columbus, Muscogee County, Georgia, United States
  - 34.2814, -78.6666 · Columbus County, North Carolina, United States
  - 39.2014, -85.9214 · Columbus, Bartholomew County, Indiana, United States
  - 33.4957, -88.4273 · Columbus, Lowndes County, Mississippi, 39703, United States
- **Champaign, US** (4 Turniere) — 2 verschiedene Orte:
  - 40.1165, -88.2431 · Champaign, Champaign County, Illinois, United States
  - 40.1727, -83.7702 · Champaign County, Ohio, United States
- **Victoria, CA** (1 Turniere) — 4 verschiedene Orte:
  - 48.4283, -123.3650 · Victoria, Capital Regional District, British Columbia, Canada
  - 47.0515, -67.3295 · Victoria County, New Brunswick, Canada
  - 46.2170, -63.4932 · Rural Municipality of Victoria, Queens County, Prince Edward Island, C0A 2G0, Canada
  - 47.7679, -53.2212 · Victoria, Newfoundland, Newfoundland and Labrador, A0A 4G0, Canada
- **Yerba Buena, AR** (2 Turniere) — 2 verschiedene Orte:
  - -26.8122, -65.2982 · Yerba Buena, Departamento Yerba Buena, Tucumán, T4107, Argentina
  - -29.0060, -65.4630 · Yerba Buena, Municipio de Ancasti, Departamento Ancasti, Catamarca, K4701, Argentina
- **San Diego, US** (8 Turniere) — 2 verschiedene Orte:
  - 32.7174, -117.1628 · San Diego, San Diego County, California, United States
  - 27.7639, -98.2389 · San Diego, Duval County, Texas, United States
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
- **Aktobe, KZ** (2 Turniere) — 2 verschiedene Orte:
  - 50.2837, 57.2298 · Aktobe, Almaty District, Aqtöbe Region, Kazakhstan
  - 48.8078, 58.2342 · Aqtöbe Region, Kazakhstan
- **San Antonio, US** (1 Turniere) — 3 verschiedene Orte:
  - 29.4246, -98.4951 · San Antonio, Bexar County, Texas, United States
  - 28.3361, -82.2745 · San Antonio, Pasco County, Florida, United States
  - 33.9170, -106.8672 · San Antonio, Socorro County, New Mexico, United States
- **Bolzano, IT** (2 Turniere) — 2 verschiedene Orte:
  - 46.6559, 11.2302 · South Tyrol, Trentino – Alto Adige/Südtirol, Italy
  - 46.1639, 12.1868 · Bolzano Bellunese, Belluno, Veneto, 32100, Italy
- **College Park, US** (1 Turniere) — 2 verschiedene Orte:
  - 38.9807, -76.9369 · College Park, Prince George's County, Maryland, United States
  - 33.6534, -84.4494 · College Park, Fulton County, Georgia, 30337, United States
- **Cipolletti, AR** (1 Turniere) — 3 verschiedene Orte:
  - -38.9313, -67.9906 · Municipio de Cipolletti, Departamento General Roca, Río Negro, R8324, Argentina
  - -39.0913, -67.1156 · Cipolletti, Villa Regina, Municipio de Villa Regina, Departamento General Roca, Río Negro, Argentina
  - -31.4981, -68.5690 · Barrio Cipolletti, Chimbas, San Juan, Argentina
- **Spring, US** (1 Turniere) — 2 verschiedene Orte:
  - 30.0710, -95.4013 · Spring, Harris County, Texas, 77373, United States
  - 41.7967, -80.3265 · Spring, Spring Township, Crawford County, Pennsylvania, United States
- **Leimen, DE** (1 Turniere) — 4 verschiedene Orte:
  - 49.3491, 8.6910 · Leimen, Rhein-Neckar-Kreis, Baden-Württemberg, 69181, Germany
  - 49.2732, 7.7673 · Leimen, Rodalben, Südwestpfalz, Rhineland-Palatinate, 66978, Germany
  - 48.2478, 9.0304 · Leimen, Truchtelfingen, Albstadt, VVG der Stadt Albstadt, Zollernalbkreis, Baden-Württemberg, Germany
  - 48.2336, 8.2143 · Leimen, Gutach (Schwarzwaldbahn), VVG der Stadt Hausach, Ortenaukreis, Baden-Württemberg, 77793, Germany
- **MIKI, JP** (1 Turniere) — 2 verschiedene Orte:
  - 34.7969, 134.9902 · Miki, Hyogo Prefecture, Japan
  - 34.2688, 134.1345 · Miki, Kita County, Kagawa Prefecture, Japan
- **Luanda, AO** (5 Turniere) — 2 verschiedene Orte:
  - -8.8273, 13.2440 · Luanda, Municipality of Luanda, Luanda Province, Angola
  - -9.5180, 13.5357 · Luanda Province, Angola
- **Salta, AR** (2 Turniere) — 2 verschiedene Orte:
  - -25.2270, -64.5912 · Salta, Argentina
  - -24.7893, -65.4103 · Salta, Capital, Salta, Argentina
- **Cary, US** (2 Turniere) — 5 verschiedene Orte:
  - 35.7883, -78.7812 · Cary, Wake County, North Carolina, United States
  - 42.2091, -88.2400 · Cary, McHenry County, Illinois, 60013, United States
  - 32.8060, -90.9268 · Cary, Sharkey County, Mississippi, 39054, United States
  - 44.4772, -90.2568 · Town of Cary, Wood County, Wisconsin, 54466, United States
  - 39.7070, -86.8231 · Cary, Putnam County, Indiana, United States
- **Frederiksberg, DK** (1 Turniere) — 2 verschiedene Orte:
  - 55.6780, 12.5326 · Frederiksberg, Frederiksberg Municipality, Capital Region of Denmark, 1861, Denmark
  - 55.4158, 11.5657 · Frederiksberg, Sorø Municipality, Region Zealand, 4180, Denmark
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
- **Richmond, CA** (1 Turniere) — 5 verschiedene Orte:
  - 49.1632, -123.1374 · Richmond, Metro Vancouver Regional District, British Columbia, Canada
  - 45.6630, -72.1412 · Ville de Richmond, Le Val-Saint-François, Estrie, Quebec, J0B 2H0, Canada
  - 51.0314, -114.1155 · Richmond, Calgary, Alberta, Canada
  - 45.1943, -75.8386 · Richmond, Ottawa, Eastern Ontario, Ontario, K0A 2Z0, Canada
  - 46.5080, -63.9915 · Richmond, Prince County, Prince Edward Island, C0B 1Y0, Canada
- **New York, US** (1 Turniere) — 2 verschiedene Orte:
  - 40.7127, -74.0060 · New York, United States
  - 43.1562, -75.8450 · New York, United States
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
- **Porec, HR** (1 Turniere) — 2 verschiedene Orte:
  - 45.2272, 13.5957 · Grad Poreč, Istria County, Croatia
  - 45.3668, 17.9199 · Poreč, Grad Kutjevo, Požega-Slavonia County, Croatia
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
- **Holte, DK** (1 Turniere) — 3 verschiedene Orte:
  - 55.8125, 12.4688 · Holte, Rudegård, Rudersdal Municipality, Capital Region of Denmark, 2840, Denmark
  - 55.2998, 9.5472 · Holte, Haderslev Municipality, Region of Southern Denmark, Denmark
  - 55.8130, 11.6033 · Holte, Herrestrup, Odsherred Municipality, Region Zealand, 4571, Denmark
- **Pensacola, US** (2 Turniere) — 2 verschiedene Orte:
  - 30.4213, -87.2169 · Pensacola, Escambia County, Florida, United States
  - 36.4558, -95.1290 · Pensacola, Mayes County, Oklahoma, United States
- **Hokuto, JP** (2 Turniere) — 3 verschiedene Orte:
  - 41.8240, 140.6530 · Hokuto, Oshima Subprefecture, Hokkaido Prefecture, Hokkaido Region, Japan
  - 35.7765, 138.4236 · Hokuto, Yamanashi Prefecture, Japan
  - 43.9058, 144.4854 · Hokuto, Koshimizu, Shari County, Okhotsk Subprefecture, Hokkaido Prefecture, Hokkaido Region, Japan
- **São Leopoldo, BR** (1 Turniere) — 2 verschiedene Orte:
  - -29.7544, -51.1516 · São Leopoldo, Rio Grande do Sul, South Region, Brazil
  - -4.3819, -69.7073 · São Leopoldo, Benjamin Constant, Amazonas, North Region, Brazil
- **San Rafael, US** (1 Turniere) — 4 verschiedene Orte:
  - 37.9748, -122.5317 · San Rafael, Marin County, California, United States
  - 35.1123, -107.8824 · San Rafael, Cibola County, New Mexico, 87051, United States
  - 31.7373, -112.0243 · San Rafael, Chukut Kuk District, Pima County, Arizona, United States
  - 33.4669, -117.5957 · San Rafael, San Clemente, Orange County, California, 92673, United States
- **Criciúma, BR** (1 Turniere) — 2 verschiedene Orte:
  - -28.6790, -49.3696 · Criciúma, Santa Catarina, South Region, Brazil
  - -20.2176, -41.6192 · Criciúma, Ibatiba, Espírito Santo, Southeast Region, Brazil
- **Santa Fe, AR** (1 Turniere) — 2 verschiedene Orte:
  - -30.3155, -61.1645 · Santa Fe, Argentina
  - -31.6187, -60.7020 · Santa Fe, Departamento La Capital, Santa Fe, S3000, Argentina
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
- **Durham, US** (1 Turniere) — 4 verschiedene Orte:
  - 35.9967, -78.9018 · Durham, Durham County, North Carolina, United States
  - 43.1214, -70.9177 · Durham, Strafford County, New Hampshire, 03824, United States
  - 38.4851, -97.2282 · Durham, Marion County, Kansas, 67438, United States
  - 41.4818, -72.6812 · Durham, Lower Connecticut River Valley Planning Region, Connecticut, 06422, United States
- **Sofia, BG** (1 Turniere) — 2 verschiedene Orte:
  - 42.6977, 23.3217 · Sofia, Sredec, Stolichna, Sofia-City, Bulgaria
  - 42.6419, 23.9736 · Sofia, Bulgaria
- **Austin, US** (2 Turniere) — 5 verschiedene Orte:
  - 30.2711, -97.7437 · Austin, Travis County, Texas, United States
  - 29.8916, -96.2443 · Austin County, Texas, United States
  - 43.6680, -92.9746 · Austin, Mower County, Minnesota, 55912, United States
  - 39.4930, -117.0714 · Austin, Lander County, Nevada, United States
  - 34.9984, -91.9838 · Austin, Lonoke County, Arkansas, 72007, United States
- **Vierumaki, FI** (1 Turniere) — 4 verschiedene Orte:
  - 61.1046, 25.9324 · Vierumäki, Heinola, Lahti sub-region, Päijät-Häme, Mainland Finland, 19110, Finland
  - 60.3586, 25.0385 · Vierumäki, Korson suuralue, Vantaa, Helsinki sub-region, Uusimaa, Mainland Finland, Finland
  - 62.3462, 25.8978 · Vierumäki, Laukaa, Jyväskylä sub-region, Central Finland, Mainland Finland, 41330, Finland
  - 60.8658, 21.7210 · Vierumäki, Kovero, Laitila, Vakka-Suomi sub-region, Southwest Finland, Mainland Finland, 23801, Finland
- **Changzhou, CN** (1 Turniere) — 2 verschiedene Orte:
  - 31.8123, 119.9692 · Changzhou, Jiangsu, 213000, China
  - 23.4886, 111.2706 · Changzhou District, Wuzhou City, Guangxi, 543000, China
- **Saint Gregoire, FR** (1 Turniere) — 3 verschiedene Orte:
  - 48.1524, -1.6854 · Saint-Grégoire, Rennes, Ille-et-Vilaine, Brittany, Metropolitan France, 35760, France
  - 43.9617, 2.2597 · Saint-Grégoire, Albi, Tarn, Occitania, Metropolitan France, 81350, France
  - 44.6423, 0.5665 · Saint-Grégoire, Douzains, Villeneuve-sur-Lot, Lot-et-Garonne, Nouvelle-Aquitaine, Metropolitan France, 47330, France
- **Bistrita, RO** (1 Turniere) — 4 verschiedene Orte:
  - 47.1327, 24.4964 · Bistrița, Bistrița-Năsăud, 420048, Romania
  - 47.0958, 25.9468 · Bistrița, Romania
  - 45.1736, 24.0467 · Bistrița, Costești, Vâlcea, 247116, Romania
  - 44.5851, 22.7876 · Bistrița, Hinova, Mehedinți, 227246, Romania
- **Leszno, PL** (1 Turniere) — 4 verschiedene Orte:
  - 51.8436, 16.5744 · Leszno, Greater Poland Voivodeship, Poland
  - 52.2579, 20.5914 · Leszno, gmina Leszno, Warsaw West County, Masovian Voivodeship, 05-084, Poland
  - 54.2983, 18.2023 · Leszno, Kiełpino, gmina Kartuzy, Kartuzy County, Pomeranian Voivodeship, 83-307, Poland
  - 53.7750, 20.8776 · Leszno, gmina Barczewo, Olsztyn County, Warmian-Masurian Voivodeship, 11-010, Poland
- **Maceió, BR** (1 Turniere) — 2 verschiedene Orte:
  - -9.6477, -35.7339 · Maceió, Alagoas, Northeast Region, Brazil
  - -22.9143, -43.0695 · Maceió, Região Pendotiba, Niterói, Rio de Janeiro, Southeast Region, Brazil
- **Taoyuan, TW** (2 Turniere) — 2 verschiedene Orte:
  - 24.9930, 121.3010 · Taoyuan City, Taiwan
  - 23.1592, 120.7655 · Taoyuan District, Kaohsiung, 848, Taiwan
- **Itajaí, BR** (2 Turniere) — 3 verschiedene Orte:
  - -26.9047, -48.6553 · Itajaí, Santa Catarina, South Region, Brazil
  - -14.9564, -40.1742 · Itajaí, Nova Canaã, Bahia, Northeast Region, Brazil
  - -13.7573, -39.1528 · Itajaí, Ituberá, Bahia, Northeast Region, 45435-000, Brazil
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
- **ESTEPONA, ES** (1 Turniere) — 2 verschiedene Orte:
  - 36.4268, -5.1468 · Estepona, Costa del Sol Occidental, Malaga, Andalusia, Spain
  - 43.4033, -2.7954 · Estepona, Mungia, Biscay, Autonomous Community of the Basque Country, Spain
- **Woodbridge, CA** (1 Turniere) — 3 verschiedene Orte:
  - 43.7849, -79.5924 · Woodbridge, Vaughan, York Region, Golden Horseshoe, Ontario, L4L 9L9, Canada
  - 53.6077, -113.5295 · Woodbridge, Castle Downs, Edmonton, Alberta, Canada
  - 49.1997, -122.7999 · Woodbridge, Fraser Heights, Guildford, Surrey, Metro Vancouver Regional District, British Columbia, Canada
- **McKinney, US** (1 Turniere) — 2 verschiedene Orte:
  - 33.1976, -96.6154 · McKinney, Collin County, Texas, United States
  - 37.4526, -84.7591 · McKinney, Lincoln County, Kentucky, 40448, United States
- **Cartagena, CO** (1 Turniere) — 2 verschiedene Orte:
  - 10.4266, -75.5442 · Cartagena, Dique, Bolívar, RAP Caribe, Colombia
  - 9.6872, -73.2622 · Cartagena, Becerril, Cesar, RAP Caribe, Colombia
- **Livorno, IT** (1 Turniere) — 2 verschiedene Orte:
  - 42.7902, 10.3402 · Livorno, Tuscany, Italy
  - 43.5507, 10.3091 · Livorno, Tuscany, Italy
- **Nanjing, CN** (1 Turniere) — 2 verschiedene Orte:
  - 32.0438, 118.7789 · Nanjing City, Jiangsu, China
  - 24.6729, 117.2737 · Nanjing County, Zhangzhou City, Fujian, China
- **Queretaro, MX** (1 Turniere) — 2 verschiedene Orte:
  - 20.8052, -99.8837 · Querétaro, Mexico
  - 20.5923, -100.3917 · Santiago de Querétaro, Municipio de Querétaro, Querétaro, 76000, Mexico
- **Winnipeg, CA** (2 Turniere) — 2 verschiedene Orte:
  - 49.8955, -97.1385 · Winnipeg, Manitoba, Canada
  - 52.1190, -97.9692 · Lake Winnipeg, Manitoba, Canada
- **Suzhou, CN** (1 Turniere) — 3 verschiedene Orte:
  - 31.3111, 120.6213 · Suzhou City, Jiangsu, China
  - 33.6482, 116.9588 · Suzhou, Anhui, China
  - 39.5785, 98.8123 · Suzhou District, Jiuquan Prefecture, Gansu, 735000, China
- **Chestertown, US** (1 Turniere) — 2 verschiedene Orte:
  - 39.2090, -76.0666 · Chestertown, Kent County, Maryland, 21620, United States
  - 43.6451, -73.7929 · Chestertown, Town of Chester, Warren County, New York, United States
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
- **Cochabamba, BO** (1 Turniere) — 2 verschiedene Orte:
  - -17.4012, -66.1676 · Cochabamba, Juan De La Rosa, Molle, Cochabamba, Cercado, Cochabamba, Bolivia
  - -17.3330, -65.5011 · Cochabamba, Bolivia
- **Templeton, US** (1 Turniere) — 4 verschiedene Orte:
  - 41.9185, -94.9430 · Templeton, Eden Township, Carroll County, Iowa, United States
  - 42.5557, -72.0674 · Templeton, Worcester County, Massachusetts, United States
  - 35.5605, -120.7008 · Templeton, San Luis Obispo County, California, 93465, United States
  - 40.9173, -79.4609 · Templeton, Mahoning, Pine Township, Armstrong County, Pennsylvania, 16259, United States
- **Delray, US** (1 Turniere) — 5 verschiedene Orte:
  - 42.2959, -83.1166 · Delray, Detroit, Wayne County, Michigan, 48209, United States
  - 39.1945, -78.6042 · Delray, Hampshire County, West Virginia, 26714, United States
  - 32.1535, -94.4599 · Delray, Panola County, Texas, United States
  - 32.9521, -84.3013 · Delray, Upson County, Georgia, United States
  - 26.4615, -80.0728 · Delray Beach, Palm Beach County, Florida, United States
- **Tauranga, NZ** (1 Turniere) — 3 verschiedene Orte:
  - -37.6859, 176.1675 · Tauranga, Tauranga City, Bay of Plenty, 3110, New Zealand
  - -38.3236, 177.1223 · Tauranga River, Whakatāne District, Bay of Plenty, New Zealand
  - -39.2852, 176.0102 · Tauranga, Rangitīkei District, Manawatū-Whanganui, New Zealand

## Nicht gefunden

- Tsaghkadzor (Cancelled), AM (2 Turniere)
- Nouméa, NC (2 Turniere)
- Hong Kong, HK (5 Turniere)
- Berlin (Cancelled), DE (1 Turniere)
- Qian Daohu, CN (2 Turniere)
- Macau, MO (2 Turniere)
- Ismaning (Cancelled), DE (1 Turniere)
- Vyshkovo (CLOSED), UA (2 Turniere)
- Harmon, GU (2 Turniere)
- Saint-Paul, RE (1 Turniere)
- Saint-Denis-de-la Reunion, RE (1 Turniere)
- RIO GRANDE, PR (1 Turniere)

## Falsches Land (Treffer lag ausserhalb des angegebenen Landes)

Keine.

## Fehler / keine Antwort

Keine.

## Alle aufgeloesten Orte

| Ort | Land | lat | lon | Turniere |
|---|---|---:|---:|---:|
| Augsburg | DE | 48.36903 | 10.89795 | 1 |
| Kreuzlingen | CH | 47.64644 | 9.17256 | 1 |
| Accra | GH | 5.55711 | -0.20124 | 6 |
| Phan Thiet | VN | 10.94184 | 108.08231 | 2 |
| Loughborough | GB | 52.77239 | -1.20780 | 3 |
| Repentigny | CA | 45.73261 | -73.45283 | 1 |
| Bulawayo | ZW | -20.10539 | 28.54269 | 2 |
| Cholpon-Ata | KG | 42.64171 | 77.06652 | 2 |
| San Pedro Sula | HN | 15.50535 | -88.02508 | 1 |
| Shenzhen | CN | 22.54457 | 114.05454 | 1 |
| Skopje | MK | 41.99622 | 21.43189 | 2 |
| Merida | MX | 20.96708 | -89.62374 | 1 |
| Christchurch | NZ | -43.53095 | 172.63643 | 1 |
| Huamantla | MX | 19.32333 | -97.91457 | 2 |
| Pszczyna | PL | 49.97781 | 18.94237 | 1 |
| Nicosia | CY | 35.17465 | 33.36388 | 2 |
| Algiers | DZ | 36.77293 | 3.05884 | 3 |
| Cluj Napoca | RO | 46.76938 | 23.58995 | 1 |
| NAIROBI | KE | -1.28900 | 36.81728 | 3 |
| Sydney | AU | -33.86984 | 151.20828 | 2 |
| MARIBOR | SI | 46.55764 | 15.64559 | 2 |
| Luque | PY | -25.26654 | -57.49269 | 2 |
| PESCARA | IT | 42.30976 | 13.95800 | 1 |
| Bridgetown | BB | 13.09778 | -59.61842 | 1 |
| Lautoka | FJ | -17.60461 | 177.44828 | 2 |
| Maria-Lanzendorf | AT | 48.09872 | 16.41952 | 3 |
| Auckland | NZ | -36.85209 | 174.76318 | 1 |
| Nuevo Leon | MX | 26.23844 | -99.88730 | 2 |
| Aizkraukle | LV | 56.60108 | 25.25425 | 5 |
| Djibouti | DJ | 11.81460 | 42.84531 | 2 |
| Rungsted Kyst | DK | 55.88244 | 12.53151 | 2 |
| Casablanca | MA | 33.59451 | -7.62003 | 2 |
| Santa Tecla | SV | 13.67375 | -89.28860 | 2 |
| Brasov | RO | 45.65251 | 25.61057 | 1 |
| TIRANA | AL | 41.32815 | 19.81844 | 2 |
| Zephyrhills | US | 28.23362 | -82.18119 | 1 |
| Samobor | HR | 45.80186 | 15.70971 | 1 |
| Montreal | CA | 45.50318 | -73.56981 | 1 |
| Athens | GR | 37.97556 | 23.73483 | 2 |
| Telavi | GE | 41.91972 | 45.47032 | 2 |
| Paralimni | CY | 35.03915 | 33.98280 | 1 |
| Dhaka | BD | 23.76439 | 90.38901 | 1 |
| Adelaide | AU | -34.92818 | 138.59993 | 2 |
| Islamabad | PK | 33.69381 | 73.06515 | 3 |
| Chiclayo | PE | -6.77161 | -79.83872 | 2 |
| Gaborone | BW | -24.65814 | 25.90885 | 3 |
| Stellenbosch | ZA | -33.93444 | 18.86917 | 2 |
| Osaka | JP | 34.69376 | 135.50145 | 2 |
| Fergana | UZ | 40.37649 | 71.79132 | 2 |
| Cakovec | HR | 46.38923 | 16.43686 | 1 |
| Managua | NI | 12.15471 | -86.27372 | 4 |
| Leon | MX | 21.12196 | -101.68298 | 2 |
| Santo Domingo | DO | 18.47139 | -69.89184 | 2 |
| Zhangjiagang | CN | 31.87830 | 120.55146 | 1 |
| Humenne | SK | 48.93500 | 21.90203 | 2 |
| Targu Jiu | RO | 45.04229 | 23.27281 | 1 |
| Stirling | GB | 56.11812 | -3.93600 | 1 |
| Punta del Este | UY | -34.96323 | -54.94400 | 1 |
| Cabarete | DO | 19.74962 | -70.41393 | 2 |
| Dushanbe | TJ | 38.57670 | 68.78543 | 5 |
| San Jose | CR | 9.93277 | -84.07961 | 2 |
| Astana | KZ | 51.11599 | 71.46771 | 2 |
| Albany | NZ | -36.72793 | 174.70865 | 1 |
| La Nucia | ES | 38.61337 | -0.12573 | 1 |
| Kawaguchi | JP | 35.80782 | 139.72411 | 1 |
| Wulkenzin | DE | 53.54492 | 13.16992 | 1 |
| Clermont-Ferrand | FR | 45.77746 | 3.08194 | 1 |
| Jelgava | LV | 56.65221 | 23.72920 | 1 |
| Istanbul | TR | 41.00638 | 28.97587 | 4 |
| Vilamoura | PT | 37.07595 | -8.11654 | 1 |
| Bucharest | RO | 44.43614 | 26.10268 | 1 |
| PUNTA CANA | DO | 18.55655 | -68.36916 | 2 |
| Andijan | UZ | 40.78335 | 72.35067 | 2 |
| Larnaca | CY | 34.92361 | 33.62362 | 1 |
| Székesfehérvár | HU | 47.19102 | 18.41081 | 1 |
| Cape Town | ZA | -33.92883 | 18.41722 | 2 |
| Tainan | TW | 22.99123 | 120.18498 | 1 |
| Liepaja | LV | 56.50484 | 21.00709 | 2 |
| Corpus Christi | US | 27.76353 | -97.40332 | 1 |
| Pretoria | ZA | -25.74593 | 28.18791 | 1 |
| Antananarivo | MG | -18.91001 | 47.52558 | 2 |
| Male | MV | 4.17799 | 73.51074 | 2 |
| Surabaya | ID | -7.24628 | 112.73777 | 1 |
| Iasi | RO | 47.16156 | 27.58378 | 1 |
| Johannesburg | ZA | -26.20500 | 28.04972 | 1 |
| Bytom | PL | 50.36529 | 18.87226 | 1 |
| Manama | BH | 26.22350 | 50.58224 | 3 |
| Nonthaburi | TH | 13.86109 | 100.34568 | 2 |
| 55218  Ingelheim | DE | 49.97078 | 8.05876 | 1 |
| Douala | CM | 4.04294 | 9.70620 | 2 |
| Bielsko - Biala | PL | 49.82212 | 19.04489 | 1 |
| Cairo | EG | 30.04439 | 31.23573 | 8 |
| Santiago | CL | -33.43770 | -70.65107 | 1 |
| Budapest | HU | 47.49788 | 19.04024 | 1 |
| Phoenix | MU | -20.28179 | 57.50253 | 1 |
| GUWAHATI | IN | 26.18060 | 91.75394 | 1 |
| Fes | MA | 34.03465 | -5.01619 | 1 |
| Wanju | KR | 35.90390 | 127.16220 | 1 |
| San Miguel de Tucumán | AR | -26.83037 | -65.20381 | 1 |
| Yaounde | CM | 3.86899 | 11.52133 | 2 |
| Concepcion | CL | -36.82707 | -73.05021 | 1 |
| Rueschlikon | CH | 47.30747 | 8.55464 | 1 |
| Mostar | BA | 43.34359 | 17.80766 | 1 |
| Lome | TG | 6.13042 | 1.21583 | 2 |
| Singapore | SG | 1.35711 | 103.81950 | 2 |
| Szabolcsveresmart | HU | 48.29244 | 22.01981 | 1 |
| Majadahonda | ES | 40.47284 | -3.87235 | 1 |
| Dunakeszi | HU | 47.63167 | 19.12941 | 2 |
| Belgrade | RS | 44.81533 | 20.44566 | 1 |
| Chigasaki | JP | 35.32948 | 139.40537 | 1 |
| Hyderabad | IN | 17.36059 | 78.47406 | 1 |
| Almaty | KZ | 43.23639 | 76.94573 | 2 |
| Kelibia | TN | 36.84566 | 11.09357 | 1 |
| Ulcinj | ME | 41.92601 | 19.20556 | 1 |
| Portimao | PT | 37.13758 | -8.53684 | 1 |
| Salvador | BR | -12.98225 | -38.48128 | 1 |
| Limassol | CY | 34.68529 | 33.03327 | 2 |
| Gothenburg | SE | 57.70723 | 11.96702 | 1 |
| Fort Lauderdale | US | 26.12231 | -80.14338 | 1 |
| BANDAR ENSTEK | MY | 2.75745 | 101.76750 | 1 |
| Antalya | TR | 36.88657 | 30.70302 | 2 |
| Pazardzhik | BG | 42.14868 | 24.15319 | 2 |
| Frydek Mistek | CZ | 49.68563 | 18.34834 | 1 |
| Burgas | BG | 42.49366 | 27.47213 | 1 |
| Tsaghkadzor | AM | 40.51535 | 44.67215 | 2 |
| DOMZALE | SI | 46.13943 | 14.59446 | 1 |
| Bujumbura | BI | -3.36381 | 29.36750 | 2 |
| Rabat | MA | 34.02185 | -6.84089 | 1 |
| Dakar | SN | 14.69342 | -17.44794 | 2 |
| Seogwipo | KR | 33.25285 | 126.56103 | 1 |
| Quito | EC | -0.22016 | -78.51233 | 2 |
| Rakovnik | CZ | 50.10411 | 13.73105 | 2 |
| Chihuahua | MX | 28.50000 | -106.00000 | 2 |
| Uppsala | SE | 59.85861 | 17.63874 | 1 |
| Pancevo | RS | 44.87057 | 20.63996 | 2 |
| Rijeka | HR | 45.32680 | 14.44221 | 1 |
| Vina del Mar | CL | -33.02445 | -71.55176 | 1 |
| Vic | ES | 41.93020 | 2.25459 | 1 |
| Tallinn | EE | 59.43724 | 24.75727 | 1 |
| PALERMO | IT | 38.11123 | 13.35244 | 1 |
| Arnhem | NL | 52.00566 | 5.87623 | 1 |
| Aridea 2 | GR | 40.97559 | 22.06137 | 1 |
| Beijing | CN | 39.90571 | 116.39130 | 1 |
| MURSKA SOBOTA | SI | 46.66246 | 16.16553 | 1 |
| Miaoli | TW | 24.56477 | 120.82052 | 1 |
| New Delhi | IN | 28.61390 | 77.20901 | 1 |
| Balma | FR | 43.60966 | 1.49801 | 1 |
| Tegucigalpa | HN | 14.10581 | -87.20471 | 1 |
| Dublin | IE | 53.34938 | -6.26056 | 1 |
| Petit Camp Phoenix | MU | -20.27319 | 57.49928 | 1 |
| Szczawno Zdrój | PL | 50.80081 | 16.25157 | 1 |
| Sandefjord | NO | 59.07990 | 10.28043 | 1 |
| Isa Town | BH | 26.17420 | 50.54734 | 3 |
| Andong | KR | 36.56349 | 128.72608 | 2 |
| Akouda | TN | 35.86573 | 10.56784 | 1 |
| Baku | AZ | 40.37559 | 49.83280 | 2 |
| Tacarigua | TT | 10.64374 | -61.36117 | 1 |
| Colombo | LK | 6.93886 | 79.85420 | 2 |
| AMBATO | EC | -1.24224 | -78.62876 | 1 |
| Sanxenxo | ES | 42.42208 | -8.83534 | 1 |
| Changhua | TW | 24.07557 | 120.54447 | 2 |
| Jakarta | ID | -6.17540 | 106.82717 | 1 |
| Liverpool | GB | 53.39334 | -2.91664 | 2 |
| Vilnius | LT | 54.68705 | 25.28291 | 1 |
| Montevideo | UY | -34.90589 | -56.19131 | 1 |
| Liège | BE | 50.64509 | 5.57361 | 1 |
| Seoul | KR | 37.56668 | 126.97829 | 1 |
| Qionghai | CN | 19.25912 | 110.47020 | 1 |
| Msaken | TN | 35.72526 | 10.58328 | 1 |
| Kozerki | PL | 52.09030 | 20.58872 | 1 |
| BARCELONA | ES | 41.38258 | 2.17707 | 2 |
| Prostejov | CZ | 49.47215 | 17.11180 | 1 |
| Tanger | MA | 35.76963 | -5.80335 | 1 |
| Taichung | TW | 24.16316 | 120.64783 | 1 |
| Oujda | MA | 34.67787 | -1.92931 | 1 |
| Megrine | TN | 36.77034 | 10.23159 | 2 |
| Le Bouscat | FR | 44.86618 | -0.59924 | 1 |
| Rotterdam | NL | 51.92444 | 4.47775 | 1 |
| Chengdu | CN | 30.65987 | 104.06332 | 1 |
| Hammam Sousse | TN | 35.87498 | 10.59352 | 1 |
| Luzern | CH | 47.05214 | 8.30581 | 1 |
| Pereira | CO | 4.78546 | -75.78832 | 1 |
| El Prat de Llobregat | ES | 41.33059 | 2.09308 | 1 |
| Barranquilla | CO | 11.01019 | -74.82318 | 1 |
| Valledupar | CO | 10.34311 | -73.37579 | 1 |
| Stavanger | NO | 58.96997 | 5.73181 | 1 |
| Oberpullendorf | AT | 47.50126 | 16.50546 | 1 |
| Mogyorod | HU | 47.59866 | 19.23842 | 1 |
| Vigo | ES | 42.19864 | -8.72796 | 1 |
| Bayonne | FR | 43.49451 | -1.47367 | 1 |
| Wierden | NL | 52.35799 | 6.59218 | 1 |
| Harare | ZW | -17.85670 | 31.06016 | 1 |
| Alcalá de Henares | ES | 40.48195 | -3.36398 | 1 |
| Quebec City | CA | 46.81374 | -71.20841 | 1 |
| Zlatibor | RS | 43.67424 | 19.61246 | 1 |
| Siauliai | LT | 55.93408 | 23.31578 | 1 |
| Lagos | NG | 6.45506 | 3.39418 | 2 |
| Bengaluru | IN | 12.97679 | 77.59008 | 1 |
| CHENNAI | IN | 13.08369 | 80.27019 | 1 |
| Boca Raton | US | 26.35869 | -80.08310 | 1 |
| Le Chambon-sur-Lignon | FR | 45.06081 | 4.30294 | 1 |
| Dijon | FR | 47.32158 | 5.04147 | 1 |
| Peja | XK | 42.65940 | 20.28858 | 2 |
| Chuncheon | KR | 37.88106 | 127.72976 | 1 |
| Aridea 1 | GR | 40.97559 | 22.06137 | 1 |
| bari | IT | 41.12578 | 16.86203 | 1 |
| Jeju | KR | 33.48877 | 126.49871 | 1 |
| Hoofddorp | NL | 52.30555 | 4.69266 | 1 |
| Varna | BG | 43.20739 | 27.91667 | 1 |
| Kaohsiung | TW | 22.62033 | 120.31204 | 2 |
| Dubrovnik | HR | 42.64910 | 18.09395 | 1 |
| Bursa | TR | 40.18257 | 29.06750 | 1 |
| Kram | TN | 36.84800 | 10.29436 | 1 |
| Tampere | FI | 61.49780 | 23.76163 | 1 |
| Lahore | PK | 31.56568 | 74.31418 | 1 |

## Hinweise

- Trockenlauf ist Voreinstellung. Scharf: `--write`. Danach `resolve-tournaments.mjs --write` schreibt aus den Claims in den Stamm.
- Idempotenz: Claims upsert onConflict (tournament_id,field_name,source,field_value) ignoreDuplicates; ROHtreffer in scripts/.geocode-cache.json gecacht.
- Rate-Limit: >= 1100 ms je Netz-Anfrage, Einzel-Thread. Mehrdeutige/fehlende Orte werden gelistet, nicht geraten.
- Mehrdeutigkeit: Treffer >50 km auseinander gelten als verschiedene Orte; nähere OSM-Knoten derselben Stadt werden zusammengeführt.
