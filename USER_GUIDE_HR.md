# IFC-Viewer Digital Twin - Korisnički Vodič

## Brzi Početak

Aplikacija učitava primjer poslovne zgrade s MEP sustavima (HVAC, ventilacija, grijanje, vodovod). Fragment datoteke (`.frag`) učitavaju se brže od IFC datoteka.

## Sučelje

```
┌─────────────────┬──────────────────────┬─────────────────┐
│   LIJEVI PANEL  │    3D PRIKAZ         │   DESNI PANEL   │
│ [Logo] [Ikone]  │                      │ Info o odabiru  │
│ Prostorna stab. │   [Model Zgrade]     │ [Senzori|Svojs] │
│ Filter svojstava│                      │ Dokumenti       │
└─────────────────┴──────────────────────┴─────────────────┘
                                              [Traka pogleda]
                     [Plutajuća alatna traka]
```

### Zaglavlje (Lijevi Panel)
- **Tema** - Prebacivanje između tamne i svijetle teme
- **Pomoć** - Otvara ovaj korisnički vodič
- **Jezik** - Prebacivanje između engleskog (EN) i hrvatskog (HR)

## Navigacija

| Radnja | Kontrola |
|--------|----------|
| Rotiranje | Lijevi klik + povlačenje |
| Pomicanje | Desni klik + povlačenje |
| Zumiranje | Kotačić miša |

**Načini kamere** (plutajuća alatna traka):
- **Orbita** - Rotiranje oko modela (zadano)
- **Prva osoba** - WASD kretanje + pogled mišem
- **Tlocrt** - Ortografski pogled odozgo

*Pokušajte: Zumirajte van da vidite cijelu zgradu, zatim prebacite na Prva osoba i šetajte unutra koristeći WASD.*

## Odabir i Svojstva

- **Kliknite** bilo koji element za odabir (označen plavom bojom)
- **Prelazite mišem** za pregled elemenata prije odabira
- Odabrani element prikazuje **Senzore** i **Svojstva** u karticama desnog panela

Desni panel ima dvije kartice:
- **Senzori** - BMS podaci senzora za nadgledanu opremu
- **Svojstva** - IFC svojstva (naziv, GUID, tip, atributi)

*Pokušajte: Kliknite na stropnu ventilatorsku jedinicu da vidite njena svojstva i podatke senzora.*

## BMS Podaci Senzora

Nadgledana oprema prikazuje očitanja senzora u stvarnom vremenu u kartici Senzori:
- Temperatura, vlažnost, CO2, protok zraka, tlak, energija
- Boje statusa: **Zelena** (normalno), **Žuta** (upozorenje), **Crvena** (alarm)
- **Kliknite na karticu senzora** za prikaz povijesnog grafikona trenda

Opcije povijesnih podataka: 24 sata, 7 dana, 30 dana s min/maks/prosjek statistikama.

*Pokušajte: Odaberite ventilatorsku jedinicu (FCU-01) da vidite senzore temperature, protoka zraka i energije. Kliknite bilo koji senzor za prikaz grafikona trenda.*

## Dokumenti

Odaberite opremu za pregled povezanih dokumenata (specifikacije, priručnici, certifikati) u sekciji Dokumenti.

- **Pregledaj** - Otvori dokument u pregledniku
- **Uredi** - Izmijeni metapodatke dokumenta
- **Preuzmi** - Spremi na lokalni disk
- **Izbriši** - Ukloni dokument

**Učitaj dokumente**: Odaberite element → Sekcija Dokumenti → Gumb Učitaj dokument

*Pokušajte: Odaberite bilo koju ventilatorsku jedinicu da vidite povezane PDF specifikacije.*

## Plutajuća Alatna Traka

Nalazi se na dnu sredine prikaza:

### Navigacija
- **Orbita** - Rotiranje oko centra modela
- **Prva osoba** - Hodanje kroz model s WASD tipkama
- **Tlocrt** - 2D pogled odozgo

### Mjerenje
- **Duljina** - Kliknite dvije točke za mjerenje udaljenosti
- **Površina** - Kliknite više točaka za definiranje poligona površine
- **Obriši** - Ukloni sva mjerenja

*Pokušajte: Omogućite mjerenje Duljine i kliknite dva kuta prostorije da dobijete udaljenost u metrima.*

### Presjek
- **Presjek** - Kliknite na površinu za stvaranje ravnine rezanja
- **Prikaži ravnine** - Prebaci vidljivost kontrola ravnine presjeka
- **Izbriši sve** - Ukloni sve ravnine rezanja

*Pokušajte: Kliknite Presjek, zatim kliknite na podnu ploču. Model se presiječe i otkriva skrivene MEP sustave.*

### Vidljivost
- **Prozirnost** - Učinite neodabrane elemente poluprozirnim
- **Izoliraj** - Prikaži samo odabrane elemente
- **Sakrij** - Sakrij odabrane elemente
- **Prikaži sve** - Resetiraj svu vidljivost

*Pokušajte: Odaberite neke elemente, kliknite Izoliraj. Samo ti elementi ostaju vidljivi. Kliknite Prikaži sve za povratak.*

## Traka Pogleda

Nalazi se gore desno od prikaza:

- **Tlocrti** - Generiraj 2D tlocrtne poglede iz IFC etaža
- **Pročelja** - Generiraj S/J/I/Z poglede pročelja
- **Izlaz 2D** - Povratak na 3D pogled
- **Spremljeni pogledi** - Pristup spremljenim pozicijama kamere

## Prostorna Struktura

U lijevom panelu pregledajte hijerarhiju zgrade:
- Proširi/skupi razine za navigaciju strukturom
- **Pretraži** - Filtriraj elemente po nazivu
- Kliknite elemente za odabir u 3D prikazu

## Filter Svojstava

Filtriraj i odaberi elemente po svojstvima:

1. Kliknite **+ Kategorija** ili **+ Atribut** za dodavanje filtera
2. Za Kategoriju: Odaberite IFC tip (npr. IFCFAN, IFCDUCTSEGMENT)
3. Za Atribut: Unesite naziv atributa i uzorak vrijednosti (regex podržan)
4. Prebacite **Zadovolji SVE uvjete** za AND/OR logiku
5. Kliknite **Primijeni** za odabir odgovarajućih elemenata

Nakon primjene:
- **Izoliraj** - Prikaži samo filtrirane elemente
- **Sakrij** - Sakrij filtrirane elemente
- **Obriši** - Resetiraj filter

*Pokušajte: Dodajte filter Atributa s Naziv koji sadrži "Kampmann" da označite svu Kampmann opremu.*

## Postavke

Pristupite postavkama putem ikona u zaglavlju lijevog panela:

- **Tema** (ikona mjeseca/sunca) - Prebaci tamnu/svijetlu temu
- **Pomoć** (upitnik) - Otvori ovaj korisnički vodič
- **Jezik** (EN/HR) - Promijeni jezik sučelja

## Tipkovničke Prečice

| Tipka | Radnja |
|-------|--------|
| W/A/S/D | Kretanje (način Prva osoba) |
| Scroll | Zumiranje |
| Escape | Poništi odabir / Izađi iz alata |

## Učitavanje Modela

Aplikacija automatski učitava zadani model. Za učitavanje prilagođenih modela:
- **Učitaj IFC**: Uvezi .ifc datoteke (sporije, zahtijeva parsiranje)
- **Učitaj Fragment**: Uvezi .frag datoteke (brže, pretprocesirano)

**Konvertiraj IFC u Fragment**: Koristite `convert-ifc-to-frag.html` za 5-10x brže učitavanje.

## Rješavanje Problema

| Problem | Rješenje |
|---------|----------|
| Model se ne učitava | Pričekajte 30s, provjerite konzolu (F12), osvježite |
| Spora izvedba | Koristite ravnine rezanja, sakrijte elemente, zatvorite kartice preglednika |
| Nema podataka senzora | Samo unaprijed konfigurirana oprema ima BMS podatke |
| Dokumenti nedostaju | Pohranjeni u IndexedDB; brisanje podataka preglednika ih uklanja |
| Jezik se ne mijenja | Osvježite stranicu nakon prebacivanja jezika |
