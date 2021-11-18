export async function load() {
  const mock = [
    {
      name: "workType",
      values: [
        {
          term: "article",
          count: 2119328,
        },
        {
          term: "literature",
          count: 1002931,
        },
        {
          term: "music",
          count: 131609,
        },
        {
          term: "movie",
          count: 54848,
        },
        {
          term: "sheetmusic",
          count: 34716,
        },
        {
          term: "none",
          count: 14406,
        },
        {
          term: "periodica",
          count: 4367,
        },
        {
          term: "game",
          count: 2761,
        },
        {
          term: "portrait",
          count: 1637,
        },
        {
          term: "analysis",
          count: 400,
        },
        {
          term: "map",
          count: 361,
        },
        {
          term: "review",
          count: 9,
        },
      ],
    },
    {
      name: "language",
      values: [
        {
          term: "dan",
          count: 2252441,
        },
        {
          term: "eng",
          count: 611581,
        },
        {
          term: "ger",
          count: 147546,
        },
        {
          term: "mul",
          count: 84833,
        },
        {
          term: "swe",
          count: 59599,
        },
        {
          term: "fre",
          count: 42971,
        },
        {
          term: "nor",
          count: 41789,
        },
        {
          term: "und",
          count: 16045,
        },
        {
          term: "mis",
          count: 15483,
        },
        {
          term: "ita",
          count: 14385,
        },
        {
          term: "spa",
          count: 11894,
        },
        {
          term: "rus",
          count: 8547,
        },
        {
          term: "ara",
          count: 8137,
        },
        {
          term: "per",
          count: 6758,
        },
        {
          term: "tur",
          count: 6090,
        },
        {
          term: "lat",
          count: 4828,
        },
        {
          term: "pol",
          count: 4062,
        },
        {
          term: "vie",
          count: 2695,
        },
        {
          term: "urd",
          count: 2522,
        },
        {
          term: "fin",
          count: 2434,
        },
        {
          term: "dut",
          count: 2412,
        },
        {
          term: "fao",
          count: 2335,
        },
        {
          term: "por",
          count: 2219,
        },
        {
          term: "kal",
          count: 2064,
        },
        {
          term: "tam",
          count: 2009,
        },
        {
          term: "jpn",
          count: 1846,
        },
        {
          term: "kur",
          count: 1686,
        },
        {
          term: "srp",
          count: 1680,
        },
        {
          term: "chi",
          count: 1461,
        },
        {
          term: "hin",
          count: 1337,
        },
        {
          term: "rum",
          count: 1192,
        },
        {
          term: "ice",
          count: 1127,
        },
        {
          term: "hrv",
          count: 1004,
        },
        {
          term: "bos",
          count: 989,
        },
        {
          term: "nob",
          count: 952,
        },
        {
          term: "cze",
          count: 854,
        },
        {
          term: "tha",
          count: 808,
        },
        {
          term: "hun",
          count: 763,
        },
        {
          term: "alb",
          count: 682,
        },
        {
          term: "grc",
          count: 667,
        },
        {
          term: "gre",
          count: 666,
        },
        {
          term: "som",
          count: 633,
        },
        {
          term: "heb",
          count: 408,
        },
        {
          term: "kor",
          count: 407,
        },
        {
          term: "pan",
          count: 404,
        },
        {
          term: "fry",
          count: 333,
        },
        {
          term: "pus",
          count: 258,
        },
        {
          term: "cat",
          count: 211,
        },
        {
          term: "epo",
          count: 168,
        },
        {
          term: "mac",
          count: 164,
        },
      ],
    },
    {
      name: "materialType",
      values: [
        {
          term: "tidsskriftsartikel",
          count: 1148775,
        },
        {
          term: "bog",
          count: 892951,
        },
        {
          term: "avisartikel",
          count: 748565,
        },
        {
          term: "artikel",
          count: 223653,
        },
        {
          term: "cd (musik)",
          count: 119305,
        },
        {
          term: "ebog",
          count: 90933,
        },
        {
          term: "dvd",
          count: 42983,
        },
        {
          term: "lydbog (net)",
          count: 42913,
        },
        {
          term: "netdokument",
          count: 34752,
        },
        {
          term: "node",
          count: 34716,
        },
        {
          term: "lydbog (bånd)",
          count: 30052,
        },
        {
          term: "billedbog",
          count: 28801,
        },
        {
          term: "grammofonplade",
          count: 19181,
        },
        {
          term: "lydbog (cd)",
          count: 13337,
        },
        {
          term: "lydbog (cd-mp3)",
          count: 11928,
        },
        {
          term: "tegneserie",
          count: 11911,
        },
        {
          term: "sammensat materiale",
          count: 9697,
        },
        {
          term: "film (net)",
          count: 8862,
        },
        {
          term: "video",
          count: 8565,
        },
        {
          term: "punktskrift",
          count: 7004,
        },
        {
          term: "blu-ray",
          count: 5994,
        },
        {
          term: "musik (net)",
          count: 5327,
        },
        {
          term: "bånd",
          count: 4540,
        },
        {
          term: "periodikum",
          count: 4297,
        },
        {
          term: "bog stor skrift",
          count: 3766,
        },
        {
          term: "elektronisk materiale",
          count: 3744,
        },
        {
          term: "lyd (cd)",
          count: 3651,
        },
        {
          term: "grafisk blad",
          count: 2273,
        },
        {
          term: "cd-rom",
          count: 2150,
        },
        {
          term: "billedbog (net)",
          count: 1989,
        },
        {
          term: "graphic novel",
          count: 1770,
        },
        {
          term: "diskette",
          count: 1447,
        },
        {
          term: "elektronisk materiale (cd)",
          count: 1338,
        },
        {
          term: "playstation 4",
          count: 1002,
        },
        {
          term: "film",
          count: 989,
        },
        {
          term: "playstation 3",
          count: 769,
        },
        {
          term: "punktskrift (net)",
          count: 668,
        },
        {
          term: "pc-spil",
          count: 663,
        },
        {
          term: "lyd (podcast)",
          count: 613,
        },
        {
          term: "xbox 360",
          count: 584,
        },
        {
          term: "xbox one",
          count: 584,
        },
        {
          term: "spil",
          count: 499,
        },
        {
          term: "dias",
          count: 455,
        },
        {
          term: "blu-ray 4k",
          count: 432,
        },
        {
          term: "kort",
          count: 361,
        },
        {
          term: "nintendo switch",
          count: 342,
        },
        {
          term: "wii",
          count: 338,
        },
        {
          term: "playstation 2",
          count: 319,
        },
        {
          term: "diverse",
          count: 315,
        },
        {
          term: "lyd",
          count: 305,
        },
      ],
    },
    {
      name: "fictiveCharacter",
      values: [
        {
          term: "Batman",
          count: 413,
        },
        {
          term: "Sherlock Holmes",
          count: 401,
        },
        {
          term: "Dr. Watson",
          count: 400,
        },
        {
          term: "Asterix",
          count: 356,
        },
        {
          term: "Obelix",
          count: 355,
        },
        {
          term: "Tintin",
          count: 286,
        },
        {
          term: "Harry Potter",
          count: 269,
        },
        {
          term: "Hermione Granger",
          count: 269,
        },
        {
          term: "Ron Weasley",
          count: 269,
        },
        {
          term: "Lucky Luke",
          count: 267,
        },
        {
          term: "Maigret",
          count: 255,
        },
        {
          term: "Rasmus Klump",
          count: 247,
        },
        {
          term: "Hercule Poirot",
          count: 226,
        },
        {
          term: "Pippi Langstrømpe",
          count: 223,
        },
        {
          term: "Peter Pedal",
          count: 222,
        },
        {
          term: "Spider-Man",
          count: 222,
        },
        {
          term: "Peter Plys",
          count: 212,
        },
        {
          term: "Askepot",
          count: 207,
        },
        {
          term: "Mumitroldene",
          count: 190,
        },
        {
          term: "Alfons Åberg",
          count: 179,
        },
        {
          term: "Kong Arthur",
          count: 175,
        },
        {
          term: "Den ¤lille havfrue",
          count: 174,
        },
        {
          term: "Alice i Eventyrland",
          count: 170,
        },
        {
          term: "James Bond",
          count: 170,
        },
        {
          term: "Miss Marple",
          count: 155,
        },
        {
          term: "Dracula",
          count: 154,
        },
        {
          term: "Superman",
          count: 154,
        },
        {
          term: "Robin Hood",
          count: 153,
        },
        {
          term: "Garfield",
          count: 150,
        },
        {
          term: "Bamse og Kylling",
          count: 134,
        },
        {
          term: "Den ¤grimme ælling",
          count: 134,
        },
        {
          term: "Naruto Uzumaki",
          count: 134,
        },
        {
          term: "Gandalf",
          count: 123,
        },
        {
          term: "Jamie Fraser",
          count: 123,
        },
        {
          term: "Peter Pan",
          count: 122,
        },
        {
          term: "Rødhætte",
          count: 122,
        },
        {
          term: "Oliver Twist",
          count: 121,
        },
        {
          term: "Claire Randall",
          count: 120,
        },
        {
          term: "Den ¤lille prins",
          count: 117,
        },
        {
          term: "Don Quijote",
          count: 117,
        },
        {
          term: "Snehvide",
          count: 116,
        },
        {
          term: "Avengers",
          count: 114,
        },
        {
          term: "Prins Valiant",
          count: 113,
        },
        {
          term: "Blueberry",
          count: 112,
        },
        {
          term: "Aladdin",
          count: 110,
        },
        {
          term: "Paddington",
          count: 110,
        },
        {
          term: "Elizabeth Bennet",
          count: 109,
        },
        {
          term: "Mr. Darcy",
          count: 109,
        },
        {
          term: "Jack Reacher",
          count: 108,
        },
        {
          term: "Postmand Per",
          count: 106,
        },
      ],
    },
    {
      name: "genre",
      values: [
        {
          term: "rock",
          count: 47372,
        },
        {
          term: "jazz",
          count: 18682,
        },
        {
          term: "krimi",
          count: 17650,
        },
        {
          term: "erindringer",
          count: 14109,
        },
        {
          term: "spænding",
          count: 11213,
        },
        {
          term: "folk",
          count: 9438,
        },
        {
          term: "fantasy",
          count: 9153,
        },
        {
          term: "pop",
          count: 9051,
        },
        {
          term: "electronica",
          count: 8102,
        },
        {
          term: "humor",
          count: 6916,
        },
        {
          term: "blues",
          count: 6911,
        },
        {
          term: "singer/songwriter",
          count: 6832,
        },
        {
          term: "tv-serier",
          count: 6823,
        },
        {
          term: "dansk pop/rock",
          count: 6455,
        },
        {
          term: "70'er rock",
          count: 5913,
        },
        {
          term: "drama",
          count: 5582,
        },
        {
          term: "metal",
          count: 5525,
        },
        {
          term: "science fiction",
          count: 5261,
        },
        {
          term: "eventyr",
          count: 5171,
        },
        {
          term: "soul",
          count: 5112,
        },
        {
          term: "klassisk musik 1950 ->",
          count: 5002,
        },
        {
          term: "sjove bøger",
          count: 4889,
        },
        {
          term: "country",
          count: 4799,
        },
        {
          term: "børnefilm",
          count: 4548,
        },
        {
          term: "folkemusik",
          count: 4472,
        },
        {
          term: "verdensmusik - world music",
          count: 4235,
        },
        {
          term: "gys",
          count: 3908,
        },
        {
          term: "hip hop",
          count: 3765,
        },
        {
          term: "synthpop",
          count: 3605,
        },
        {
          term: "dokumentarfilm",
          count: 3273,
        },
        {
          term: "punk",
          count: 3070,
        },
        {
          term: "heavy rock",
          count: 3013,
        },
        {
          term: "jazz-dansk",
          count: 2947,
        },
        {
          term: "60'er rock",
          count: 2927,
        },
        {
          term: "latin",
          count: 2858,
        },
        {
          term: "kærlighed",
          count: 2849,
        },
        {
          term: "historiske romaner",
          count: 2777,
        },
        {
          term: "komedier",
          count: 2717,
        },
        {
          term: "r&b",
          count: 2708,
        },
        {
          term: "evergreen",
          count: 2661,
        },
        {
          term: "kammermusik",
          count: 2655,
        },
        {
          term: "politiromaner",
          count: 2330,
        },
        {
          term: "filmmusik - soundtracks",
          count: 2289,
        },
        {
          term: "americana",
          count: 2248,
        },
        {
          term: "barndomserindringer",
          count: 2222,
        },
        {
          term: "animationsfilm mest for børn",
          count: 2171,
        },
        {
          term: "progressiv rock",
          count: 2168,
        },
        {
          term: "slægtsromaner",
          count: 2132,
        },
        {
          term: "swing",
          count: 2078,
        },
        {
          term: "eventyrlige fortællinger",
          count: 1958,
        },
      ],
    },
    {
      name: "audience",
      values: [
        {
          term: "voksenmaterialer",
          count: 3253857,
        },
        {
          term: "børnematerialer",
          count: 165072,
        },
      ],
    },
    {
      name: "accessType",
      values: [
        {
          term: "physical",
          count: 3255553,
        },
        {
          term: "online",
          count: 593305,
        },
        {
          term: "none",
          count: 2459,
        },
      ],
    },
    {
      name: "fictionNonfiction",
      values: [
        {
          term: "nonfiktion",
          count: 2399695,
        },
        {
          term: "fiktion",
          count: 304923,
        },
      ],
    },
    {
      name: "subject",
      values: [
        {
          term: "historie",
          count: 105800,
        },
        {
          term: "vokal",
          count: 99798,
        },
        {
          term: "Børnebøger",
          count: 63890,
        },
        {
          term: "rock",
          count: 61500,
        },
        {
          term: "instrumental",
          count: 49552,
        },
        {
          term: "biografier",
          count: 49278,
        },
        {
          term: "Personalhistorie",
          count: 46391,
        },
        {
          term: "politiske forhold",
          count: 40797,
        },
        {
          term: "Danmark",
          count: 37635,
        },
        {
          term: "kronikker",
          count: 36652,
        },
        {
          term: "Skolebøger",
          count: 35036,
        },
        {
          term: "børn",
          count: 30220,
        },
        {
          term: "Biografier af enkelte personer",
          count: 29222,
        },
        {
          term: "København Kommune",
          count: 27965,
        },
        {
          term: "Slesvig",
          count: 26352,
        },
        {
          term: "Sønderjyllands amtskommune",
          count: 26182,
        },
        {
          term: "kvinder",
          count: 26067,
        },
        {
          term: "kærlighed",
          count: 24362,
        },
        {
          term: "jazz",
          count: 24337,
        },
        {
          term: "Enkelte Personer og Familier",
          count: 23495,
        },
        {
          term: "politik",
          count: 22760,
        },
        {
          term: "unge",
          count: 21477,
        },
        {
          term: "dansk litteratur",
          count: 21170,
        },
        {
          term: "pop",
          count: 19271,
        },
        {
          term: "krimi",
          count: 19153,
        },
        {
          term: "erindringer",
          count: 18408,
        },
        {
          term: "Den Europæiske Union",
          count: 18175,
        },
        {
          term: "arkitektur",
          count: 17790,
        },
        {
          term: "virksomheder",
          count: 17355,
        },
        {
          term: "dansk skønlitteratur",
          count: 16200,
        },
        {
          term: "ledelse",
          count: 15727,
        },
        {
          term: "undervisningsmaterialer",
          count: 15603,
        },
        {
          term: "behandling",
          count: 15439,
        },
        {
          term: "Computer science",
          count: 14803,
        },
        {
          term: "litteratur",
          count: 13928,
        },
        {
          term: "arkæologi",
          count: 13890,
        },
        {
          term: "familien",
          count: 13718,
        },
        {
          term: "kunst",
          count: 13718,
        },
        {
          term: "folkeskolen",
          count: 13517,
        },
        {
          term: "vejledninger",
          count: 13472,
        },
        {
          term: "uddannelse",
          count: 13230,
        },
        {
          term: "musik",
          count: 13139,
        },
        {
          term: "forskning",
          count: 12611,
        },
        {
          term: "klaver",
          count: 12606,
        },
        {
          term: "Biografier af enkelte personer og familier",
          count: 12465,
        },
        {
          term: "samfundsforhold",
          count: 12387,
        },
        {
          term: "etik",
          count: 12171,
        },
        {
          term: "spænding",
          count: 11536,
        },
        {
          term: "Danmark.",
          count: 11483,
        },
        {
          term: "guitar",
          count: 11378,
        },
      ],
    },
    {
      name: "creator",
      values: [
        {
          term: "Association for Computing Machinery-Digital Library",
          count: 6209,
        },
        {
          term: "Hedvig Schousboe",
          count: 4979,
        },
        {
          term: "August F. Schmidt",
          count: 1787,
        },
        {
          term: "V. J. Brøndegaard",
          count: 1721,
        },
        {
          term: "Jørgen Steen Nielsen",
          count: 1705,
        },
        {
          term: "H. C. Andersen (f. 1805)",
          count: 1656,
        },
        {
          term: "Poul Høi",
          count: 1428,
        },
        {
          term: "Martin Burcharth",
          count: 1413,
        },
        {
          term: "Lasse Ellegaard",
          count: 1254,
        },
        {
          term: "Erik Jensen",
          count: 1215,
        },
        {
          term: "Eigil Steinmetz",
          count: 1166,
        },
        {
          term: "Johann Sebastian Bach",
          count: 1155,
        },
        {
          term: "Michael Seidelin",
          count: 1153,
        },
        {
          term: "Jørgen Steens",
          count: 1144,
        },
        {
          term: "Frede Vestergaard",
          count: 1067,
        },
        {
          term: "Else Marie Nygaard",
          count: 1055,
        },
        {
          term: "Ulrik Dahlin",
          count: 1008,
        },
        {
          term: "Peter Wivel",
          count: 1001,
        },
        {
          term: "Peter Garde",
          count: 984,
        },
        {
          term: "Arne Hardis",
          count: 964,
        },
        {
          term: "Michael Bo",
          count: 964,
        },
        {
          term: "Carsten Andersen",
          count: 963,
        },
        {
          term: "Georg Brandes",
          count: 961,
        },
        {
          term: "Wolfgang Amadeus Mozart",
          count: 956,
        },
        {
          term: "Jørgen Ullerup",
          count: 951,
        },
        {
          term: "Sidsel Boye",
          count: 948,
        },
        {
          term: "Pernille Stensgaard",
          count: 945,
        },
        {
          term: "Klaus Rifbjerg",
          count: 936,
        },
        {
          term: "Jørgen Dragsdahl",
          count: 933,
        },
        {
          term: "Henrik Dørge",
          count: 932,
        },
        {
          term: "Kim Skotte",
          count: 924,
        },
        {
          term: "Jan Bo Hansen",
          count: 913,
        },
        {
          term: "Torben K. Andersen",
          count: 911,
        },
        {
          term: "Keld Louie Pedersen",
          count: 906,
        },
        {
          term: "Jens Kruuse",
          count: 902,
        },
        {
          term: "Claus Grymer",
          count: 898,
        },
        {
          term: "Sigurd Berg",
          count: 873,
        },
        {
          term: "Jørgen Jørgensen",
          count: 864,
        },
        {
          term: "Poul Hansen",
          count: 862,
        },
        {
          term: "Klaus Justsen",
          count: 857,
        },
        {
          term: "Poul Erik Skriver",
          count: 855,
        },
        {
          term: "Gunnar Leistikow",
          count: 844,
        },
        {
          term: "Jørgen Jensen",
          count: 836,
        },
        {
          term: "Bertel Haarder",
          count: 835,
        },
        {
          term: "Morten Beiter",
          count: 827,
        },
        {
          term: "Hanne Dam",
          count: 823,
        },
        {
          term: "Astrid Lindgren",
          count: 821,
        },
        {
          term: "Mogens Korst",
          count: 821,
        },
        {
          term: "Karen Syberg",
          count: 819,
        },
        {
          term: "Niels Friis",
          count: 814,
        },
      ],
    },
  ];

  return mock;
}
