/**
 * Turkey Geographic Data for OSGB Local SEO
 *
 * 81 il, 922 ilce ve komsu il iliskileri
 * Her OSGB kendi ili + komsu illere hizmet verebilir
 */

export interface District {
  name: string;
  slug: string;
  population?: number;
  isCenter?: boolean; // Merkez ilce mi?
}

export interface IndustrySector {
  id: string; // "otomotiv", "kimya", "tekstil"
  name: string; // "Otomotiv Sanayi"
  slug: string; // "otomotiv"
  weight: number; // 1-10 arasi onem/yogunluk (SEO onceligi)
  dangerClass: "az_tehlikeli" | "tehlikeli" | "cok_tehlikeli";
}

export interface Province {
  id: number; // Plaka kodu
  name: string;
  slug: string;
  region: TurkeyRegion;
  neighbors: number[]; // Komsu il plaka kodlari
  districts: District[];
  population?: number;
  dangerClass?: "az_tehlikeli" | "tehlikeli" | "cok_tehlikeli"; // Bolgedeki agirlikli tehlike sinifi
  industrySectors?: IndustrySector[]; // Bolgenin baslica sanayi sektorleri
}

export type TurkeyRegion =
  | "marmara"
  | "ege"
  | "akdeniz"
  | "ic_anadolu"
  | "karadeniz"
  | "dogu_anadolu"
  | "guneydogu_anadolu";

/**
 * Turkiye Il ve Komsu Verileri
 * Plaka koduna gore siralanmis
 */
export const TURKEY_PROVINCES: Province[] = [
  {
    id: 1,
    name: "Adana",
    slug: "adana",
    region: "akdeniz",
    neighbors: [31, 33, 38, 46, 80], // Hatay, Mersin, Kayseri, K.Maras, Osmaniye
    districts: [
      { name: "Seyhan", slug: "seyhan", isCenter: true },
      { name: "Cukurova", slug: "cukurova", isCenter: true },
      { name: "Yuregir", slug: "yuregir", isCenter: true },
      { name: "Sarıcam", slug: "saricam", isCenter: true },
      { name: "Ceyhan", slug: "ceyhan" },
      { name: "Kozan", slug: "kozan" },
      { name: "Imamoglu", slug: "imamoglu" },
      { name: "Karaisalı", slug: "karaisali" },
      { name: "Karatas", slug: "karatas" },
      { name: "Pozantı", slug: "pozanti" },
      { name: "Saimbeyli", slug: "saimbeyli" },
      { name: "Tufanbeyli", slug: "tufanbeyli" },
      { name: "Yumurtalık", slug: "yumurtalik" },
      { name: "Aladağ", slug: "aladag" },
      { name: "Feke", slug: "feke" },
    ],
  },
  {
    id: 6,
    name: "Ankara",
    slug: "ankara",
    region: "ic_anadolu",
    neighbors: [14, 18, 26, 40, 42, 66, 68, 71], // Bolu, Cankiri, Eskisehir, Kirsehir, Konya, Yozgat, Aksaray, Kirikkale
    districts: [
      { name: "Cankaya", slug: "cankaya", isCenter: true },
      { name: "Kecioren", slug: "kecioren", isCenter: true },
      { name: "Mamak", slug: "mamak", isCenter: true },
      { name: "Yenimahalle", slug: "yenimahalle", isCenter: true },
      { name: "Etimesgut", slug: "etimesgut", isCenter: true },
      { name: "Sincan", slug: "sincan", isCenter: true },
      { name: "Altındağ", slug: "altindag", isCenter: true },
      { name: "Pursaklar", slug: "pursaklar", isCenter: true },
      { name: "Polatli", slug: "polatli" },
      { name: "Cubuk", slug: "cubuk" },
      { name: "Beypazari", slug: "beypazari" },
      { name: "Haymana", slug: "haymana" },
      { name: "Sereflikochisar", slug: "sereflikochisar" },
      { name: "Ayas", slug: "ayas" },
      { name: "Bala", slug: "bala" },
      { name: "Camlidere", slug: "camlidere" },
      { name: "Elmadag", slug: "elmadag" },
      { name: "Evren", slug: "evren" },
      { name: "Golbasi", slug: "golbasi" },
      { name: "Gudul", slug: "gudul" },
      { name: "Kahramankazan", slug: "kahramankazan" },
      { name: "Kalecik", slug: "kalecik" },
      { name: "Kizilcahamam", slug: "kizilcahamam" },
      { name: "Nallihan", slug: "nallihan" },
      { name: "Akyurt", slug: "akyurt" },
    ],
  },
  {
    id: 34,
    name: "Istanbul",
    slug: "istanbul",
    region: "marmara",
    neighbors: [41, 59], // Kocaeli, Tekirdag
    districts: [
      { name: "Kadıkoy", slug: "kadikoy", isCenter: true },
      { name: "Besiktas", slug: "besiktas", isCenter: true },
      { name: "Sisli", slug: "sisli", isCenter: true },
      { name: "Fatih", slug: "fatih", isCenter: true },
      { name: "Uskudar", slug: "uskudar", isCenter: true },
      { name: "Beyoglu", slug: "beyoglu", isCenter: true },
      { name: "Umraniye", slug: "umraniye" },
      { name: "Bagcilar", slug: "bagcilar" },
      { name: "Bahcelievler", slug: "bahcelievler" },
      { name: "Bakirkoy", slug: "bakirkoy" },
      { name: "Maltepe", slug: "maltepe" },
      { name: "Kartal", slug: "kartal" },
      { name: "Pendik", slug: "pendik" },
      { name: "Tuzla", slug: "tuzla" },
      { name: "Atasehir", slug: "atasehir" },
      { name: "Sancaktepe", slug: "sancaktepe" },
      { name: "Sultanbeyli", slug: "sultanbeyli" },
      { name: "Cekmekoy", slug: "cekmekoy" },
      { name: "Beykoz", slug: "beykoz" },
      { name: "Sile", slug: "sile" },
      { name: "Avcilar", slug: "avcilar" },
      { name: "Kucukcekmece", slug: "kucukcekmece" },
      { name: "Buyukcekmece", slug: "buyukcekmece" },
      { name: "Basaksehir", slug: "basaksehir" },
      { name: "Esenyurt", slug: "esenyurt" },
      { name: "Beylikduzu", slug: "beylikduzu" },
      { name: "Arnavutkoy", slug: "arnavutkoy" },
      { name: "Catalca", slug: "catalca" },
      { name: "Silivri", slug: "silivri" },
      { name: "Esenler", slug: "esenler" },
      { name: "Gungoren", slug: "gungoren" },
      { name: "Zeytinburnu", slug: "zeytinburnu" },
      { name: "Bayrampaşa", slug: "bayrampasa" },
      { name: "Eyupsultan", slug: "eyupsultan" },
      { name: "Gaziosmanpasa", slug: "gaziosmanpasa" },
      { name: "Kagithane", slug: "kagithane" },
      { name: "Sariyer", slug: "sariyer" },
      { name: "Sultangazı", slug: "sultangazi" },
      { name: "Adalar", slug: "adalar" },
    ],
  },
  {
    id: 35,
    name: "Izmir",
    slug: "izmir",
    region: "ege",
    neighbors: [9, 10, 45], // Aydin, Balikesir, Manisa
    districts: [
      { name: "Konak", slug: "konak", isCenter: true },
      { name: "Karsıyaka", slug: "karsiyaka", isCenter: true },
      { name: "Bornova", slug: "bornova", isCenter: true },
      { name: "Buca", slug: "buca", isCenter: true },
      { name: "Cigli", slug: "cigli", isCenter: true },
      { name: "Bayrakli", slug: "bayrakli", isCenter: true },
      { name: "Karabaglar", slug: "karabaglar", isCenter: true },
      { name: "Gaziemir", slug: "gaziemir", isCenter: true },
      { name: "Narlidere", slug: "narlidere", isCenter: true },
      { name: "Balcova", slug: "balcova", isCenter: true },
      { name: "Guzelbahce", slug: "guzelbahce", isCenter: true },
      { name: "Aliaga", slug: "aliaga" },
      { name: "Bergama", slug: "bergama" },
      { name: "Cesme", slug: "cesme" },
      { name: "Dikili", slug: "dikili" },
      { name: "Foca", slug: "foca" },
      { name: "Karaburun", slug: "karaburun" },
      { name: "Kemalpasa", slug: "kemalpasa" },
      { name: "Kinik", slug: "kinik" },
      { name: "Kiraz", slug: "kiraz" },
      { name: "Menderes", slug: "menderes" },
      { name: "Menemen", slug: "menemen" },
      { name: "Odemis", slug: "odemis" },
      { name: "Seferihisar", slug: "seferihisar" },
      { name: "Selcuk", slug: "selcuk" },
      { name: "Tire", slug: "tire" },
      { name: "Torbali", slug: "torbali" },
      { name: "Urla", slug: "urla" },
      { name: "Beydag", slug: "beydag" },
    ],
  },
  {
    id: 41,
    name: "Kocaeli",
    slug: "kocaeli",
    region: "marmara",
    neighbors: [11, 16, 34, 54, 77], // Bilecik, Bursa, Istanbul, Sakarya, Yalova
    districts: [
      { name: "Izmit", slug: "izmit", isCenter: true },
      { name: "Gebze", slug: "gebze" },
      { name: "Darica", slug: "darica" },
      { name: "Dilovasi", slug: "dilovasi" },
      { name: "Cayirova", slug: "cayirova" },
      { name: "Basiskele", slug: "basiskele" },
      { name: "Kartepe", slug: "kartepe" },
      { name: "Golcuk", slug: "golcuk" },
      { name: "Kandira", slug: "kandira" },
      { name: "Karamursel", slug: "karamursel" },
      { name: "Korfez", slug: "korfez" },
      { name: "Derince", slug: "derince" },
    ],
  },
  {
    id: 16,
    name: "Bursa",
    slug: "bursa",
    region: "marmara",
    neighbors: [10, 11, 41, 43, 77], // Balıkesir, Bilecik, Kocaeli, Kutahya, Yalova
    districts: [
      { name: "Osmangazi", slug: "osmangazi", isCenter: true },
      { name: "Nilufer", slug: "nilufer", isCenter: true },
      { name: "Yildirim", slug: "yildirim", isCenter: true },
      { name: "Inegol", slug: "inegol" },
      { name: "Gemlik", slug: "gemlik" },
      { name: "Mudanya", slug: "mudanya" },
      { name: "Gursu", slug: "gursu" },
      { name: "Kestel", slug: "kestel" },
      { name: "Karacabey", slug: "karacabey" },
      { name: "Mustafakemalpasa", slug: "mustafakemalpasa" },
      { name: "Orhangazi", slug: "orhangazi" },
      { name: "Iznik", slug: "iznik" },
      { name: "Yenisehir", slug: "yenisehir" },
      { name: "Orhaneli", slug: "orhaneli" },
      { name: "Keles", slug: "keles" },
      { name: "Harmancik", slug: "harmancik" },
      { name: "Buyukorhan", slug: "buyukorhan" },
    ],
  },
  // 2 - Adiyaman
  {
    id: 2,
    name: "Adiyaman",
    slug: "adiyaman",
    region: "guneydogu_anadolu",
    neighbors: [21, 27, 38, 44, 46, 63],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Besni", slug: "besni" },
      { name: "Golbasi", slug: "golbasi" },
      { name: "Kahta", slug: "kahta" },
      { name: "Gerger", slug: "gerger" },
      { name: "Celikhan", slug: "celikhan" },
      { name: "Samsat", slug: "samsat" },
      { name: "Sincik", slug: "sincik" },
      { name: "Tut", slug: "tut" },
    ],
  },
  // 3 - Afyonkarahisar
  {
    id: 3,
    name: "Afyonkarahisar",
    slug: "afyonkarahisar",
    region: "ege",
    neighbors: [15, 20, 26, 32, 42, 43, 64],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Sandikli", slug: "sandikli" },
      { name: "Dinar", slug: "dinar" },
      { name: "Bolvadin", slug: "bolvadin" },
      { name: "Emirdağ", slug: "emirdag" },
      { name: "Sultandagi", slug: "sultandagi" },
      { name: "Sinanpasa", slug: "sinanpasa" },
      { name: "Suhut", slug: "suhut" },
      { name: "Iscehisar", slug: "iscehisar" },
      { name: "Cayirbasıi", slug: "cayirbasi" },
      { name: "Basmakcı", slug: "basmakci" },
      { name: "Bayat", slug: "bayat" },
      { name: "Dazkiri", slug: "dazkiri" },
      { name: "Evciler", slug: "evciler" },
      { name: "Hocalar", slug: "hocalar" },
      { name: "Ihsaniye", slug: "ihsaniye" },
      { name: "Kiziloren", slug: "kiziloren" },
      { name: "Cobanlar", slug: "cobanlar" },
    ],
  },
  // 4 - Agri
  {
    id: 4,
    name: "Agri",
    slug: "agri",
    region: "dogu_anadolu",
    neighbors: [25, 36, 65, 76],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Dogubayazit", slug: "dogubayazit" },
      { name: "Patnos", slug: "patnos" },
      { name: "Diyadin", slug: "diyadin" },
      { name: "Eleşkirt", slug: "eleskirt" },
      { name: "Hamur", slug: "hamur" },
      { name: "Taslicay", slug: "taslicay" },
      { name: "Tutak", slug: "tutak" },
    ],
  },
  // 5 - Amasya
  {
    id: 5,
    name: "Amasya",
    slug: "amasya",
    region: "karadeniz",
    neighbors: [19, 55, 60, 66],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Merzifon", slug: "merzifon" },
      { name: "Suluova", slug: "suluova" },
      { name: "Tasova", slug: "tasova" },
      { name: "Goynucek", slug: "goynucek" },
      { name: "Gumushacikoy", slug: "gumushacikoy" },
      { name: "Hamamozu", slug: "hamamozu" },
    ],
  },
  // 7 - Antalya
  {
    id: 7,
    name: "Antalya",
    slug: "antalya",
    region: "akdeniz",
    neighbors: [15, 32, 33, 42, 48],
    districts: [
      { name: "Muratpasa", slug: "muratpasa", isCenter: true },
      { name: "Konyaalti", slug: "konyaalti", isCenter: true },
      { name: "Kepez", slug: "kepez", isCenter: true },
      { name: "Dosemealti", slug: "dosemealti", isCenter: true },
      { name: "Aksu", slug: "aksu", isCenter: true },
      { name: "Alanya", slug: "alanya" },
      { name: "Manavgat", slug: "manavgat" },
      { name: "Serik", slug: "serik" },
      { name: "Kemer", slug: "kemer" },
      { name: "Kas", slug: "kas" },
      { name: "Kumluca", slug: "kumluca" },
      { name: "Finike", slug: "finike" },
      { name: "Demre", slug: "demre" },
      { name: "Elmali", slug: "elmali" },
      { name: "Korkuteli", slug: "korkuteli" },
      { name: "Akseki", slug: "akseki" },
      { name: "Gazipasa", slug: "gazipasa" },
      { name: "Gundogmus", slug: "gundogmus" },
      { name: "Ibradi", slug: "ibradi" },
    ],
  },
  // 8 - Artvin
  {
    id: 8,
    name: "Artvin",
    slug: "artvin",
    region: "karadeniz",
    neighbors: [25, 53, 75],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Arhavi", slug: "arhavi" },
      { name: "Borcka", slug: "borcka" },
      { name: "Hopa", slug: "hopa" },
      { name: "Savsat", slug: "savsat" },
      { name: "Yusufeli", slug: "yusufeli" },
      { name: "Ardanuc", slug: "ardanuc" },
      { name: "Murgul", slug: "murgul" },
    ],
  },
  // 9 - Aydin
  {
    id: 9,
    name: "Aydin",
    slug: "aydin",
    region: "ege",
    neighbors: [20, 35, 48],
    districts: [
      { name: "Efeler", slug: "efeler", isCenter: true },
      { name: "Nazilli", slug: "nazilli" },
      { name: "Soke", slug: "soke" },
      { name: "Kusadasi", slug: "kusadasi" },
      { name: "Didim", slug: "didim" },
      { name: "Incirliova", slug: "incirliova" },
      { name: "Germencik", slug: "germencik" },
      { name: "Cine", slug: "cine" },
      { name: "Sultanhisar", slug: "sultanhisar" },
      { name: "Buharkent", slug: "buharkent" },
      { name: "Karacasu", slug: "karacasu" },
      { name: "Bozdogan", slug: "bozdogan" },
      { name: "Kosk", slug: "kosk" },
      { name: "Kuyucak", slug: "kuyucak" },
      { name: "Yenipazar", slug: "yenipazar" },
      { name: "Kocarli", slug: "kocarli" },
      { name: "Karpuzlu", slug: "karpuzlu" },
    ],
  },
  // 10 - Balikesir
  {
    id: 10,
    name: "Balikesir",
    slug: "balikesir",
    region: "marmara",
    neighbors: [11, 16, 17, 35, 43, 45],
    districts: [
      { name: "Altieylul", slug: "altieylul", isCenter: true },
      { name: "Karesi", slug: "karesi", isCenter: true },
      { name: "Bandirma", slug: "bandirma" },
      { name: "Edremit", slug: "edremit" },
      { name: "Gonen", slug: "gonen" },
      { name: "Burhaniye", slug: "burhaniye" },
      { name: "Susurluk", slug: "susurluk" },
      { name: "Bigadic", slug: "bigadic" },
      { name: "Dursunbey", slug: "dursunbey" },
      { name: "Erdek", slug: "erdek" },
      { name: "Ayvalik", slug: "ayvalik" },
      { name: "Havran", slug: "havran" },
      { name: "Sindirgi", slug: "sindirgi" },
      { name: "Savastepe", slug: "savastepe" },
      { name: "Ivrinidi", slug: "ivrindi" },
      { name: "Kepsut", slug: "kepsut" },
      { name: "Manyas", slug: "manyas" },
      { name: "Marmara", slug: "marmara" },
      { name: "Balya", slug: "balya" },
      { name: "Gocek", slug: "gocek" },
    ],
  },
  // 11 - Bilecik
  {
    id: 11,
    name: "Bilecik",
    slug: "bilecik",
    region: "marmara",
    neighbors: [10, 14, 16, 26, 41, 43, 54],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Bozuyuk", slug: "bozuyuk" },
      { name: "Osmaneli", slug: "osmaneli" },
      { name: "Pazaryeri", slug: "pazaryeri" },
      { name: "Sogut", slug: "sogut" },
      { name: "Golpazari", slug: "golpazari" },
      { name: "Inhisar", slug: "inhisar" },
      { name: "Yenipazar", slug: "yenipazar" },
    ],
  },
  // 12 - Bingol
  {
    id: 12,
    name: "Bingol",
    slug: "bingol",
    region: "dogu_anadolu",
    neighbors: [21, 23, 24, 49, 62],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Genc", slug: "genc" },
      { name: "Solhan", slug: "solhan" },
      { name: "Karliova", slug: "karliova" },
      { name: "Adakli", slug: "adakli" },
      { name: "Kigi", slug: "kigi" },
      { name: "Yayladere", slug: "yayladere" },
      { name: "Yedisu", slug: "yedisu" },
    ],
  },
  // 13 - Bitlis
  {
    id: 13,
    name: "Bitlis",
    slug: "bitlis",
    region: "dogu_anadolu",
    neighbors: [21, 49, 56, 65, 72],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Tatvan", slug: "tatvan" },
      { name: "Ahlat", slug: "ahlat" },
      { name: "Adilcevaz", slug: "adilcevaz" },
      { name: "Guroymak", slug: "guroymak" },
      { name: "Hizan", slug: "hizan" },
      { name: "Mutki", slug: "mutki" },
    ],
  },
  // 14 - Bolu
  {
    id: 14,
    name: "Bolu",
    slug: "bolu",
    region: "karadeniz",
    neighbors: [6, 11, 18, 54, 67, 78, 81],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Gerede", slug: "gerede" },
      { name: "Mengen", slug: "mengen" },
      { name: "Mudurnu", slug: "mudurnu" },
      { name: "Goynuk", slug: "goynuk" },
      { name: "Seben", slug: "seben" },
      { name: "Dortdivan", slug: "dortdivan" },
      { name: "Kibriscik", slug: "kibriscik" },
      { name: "Yenicaga", slug: "yenicaga" },
    ],
  },
  // 15 - Burdur
  {
    id: 15,
    name: "Burdur",
    slug: "burdur",
    region: "akdeniz",
    neighbors: [3, 7, 20, 32, 48, 64],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Bucak", slug: "bucak" },
      { name: "Golhisar", slug: "golhisar" },
      { name: "Yesilova", slug: "yesilova" },
      { name: "Tefenni", slug: "tefenni" },
      { name: "Aglasun", slug: "aglasun" },
      { name: "Altinyayla", slug: "altinyayla" },
      { name: "Cavdir", slug: "cavdir" },
      { name: "Celtikci", slug: "celtikci" },
      { name: "Karamanli", slug: "karamanli" },
      { name: "Kemer", slug: "kemer" },
    ],
  },
  // 17 - Canakkale
  {
    id: 17,
    name: "Canakkale",
    slug: "canakkale",
    region: "marmara",
    neighbors: [10, 59],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Biga", slug: "biga" },
      { name: "Can", slug: "can" },
      { name: "Gelibolu", slug: "gelibolu" },
      { name: "Ezine", slug: "ezine" },
      { name: "Ayvacik", slug: "ayvacik" },
      { name: "Bayramic", slug: "bayramic" },
      { name: "Lapseki", slug: "lapseki" },
      { name: "Yenice", slug: "yenice" },
      { name: "Eceabat", slug: "eceabat" },
      { name: "Bozcaada", slug: "bozcaada" },
      { name: "Gokceada", slug: "gokceada" },
    ],
  },
  // 18 - Cankiri
  {
    id: 18,
    name: "Cankiri",
    slug: "cankiri",
    region: "ic_anadolu",
    neighbors: [6, 14, 19, 37, 66, 71],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Cerkes", slug: "cerkes" },
      { name: "Ilgaz", slug: "ilgaz" },
      { name: "Kurskale", slug: "kurskale" },
      { name: "Orta", slug: "orta" },
      { name: "Sabanozü", slug: "sabanozu" },
      { name: "Yaprakli", slug: "yaprakli" },
      { name: "Atkaracalar", slug: "atkaracalar" },
      { name: "Bayramoren", slug: "bayramoren" },
      { name: "Eldivan", slug: "eldivan" },
      { name: "Korgun", slug: "korgun" },
      { name: "Kizilirmak", slug: "kizilirmak" },
    ],
  },
  // 19 - Corum
  {
    id: 19,
    name: "Corum",
    slug: "corum",
    region: "karadeniz",
    neighbors: [5, 18, 37, 55, 60, 66],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Sungurlu", slug: "sungurlu" },
      { name: "Osmancik", slug: "osmancik" },
      { name: "Alaca", slug: "alaca" },
      { name: "Iskilip", slug: "iskilip" },
      { name: "Bayat", slug: "bayat" },
      { name: "Kargi", slug: "kargi" },
      { name: "Mecitozu", slug: "mecitozu" },
      { name: "Ortakoy", slug: "ortakoy" },
      { name: "Dodurga", slug: "dodurga" },
      { name: "Lacin", slug: "lacin" },
      { name: "Oguzlar", slug: "oguzlar" },
      { name: "Ugurludag", slug: "ugurludag" },
      { name: "Bogazkale", slug: "bogazkale" },
    ],
  },
  // 20 - Denizli
  {
    id: 20,
    name: "Denizli",
    slug: "denizli",
    region: "ege",
    neighbors: [3, 9, 15, 48, 64],
    districts: [
      { name: "Merkezefendi", slug: "merkezefendi", isCenter: true },
      { name: "Pamukkale", slug: "pamukkale", isCenter: true },
      { name: "Civril", slug: "civril" },
      { name: "Acipayam", slug: "acipayam" },
      { name: "Tavas", slug: "tavas" },
      { name: "Buldan", slug: "buldan" },
      { name: "Saraykoy", slug: "saraykoy" },
      { name: "Kale", slug: "kale" },
      { name: "Honaz", slug: "honaz" },
      { name: "Guney", slug: "guney" },
      { name: "Cal", slug: "cal" },
      { name: "Cardak", slug: "cardak" },
      { name: "Bozkurt", slug: "bozkurt" },
      { name: "Serinhisar", slug: "serinhisar" },
      { name: "Bekilli", slug: "bekilli" },
      { name: "Babadağ", slug: "babadag" },
      { name: "Beyagac", slug: "beyagac" },
      { name: "Baklan", slug: "baklan" },
    ],
  },
  // 21 - Diyarbakir
  {
    id: 21,
    name: "Diyarbakir",
    slug: "diyarbakir",
    region: "guneydogu_anadolu",
    neighbors: [2, 12, 13, 23, 44, 47, 49, 56, 63, 72],
    districts: [
      { name: "Baglar", slug: "baglar", isCenter: true },
      { name: "Kayapinar", slug: "kayapinar", isCenter: true },
      { name: "Sur", slug: "sur", isCenter: true },
      { name: "Yenisehir", slug: "yenisehir", isCenter: true },
      { name: "Bismil", slug: "bismil" },
      { name: "Ergani", slug: "ergani" },
      { name: "Silvan", slug: "silvan" },
      { name: "Cermik", slug: "cermik" },
      { name: "Dicle", slug: "dicle" },
      { name: "Hani", slug: "hani" },
      { name: "Hazro", slug: "hazro" },
      { name: "Kulp", slug: "kulp" },
      { name: "Lice", slug: "lice" },
      { name: "Cinar", slug: "cinar" },
      { name: "Egil", slug: "egil" },
      { name: "Kocakoy", slug: "kocakoy" },
      { name: "Cungus", slug: "cungus" },
    ],
  },
  // 22 - Edirne
  {
    id: 22,
    name: "Edirne",
    slug: "edirne",
    region: "marmara",
    neighbors: [39, 59],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Kesan", slug: "kesan" },
      { name: "Uzunkopru", slug: "uzunkopru" },
      { name: "Ipsala", slug: "ipsala" },
      { name: "Havsa", slug: "havsa" },
      { name: "Enez", slug: "enez" },
      { name: "Meric", slug: "meric" },
      { name: "Suloglu", slug: "suloglu" },
      { name: "Lalapasa", slug: "lalapasa" },
    ],
  },
  // 23 - Elazig
  {
    id: 23,
    name: "Elazig",
    slug: "elazig",
    region: "dogu_anadolu",
    neighbors: [12, 21, 24, 44, 62],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Karakocan", slug: "karakocan" },
      { name: "Kovancilar", slug: "kovancilar" },
      { name: "Maden", slug: "maden" },
      { name: "Palu", slug: "palu" },
      { name: "Baskil", slug: "baskil" },
      { name: "Sivrice", slug: "sivrice" },
      { name: "Aricak", slug: "aricak" },
      { name: "Keban", slug: "keban" },
      { name: "Ağin", slug: "agin" },
      { name: "Alacakaya", slug: "alacakaya" },
    ],
  },
  // 24 - Erzincan
  {
    id: 24,
    name: "Erzincan",
    slug: "erzincan",
    region: "dogu_anadolu",
    neighbors: [12, 23, 25, 28, 29, 58, 62],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Tercan", slug: "tercan" },
      { name: "Uzumlu", slug: "uzumlu" },
      { name: "Refahiye", slug: "refahiye" },
      { name: "Cayirli", slug: "cayirli" },
      { name: "Ilic", slug: "ilic" },
      { name: "Kemah", slug: "kemah" },
      { name: "Kemaliye", slug: "kemaliye" },
      { name: "Otlukbeli", slug: "otlukbeli" },
    ],
  },
  // 25 - Erzurum
  {
    id: 25,
    name: "Erzurum",
    slug: "erzurum",
    region: "dogu_anadolu",
    neighbors: [4, 8, 24, 29, 36, 49, 53, 69, 75],
    districts: [
      { name: "Yakutiye", slug: "yakutiye", isCenter: true },
      { name: "Palandoken", slug: "palandoken", isCenter: true },
      { name: "Aziziye", slug: "aziziye", isCenter: true },
      { name: "Oltu", slug: "oltu" },
      { name: "Horasan", slug: "horasan" },
      { name: "Pasinler", slug: "pasinler" },
      { name: "Ispir", slug: "ispir" },
      { name: "Tortum", slug: "tortum" },
      { name: "Askale", slug: "askale" },
      { name: "Narman", slug: "narman" },
      { name: "Hinis", slug: "hinis" },
      { name: "Karayazi", slug: "karayazi" },
      { name: "Tekman", slug: "tekman" },
      { name: "Cat", slug: "cat" },
      { name: "Karacoban", slug: "karacoban" },
      { name: "Koprukoy", slug: "koprukoy" },
      { name: "Senkaya", slug: "senkaya" },
      { name: "Uzundere", slug: "uzundere" },
      { name: "Olur", slug: "olur" },
      { name: "Pazaryolu", slug: "pazaryolu" },
    ],
  },
  // 26 - Eskisehir
  {
    id: 26,
    name: "Eskisehir",
    slug: "eskisehir",
    region: "ic_anadolu",
    neighbors: [3, 6, 11, 43],
    districts: [
      { name: "Odunpazari", slug: "odunpazari", isCenter: true },
      { name: "Tepebasi", slug: "tepebasi", isCenter: true },
      { name: "Sivrihisar", slug: "sivrihisar" },
      { name: "Cifteler", slug: "cifteler" },
      { name: "Alpu", slug: "alpu" },
      { name: "Beylikova", slug: "beylikova" },
      { name: "Inonu", slug: "inonu" },
      { name: "Mahmudiye", slug: "mahmudiye" },
      { name: "Mihalgazi", slug: "mihalgazi" },
      { name: "Mihaliccik", slug: "mihaliccik" },
      { name: "Saricakaya", slug: "saricakaya" },
      { name: "Seyitgazi", slug: "seyitgazi" },
      { name: "Gunyuzu", slug: "gunyuzu" },
      { name: "Han", slug: "han" },
    ],
  },
  // 27 - Gaziantep
  {
    id: 27,
    name: "Gaziantep",
    slug: "gaziantep",
    region: "guneydogu_anadolu",
    neighbors: [2, 31, 46, 63, 79, 80],
    districts: [
      { name: "Sahinbey", slug: "sahinbey", isCenter: true },
      { name: "Sehitkamil", slug: "sehitkamil", isCenter: true },
      { name: "Nizip", slug: "nizip" },
      { name: "Islahiye", slug: "islahiye" },
      { name: "Nurdagi", slug: "nurdagi" },
      { name: "Oğuzeli", slug: "oguzeli" },
      { name: "Araban", slug: "araban" },
      { name: "Yavuzeli", slug: "yavuzeli" },
      { name: "Karkamis", slug: "karkamis" },
    ],
  },
  // 28 - Giresun
  {
    id: 28,
    name: "Giresun",
    slug: "giresun",
    region: "karadeniz",
    neighbors: [24, 29, 52, 60, 61, 69],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Bulancak", slug: "bulancak" },
      { name: "Gorele", slug: "gorele" },
      { name: "Espiye", slug: "espiye" },
      { name: "Tirebolu", slug: "tirebolu" },
      { name: "Eynesil", slug: "eynesil" },
      { name: "Dereli", slug: "dereli" },
      { name: "Kesap", slug: "kesap" },
      { name: "Sebinkarahisar", slug: "sebinkarahisar" },
      { name: "Alucra", slug: "alucra" },
      { name: "Piraziz", slug: "piraziz" },
      { name: "Yaglidere", slug: "yaglidere" },
      { name: "Camoluk", slug: "camoluk" },
      { name: "Canakci", slug: "canakci" },
      { name: "Dogankent", slug: "dogankent" },
      { name: "Guce", slug: "guce" },
    ],
  },
  // 29 - Gumushane
  {
    id: 29,
    name: "Gumushane",
    slug: "gumushane",
    region: "karadeniz",
    neighbors: [24, 25, 28, 61, 69],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Kelkit", slug: "kelkit" },
      { name: "Siran", slug: "siran" },
      { name: "Torul", slug: "torul" },
      { name: "Kose", slug: "kose" },
      { name: "Kurtun", slug: "kurtun" },
    ],
  },
  // 30 - Hakkari
  {
    id: 30,
    name: "Hakkari",
    slug: "hakkari",
    region: "dogu_anadolu",
    neighbors: [65, 73],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Yuksekova", slug: "yuksekova" },
      { name: "Semdinli", slug: "semdinli" },
      { name: "Cukurca", slug: "cukurca" },
    ],
  },
  // 31 - Hatay
  {
    id: 31,
    name: "Hatay",
    slug: "hatay",
    region: "akdeniz",
    neighbors: [1, 27, 46, 80],
    districts: [
      { name: "Antakya", slug: "antakya", isCenter: true },
      { name: "Defne", slug: "defne", isCenter: true },
      { name: "Iskenderun", slug: "iskenderun" },
      { name: "Dortyol", slug: "dortyol" },
      { name: "Kirikhan", slug: "kirikhan" },
      { name: "Reyhanli", slug: "reyhanli" },
      { name: "Samandag", slug: "samandag" },
      { name: "Erzin", slug: "erzin" },
      { name: "Altinozü", slug: "altinozu" },
      { name: "Hassa", slug: "hassa" },
      { name: "Belen", slug: "belen" },
      { name: "Kumlu", slug: "kumlu" },
      { name: "Yayladagi", slug: "yayladagi" },
      { name: "Payas", slug: "payas" },
      { name: "Arsuz", slug: "arsuz" },
    ],
  },
  // 32 - Isparta
  {
    id: 32,
    name: "Isparta",
    slug: "isparta",
    region: "akdeniz",
    neighbors: [3, 7, 15, 42],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Yalvac", slug: "yalvac" },
      { name: "Egirdir", slug: "egirdir" },
      { name: "Senirkent", slug: "senirkent" },
      { name: "Keciborlu", slug: "keciborlu" },
      { name: "Sarkikaraagac", slug: "sarkikaraagac" },
      { name: "Gelendost", slug: "gelendost" },
      { name: "Uluborlu", slug: "uluborlu" },
      { name: "Sutculer", slug: "sutculer" },
      { name: "Aksu", slug: "aksu" },
      { name: "Gonen", slug: "gonen" },
      { name: "Atabey", slug: "atabey" },
      { name: "Yenisarbademli", slug: "yenisarbademli" },
    ],
  },
  // 33 - Mersin
  {
    id: 33,
    name: "Mersin",
    slug: "mersin",
    region: "akdeniz",
    neighbors: [1, 7, 42, 70],
    districts: [
      { name: "Akdeniz", slug: "akdeniz", isCenter: true },
      { name: "Mezitli", slug: "mezitli", isCenter: true },
      { name: "Toroslar", slug: "toroslar", isCenter: true },
      { name: "Yenisehir", slug: "yenisehir", isCenter: true },
      { name: "Tarsus", slug: "tarsus" },
      { name: "Silifke", slug: "silifke" },
      { name: "Erdemli", slug: "erdemli" },
      { name: "Anamur", slug: "anamur" },
      { name: "Mut", slug: "mut" },
      { name: "Aydincik", slug: "aydincik" },
      { name: "Bozyazi", slug: "bozyazi" },
      { name: "Camliyayla", slug: "camliyayla" },
      { name: "Gulnar", slug: "gulnar" },
    ],
  },
  // 36 - Kars
  {
    id: 36,
    name: "Kars",
    slug: "kars",
    region: "dogu_anadolu",
    neighbors: [4, 25, 75, 76],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Sarikamis", slug: "sarikamis" },
      { name: "Kagizman", slug: "kagizman" },
      { name: "Susuz", slug: "susuz" },
      { name: "Selim", slug: "selim" },
      { name: "Arpaçay", slug: "arpacay" },
      { name: "Digor", slug: "digor" },
      { name: "Akyaka", slug: "akyaka" },
    ],
  },
  // 37 - Kastamonu
  {
    id: 37,
    name: "Kastamonu",
    slug: "kastamonu",
    region: "karadeniz",
    neighbors: [18, 19, 57, 67, 74, 78],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Tosya", slug: "tosya" },
      { name: "Taskopru", slug: "taskopru" },
      { name: "Inebolu", slug: "inebolu" },
      { name: "Araç", slug: "arac" },
      { name: "Cide", slug: "cide" },
      { name: "Daday", slug: "daday" },
      { name: "Devrekani", slug: "devrekani" },
      { name: "Ihsangazi", slug: "ihsangazi" },
      { name: "Catalhoyuk", slug: "catalhoyuk" },
      { name: "Abana", slug: "abana" },
      { name: "Aglilar", slug: "aglilar" },
      { name: "Bozkurt", slug: "bozkurt" },
      { name: "Hanonu", slug: "hanonu" },
      { name: "Kure", slug: "kure" },
      { name: "Pinarbasi", slug: "pinarbasi" },
      { name: "Senpazar", slug: "senpazar" },
      { name: "Seydiler", slug: "seydiler" },
      { name: "Doganyurt", slug: "doganyurt" },
      { name: "Azdavay", slug: "azdavay" },
    ],
  },
  // 38 - Kayseri
  {
    id: 38,
    name: "Kayseri",
    slug: "kayseri",
    region: "ic_anadolu",
    neighbors: [1, 2, 40, 42, 44, 46, 50, 51, 58, 66, 68],
    districts: [
      { name: "Kocasinan", slug: "kocasinan", isCenter: true },
      { name: "Melikgazi", slug: "melikgazi", isCenter: true },
      { name: "Talas", slug: "talas", isCenter: true },
      { name: "Hacilar", slug: "hacilar", isCenter: true },
      { name: "Incesu", slug: "incesu", isCenter: true },
      { name: "Develi", slug: "develi" },
      { name: "Bunyan", slug: "bunyan" },
      { name: "Yahyali", slug: "yahyali" },
      { name: "Pinarbasi", slug: "pinarbasi" },
      { name: "Sarioglan", slug: "sarioglan" },
      { name: "Tomarza", slug: "tomarza" },
      { name: "Yesilhisar", slug: "yesilhisar" },
      { name: "Felahiye", slug: "felahiye" },
      { name: "Ozvatan", slug: "ozvatan" },
      { name: "Akkisla", slug: "akkisla" },
      { name: "Sariz", slug: "sariz" },
    ],
  },
  // 39 - Kirklareli
  {
    id: 39,
    name: "Kirklareli",
    slug: "kirklareli",
    region: "marmara",
    neighbors: [22, 59],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Luleburgaz", slug: "luleburgaz" },
      { name: "Babaeski", slug: "babaeski" },
      { name: "Vize", slug: "vize" },
      { name: "Pinarhisar", slug: "pinarhisar" },
      { name: "Demirkoy", slug: "demirkoy" },
      { name: "Kofrazi", slug: "kofrazi" },
      { name: "Pehlivankoy", slug: "pehlivankoy" },
    ],
  },
  // 40 - Kirsehir
  {
    id: 40,
    name: "Kirsehir",
    slug: "kirsehir",
    region: "ic_anadolu",
    neighbors: [6, 38, 50, 66, 68, 71],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Kaman", slug: "kaman" },
      { name: "Mucur", slug: "mucur" },
      { name: "Cicekdagi", slug: "cicekdagi" },
      { name: "Akpinar", slug: "akpinar" },
      { name: "Akçakent", slug: "akcakent" },
      { name: "Boztepe", slug: "boztepe" },
    ],
  },
  // 42 - Konya
  {
    id: 42,
    name: "Konya",
    slug: "konya",
    region: "ic_anadolu",
    neighbors: [3, 6, 7, 32, 33, 38, 51, 68, 70],
    districts: [
      { name: "Selcuklu", slug: "selcuklu", isCenter: true },
      { name: "Meram", slug: "meram", isCenter: true },
      { name: "Karatay", slug: "karatay", isCenter: true },
      { name: "Eregli", slug: "eregli" },
      { name: "Akşehir", slug: "aksehir" },
      { name: "Beyşehir", slug: "beysehir" },
      { name: "Seydisehir", slug: "seydisehir" },
      { name: "Cihanbeyli", slug: "cihanbeyli" },
      { name: "Cumra", slug: "cumra" },
      { name: "Ilgin", slug: "ilgin" },
      { name: "Kadinhani", slug: "kadinhani" },
      { name: "Kulu", slug: "kulu" },
      { name: "Sarayonu", slug: "sarayonu" },
      { name: "Bozkir", slug: "bozkir" },
      { name: "Hadim", slug: "hadim" },
      { name: "Doganhisar", slug: "doganhisar" },
      { name: "Yunak", slug: "yunak" },
      { name: "Huyuk", slug: "huyuk" },
      { name: "Taskent", slug: "taskent" },
      { name: "Altinekin", slug: "altinekin" },
      { name: "Guneysinir", slug: "guneysinir" },
      { name: "Derbent", slug: "derbent" },
      { name: "Emirgazi", slug: "emirgazi" },
      { name: "Halkapinar", slug: "halkapinar" },
      { name: "Tuzlukcu", slug: "tuzlukcu" },
      { name: "Yalihuyuk", slug: "yalihuyuk" },
      { name: "Ahirli", slug: "ahirli" },
      { name: "Karapinar", slug: "karapinar" },
      { name: "Derebucak", slug: "derebucak" },
      { name: "Catalhoyuk", slug: "catalhoyuk" },
      { name: "Akoren", slug: "akoren" },
    ],
  },
  // 43 - Kutahya
  {
    id: 43,
    name: "Kutahya",
    slug: "kutahya",
    region: "ege",
    neighbors: [3, 10, 11, 16, 26, 45, 64],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Tavsanli", slug: "tavsanli" },
      { name: "Simav", slug: "simav" },
      { name: "Gediz", slug: "gediz" },
      { name: "Emet", slug: "emet" },
      { name: "Domanic", slug: "domanic" },
      { name: "Altintas", slug: "altintas" },
      { name: "Aslanapa", slug: "aslanapa" },
      { name: "Cavdarhisar", slug: "cavdarhisar" },
      { name: "Dumlupinar", slug: "dumlupinar" },
      { name: "Hisarcik", slug: "hisarcik" },
      { name: "Pazarlar", slug: "pazarlar" },
      { name: "Saphane", slug: "saphane" },
    ],
  },
  // 44 - Malatya
  {
    id: 44,
    name: "Malatya",
    slug: "malatya",
    region: "dogu_anadolu",
    neighbors: [2, 21, 23, 38, 46, 58, 62],
    districts: [
      { name: "Battalgazi", slug: "battalgazi", isCenter: true },
      { name: "Yesilyurt", slug: "yesilyurt", isCenter: true },
      { name: "Dogansehir", slug: "dogansehir" },
      { name: "Akcadag", slug: "akcadag" },
      { name: "Darende", slug: "darende" },
      { name: "Hekimhan", slug: "hekimhan" },
      { name: "Arapgir", slug: "arapgir" },
      { name: "Arguvan", slug: "arguvan" },
      { name: "Kuluncak", slug: "kuluncak" },
      { name: "Puturge", slug: "puturge" },
      { name: "Doganyol", slug: "doganyol" },
      { name: "Kale", slug: "kale" },
      { name: "Yazihan", slug: "yazihan" },
    ],
  },
  // 45 - Manisa
  {
    id: 45,
    name: "Manisa",
    slug: "manisa",
    region: "ege",
    neighbors: [10, 35, 43, 64],
    districts: [
      { name: "Yunusemre", slug: "yunusemre", isCenter: true },
      { name: "Sehzadeler", slug: "sehzadeler", isCenter: true },
      { name: "Akhisar", slug: "akhisar" },
      { name: "Turgutlu", slug: "turgutlu" },
      { name: "Salihli", slug: "salihli" },
      { name: "Soma", slug: "soma" },
      { name: "Alasehir", slug: "alasehir" },
      { name: "Saruhanli", slug: "saruhanli" },
      { name: "Kirkagac", slug: "kirkagac" },
      { name: "Demirci", slug: "demirci" },
      { name: "Gordes", slug: "gordes" },
      { name: "Sarigol", slug: "sarigol" },
      { name: "Kula", slug: "kula" },
      { name: "Ahmetli", slug: "ahmetli" },
      { name: "Golmarmara", slug: "golmarmara" },
      { name: "Koprubasi", slug: "koprubasi" },
      { name: "Selendi", slug: "selendi" },
    ],
  },
  // 46 - Kahramanmaras
  {
    id: 46,
    name: "Kahramanmaras",
    slug: "kahramanmaras",
    region: "akdeniz",
    neighbors: [1, 2, 27, 31, 38, 44, 58, 80],
    districts: [
      { name: "Dulkadiroglu", slug: "dulkadiroglu", isCenter: true },
      { name: "Onikisubat", slug: "onikisubat", isCenter: true },
      { name: "Elbistan", slug: "elbistan" },
      { name: "Afsin", slug: "afsin" },
      { name: "Turkoglu", slug: "turkoglu" },
      { name: "Pazarcik", slug: "pazarcik" },
      { name: "Goksun", slug: "goksun" },
      { name: "Andirin", slug: "andirin" },
      { name: "Caglayancerit", slug: "caglayancerit" },
      { name: "Nurhak", slug: "nurhak" },
      { name: "Ekinozu", slug: "ekinozu" },
    ],
  },
  // 47 - Mardin
  {
    id: 47,
    name: "Mardin",
    slug: "mardin",
    region: "guneydogu_anadolu",
    neighbors: [21, 56, 63, 72, 73],
    districts: [
      { name: "Artuklu", slug: "artuklu", isCenter: true },
      { name: "Kiziltepe", slug: "kiziltepe" },
      { name: "Midyat", slug: "midyat" },
      { name: "Nusaybin", slug: "nusaybin" },
      { name: "Derik", slug: "derik" },
      { name: "Mazidagi", slug: "mazidagi" },
      { name: "Omerli", slug: "omerli" },
      { name: "Savur", slug: "savur" },
      { name: "Dargecit", slug: "dargecit" },
      { name: "Yesilli", slug: "yesilli" },
    ],
  },
  // 48 - Mugla
  {
    id: 48,
    name: "Mugla",
    slug: "mugla",
    region: "ege",
    neighbors: [7, 9, 20, 15],
    districts: [
      { name: "Mentese", slug: "mentese", isCenter: true },
      { name: "Bodrum", slug: "bodrum" },
      { name: "Fethiye", slug: "fethiye" },
      { name: "Marmaris", slug: "marmaris" },
      { name: "Milas", slug: "milas" },
      { name: "Dalaman", slug: "dalaman" },
      { name: "Ortaca", slug: "ortaca" },
      { name: "Datca", slug: "datca" },
      { name: "Koycegiz", slug: "koycegiz" },
      { name: "Ula", slug: "ula" },
      { name: "Yatagan", slug: "yatagan" },
      { name: "Kavaklidere", slug: "kavaklidere" },
      { name: "Seydikemer", slug: "seydikemer" },
    ],
  },
  // 49 - Mus
  {
    id: 49,
    name: "Mus",
    slug: "mus",
    region: "dogu_anadolu",
    neighbors: [12, 13, 21, 25, 65],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Bulanik", slug: "bulanik" },
      { name: "Malazgirt", slug: "malazgirt" },
      { name: "Varto", slug: "varto" },
      { name: "Haskoy", slug: "haskoy" },
      { name: "Korkut", slug: "korkut" },
    ],
  },
  // 50 - Nevsehir
  {
    id: 50,
    name: "Nevsehir",
    slug: "nevsehir",
    region: "ic_anadolu",
    neighbors: [38, 40, 51, 66, 68],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Urgup", slug: "urgup" },
      { name: "Avanos", slug: "avanos" },
      { name: "Gulsehir", slug: "gulsehir" },
      { name: "Derinkuyu", slug: "derinkuyu" },
      { name: "Hacibektaş", slug: "hacibektaş" },
      { name: "Kozakli", slug: "kozakli" },
      { name: "Acigol", slug: "acigol" },
    ],
  },
  // 51 - Nigde
  {
    id: 51,
    name: "Nigde",
    slug: "nigde",
    region: "ic_anadolu",
    neighbors: [38, 42, 50, 68, 70],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Bor", slug: "bor" },
      { name: "Camardi", slug: "camardi" },
      { name: "Ulukisla", slug: "ulukisla" },
      { name: "Altunhisar", slug: "altunhisar" },
      { name: "Ciftlik", slug: "ciftlik" },
    ],
  },
  // 52 - Ordu
  {
    id: 52,
    name: "Ordu",
    slug: "ordu",
    region: "karadeniz",
    neighbors: [28, 55, 60, 69],
    districts: [
      { name: "Altinordu", slug: "altinordu", isCenter: true },
      { name: "Unye", slug: "unye" },
      { name: "Fatsa", slug: "fatsa" },
      { name: "Persembe", slug: "persembe" },
      { name: "Korgan", slug: "korgan" },
      { name: "Kumru", slug: "kumru" },
      { name: "Golkoy", slug: "golkoy" },
      { name: "Ulubey", slug: "ulubey" },
      { name: "Gurgentepe", slug: "gurgentepe" },
      { name: "Mesudiye", slug: "mesudiye" },
      { name: "Aybasti", slug: "aybasti" },
      { name: "Akkus", slug: "akkus" },
      { name: "Ikizce", slug: "ikizce" },
      { name: "Catalpinar", slug: "catalpinar" },
      { name: "Kabaduz", slug: "kabaduz" },
      { name: "Kabatas", slug: "kabatas" },
      { name: "Camasir", slug: "camasir" },
      { name: "Gundogdu", slug: "gundogdu" },
      { name: "Gölyas", slug: "golyasi" },
    ],
  },
  // 53 - Rize
  {
    id: 53,
    name: "Rize",
    slug: "rize",
    region: "karadeniz",
    neighbors: [8, 25, 61],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Cayeli", slug: "cayeli" },
      { name: "Ardeşen", slug: "ardesen" },
      { name: "Pazar", slug: "pazar" },
      { name: "Findikli", slug: "findikli" },
      { name: "Ikizdere", slug: "ikizdere" },
      { name: "Kalkandere", slug: "kalkandere" },
      { name: "Derepazari", slug: "derepazari" },
      { name: "Guneysu", slug: "guneysu" },
      { name: "Hemsin", slug: "hemsin" },
      { name: "Iyidere", slug: "iyidere" },
    ],
  },
  // 54 - Sakarya
  {
    id: 54,
    name: "Sakarya",
    slug: "sakarya",
    region: "marmara",
    neighbors: [11, 14, 41, 67, 81],
    districts: [
      { name: "Adapazari", slug: "adapazari", isCenter: true },
      { name: "Serdivan", slug: "serdivan", isCenter: true },
      { name: "Erenler", slug: "erenler", isCenter: true },
      { name: "Arifiye", slug: "arifiye", isCenter: true },
      { name: "Hendek", slug: "hendek" },
      { name: "Akyazi", slug: "akyazi" },
      { name: "Geyve", slug: "geyve" },
      { name: "Karasu", slug: "karasu" },
      { name: "Sapanca", slug: "sapanca" },
      { name: "Kaynarca", slug: "kaynarca" },
      { name: "Kocaali", slug: "kocaali" },
      { name: "Sogutlu", slug: "sogutlu" },
      { name: "Tarakli", slug: "tarakli" },
      { name: "Pamukova", slug: "pamukova" },
      { name: "Ferizli", slug: "ferizli" },
      { name: "Karapurcek", slug: "karapurcek" },
    ],
  },
  // 55 - Samsun
  {
    id: 55,
    name: "Samsun",
    slug: "samsun",
    region: "karadeniz",
    neighbors: [5, 19, 52, 60, 66],
    districts: [
      { name: "Atakum", slug: "atakum", isCenter: true },
      { name: "Ilkadim", slug: "ilkadim", isCenter: true },
      { name: "Canik", slug: "canik", isCenter: true },
      { name: "Tekkeköy", slug: "tekkekoy", isCenter: true },
      { name: "Bafra", slug: "bafra" },
      { name: "Carsamba", slug: "carsamba" },
      { name: "Terme", slug: "terme" },
      { name: "Vezirkopru", slug: "vezirkopru" },
      { name: "Havza", slug: "havza" },
      { name: "Kavak", slug: "kavak" },
      { name: "Ladik", slug: "ladik" },
      { name: "Asarcik", slug: "asarcik" },
      { name: "Nineteen May", slug: "ondokuzmayis" },
      { name: "Salipazari", slug: "salipazari" },
      { name: "Ayvacik", slug: "ayvacik" },
      { name: "Yakakent", slug: "yakakent" },
      { name: "Alaçam", slug: "alacam" },
    ],
  },
  // 56 - Siirt
  {
    id: 56,
    name: "Siirt",
    slug: "siirt",
    region: "guneydogu_anadolu",
    neighbors: [13, 21, 47, 72, 73],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Kurtalan", slug: "kurtalan" },
      { name: "Baykan", slug: "baykan" },
      { name: "Eruh", slug: "eruh" },
      { name: "Pervari", slug: "pervari" },
      { name: "Sirvan", slug: "sirvan" },
      { name: "Tillo", slug: "tillo" },
    ],
  },
  // 57 - Sinop
  {
    id: 57,
    name: "Sinop",
    slug: "sinop",
    region: "karadeniz",
    neighbors: [37],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Boyabat", slug: "boyabat" },
      { name: "Gerze", slug: "gerze" },
      { name: "Ayancik", slug: "ayancik" },
      { name: "Turkeli", slug: "turkeli" },
      { name: "Duragan", slug: "duragan" },
      { name: "Dikmen", slug: "dikmen" },
      { name: "Erfelek", slug: "erfelek" },
      { name: "Saraydüzü", slug: "sarayduzu" },
    ],
  },
  // 58 - Sivas
  {
    id: 58,
    name: "Sivas",
    slug: "sivas",
    region: "ic_anadolu",
    neighbors: [24, 38, 44, 46, 60, 62, 66],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Sarkisla", slug: "sarkisla" },
      { name: "Yildizeli", slug: "yildizeli" },
      { name: "Zara", slug: "zara" },
      { name: "Gemerek", slug: "gemerek" },
      { name: "Gurun", slug: "gurun" },
      { name: "Kangal", slug: "kangal" },
      { name: "Divrigi", slug: "divrigi" },
      { name: "Susehri", slug: "susehri" },
      { name: "Hafik", slug: "hafik" },
      { name: "Imranli", slug: "imranli" },
      { name: "Koyulhisar", slug: "koyulhisar" },
      { name: "Akincilar", slug: "akincilar" },
      { name: "Altinyayla", slug: "altinyayla" },
      { name: "Dogansar", slug: "dogansar" },
      { name: "Golova", slug: "golova" },
      { name: "Ulas", slug: "ulas" },
    ],
  },
  // 59 - Tekirdag
  {
    id: 59,
    name: "Tekirdag",
    slug: "tekirdag",
    region: "marmara",
    neighbors: [17, 22, 34, 39],
    districts: [
      { name: "Suleymanpasa", slug: "suleymanpasa", isCenter: true },
      { name: "Kapaklı", slug: "kapakli", isCenter: true },
      { name: "Corlu", slug: "corlu" },
      { name: "Cerkezkoy", slug: "cerkezkoy" },
      { name: "Ergene", slug: "ergene" },
      { name: "Hayrabolu", slug: "hayrabolu" },
      { name: "Malkara", slug: "malkara" },
      { name: "Muratli", slug: "muratli" },
      { name: "Saray", slug: "saray" },
      { name: "Marmaraereglisi", slug: "marmaraereglisi" },
      { name: "Sarkoy", slug: "sarkoy" },
    ],
  },
  // 60 - Tokat
  {
    id: 60,
    name: "Tokat",
    slug: "tokat",
    region: "karadeniz",
    neighbors: [5, 19, 28, 52, 55, 58, 66],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Erbaa", slug: "erbaa" },
      { name: "Turhal", slug: "turhal" },
      { name: "Niksar", slug: "niksar" },
      { name: "Zile", slug: "zile" },
      { name: "Resadiye", slug: "resadiye" },
      { name: "Almus", slug: "almus" },
      { name: "Artova", slug: "artova" },
      { name: "Basciftlik", slug: "basciftlik" },
      { name: "Pazar", slug: "pazar" },
      { name: "Sulusaray", slug: "sulusaray" },
      { name: "Yesilyurt", slug: "yesilyurt" },
    ],
  },
  // 61 - Trabzon
  {
    id: 61,
    name: "Trabzon",
    slug: "trabzon",
    region: "karadeniz",
    neighbors: [28, 29, 53, 69],
    districts: [
      { name: "Ortahisar", slug: "ortahisar", isCenter: true },
      { name: "Akcaabat", slug: "akcaabat" },
      { name: "Of", slug: "of" },
      { name: "Arakli", slug: "arakli" },
      { name: "Vakfikebir", slug: "vakfikebir" },
      { name: "Yomra", slug: "yomra" },
      { name: "Besikduzu", slug: "besikduzu" },
      { name: "Caykara", slug: "caykara" },
      { name: "Macka", slug: "macka" },
      { name: "Surmene", slug: "surmene" },
      { name: "Tonya", slug: "tonya" },
      { name: "Hayrat", slug: "hayrat" },
      { name: "Dernekpazari", slug: "dernekpazari" },
      { name: "Duzköy", slug: "duzkoy" },
      { name: "Salpazari", slug: "salpazari" },
      { name: "Koprubasi", slug: "koprubasi" },
      { name: "Arsin", slug: "arsin" },
      { name: "Carsibasi", slug: "carsibasi" },
    ],
  },
  // 62 - Tunceli
  {
    id: 62,
    name: "Tunceli",
    slug: "tunceli",
    region: "dogu_anadolu",
    neighbors: [12, 23, 24, 44, 58],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Pertek", slug: "pertek" },
      { name: "Hozat", slug: "hozat" },
      { name: "Ovacik", slug: "ovacik" },
      { name: "Mazgirt", slug: "mazgirt" },
      { name: "Nazimiye", slug: "nazimiye" },
      { name: "Cemisgezek", slug: "cemisgezek" },
      { name: "Pulumur", slug: "pulumur" },
    ],
  },
  // 63 - Sanliurfa
  {
    id: 63,
    name: "Sanliurfa",
    slug: "sanliurfa",
    region: "guneydogu_anadolu",
    neighbors: [2, 21, 27, 47, 79],
    districts: [
      { name: "Eyyubiye", slug: "eyyubiye", isCenter: true },
      { name: "Haliliye", slug: "haliliye", isCenter: true },
      { name: "Karakopru", slug: "karakopru", isCenter: true },
      { name: "Siverek", slug: "siverek" },
      { name: "Viransehir", slug: "viransehir" },
      { name: "Suruc", slug: "suruc" },
      { name: "Akcakale", slug: "akcakale" },
      { name: "Birecik", slug: "birecik" },
      { name: "Bozova", slug: "bozova" },
      { name: "Ceylanpinar", slug: "ceylanpinar" },
      { name: "Halfeti", slug: "halfeti" },
      { name: "Hilvan", slug: "hilvan" },
      { name: "Harran", slug: "harran" },
    ],
  },
  // 64 - Usak
  {
    id: 64,
    name: "Usak",
    slug: "usak",
    region: "ege",
    neighbors: [3, 15, 20, 43, 45],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Banaz", slug: "banaz" },
      { name: "Esme", slug: "esme" },
      { name: "Sivasli", slug: "sivasli" },
      { name: "Ulubey", slug: "ulubey" },
      { name: "Karahalli", slug: "karahalli" },
    ],
  },
  // 65 - Van
  {
    id: 65,
    name: "Van",
    slug: "van",
    region: "dogu_anadolu",
    neighbors: [4, 13, 30, 49, 76],
    districts: [
      { name: "Ipekyolu", slug: "ipekyolu", isCenter: true },
      { name: "Tusba", slug: "tusba", isCenter: true },
      { name: "Edremit", slug: "edremit", isCenter: true },
      { name: "Ercis", slug: "ercis" },
      { name: "Baskale", slug: "baskale" },
      { name: "Ozalp", slug: "ozalp" },
      { name: "Muradiye", slug: "muradiye" },
      { name: "Gurpinar", slug: "gurpinar" },
      { name: "Gevas", slug: "gevas" },
      { name: "Caldiran", slug: "caldiran" },
      { name: "Saray", slug: "saray" },
      { name: "Bahcesaray", slug: "bahcesaray" },
      { name: "Catak", slug: "catak" },
    ],
  },
  // 66 - Yozgat
  {
    id: 66,
    name: "Yozgat",
    slug: "yozgat",
    region: "ic_anadolu",
    neighbors: [5, 6, 18, 19, 38, 40, 50, 55, 58, 60, 71],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Sorgun", slug: "sorgun" },
      { name: "Bozok", slug: "bozok" },
      { name: "Yerkoyu", slug: "yerkoyu" },
      { name: "Akdagmadeni", slug: "akdagmadeni" },
      { name: "Saraykent", slug: "saraykent" },
      { name: "Bogazliyan", slug: "bogazliyan" },
      { name: "Sarıkaya", slug: "sarikaya" },
      { name: "Sefaatli", slug: "sefaatli" },
      { name: "Yenifakili", slug: "yenifakili" },
      { name: "Candir", slug: "candir" },
      { name: "Kadisehri", slug: "kadisehri" },
      { name: "Aydincik", slug: "aydincik" },
      { name: "Cekerek", slug: "cekerek" },
    ],
  },
  // 67 - Zonguldak
  {
    id: 67,
    name: "Zonguldak",
    slug: "zonguldak",
    region: "karadeniz",
    neighbors: [14, 37, 54, 74, 78, 81],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Eregli", slug: "eregli" },
      { name: "Devrek", slug: "devrek" },
      { name: "Caycuma", slug: "caycuma" },
      { name: "Alapli", slug: "alapli" },
      { name: "Gokcebey", slug: "gokcebey" },
      { name: "Kilimli", slug: "kilimli" },
      { name: "Kozlu", slug: "kozlu" },
    ],
  },
  // 68 - Aksaray
  {
    id: 68,
    name: "Aksaray",
    slug: "aksaray",
    region: "ic_anadolu",
    neighbors: [6, 38, 40, 42, 50, 51],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Ortakoy", slug: "ortakoy" },
      { name: "Sultanhanı", slug: "sultanhani" },
      { name: "Eskil", slug: "eskil" },
      { name: "Agilcik", slug: "agilcik" },
      { name: "Guzelyurt", slug: "guzelyurt" },
      { name: "Gulsehir", slug: "gulsehir" },
      { name: "Sariyahsi", slug: "sariyahsi" },
    ],
  },
  // 69 - Bayburt
  {
    id: 69,
    name: "Bayburt",
    slug: "bayburt",
    region: "karadeniz",
    neighbors: [25, 28, 29, 52, 61],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Aydintepe", slug: "aydintepe" },
      { name: "Demirozu", slug: "demirozu" },
    ],
  },
  // 70 - Karaman
  {
    id: 70,
    name: "Karaman",
    slug: "karaman",
    region: "ic_anadolu",
    neighbors: [33, 42, 51],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Ermenek", slug: "ermenek" },
      { name: "Sarıveliler", slug: "sariveliler" },
      { name: "Ayranci", slug: "ayranci" },
      { name: "Kazimkarabekir", slug: "kazimkarabekir" },
      { name: "Basyayla", slug: "basyayla" },
    ],
  },
  // 71 - Kirikkale
  {
    id: 71,
    name: "Kirikkale",
    slug: "kirikkale",
    region: "ic_anadolu",
    neighbors: [6, 18, 40, 66],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Keskin", slug: "keskin" },
      { name: "Delice", slug: "delice" },
      { name: "Sulakyurt", slug: "sulakyurt" },
      { name: "Yahsihan", slug: "yahsihan" },
      { name: "Bahsili", slug: "bahsili" },
      { name: "Baliseyh", slug: "baliseyh" },
      { name: "Karakecili", slug: "karakecili" },
      { name: "Celikkhan", slug: "celikhan" },
    ],
  },
  // 72 - Batman
  {
    id: 72,
    name: "Batman",
    slug: "batman",
    region: "guneydogu_anadolu",
    neighbors: [13, 21, 47, 56, 73],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Besiri", slug: "besiri" },
      { name: "Gercus", slug: "gercus" },
      { name: "Kozluk", slug: "kozluk" },
      { name: "Hasankeyf", slug: "hasankeyf" },
      { name: "Sason", slug: "sason" },
    ],
  },
  // 73 - Sirnak
  {
    id: 73,
    name: "Sirnak",
    slug: "sirnak",
    region: "guneydogu_anadolu",
    neighbors: [30, 47, 56, 72],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Cizre", slug: "cizre" },
      { name: "Silopi", slug: "silopi" },
      { name: "Idil", slug: "idil" },
      { name: "Uludere", slug: "uludere" },
      { name: "Beytüssebap", slug: "beytussebap" },
      { name: "Guclukonak", slug: "guclukonak" },
    ],
  },
  // 74 - Bartin
  {
    id: 74,
    name: "Bartin",
    slug: "bartin",
    region: "karadeniz",
    neighbors: [37, 67, 78],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Amasra", slug: "amasra" },
      { name: "Kurucasile", slug: "kurucasile" },
      { name: "Ulus", slug: "ulus" },
    ],
  },
  // 75 - Ardahan
  {
    id: 75,
    name: "Ardahan",
    slug: "ardahan",
    region: "dogu_anadolu",
    neighbors: [8, 25, 36],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Gole", slug: "gole" },
      { name: "Cildir", slug: "cildir" },
      { name: "Hanak", slug: "hanak" },
      { name: "Damal", slug: "damal" },
      { name: "Posof", slug: "posof" },
    ],
  },
  // 76 - Igdir
  {
    id: 76,
    name: "Igdir",
    slug: "igdir",
    region: "dogu_anadolu",
    neighbors: [4, 36, 65],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Tuzluca", slug: "tuzluca" },
      { name: "Aralik", slug: "aralik" },
      { name: "Karakoyunlu", slug: "karakoyunlu" },
    ],
  },
  // 77 - Yalova
  {
    id: 77,
    name: "Yalova",
    slug: "yalova",
    region: "marmara",
    neighbors: [16, 41],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Cinarcik", slug: "cinarcik" },
      { name: "Ciftlikkoy", slug: "ciftlikkoy" },
      { name: "Altinova", slug: "altinova" },
      { name: "Armutlu", slug: "armutlu" },
      { name: "Termal", slug: "termal" },
    ],
  },
  // 78 - Karabuk
  {
    id: 78,
    name: "Karabuk",
    slug: "karabuk",
    region: "karadeniz",
    neighbors: [14, 37, 67, 74],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Safranbolu", slug: "safranbolu" },
      { name: "Yenice", slug: "yenice" },
      { name: "Eflani", slug: "eflani" },
      { name: "Eskipazar", slug: "eskipazar" },
      { name: "Ovacik", slug: "ovacik" },
    ],
  },
  // 79 - Kilis
  {
    id: 79,
    name: "Kilis",
    slug: "kilis",
    region: "guneydogu_anadolu",
    neighbors: [27, 63],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Elbeyli", slug: "elbeyli" },
      { name: "Musabeyli", slug: "musabeyli" },
      { name: "Polateli", slug: "polateli" },
    ],
  },
  // 80 - Osmaniye
  {
    id: 80,
    name: "Osmaniye",
    slug: "osmaniye",
    region: "akdeniz",
    neighbors: [1, 27, 31, 46],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Kadirli", slug: "kadirli" },
      { name: "Duzici", slug: "duzici" },
      { name: "Bahce", slug: "bahce" },
      { name: "Toprakkale", slug: "toprakkale" },
      { name: "Hasanbeyli", slug: "hasanbeyli" },
      { name: "Sumbas", slug: "sumbas" },
    ],
  },
  // 81 - Duzce
  {
    id: 81,
    name: "Duzce",
    slug: "duzce",
    region: "karadeniz",
    neighbors: [14, 54, 67],
    districts: [
      { name: "Merkez", slug: "merkez", isCenter: true },
      { name: "Akcakoca", slug: "akcakoca" },
      { name: "Cumayeri", slug: "cumayeri" },
      { name: "Cilimli", slug: "cilimli" },
      { name: "Golyaka", slug: "golyaka" },
      { name: "Gumusova", slug: "gumusova" },
      { name: "Kaynasli", slug: "kaynasli" },
      { name: "Yigilca", slug: "yigilca" },
    ],
  },
];

/**
 * Plaka koduna gore il bul
 */
export function getProvinceById(id: number): Province | undefined {
  return TURKEY_PROVINCES.find((p) => p.id === id);
}

/**
 * Slug'a gore il bul
 */
export function getProvinceBySlug(slug: string): Province | undefined {
  return TURKEY_PROVINCES.find((p) => p.slug === slug);
}

/**
 * Bir ilin komsu illerini getir
 */
export function getNeighborProvinces(provinceId: number): Province[] {
  const province = getProvinceById(provinceId);
  if (!province) return [];

  return province.neighbors
    .map((id) => getProvinceById(id))
    .filter((p): p is Province => p !== undefined);
}

/**
 * Bir OSGB'nin hizmet verebilecegi tum illeri getir
 * (Kendi ili + komsu iller)
 */
export function getServiceAreaProvinces(provinceId: number): Province[] {
  const province = getProvinceById(provinceId);
  if (!province) return [];

  const neighbors = getNeighborProvinces(provinceId);
  return [province, ...neighbors];
}

/**
 * Bir OSGB'nin hizmet verebilecegi tum ilceleri getir
 */
export function getServiceAreaDistricts(provinceId: number): {
  province: Province;
  districts: District[];
}[] {
  const serviceArea = getServiceAreaProvinces(provinceId);

  return serviceArea.map((province) => ({
    province,
    districts: province.districts,
  }));
}

/**
 * Toplam sayfa sayisini hesapla
 * (Il sayfalari + ilce sayfalari)
 */
export function calculateTotalPages(provinceId: number): {
  provincePages: number;
  districtPages: number;
  total: number;
} {
  const serviceArea = getServiceAreaProvinces(provinceId);

  const provincePages = serviceArea.length;
  const districtPages = serviceArea.reduce(
    (sum, p) => sum + p.districts.length,
    0
  );

  return {
    provincePages,
    districtPages,
    total: provincePages + districtPages,
  };
}

/**
 * Bolgeye gore illeri getir
 */
export function getProvincesByRegion(region: TurkeyRegion): Province[] {
  return TURKEY_PROVINCES.filter((p) => p.region === region);
}

/**
 * Tum illeri getir
 */
export function getAllProvinces(): Province[] {
  return TURKEY_PROVINCES;
}

/**
 * Sanayi yogunluguna gore sirala (tehlike sinifi baz alinarak)
 */
export function getIndustrialProvinces(): Province[] {
  // Sanayi yogun iller - oncelikli SEO hedefi
  const industrialIds = [
    34, // Istanbul
    41, // Kocaeli
    16, // Bursa
    35, // Izmir
    6,  // Ankara
    1,  // Adana
    42, // Konya
    26, // Eskisehir
    33, // Mersin
    27, // Gaziantep
  ];

  return industrialIds
    .map((id) => getProvinceById(id))
    .filter((p): p is Province => p !== undefined);
}

// ============================================
// KOMSULUK ILISKILERI
// ============================================

/**
 * Iki ilin sinir komsusu olup olmadigini kontrol et
 */
export function areNeighbors(provinceId1: number, provinceId2: number): boolean {
  const p1 = getProvinceById(provinceId1);
  return p1 ? p1.neighbors.includes(provinceId2) : false;
}

/**
 * Iki ilin ortak komsularini bul
 * Ornek: Istanbul(34) ve Bursa(16) -> Yalova(77), Balikesir(10)
 */
export function getCommonNeighbors(
  provinceId1: number,
  provinceId2: number
): Province[] {
  const p1 = getProvinceById(provinceId1);
  const p2 = getProvinceById(provinceId2);
  if (!p1 || !p2) return [];

  const common = p1.neighbors.filter(
    (id) => p2.neighbors.includes(id) && id !== provinceId1 && id !== provinceId2
  );

  return common
    .map((id) => getProvinceById(id))
    .filter((p): p is Province => p !== undefined);
}

/**
 * Komsuluk tutarliligini dogrula
 * A'nin komsusu B ise, B'nin komsusu da A olmali
 * Tutarsizliklari doner
 */
export function validateNeighborConsistency(): {
  province: string;
  neighborId: number;
  issue: "missing_reverse" | "invalid_id";
}[] {
  const issues: {
    province: string;
    neighborId: number;
    issue: "missing_reverse" | "invalid_id";
  }[] = [];

  for (const province of TURKEY_PROVINCES) {
    for (const neighborId of province.neighbors) {
      const neighbor = getProvinceById(neighborId);
      if (!neighbor) {
        issues.push({
          province: province.name,
          neighborId,
          issue: "invalid_id",
        });
        continue;
      }
      if (!neighbor.neighbors.includes(province.id)) {
        issues.push({
          province: province.name,
          neighborId,
          issue: "missing_reverse",
        });
      }
    }
  }

  return issues;
}

/**
 * Iki il arasindaki en kisa komsu zincirini bul
 * BFS ile calisan shortest path
 * Ornek: Edirne -> Ankara = Edirne > Kirklareli > Istanbul > Kocaeli > Bolu > Ankara (vb)
 */
export function findShortestPath(
  fromId: number,
  toId: number
): Province[] | null {
  if (fromId === toId) {
    const p = getProvinceById(fromId);
    return p ? [p] : null;
  }

  const visited = new Set<number>();
  const queue: { id: number; path: number[] }[] = [{ id: fromId, path: [fromId] }];
  visited.add(fromId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const province = getProvinceById(current.id);
    if (!province) continue;

    for (const neighborId of province.neighbors) {
      if (neighborId === toId) {
        const fullPath = [...current.path, toId];
        return fullPath
          .map((id) => getProvinceById(id))
          .filter((p): p is Province => p !== undefined);
      }
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ id: neighborId, path: [...current.path, neighborId] });
      }
    }
  }

  return null;
}

/**
 * Bir ilden belirli adim uzakliktaki tum illeri bul
 * depth=1 -> direkt komsular, depth=2 -> komsularin komsuları
 */
export function getProvincesWithinDistance(
  provinceId: number,
  depth: number
): Province[] {
  const visited = new Set<number>([provinceId]);
  let currentLevel = [provinceId];

  for (let d = 0; d < depth; d++) {
    const nextLevel: number[] = [];
    for (const id of currentLevel) {
      const province = getProvinceById(id);
      if (!province) continue;
      for (const neighborId of province.neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          nextLevel.push(neighborId);
        }
      }
    }
    currentLevel = nextLevel;
  }

  // Kendisini cikar
  visited.delete(provinceId);

  return Array.from(visited)
    .map((id) => getProvinceById(id))
    .filter((p): p is Province => p !== undefined)
    .sort((a, b) => a.id - b.id);
}

// ============================================
// BOLGESEL SANAYI PROFILLERI
// ============================================

/**
 * Il bazli sanayi sektor atamalari
 * Her il icin agirlikli sektorler (weight: 1-10)
 */
const PROVINCE_INDUSTRY_MAP: Record<
  number,
  { id: string; weight: number }[]
> = {
  // Marmara
  34: [{ id: "tekstil", weight: 9 }, { id: "gida", weight: 7 }, { id: "kimya", weight: 7 }, { id: "metal", weight: 6 }, { id: "lojistik", weight: 8 }, { id: "perakende", weight: 7 }],
  41: [{ id: "otomotiv", weight: 10 }, { id: "kimya", weight: 9 }, { id: "petrokimya", weight: 8 }, { id: "metal", weight: 7 }],
  16: [{ id: "otomotiv", weight: 10 }, { id: "tekstil", weight: 8 }, { id: "gida", weight: 6 }, { id: "makine", weight: 7 }],
  59: [{ id: "tekstil", weight: 7 }, { id: "gida", weight: 6 }, { id: "metal", weight: 5 }],
  54: [{ id: "otomotiv", weight: 7 }, { id: "metal", weight: 6 }, { id: "gida", weight: 5 }],
  10: [{ id: "gida", weight: 7 }, { id: "tarim", weight: 6 }, { id: "madencilik", weight: 5 }],
  11: [{ id: "seramik", weight: 7 }, { id: "makine", weight: 5 }],
  17: [{ id: "gida", weight: 6 }, { id: "tarim", weight: 5 }, { id: "turizm", weight: 5 }],
  22: [{ id: "gida", weight: 6 }, { id: "tarim", weight: 6 }],
  39: [{ id: "gida", weight: 5 }, { id: "tarim", weight: 5 }],
  77: [{ id: "kimya", weight: 6 }, { id: "tekstil", weight: 5 }],

  // Ege
  35: [{ id: "petrokimya", weight: 8 }, { id: "gida", weight: 7 }, { id: "otomotiv", weight: 6 }, { id: "tekstil", weight: 6 }, { id: "turizm", weight: 5 }],
  45: [{ id: "gida", weight: 7 }, { id: "makine", weight: 5 }, { id: "madencilik", weight: 5 }],
  20: [{ id: "tekstil", weight: 10 }, { id: "mermer", weight: 8 }, { id: "gida", weight: 5 }],
  9:  [{ id: "tarim", weight: 7 }, { id: "gida", weight: 6 }, { id: "turizm", weight: 6 }],
  48: [{ id: "turizm", weight: 9 }, { id: "madencilik", weight: 5 }, { id: "gida", weight: 4 }],
  64: [{ id: "tekstil", weight: 7 }, { id: "deri", weight: 6 }, { id: "seramik", weight: 5 }],
  43: [{ id: "seramik", weight: 8 }, { id: "madencilik", weight: 6 }, { id: "gida", weight: 4 }],
  3:  [{ id: "mermer", weight: 7 }, { id: "gida", weight: 6 }, { id: "makine", weight: 4 }],

  // Akdeniz
  1:  [{ id: "tekstil", weight: 7 }, { id: "gida", weight: 7 }, { id: "tarim", weight: 6 }, { id: "metal", weight: 6 }],
  33: [{ id: "lojistik", weight: 8 }, { id: "petrokimya", weight: 7 }, { id: "gida", weight: 6 }, { id: "tarim", weight: 5 }],
  7:  [{ id: "turizm", weight: 10 }, { id: "gida", weight: 5 }, { id: "insaat", weight: 5 }],
  31: [{ id: "metal", weight: 7 }, { id: "gida", weight: 6 }, { id: "tarim", weight: 5 }],
  46: [{ id: "tekstil", weight: 7 }, { id: "metal", weight: 6 }, { id: "gida", weight: 5 }],
  32: [{ id: "gida", weight: 6 }, { id: "tarim", weight: 6 }],
  15: [{ id: "mermer", weight: 6 }, { id: "gida", weight: 5 }],
  80: [{ id: "gida", weight: 6 }, { id: "tekstil", weight: 5 }],

  // Ic Anadolu
  6:  [{ id: "savunma", weight: 8 }, { id: "makine", weight: 7 }, { id: "gida", weight: 6 }, { id: "insaat", weight: 6 }, { id: "teknoloji", weight: 5 }],
  42: [{ id: "tarim", weight: 8 }, { id: "gida", weight: 7 }, { id: "makine", weight: 6 }, { id: "otomotiv", weight: 5 }],
  38: [{ id: "mobilya", weight: 8 }, { id: "metal", weight: 7 }, { id: "tekstil", weight: 6 }, { id: "gida", weight: 5 }],
  26: [{ id: "seramik", weight: 7 }, { id: "makine", weight: 6 }, { id: "gida", weight: 5 }, { id: "havacılık", weight: 5 }],
  58: [{ id: "metal", weight: 6 }, { id: "gida", weight: 5 }, { id: "madencilik", weight: 5 }],
  66: [{ id: "gida", weight: 6 }, { id: "tarim", weight: 6 }],
  40: [{ id: "gida", weight: 5 }, { id: "tarim", weight: 5 }],
  50: [{ id: "turizm", weight: 7 }, { id: "gida", weight: 5 }],
  51: [{ id: "tarim", weight: 6 }, { id: "gida", weight: 5 }, { id: "madencilik", weight: 4 }],
  68: [{ id: "tarim", weight: 6 }, { id: "gida", weight: 5 }],
  70: [{ id: "gida", weight: 6 }, { id: "tarim", weight: 5 }],
  71: [{ id: "savunma", weight: 7 }, { id: "metal", weight: 6 }, { id: "makine", weight: 5 }],

  // Karadeniz
  55: [{ id: "gida", weight: 7 }, { id: "tarim", weight: 6 }, { id: "lojistik", weight: 5 }],
  61: [{ id: "gida", weight: 6 }, { id: "insaat", weight: 5 }, { id: "turizm", weight: 4 }],
  52: [{ id: "gida", weight: 6 }, { id: "tarim", weight: 6 }],
  67: [{ id: "maden", weight: 9 }, { id: "metal", weight: 8 }, { id: "enerji", weight: 7 }],
  78: [{ id: "metal", weight: 8 }, { id: "maden", weight: 6 }],
  53: [{ id: "gida", weight: 6 }, { id: "tarim", weight: 5 }],
  28: [{ id: "gida", weight: 5 }, { id: "tarim", weight: 5 }],
  60: [{ id: "gida", weight: 6 }, { id: "tarim", weight: 5 }],
  5:  [{ id: "gida", weight: 6 }, { id: "tarim", weight: 5 }],
  19: [{ id: "gida", weight: 6 }, { id: "tarim", weight: 5 }, { id: "makine", weight: 4 }],
  37: [{ id: "gida", weight: 5 }, { id: "tarim", weight: 5 }],
  57: [{ id: "gida", weight: 5 }, { id: "tarim", weight: 5 }],
  74: [{ id: "maden", weight: 5 }, { id: "gida", weight: 4 }],
  14: [{ id: "gida", weight: 5 }, { id: "insaat", weight: 4 }],
  81: [{ id: "gida", weight: 5 }, { id: "insaat", weight: 5 }],
  29: [{ id: "madencilik", weight: 5 }, { id: "gida", weight: 4 }],
  69: [{ id: "tarim", weight: 5 }, { id: "gida", weight: 4 }],
  8:  [{ id: "enerji", weight: 5 }, { id: "gida", weight: 4 }],

  // Guneydogu Anadolu
  27: [{ id: "gida", weight: 9 }, { id: "tekstil", weight: 7 }, { id: "kimya", weight: 6 }, { id: "metal", weight: 5 }],
  63: [{ id: "tekstil", weight: 7 }, { id: "gida", weight: 7 }, { id: "tarim", weight: 6 }],
  21: [{ id: "gida", weight: 6 }, { id: "insaat", weight: 5 }, { id: "mermer", weight: 5 }],
  47: [{ id: "gida", weight: 6 }, { id: "tarim", weight: 5 }],
  2:  [{ id: "tekstil", weight: 6 }, { id: "gida", weight: 5 }],
  72: [{ id: "petrokimya", weight: 7 }, { id: "enerji", weight: 5 }],
  56: [{ id: "gida", weight: 5 }, { id: "tarim", weight: 4 }],
  73: [{ id: "insaat", weight: 5 }, { id: "gida", weight: 4 }],
  79: [{ id: "gida", weight: 5 }, { id: "tarim", weight: 5 }],

  // Dogu Anadolu
  25: [{ id: "gida", weight: 5 }, { id: "tarim", weight: 5 }, { id: "insaat", weight: 4 }],
  44: [{ id: "gida", weight: 6 }, { id: "tekstil", weight: 5 }],
  65: [{ id: "gida", weight: 5 }, { id: "insaat", weight: 4 }, { id: "tarim", weight: 4 }],
  23: [{ id: "gida", weight: 5 }, { id: "tekstil", weight: 4 }],
  24: [{ id: "gida", weight: 5 }, { id: "madencilik", weight: 4 }],
  12: [{ id: "gida", weight: 4 }, { id: "tarim", weight: 4 }],
  13: [{ id: "gida", weight: 4 }, { id: "tarim", weight: 4 }],
  49: [{ id: "tarim", weight: 5 }, { id: "gida", weight: 4 }],
  62: [{ id: "tarim", weight: 4 }, { id: "gida", weight: 3 }],
  4:  [{ id: "tarim", weight: 5 }, { id: "gida", weight: 4 }],
  30: [{ id: "insaat", weight: 4 }, { id: "tarim", weight: 4 }],
  36: [{ id: "tarim", weight: 5 }, { id: "gida", weight: 4 }],
  75: [{ id: "tarim", weight: 5 }, { id: "gida", weight: 4 }],
  76: [{ id: "tarim", weight: 5 }, { id: "gida", weight: 4 }],
};

/**
 * Sektor tanimlari - ISG risk profilleri
 */
export const INDUSTRY_DEFINITIONS: Record<
  string,
  {
    name: string;
    slug: string;
    dangerClass: "az_tehlikeli" | "tehlikeli" | "cok_tehlikeli";
    commonRisks: string[];
  }
> = {
  otomotiv: { name: "Otomotiv Sanayi", slug: "otomotiv", dangerClass: "cok_tehlikeli", commonRisks: ["makine sıkisma", "gurultu", "kimyasal maruziyet", "ergonomik riskler"] },
  kimya: { name: "Kimya Sanayi", slug: "kimya", dangerClass: "cok_tehlikeli", commonRisks: ["kimyasal maruziyet", "patlama", "yangin", "zehirlenme"] },
  petrokimya: { name: "Petrokimya Sanayi", slug: "petrokimya", dangerClass: "cok_tehlikeli", commonRisks: ["patlama", "yangin", "kimyasal maruziyet", "yuksek basinc"] },
  tekstil: { name: "Tekstil Sanayi", slug: "tekstil", dangerClass: "tehlikeli", commonRisks: ["toz maruziyeti", "gurultu", "makine sıkisma", "ergonomik riskler"] },
  gida: { name: "Gida Sanayi", slug: "gida", dangerClass: "tehlikeli", commonRisks: ["soguk ortam", "kayma-dusme", "kesici aletler", "biyolojik riskler"] },
  metal: { name: "Metal Sanayi", slug: "metal", dangerClass: "cok_tehlikeli", commonRisks: ["yuksek sicaklik", "metal talaslari", "gurultu", "agir yukler"] },
  maden: { name: "Madencilik", slug: "maden", dangerClass: "cok_tehlikeli", commonRisks: ["gocuk", "toz maruziyeti", "patlama", "gurultu"] },
  insaat: { name: "Insaat Sektoru", slug: "insaat", dangerClass: "cok_tehlikeli", commonRisks: ["yuksekte calisma", "gocuk", "elektrik carpmasi", "agir yukler"] },
  makine: { name: "Makine Imalat", slug: "makine", dangerClass: "tehlikeli", commonRisks: ["makine sıkisma", "metal talaslari", "gurultu", "titresim"] },
  tarim: { name: "Tarim ve Hayvancilik", slug: "tarim", dangerClass: "tehlikeli", commonRisks: ["tarim ilaclari", "hayvan kaynakli riskler", "makine kazalari", "ergonomik riskler"] },
  lojistik: { name: "Lojistik ve Depoculuk", slug: "lojistik", dangerClass: "tehlikeli", commonRisks: ["forklift kazalari", "agir yukler", "dusen malzeme", "trafik kazalari"] },
  enerji: { name: "Enerji Sektoru", slug: "enerji", dangerClass: "cok_tehlikeli", commonRisks: ["elektrik carpmasi", "yuksekte calisma", "patlama", "yanma"] },
  turizm: { name: "Turizm ve Otelcilik", slug: "turizm", dangerClass: "az_tehlikeli", commonRisks: ["kayma-dusme", "gida guvenligi", "ergonomik riskler", "kimyasal temizlik"] },
  perakende: { name: "Perakende Ticaret", slug: "perakende", dangerClass: "az_tehlikeli", commonRisks: ["ergonomik riskler", "kayma-dusme", "yukler", "stres"] },
  savunma: { name: "Savunma Sanayi", slug: "savunma", dangerClass: "cok_tehlikeli", commonRisks: ["patlayici maddeler", "kimyasal maruziyet", "gurultu", "radyasyon"] },
  mermer: { name: "Mermer ve Dogal Tas", slug: "mermer", dangerClass: "cok_tehlikeli", commonRisks: ["toz maruziyeti", "agir yukler", "makine sıkisma", "gurultu"] },
  mobilya: { name: "Mobilya Sanayi", slug: "mobilya", dangerClass: "tehlikeli", commonRisks: ["toz maruziyeti", "makine sıkisma", "kimyasal boya", "gurultu"] },
  deri: { name: "Deri Sanayi", slug: "deri", dangerClass: "tehlikeli", commonRisks: ["kimyasal maruziyet", "biyolojik riskler", "kesici aletler", "gurultu"] },
  seramik: { name: "Seramik Sanayi", slug: "seramik", dangerClass: "tehlikeli", commonRisks: ["toz maruziyeti", "yuksek sicaklik", "gurultu", "agir yukler"] },
  madencilik: { name: "Madencilik", slug: "madencilik", dangerClass: "cok_tehlikeli", commonRisks: ["gocuk", "toz maruziyeti", "patlama", "gurultu"] },
  teknoloji: { name: "Teknoloji ve Yazilim", slug: "teknoloji", dangerClass: "az_tehlikeli", commonRisks: ["ergonomik riskler", "ekran maruziyeti", "stres", "hareketsizlik"] },
  havacılık: { name: "Havacilik Sanayi", slug: "havacilik", dangerClass: "cok_tehlikeli", commonRisks: ["yuksekte calisma", "gurultu", "kimyasal maruziyet", "agir yukler"] },
};

/**
 * Bir ilin sanayi sektorlerini getir
 */
export function getProvinceSectors(provinceId: number): IndustrySector[] {
  const mapping = PROVINCE_INDUSTRY_MAP[provinceId];
  if (!mapping) return [];

  return mapping
    .map((m) => {
      const def = INDUSTRY_DEFINITIONS[m.id];
      if (!def) return null;
      return {
        id: m.id,
        name: def.name,
        slug: def.slug,
        weight: m.weight,
        dangerClass: def.dangerClass,
      };
    })
    .filter((s): s is IndustrySector => s !== null)
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Bir ilin en agir tehlike sinifini getir
 */
export function getProvinceDominantDangerClass(
  provinceId: number
): "az_tehlikeli" | "tehlikeli" | "cok_tehlikeli" {
  const sectors = getProvinceSectors(provinceId);
  if (sectors.length === 0) return "az_tehlikeli";

  const order = { cok_tehlikeli: 3, tehlikeli: 2, az_tehlikeli: 1 };
  const max = sectors.reduce((best, s) =>
    order[s.dangerClass] > order[best.dangerClass] ? s : best
  );
  return max.dangerClass;
}

/**
 * Bir ilin baslica sektor isimlerini getir (SEO icerigi icin)
 */
export function getProvinceSectorNames(provinceId: number, limit = 3): string[] {
  return getProvinceSectors(provinceId)
    .slice(0, limit)
    .map((s) => s.name);
}

/**
 * Bir ilin baslica sektor risklerini getir
 */
export function getProvinceSectorRisks(provinceId: number): string[] {
  const sectors = getProvinceSectors(provinceId);
  const risksSet = new Set<string>();
  for (const s of sectors.slice(0, 3)) {
    const def = INDUSTRY_DEFINITIONS[s.id];
    if (def) {
      for (const r of def.commonRisks.slice(0, 2)) {
        risksSet.add(r);
      }
    }
  }
  return Array.from(risksSet);
}
