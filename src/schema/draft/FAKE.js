export const FAKE_GENERAL_SERIES = {
  title: "Dummy Some Series",
  parallelTitles: [
    "Dummy  Some Series, parallel title",
    "Dummy Some Series, another parallel title",
  ],
  alternativeTitles: [],
  numberInSeries: {
    display: "Dummy number one",
    number: [1],
  },
  isPopular: false,
};

export const FAKE_POPULAR_SERIES = {
  title: "Dummy Some Series",
  alternativeTitles: [
    "Dummy Some Series, parallel title",
    "Dummy Some Series, another parallel title",
  ],
  parallelTitles: [],
  numberInSeries: {
    display: "Dummy number one",
    number: [1],
  },
  isPopular: true,
  readThisFirst: true,
  readThisWhenever: false,
};

export const FAKE_TRANSLATION = {
  singular: "Dummy forfatter",
  plural: "Dummy forfattere",
};

export const FAKE_ROLE = {
  functionCode: "Dummy aut",
  function: FAKE_TRANSLATION,
};

export const FAKE_PERSON = {
  __typename: "Person",
  display: "Dummy Jens Jensen",
  nameSort: "Dummy Jensen Jens",
  firstName: "Dummy Jens",
  lastName: "Dummy Jensen",
  birthYear: "Dummy 1950",
  romanNumeral: "Dummy Jens Jensen IV",
  attributeToName: "Dummy Jens Jensen, testperson",
  aliases: [
    { display: "Dummy Svend Svendsen, personen bag Jens Jensen" },
    { display: "Dummy Kirsten Kirstensen, personen bag Jens Jensen" },
  ],
  roles: [FAKE_ROLE],
};

export const FAKE_ACCESS = {
  accessUrls: [
    {
      note: "Findes også på internettet",
      origin: null,
      url: "http://infolink2003.elbo.dk/DVT/dokumenter/doc/15271.pdf",
    },
  ],
  dbcWebArchive: false,
  digitalArticleService: { issn: "0902-1620" },
  ereol: [],
  infomediaService: null,
  interLibraryLoanIsPossible: false,
  openUrl:
    '_BASEURL_url_ctx_fmt=info:ofi/fmt:kev:mtx:ctx&ctx_ver=Z39.88-2004&rft_val_fmt=info:ofi/fmt:kev:mtx:journal&rft.atitle=Staldkrampe+%28"shivering"%29+hos+hest&rft.aulast=Albæk+Andersen&rft.aufirst=Susanne&rft.auinit=S&rft.jtitle=Dansk+veterinærtidsskrift&rft.date=2014&rft.volume=97&rft.issue=10&rft.pages=22-24&rft.spage=22&rft.epage=24&rft.issn=0106-6854&rft.genre=article&rfr_id=info:sid/dbc.dk:870971-tsart',
};

export const FAKE_CORPORATION = {
  __typename: "Corporation",
  display: "Dummy Some Corporation",
  nameSort: "Dummy Some Corporation for sorting",
  main: "Dummy Some Corporation",
  sub: "Dummy Some Sub Corporation",
  location: "Dummy Some location",
  year: "Dummy 1950",
  number: "Dummy 5",
  attributeToName: "Dummy Some Corporation ...",
  roles: [],
};

export const FAKE_SUBJECTS = {
  all: [
    {
      __typename: "SubjectText",
      type: "TOPIC",
      language: {
        display: "Dummy dansk",
        isoCode: "dum dan",
      },
      display: "Dummy Some fictional subject",
    },
    {
      __typename: "TimePeriod",
      display: "Dummy 1950-1980",
      period: { begin: 1950, end: 1980, display: "Dummy 1950-1980" },
    },
    FAKE_PERSON,
    FAKE_CORPORATION,
  ],
  dbcVerified: [
    {
      __typename: "SubjectText",
      type: "TOPIC",
      language: {
        display: "Dummy dansk",
        isoCode: "dum dan",
      },
      display: "Dummy Some fictional subject",
    },
    {
      __typename: "TimePeriod",
      display: "Dummy 1950-1980",
      period: { begin: 1950, end: 1980, display: "Dummy 1950-1980" },
    },
    FAKE_PERSON,
    FAKE_CORPORATION,
  ],
};

export const FAKE_MANIFESTATION_TITLE = {
  main: ["Dummy Some Title"],
  full: ["Dummy Some Title: Full"],
  alternative: ["Dummy Some Title: Alternative"],
  identifyingAddition: "Dummy Indlæst af Jens Jensen",
  original: ["Dummy Some Title: Original"],
  parallel: ["Dummy Parallel Title 1", "Parallel Title 2"],
  sort: "Dummy Some Title Sort",
  standard: "Dummy Some Title Standard",
  translated: ["Dummy En Oversat Titel"],
};

export const FAKE_AUDIENCE = {
  generalAudience: ["Dummy general audience"],
  ages: [{ display: "Dummy 10-14", begin: 10, end: 14 }],
  libraryRecommendation: "Dummy some library recommendation",
  childrenOrAdults: [{ display: "Dummy til børn", code: "FOR_CHILDREN" }],
  schoolUse: [{ display: "Dummy til skolebrug", code: "FOR_SCHOOL_USE" }],
  primaryTarget: ["Dummy Some primary target"],
  let: "Dummy some let",
  lix: "Dummy some lix",
};

export const FAKE_CLASSIFICATION = {
  system: "Dummy DK5",
  code: "Dummy 86-096",
  dk5Heading: "Dummy Skønlitteratur",
  display: "Dummy 86-096, Skønlitteratur",
  entryType: "NATIONAL_BIBLIOGRAPHY_ENTRY",
};
export const FAKE_CLASSIFICATION_1 = {
  system: "Dummy DK5 additional",
  code: "Dummy 86-096 additional",
  dk5Heading: "Dummy Skønlitteratur additional",
  display: "Dummy 86-096, Skønlitteratur additional",
  entryType: "NATIONAL_BIBLIOGRAPHY_ADDITIONAL_ENTRY",
};

export const FAKE_EDITION = {
  note: "Dummy note",
  summary: "Dummy 3. i.e. 2 udgave, 2005",
  edition: "Dummy 3. i.e. 2 udgave",
  contributors: [],
  publicationYear: {
    display: "Dummy 2005",
    year: 2005,
  },
};

export const FAKE_LATEST_PRINTING = {
  summary: "Dummy 11. oplag, 2020",
  printing: "Dummy 11. oplag",
  publicationYear: {
    display: "Dummy 2020",
    year: 2020,
  },
};

export const FAKE_HOST_PUBLICATION = {
  title: "Dummy Årsskrift / Carlsbergfondet",
  creator: "Dummy Some Creator",
  isbn: "Dummy some isbn",
  issue: "Dummy some issue",
  notes: ["Dummy a note"],
  pages: "Dummy 140-145",
  publisher: "Dummy Some Publisher",
  summary: "Dummy Årsskrift / Carlsbergfondet, 2006",
  issn: "Dummy 1395-7961",
  year: {
    display: "Dummy 2006",
    year: 2006,
  },
  series: FAKE_GENERAL_SERIES,
};

export const FAKE_LANGUAGES = {
  notes: ["Dummy dansk", "dummy english", "dummy german"],
  main: [{ display: "Dummy dansk", isoCode: "Dummy dan" }],
  original: [{ display: "Dummy dansk", isoCode: "Dummy dan" }],
  parallel: [{ display: "Dummy dansk", isoCode: "Dummy dan" }],
  spoken: [{ display: "Dummy dansk", isoCode: "Dummy dan" }],
  subtitles: [{ display: "Dummy dansk", isoCode: "Dummy dan" }],
  abstract: [{ display: "Dummy dansk", isoCode: "Dummy dan" }],
};

export const FAKE_MANIFESTATION_PARTS = {
  type: "MUSIC_TRACKS",
  heading: "Dummy Indhold:",
  parts: [
    {
      title: { display: "Dummy Bouquet royal" },
      creators: [
        {
          __typename: "Person",
          display: "Dummy H. C. Lumbye",
          nameSort: "Dummy Lumbye, H.C.",
          firstName: "Dummy H. C.",
          lastName: "Dummy Lumbye",
          roles: [],
        },
      ],
      creatorsFromDescription: ["Dummy arr.: Peter Ettrup Larsen"],
      classifications: [
        {
          system: "DK5",
          code: "Dummy 78.424",
          display: "Dummy Klaver og strygere. Orgel og strygere",
        },
      ],
      playingTime: "Dummy playing time",
    },
    {
      title: { display: "Dummy Banker Loyal" },
      creators: [
        {
          __typename: "Person",
          display: "Dummy A. C. Handerson",
          nameSort: "Dummy Handerson, A.C.",
          firstName: "Dummy A. C.",
          lastName: "Dummy Handerson",
          roles: [],
        },
      ],
      creatorsFromDescription: ["Dummy arr.: Don Alderson Drumf"],
      classifications: [
        {
          system: "DK5",
          code: "Dummy 88.424",
          display: "Dummy Saxofon og blæsere. Trompet og blæsere",
        },
      ],
      playingTime: "Dummy long playing time",
    },
    {
      title: { forSearchIndexOnly: "Dummy forSearchIndexOnly" },
      creators: [
        {
          __typename: "Person",
          display: "Dummy Search Index Only",
          nameSort: "Dummy Only, Search Index",
          firstName: "Dummy Search Index",
          lastName: "Dummy Only",
          roles: [],
        },
      ],
      creatorsFromDescription: ["Dummy arr.: Benny Strompet"],
      classifications: [
        {
          system: "DK5",
          code: "Dummy 88.424",
          display:
            "Dummy Trommer og slaginstrumenter. Bongo og slaginstrumenter",
        },
      ],
      playingTime: "Dummy wasteful playing time",
    },
  ],
};

export const FAKE_MATERIALTYPE = {
  general: { code: "AUDIO_BOOKS", display: "Dummy bøger" },
  specific: { code: "AUDIO_BOOK", display: "Dummy bog" },
};

export const FAKE_NOTES = {
  type: "NOT_SPECIFIED",
  display: ["Dummy Indspillet i Ꜳrhus Musikhus 12.-14. juni 2020"],
};

export const FAKE_PHYSICALDESCRIPTION = {
  summary:
    "Dummy 1 dvd-rom Xbox One Nødvendigt udstyr Xbox One. - Med multiplayerfunktion Spiludvikler fremgår ikke af materialet",
  extent: "Dummy 1 dvd-rom",
  requirements: "Dummy Nødvendigt udstyr Xbox One. - Med multiplayerfunktion",
  technicalInformation: "Dummy Xbox One",
};

export const FAKE_PUBLICATIONYEAR = {
  display: "Dummy 1839",
  year: 1839,
  frequency: "Dummy ugentlig",
};

export const FAKE_SHELFMARK = {
  postfix: "Dummy some postfix",
  shelfmark: "Dummy some shelfmark",
};

export const FAKE_LIST_OF_CONTENT = {
  heading: "Dummy Indhold",
  listOfContent: [
    {
      heading: "Dummy Puderne",
      listOfContent: [
        { content: "Dummy Bruddet" },
        { content: "Dummy Hustelefonen" },
      ],
    },
    {
      content: "Dummy Tykke-Olsen m.fl.",
    },
    {
      content: "Dummy Over skulderen",
    },
  ],
};

const FAKE_OWNER_WORK = {
  workId: "work-of:870970-basis:54029519",
};

export const FAKE_MANIFESTATION_1 = {
  pid: "Dummy some-pid-1",
  titles: FAKE_MANIFESTATION_TITLE,
  abstract: ["Dummy Some abstract ..."],
  accessTypes: [
    { display: "Dummy fysisk", code: "PHYSICAL" },
    { display: "Dummy online", code: "ONLINE" },
  ],
  access: FAKE_ACCESS,
  audience: FAKE_AUDIENCE,
  catalogueCodes: {
    nationalBibliography: ["national_bibliography"],
    // otherCatalogues: ["other_catalogueCodes", "even_other_catalogueCodes"],
    otherCatalogues: ["other_catalogueCodes", "even_other_catalogueCodes"],
  },
  contributors: [
    {
      ...FAKE_PERSON,
      roles: [
        {
          functionCode: "Dummy ill",
          function: {
            singular: "Dummy illustrator",
            plural: "Dummy illustratorer",
          },
        },
      ],
    },
  ],
  contributorsFromDescription: ["Dummy på dansk ved Vivi Berendt"],
  creators: [FAKE_PERSON, FAKE_CORPORATION],
  creatorsFromDescription: ["Dummy tekst af William Warren"],
  classifications: [FAKE_CLASSIFICATION, FAKE_CLASSIFICATION_1],
  dateFirstEdition: {
    display: "Dummy first edition",
    year: 1950,
    endYear: 1950,
    frequency: 1,
  },
  edition: FAKE_EDITION,
  latestPrinting: FAKE_LATEST_PRINTING,
  fictionNonfiction: { display: "Dummy skønlitteratur", code: "FICTION" },
  genreAndForm: ["Dummy some genre"],
  hostPublication: FAKE_HOST_PUBLICATION,
  identifiers: [
    {
      type: "ISBN",
      value: "Dummy 1234567891234",
    },
  ],
  languages: FAKE_LANGUAGES,
  manifestationParts: FAKE_MANIFESTATION_PARTS,
  materialTypes: [FAKE_MATERIALTYPE],
  notes: [FAKE_NOTES],
  ownerWork: FAKE_OWNER_WORK,
  relatedPublications: [
    {
      heading: "Dummy Tidligere titel:",
      title: ["Dummy Yngre læger"],
      issn: "Dummy 0105-0508",
    },
    {
      heading: "Dummy Udgave i andet medium: Også på cd-rom",
      title: ["Dummy Ugeskrift for læger"],
      issn: "Dummy 1399-4174",
    },
  ],
  physicalDescriptions: [FAKE_PHYSICALDESCRIPTION],
  publicationYear: FAKE_PUBLICATIONYEAR,
  publisher: ["Dummy Lægeforeningen"],
  recordCreationDate: "Dummy 19830414",
  series: [FAKE_POPULAR_SERIES, FAKE_GENERAL_SERIES],
  universe: { title: "Dummy some universe 1" },
  shelfmark: FAKE_SHELFMARK,
  source: ["Dummy some source"],
  subjects: FAKE_SUBJECTS,
  volume: "Dummy Bind 2",
  tableOfContents: FAKE_LIST_OF_CONTENT,
  workYear: {
    display: "Dummy",
    year: 1950,
    endYear: 1951,
    frequency: 1,
  },
};

export const FAKE_MANIFESTATION_2 = {
  ...FAKE_MANIFESTATION_1,
  pid: "Dummy some-pid-2",
};

export const hest = {
  fisk: "Dummy hest",
};

export const FAKE_WORKTITLES = {
  main: ["Dummy Some Title"],
  full: ["Dummy Some Title: Full"],
  parallel: ["Dummy Parallel Title 1", "Dummy Parallel Title 2"],
  sort: "Dummy Some Title Sort",
  original: ["Dummy Some Title Origintal"],
  standard: "Dummy Some Title Standard",
  translated: ["Dummy Oversat titel"],
};

export const FAKE_DK5MAINENTRY = {
  display: "Dummy some dk5 display",
  code: "Dummy some dk5 code",
  dk5Heading: "Dummy some dk5 heading",
};

export const FAKE_WORK = {
  workId: FAKE_OWNER_WORK.workId,
  titles: FAKE_WORKTITLES,
  abstract: ["Dummy The abstract"],
  creators: [FAKE_PERSON, FAKE_CORPORATION],
  dk5MainEntry: FAKE_DK5MAINENTRY,
  fictionNonfiction: { display: "Dummy skønlitteratur", code: "FICTION" },
  materialTypes: [FAKE_MATERIALTYPE],
  series: [FAKE_POPULAR_SERIES, FAKE_GENERAL_SERIES],
  universe: { title: "Dummy Some Universe" },
  genreAndForm: ["Dummy some genre"],
  workTypes: ["LITERATURE"],
  workYear: {
    display: "Dummy",
    year: 1950,
    endYear: 1951,
    frequency: 1,
  },
  mainLanguages: [{ display: "Dummy dansk", isoCode: "Dummy dan" }],
  subjects: FAKE_SUBJECTS,
  manifestations: {
    first: FAKE_MANIFESTATION_1,
    latest: FAKE_MANIFESTATION_2,
    all: [FAKE_MANIFESTATION_1, FAKE_MANIFESTATION_2],
    bestRepresentation: FAKE_MANIFESTATION_2,
    mostRelevant: [FAKE_MANIFESTATION_2, FAKE_MANIFESTATION_1],
  },
};

export const FAKE_SUGGEST_RESPONSE = {
  result: [
    { type: "Dummy title", term: "Dummy Some Title", work: FAKE_WORK },
    { type: "Dummy creator", term: "Dummy Some Creator", work: FAKE_WORK },
  ],
};

export const FAKE_RECOMMEND_RESPONSE = {
  result: [
    { work: FAKE_WORK, manifestation: FAKE_MANIFESTATION_1 },
    { work: FAKE_WORK, manifestation: FAKE_MANIFESTATION_1 },
  ],
};
