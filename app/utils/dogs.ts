import type { PropertyType, ProtectionLevel } from './protection'
import type { hipGrades } from './k9'
import { sampleStores } from './stores'
import sargePhoto from "@/assets/dogs/sarge-gsd.jpg";
import novaPhoto from "@/assets/dogs/nova-gsd.jpg";
import ramboPhoto from "@/assets/dogs/rambo-malinois.jpg";
import flashPhoto from "@/assets/dogs/flash-malinois.jpg";
import tankPhoto from "@/assets/dogs/tank-rottweiler.jpg";
import bellaPhoto from "@/assets/dogs/bella-rottweiler.jpg";
import dieselPhoto from "@/assets/dogs/diesel-doberman.jpg";
import kaiaPhoto from "@/assets/dogs/kaia-doberman.jpg";
import kingPhoto from "@/assets/dogs/king-cane-corso.jpg";
import duchessPhoto from "@/assets/dogs/duchess-cane-corso.jpg";
import boulderPhoto from "@/assets/dogs/boulder-boerboel.jpg";
import zaraPhoto from "@/assets/dogs/zara-boerboel.jpg";
import onyxPhoto from "@/assets/dogs/onyx-giant-schnauzer.jpg";
import cobraPhoto from "@/assets/dogs/cobra-dutch-shepherd.jpg";
import titusPhoto from "@/assets/dogs/titus-presa.jpg";
import blitzPhoto from "@/assets/dogs/blitz-gsd.jpg";
import mambaPhoto from "@/assets/dogs/mamba-malinois.jpg";
import aresPhoto from "@/assets/dogs/ares-rottweiler.jpg";

export interface Dog {
  fileNo: string
  name: string
  breed: string
  sex: 'Male' | 'Female'
  city: string
  age: string
  weightKg: number
  hips: (typeof hipGrades)[number]
  level: ProtectionLevel
  priceNaira: number
  status: 'available' | 'reserved'
  photo?: string
  property: PropertyType[]
  safeWithChildren: boolean
  storeId: string
  // Full K9 file, shown on the profile page
  file?: {
    summary: string
    born: string
    hipsElbows: string
    microchip: string
    vaccinations: string
    titles: string
    sire: string
    dam: string
    inspected: string
    bestSuited: string
    traits: string[]
  }
}

// Example listings until the store dashboard and API exist.
// level is the Dogeash protection scale (1–5); property uses the picker's four types.
export const sampleDogs: Dog[] = [
  {
    fileNo: "KD-2026-003",
    name: "Rambo",
    breed: "Belgian Malinois",
    sex: "Male",
    city: "Abuja",
    age: "2.5 years",
    weightKg: 32,
    hips: "A1",
    level: 5,
    priceNaira: 3_200_000,
    status: "available",
    photo: ramboPhoto,
    property: ["home", "estate", "compound"],
    safeWithChildren: true,
    storeId: "STR-001",
    file: {
      summary:
        "Imported Belgian working line male with full IGP-3 training. A serious deterrent for high-profile households: explosive drive on the field, calm and social indoors.",
      born: "12 February 2024 — K9 Guardian Kennels, Abuja",
      hipsElbows: "Hips A1 (a-normal) / elbows normal, SV certified",
      microchip: "985 112 004 716 204",
      vaccinations: "Full puppy series complete; annual booster due February 2027",
      titles: "IGP-3 (obedience, tracking, protection)",
      sire: "V Django vom Wolfsbane (NL)",
      dam: "Xira des Guerriers Belges (BE)",
      inspected: "Breed survey inspected November 2025",
      bestSuited:
        "Executive homes and gated estates needing an elite response dog handled by experienced owners",
      traits: ["IGP-3 titled", "Elite bitework", "Bombproof nerves", "Travels well", "Doorway alert"],
    },
  },
  {
    fileNo: "KD-2026-014",
    name: "Sarge",
    breed: "German Shepherd",
    sex: "Male",
    city: "Abuja",
    age: "2 years",
    weightKg: 38,
    hips: "A1",
    level: 4,
    priceNaira: 2_400_000,
    status: "available",
    photo: sargePhoto,
    property: ["home", "estate", "compound"],
    safeWithChildren: true,
    storeId: "STR-001",
    file: {
      summary:
        "Deep-pigmented saddle male with an on/off switch most families ask for: full alert at the gate, gentle with the children he was raised beside.",
      born: "12 March 2024 — K9 Guardian Kennels, Abuja",
      hipsElbows: "Hips A1 (a-normal) / elbows normal, SV certified",
      microchip: "985 112 004 716 311",
      vaccinations: "Full series complete; booster due March 2027",
      titles: "IGP-1 obedience and protection",
      sire: "V Tell vom Adlerblut (DE)",
      dam: "V Asha of Guardian Line (NG)",
      inspected: "SV breed survey inspected November 2025",
      bestSuited:
        "Families in gated estates wanting a visible deterrent with controlled aggression on command",
      traits: ["Stable nerve", "High prey drive", "Obedience titled", "Crate trained", "Kid friendly"],
    },
  },
  {
    fileNo: "KD-2026-021",
    name: "Nova",
    breed: "German Shepherd",
    sex: "Female",
    city: "Lagos",
    age: "18 months",
    weightKg: 30,
    hips: "A2",
    level: 3,
    priceNaira: 1_650_000,
    status: "available",
    photo: novaPhoto,
    property: ["home", "estate"],
    safeWithChildren: true,
    storeId: "STR-002",
    file: {
      summary:
        "Sable female with an exceptional nose and a soft mouth around small children. Barks early, bites only when commanded — the ideal first protection dog.",
      born: "3 June 2024 — Naija Guard Dogs, Lagos",
      hipsElbows: "Hips A2 (a-fast normal) / elbows normal",
      microchip: "985 113 002 884 917",
      vaccinations: "Complete puppy series; booster due June 2027",
      titles: "Companion obedience (CD) and beginner protection",
      sire: "V Kaiser von Loyalheim (DE)",
      dam: "Ada of Naija Guard (NG)",
      inspected: "Inspected January 2026 by NGSD panel",
      bestSuited:
        "First-time protection-dog owners in bungalows and duplexes with young children",
      traits: ["Early barker", "Soft with kids", "Food motivated", "Travels calmly"],
    },
  },
  {
    fileNo: "KD-2026-032",
    name: "Flash",
    breed: "Belgian Malinois",
    sex: "Female",
    city: "Port Harcourt",
    age: "14 months",
    weightKg: 26,
    hips: "A1",
    level: 4,
    priceNaira: 2_100_000,
    status: "reserved",
    photo: flashPhoto,
    property: ["home", "estate", "compound"],
    safeWithChildren: true,
    storeId: "STR-003",
    file: {
      summary:
        "Fast, precise young female already performing full bitework. Reserved pending home inspection — her next family wants a night-shift deterrent.",
      born: "22 August 2024 — Niger Delta K9, Port Harcourt",
      hipsElbows: "Hips A1 (a-normal) / elbows normal",
      microchip: "985 114 001 552 036",
      vaccinations: "Complete series; booster due August 2027",
      titles: "IGP-2 routine in training",
      sire: "Ch. Blade of Delta Line (NG)",
      dam: "Yaska du Renard (FR)",
      inspected: "Inspected December 2025",
      bestSuited: "Active families with secure fencing and time for daily drills",
      traits: ["Explosive speed", "Agile climber", "High energy", "Water confident"],
    },
  },
  {
    fileNo: "KD-2026-008",
    name: "Tank",
    breed: "Rottweiler",
    sex: "Male",
    city: "Ibadan",
    age: "3 years",
    weightKg: 52,
    hips: "B1",
    level: 4,
    priceNaira: 1_900_000,
    status: "available",
    photo: tankPhoto,
    property: ["home", "compound"],
    safeWithChildren: true,
    storeId: "STR-004",
    file: {
      summary:
        "A physical wall of a dog. Tank holds a doorway by presence alone; his deep bark has ended three break-in attempts at his current home without contact.",
      born: "5 January 2023 — Savanna Working Dogs, Ibadan",
      hipsElbows: "Hips B1 (fast normal) / elbows clear",
      microchip: "985 115 003 220 741",
      vaccinations: "Complete; rabies current to January 2027",
      titles: "Family protection certified (level 2)",
      sire: "GCh. Bruno vom Starken Rott (DE)",
      dam: "Nkechi of Savanna (NG)",
      inspected: "ADRK-style survey February 2026",
      bestSuited: "Walled compounds and farmsteads needing a single-dog deterrent",
      traits: ["Deep deterrent bark", "Imposing size", "Low energy indoors", "Gate trained"],
    },
  },
  {
    fileNo: "KD-2026-027",
    name: "Bella",
    breed: "Rottweiler",
    sex: "Female",
    city: "Lagos",
    age: "2 years",
    weightKg: 42,
    hips: "B2",
    level: 3,
    priceNaira: 1_400_000,
    status: "available",
    photo: bellaPhoto,
    property: ["home", "estate"],
    safeWithChildren: true,
    storeId: "STR-002",
    file: {
      summary:
        "Compact female that suits a duplex lifestyle: quiet through the day, tireless through the night. Alert-bark trained and housebroken.",
      born: "17 April 2024 — Naija Guard Dogs, Lagos",
      hipsElbows: "Hips B2 (fast normal) / elbows clear",
      microchip: "985 115 003 220 789",
      vaccinations: "Complete; booster due April 2027",
      titles: "Family protection certified (level 1)",
      sire: "Ch. Apollo of Lekki Line (NG)",
      dam: "Greta vom Hause Neumann (DE)",
      inspected: "Inspected February 2026",
      bestSuited: "Apartments and duplexes in serviced estates",
      traits: ["Quiet indoors", "Night alert", "Housebroken", "Good on lead"],
    },
  },
  {
    fileNo: "KD-2026-017",
    name: "Diesel",
    breed: "Doberman Pinscher",
    sex: "Male",
    city: "Enugu",
    age: "2 years",
    weightKg: 40,
    hips: "A1",
    level: 4,
    priceNaira: 1_750_000,
    status: "available",
    photo: dieselPhoto,
    property: ["home", "estate"],
    safeWithChildren: true,
    storeId: "STR-003",
    file: {
      summary:
        "Sleek perimeter patroller with European bloodlines. Covers a fence line faster than any dog in our kennel and shadows his handler room to room.",
      born: "9 September 2024 — Niger Delta K9, Enugu",
      hipsElbows: "Hips A1 / elbows normal, DCA evaluated",
      microchip: "985 116 002 013 558",
      vaccinations: "Complete; booster due September 2027",
      titles: "SCG-level protection dog certification",
      sire: "EU Ch. Falcon di Nero (IT)",
      dam: "Amara of Delta K9 (NG)",
      inspected: "Cardiac and hip screen December 2025",
      bestSuited: "Homes with large compounds and a jogging or security-conscious owner",
      traits: ["Fastest patroller", "Velcro handler dog", "Heat tolerant", "Crate trained"],
    },
  },
  {
    fileNo: "KD-2026-036",
    name: "Kaia",
    breed: "Doberman Pinscher",
    sex: "Female",
    city: "Abuja",
    age: "16 months",
    weightKg: 30,
    hips: "A2",
    level: 3,
    priceNaira: 1_500_000,
    status: "reserved",
    photo: kaiaPhoto,
    property: ["home"],
    safeWithChildren: true,
    storeId: "STR-001",
    file: {
      summary:
        "Sweet-natured female finishing her alert-bark program. Reserved for a family in Maitama; contact the kennel to join the waiting list for her littermate.",
      born: "30 July 2024 — K9 Guardian Kennels, Abuja",
      hipsElbows: "Hips A2 (preliminary) / elbows normal",
      microchip: "985 116 002 013 604",
      vaccinations: "Complete series; booster due July 2027",
      titles: "Obedience certified, protection in training",
      sire: "EU Ch. Falcon di Nero (IT)",
      dam: "Zuri of Guardian Line (NG)",
      inspected: "Inspected January 2026",
      bestSuited: "Families wanting a lighter-built guardian with strong people focus",
      traits: ["People focused", "Quick learner", "Gentle mouth", "Child tested"],
    },
  },
  {
    fileNo: "KD-2026-005",
    name: "King",
    breed: "Cane Corso",
    sex: "Male",
    city: "Lagos",
    age: "2.5 years",
    weightKg: 50,
    hips: "B1",
    level: 4,
    priceNaira: 2_200_000,
    status: "available",
    photo: kingPhoto,
    property: ["home", "estate", "compound"],
    safeWithChildren: true,
    storeId: "STR-002",
    file: {
      summary:
        "Black brindle corso with a chest like a barrel and the judgement to match. Property-aware: he distinguishes the gardener from a stranger within two visits.",
      born: "28 November 2023 — Naija Guard Dogs, Lagos",
      hipsElbows: "Hips B1 / elbows clear, ICCF evaluated",
      microchip: "985 117 001 934 275",
      vaccinations: "Complete; rabies current to November 2027",
      titles: "Family protection certified (level 2)",
      sire: "Ch. Escobar Mastini (IT)",
      dam: "Adaeze of Naija Guard (NG)",
      inspected: "Inspected February 2026",
      bestSuited: "Families with frequent visitors needing a discriminating guardian",
      traits: ["Visitor discernment", "Calm confidence", "Drool moderate", "Gate guardian"],
    },
  },
  {
    fileNo: "KD-2026-029",
    name: "Duchess",
    breed: "Cane Corso",
    sex: "Female",
    city: "Ibadan",
    age: "20 months",
    weightKg: 41,
    hips: "B2",
    level: 3,
    priceNaira: 1_800_000,
    status: "available",
    photo: duchessPhoto,
    property: ["home", "estate"],
    safeWithChildren: true,
    storeId: "STR-004",
    file: {
      summary:
        "Blue female with a watchful streak and a soft spot for teenagers. Trained to sleep across the front door corridor and challenge after dark.",
      born: "8 February 2024 — Savanna Working Dogs, Ibadan",
      hipsElbows: "Hips B2 / elbows clear",
      microchip: "985 117 001 934 318",
      vaccinations: "Complete; booster due February 2027",
      titles: "Family protection certified (level 1)",
      sire: "GCh. Nero Blu Corsi (IT)",
      dam: "Ijeoma of Savanna (NG)",
      inspected: "Inspected January 2026",
      bestSuited: "Bungalows and single-storey homes with night-time intrusion risk",
      traits: ["Night challenger", "Door corridor trained", "Affectionate", "Low prey chase"],
    },
  },
  {
    fileNo: "KD-2026-011",
    name: "Boulder",
    breed: "Boerboel",
    sex: "Male",
    city: "Kano",
    age: "2 years",
    weightKg: 62,
    hips: "B1",
    level: 3,
    priceNaira: 850_000,
    status: "available",
    photo: boulderPhoto,
    property: ["home", "compound"],
    safeWithChildren: true,
    storeId: "STR-005",
    file: {
      summary:
        "Homegrown brindle Boerboel bred for our climate — thick skin, low coat care and relentless loyalty to the whole household, from grandfather to toddler.",
      born: "14 May 2024 — Northern Ridge K9, Kano",
      hipsElbows: "Hips B1 / elbows clear, SABBS appraised",
      microchip: "985 118 004 655 190",
      vaccinations: "Complete; rabies current to May 2027",
      titles: "SABBS appraisal 88.5%",
      sire: "Dike of Northern Ridge (NG)",
      dam: "Hauwa of Northern Ridge (NG)",
      inspected: "SABBS appraisal October 2025",
      bestSuited: "Rural homesteads and farm compounds needing a robust livestock-aware guard",
      traits: ["Heat hardened", "Livestock aware", "Frugal feeder", "Immovable courage"],
    },
  },
  {
    fileNo: "KD-2026-041",
    name: "Zara",
    breed: "Boerboel",
    sex: "Female",
    city: "Jos",
    age: "7 months",
    weightKg: 28,
    hips: "A2",
    level: 2,
    priceNaira: 550_000,
    status: "available",
    photo: zaraPhoto,
    property: ["home", "compound"],
    safeWithChildren: true,
    storeId: "STR-005",
    file: {
      summary:
        "Fawn puppy with 12 weeks of foundational guard training already banked: crate, lead, recall and bark-on-command foundation. Grows into a 55 kg guardian.",
      born: "22 March 2026 — Northern Ridge K9, Kano (raised in Jos)",
      hipsElbows: "Preliminary hips A2; formal scoring at 18 months",
      microchip: "985 118 004 655 233",
      vaccinations: "Full puppy series complete; next booster March 2027",
      titles: "Puppy foundation program (graduated)",
      sire: "Dike of Northern Ridge (NG)",
      dam: "Mai Tumbin of Jos Plateau (NG)",
      inspected: "Vet health check October 2026",
      bestSuited: "Families who want to raise a guardian alongside their children from puppyhood",
      traits: ["Puppy trainable", "Child raised", "Recall started", "Bark on cue (foundation)"],
    },
  },
  {
    fileNo: "KD-2026-046",
    name: "Onyx",
    breed: "Giant Schnauzer",
    sex: "Male",
    city: "Abuja",
    age: "2 years",
    weightKg: 44,
    hips: "A1",
    level: 4,
    priceNaira: 2_050_000,
    status: "available",
    photo: onyxPhoto,
    property: ["home", "estate", "compound"],
    safeWithChildren: true,
    storeId: "STR-001",
    file: {
      summary:
        "Wiry-coated sentinel from German show-and-work lines. Onyx hears a visitor at the gate long before the gate bell rings and announces with a single decisive bark.",
      born: "6 April 2024 — K9 Guardian Kennels, Abuja",
      hipsElbows: "Hips A1 (a-normal) / elbows normal",
      microchip: "985 119 003 118 447",
      vaccinations: "Complete; booster due April 2027",
      titles: "IGP-2 obedience and protection",
      sire: "Ch. Falko vom Schwarzwald (DE)",
      dam: "Petra of Guardian Line (NG)",
      inspected: "Inspected January 2026",
      bestSuited:
        "Homes needing a low-shedding guardian with strong personal-space boundaries",
      traits: ["Low shedding", "Keen hearing", "One-bark alert", "Territorial", "Kid friendly"],
    },
  },
  {
    fileNo: "KD-2026-049",
    name: "Cobra",
    breed: "Dutch Shepherd",
    sex: "Male",
    city: "Kaduna",
    age: "20 months",
    weightKg: 30,
    hips: "A2",
    level: 4,
    priceNaira: 1_950_000,
    status: "available",
    photo: cobraPhoto,
    property: ["home", "compound"],
    safeWithChildren: true,
    storeId: "STR-005",
    file: {
      summary:
        "Brindle KNPV-bred male with an off-switch that surprises everyone. Cobra works the fence line at a trot for hours, then lies under the dining table through dinner.",
      born: "19 February 2025 — Northern Ridge K9, Kaduna",
      hipsElbows: "Hips A2 (a-fast normal) / elbows normal",
      microchip: "985 119 004 776 012",
      vaccinations: "Complete series; booster due February 2027",
      titles: "KNPV-1 in training, obedience certified",
      sire: "Rex van de Bloemendaal (NL)",
      dam: "Sahara of Northern Ridge (NG)",
      inspected: "Inspected February 2026",
      bestSuited: "Active households and farms wanting a versatile all-weather worker",
      traits: ["Endless stamina", "Brindle working line", "Social indoors", "Heat hardened"],
    },
  },
  {
    fileNo: "KD-2026-052",
    name: "Titus",
    breed: "Presa Canario",
    sex: "Male",
    city: "Lagos",
    age: "3 years",
    weightKg: 58,
    hips: "B1",
    level: 4,
    priceNaira: 2_600_000,
    status: "reserved",
    photo: titusPhoto,
    property: ["compound"],
    safeWithChildren: true,
    storeId: "STR-002",
    file: {
      summary:
        "A fawn mountain with a black mask and the calm authority of a much older dog. Reserved for a consulate residence after a two-week trial; join the list for his half-brother.",
      born: "2 October 2023 — Naija Guard Dogs, Lagos",
      hipsElbows: "Hips B1 / elbows clear",
      microchip: "985 120 001 340 995",
      vaccinations: "Complete; rabies current to October 2027",
      titles: "Family protection certified (level 2)",
      sire: "Ch. Taz del Atlantico (ES)",
      dam: "Bianca of Naija Guard (NG)",
      inspected: "Inspected December 2025",
      bestSuited: "Large walled compounds with controlled visitor traffic",
      traits: ["Immovable presence", "Calm authority", "Deep chest bark", "Gate trained"],
    },
  },
  {
    fileNo: "KD-2026-055",
    name: "Blitz",
    breed: "German Shepherd",
    sex: "Male",
    city: "Ibadan",
    age: "20 months",
    weightKg: 36,
    hips: "A1",
    level: 3,
    priceNaira: 1_850_000,
    status: "available",
    photo: blitzPhoto,
    property: ["home", "estate"],
    safeWithChildren: true,
    storeId: "STR-004",
    file: {
      summary:
        "Solid black male from east-German working lines. Blitz tracks, alerts and holds — a natural with children and merciless on a trail.",
      born: "26 December 2024 — Savanna Working Dogs, Ibadan",
      hipsElbows: "Hips A1 (a-normal) / elbows normal",
      microchip: "985 120 002 918 663",
      vaccinations: "Complete; booster due December 2026",
      titles: "Tracking certified (IPH-1)",
      sire: "Quattro vom Felsenmeer (DE)",
      dam: "Ewu of Savanna (NG)",
      inspected: "Inspected January 2026",
      bestSuited: "Families who want tracking ability paired with home guarding",
      traits: ["Elite tracker", "Solid black coat", "Kid friendly", "Trainable daily"],
    },
  },
  {
    fileNo: "KD-2026-058",
    name: "Mamba",
    breed: "Belgian Malinois",
    sex: "Female",
    city: "Abuja",
    age: "3 years",
    weightKg: 28,
    hips: "A1",
    level: 5,
    priceNaira: 2_900_000,
    status: "available",
    photo: mambaPhoto,
    property: ["home", "estate", "compound"],
    safeWithChildren: true,
    storeId: "STR-001",
    file: {
      summary:
        "Veteran of two embassy security contracts, now ready for a family that can keep up with her. Mamba reads a room in seconds and holds a perimeter like a drone with teeth.",
      born: "11 November 2023 — K9 Guardian Kennels, Abuja",
      hipsElbows: "Hips A1 (a-normal) / elbows normal, SV certified",
      microchip: "985 121 003 507 226",
      vaccinations: "Complete; booster due November 2026",
      titles: "IGP-3, executive protection certified",
      sire: "V Nikita des Loups Hardis (FR)",
      dam: "Keisha of Guardian Line (NG)",
      inspected: "Re-inspected February 2026",
      bestSuited: "Experienced handlers and high-profile homes with frequent travel",
      traits: ["Contract veteran", "Elite bitework", "Vehicle trained", "Fast response"],
    },
  },
  {
    fileNo: "KD-2026-061",
    name: "Ares",
    breed: "Rottweiler",
    sex: "Male",
    city: "Enugu",
    age: "18 months",
    weightKg: 46,
    hips: "B1",
    level: 3,
    priceNaira: 1_250_000,
    status: "available",
    photo: aresPhoto,
    property: ["home", "compound"],
    safeWithChildren: true,
    storeId: "STR-003",
    file: {
      summary:
        "Youthful male with heavyweight genetics still filling out. Ares has finished his alert-bark program and is ready to bond with a family and grow into the role.",
      born: "3 May 2025 — Niger Delta K9, Enugu",
      hipsElbows: "Hips B1 (preliminary) / elbows clear",
      microchip: "985 121 004 883 770",
      vaccinations: "Complete series; booster due May 2027",
      titles: "Family protection certified (level 1)",
      sire: "Ch. Brutus vom Delta Line (NG)",
      dam: "Oluchi of Delta K9 (NG)",
      inspected: "Inspected September 2026",
      bestSuited: "Growing families who want a guardian raised alongside the household",
      traits: ["Still growing", "Playful guardian", "Alert-bark trained", "Lead trained"],
    },
  },
];

export function getStore(storeId: string) {
  return sampleStores.find(s => s.id === storeId)
}

export function formatNaira(value: number) {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  return `₦${value.toLocaleString('en-NG')}`
}

export function findDog(fileNo: string) {
  return sampleDogs.find(dog => dog.fileNo.toLowerCase() === fileNo.toLowerCase())
}
