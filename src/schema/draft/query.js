export const typeDef = `
type Draft_Query {
  work(id: String, faust: String, pid: String): Draft_Work
  works(id: [String!], faust: [String!], pid: [String!]): [Draft_Work]!
  manifestation(faust: String, pid: String): Draft_Manifestation
  manifestations(faust: [String!], pid: [String!]): [Draft_Manifestation]!
  suggest(
    """
    The query to get suggestions from
    """
    q: String!

    """
    work type to include in the result
    Note: Is only supported in the bibdk suggester
    """
    workType: WorkType

    """
    suggest type to include in result
    """
    suggestType: Draft_SuggestionType
  ): Draft_SuggestResponse!

  """
  Get recommendations based on a pid
  """
  recommend(pid: String!): Draft_RecommendationResponse!

  """
  Search
  """
  search(q: SearchQuery!): Draft_SearchResponse!
}
extend type Query {
  draft: Draft_Query!
}
`;

const FAKE_GENERAL_SERIES = {
  title: "Some Series",
  parallelTitles: [
    "Some Series, parallel title",
    "Some Series, another parallel title",
  ],
  numberInSeries: {
    display: "number one",
    number: 1,
  },
  works: [],
};

const FAKE_SERIES_CONTAINER = {
  all: [FAKE_GENERAL_SERIES],
  popular: [
    {
      title: "Some Series",
      alternativeTitles: [
        "Some Series, parallel title",
        "Some Series, another parallel title",
      ],
      numberInSeries: {
        display: "number one",
        number: 1,
      },
      readThisFirst: true,
      readThisWhenever: false,
      works: [],
    },
  ],
};
const FAKE_PERSON = {
  __typename: "Draft_Person",
  display: "Jens Jensen",
  nameSort: "Jensen Jens",
  firstName: "Jens",
  lastName: "Jensen",
  birthYear: "1950",
  romanNumeral: "Jens Jensen IV",
  attributeToName: "Jens Jensen, testperson",
  aliases: [
    { display: "Svend Svendsen, personen bag Jens Jensen" },
    { display: "Kirsten Kirstensen, personen bag Jens Jensen" },
  ],
  roles: [
    {
      functionCode: "aut",
      function: {
        singular: "forfatter",
        plural: "forfattere",
      },
    },
  ],
};

const FAKE_CORPORATION = {
  __typename: "Draft_Corporation",
  display: "Some Corporation",
  nameSort: "Some Corporation for sorting",
  main: "Some Corporation",
  sub: "Some Sub Corporation",
  location: "Some location",
  year: "1950",
  number: "5",
  attributeToName: "Some Corporation ...",
  roles: [],
};

const FAKE_SUBJECTS = {
  all: [
    {
      __typename: "Draft_SubjectText",
      type: "TOPIC",
      display: "Some fictional subject",
    },
    {
      __typename: "Draft_TimePeriod",
      display: "1950-1980",
      period: { begin: 1950, end: 1980, display: "1950-1980" },
    },
    FAKE_PERSON,
    FAKE_CORPORATION,
  ],
  dbcVerified: [
    {
      __typename: "Draft_SubjectText",
      type: "TOPIC",
      display: "Some fictional subject",
    },
    {
      __typename: "Draft_TimePeriod",
      display: "1950-1980",
      period: { begin: 1950, end: 1980, display: "1950-1980" },
    },
    FAKE_PERSON,
    FAKE_CORPORATION,
  ],
};

const FAKE_MANIFESTATION_1 = {
  pid: "some-pid-1",
  titles: {
    main: ["Some Title"],
    full: ["Some Title: Full"],
    alternative: ["Some Title: Alternative"],
    identifyingAddition: "Indlæst af Jens Jensen",
    original: ["Some Title: Original"],
    parallel: ["Parallel Title 1", "Parallel Title 2"],
    sort: "Some Title Sort",
    standard: "Some Title Standard",
    translated: ["En Oversat Titel"],
  },
  abstract: ["Some abstract ..."],
  accessTypes: [
    { display: "fysisk", code: "PHYSICAL" },
    { display: "online", code: "ONLINE" },
  ],
  access: [
    {
      __typename: "Draft_URL",
      origin: "DBC Webarkiv",
      url: "https://moreinfo.dbc.dk",
    },
    {
      __typename: "Draft_Ereol",
      origin: "Ereolen",
      url: "https://...",
      canAlwaysBeLoaned: true,
    },
    {
      __typename: "Draft_Ill",
      ill: true,
    },
    {
      __typename: "Draft_InfomediaService",
      id: "123456",
    },
    {
      __typename: "Draft_DigitalArticleService",
      issn: "123456",
      subscribed: true,
    },
  ],
  audience: {
    generalAudience: ["general audience"],
    ages: [{ display: "10-14", begin: 10, end: 14 }],
    libraryRecommendation: "some library recommendation",
    childrenOrAdults: [{ display: "til børn", code: "FOR_CHILDREN" }],
    schoolUse: [{ display: "til skolebrug", code: "FOR_SCHOOL_USE" }],
    primaryTarget: ["Some primary target"],
    let: "some let",
    lix: "some lix",
  },
  contributors: [
    {
      ...FAKE_PERSON,
      roles: [
        {
          functionCode: "ill",
          function: {
            singular: "illustrator",
            plural: "illustratorer",
          },
        },
      ],
    },
  ],
  contributorsFromDescription: ["på dansk ved Vivi Berendt"],
  creators: [FAKE_PERSON, FAKE_CORPORATION],
  creatorsFromDescription: ["tekst af William Warren"],
  classifications: [
    {
      system: "DK5",
      code: "86-096",
      display: "Skønlitteratur",
      entryType: "NATIONAL_BIBLIOGRAPHY_ENTRY",
    },
  ],
  edition: {
    summary: "3. i.e. 2 udgave, 2005",
    edition: "3. i.e. 2 udgave",
    contributors: [],
    publicationYear: {
      display: "2005",
      year: 2005,
    },
  },
  latestPrinting: {
    summary: "11. oplag, 2020",
    printing: "11. oplag",
    publicationYear: {
      display: "2020",
      year: 2020,
    },
  },
  fictionNonfiction: { display: "skønlitteratur", code: "FICTION" },
  genreAndForm: ["some genre"],
  hostPublication: {
    title: "Årsskrift / Carlsbergfondet",
    creator: "Some Creator",
    isbn: "some isbn",
    issue: "some issue",
    notes: ["a note"],
    pages: "140-145",
    publisher: "Some Publisher",
    summary: "Årsskrift / Carlsbergfondet, 2006",
    issn: "1395-7961",
    year: {
      display: "2006",
      year: 2006,
    },
    series: FAKE_GENERAL_SERIES,
  },
  identifiers: [
    {
      type: "ISBN",
      value: "1234567891234",
    },
  ],
  languages: {
    main: [{ display: "dansk", isoCode: "dan" }],
    original: [{ display: "dansk", isoCode: "dan" }],
    parallel: [{ display: "dansk", isoCode: "dan" }],
    spoken: [{ display: "dansk", isoCode: "dan" }],
    subtitles: [{ display: "dansk", isoCode: "dan" }],
    abstract: [{ display: "dansk", isoCode: "dan" }],
  },
  manifestationParts: {
    type: "MUSIC_TRACKS",
    heading: "Indhold:",
    parts: [
      {
        title: "Bouquet royal",
        creators: [
          {
            __typename: "Draft_Person",
            display: "H. C. Lumbye",
            nameSort: "Lumbye, H.C.",
            firstName: "H. C.",
            lastName: "Lumbye",
            roles: [],
          },
        ],
        creatorsFromDescription: ["arr.: Peter Ettrup Larsen"],
        classifications: [
          {
            system: "DK5",
            code: "78.424",
            display: "Klaver og strygere. Orgel og strygere",
          },
        ],
      },
    ],
  },
  materialTypes: { general: ["bøger", "ebøger"], specific: ["bog", "ebog"] },
  notes: [
    {
      type: "NOT_SPECIFIED",
      display: ["Indspillet i Ꜳrhus Musikhus 12.-14. juni 2020"],
    },
  ],
  relatedPublications: [
    {
      heading: "Tidligere titel:",
      title: ["Yngre læger"],
      issn: "0105-0508",
    },
    {
      heading: "Udgave i andet medium: Også på cd-rom",
      title: ["Ugeskrift for læger"],
      issn: "1399-4174",
    },
  ],
  physicalDescriptions: [
    {
      summary:
        "1 dvd-rom Xbox One Nødvendigt udstyr Xbox One. - Med multiplayerfunktion Spiludvikler fremgår ikke af materialet",
      extent: "1 dvd-rom",
      requirements: "Nødvendigt udstyr Xbox One. - Med multiplayerfunktion",
      technicalInformation: "Xbox One",
    },
  ],
  publicationYear: {
    display: "1839",
    year: 1839,
    frequency: "ugentlig",
  },
  publisher: ["Lægeforeningen"],
  recordCreationDate: "19830414",
  series: FAKE_SERIES_CONTAINER,
  shelfmark: {
    postfix: "some postfix",
    shelfmark: "some shelfmark",
  },
  source: ["some source"],
  subjects: FAKE_SUBJECTS,
  volume: "Bind 2",
  tableOfContents: {
    heading: "Indhold",
    listOfContent: [
      {
        heading: "Puderne",
        listOfContent: [{ content: "Bruddet" }, { content: "Hustelefonen" }],
      },
      {
        content: "Tykke-Olsen m.fl.",
      },
      {
        content: "Over skulderen",
      },
    ],
  },
};

const FAKE_MANIFESTATION_2 = {
  ...FAKE_MANIFESTATION_1,
  pid: "some-pid-2",
};

const FAKE_WORK = {
  workId: "work-of:870970-basis:54029519",
  titles: {
    main: ["Some Title"],
    full: ["Some Title: Full"],
    parallel: ["Parallel Title 1", "Parallel Title 2"],
    sort: "Some Title Sort",
    original: ["Some Title Origintal"],
    standard: "Some Title Standard",
    translated: ["Oversat titel"],
  },
  abstract: ["The abstract"],
  creators: [FAKE_PERSON, FAKE_CORPORATION],
  dk5MainEntry: { display: "some dk5 display", code: "some dk5 code" },
  fictionNonfiction: { display: "skønlitteratur", code: "FICTION" },
  materialTypes: { general: ["bøger", "ebøger"], specific: ["bog", "ebog"] },
  series: FAKE_SERIES_CONTAINER,
  universe: { title: "Some Universe" },
  subjects: FAKE_SUBJECTS,
  genreAndForm: ["some genre"],
  workTypes: ["LITERATURE"],
  workYear: "1950",
  mainLanguages: [{ display: "dansk", isoCode: "dan" }],
  subjects: FAKE_SUBJECTS,
  manifestations: {
    first: FAKE_MANIFESTATION_1,
    latest: FAKE_MANIFESTATION_2,
    all: [FAKE_MANIFESTATION_1, FAKE_MANIFESTATION_2],
  },
};

const FAKE_SUGGEST_RESPONSE = {
  result: [
    { type: "title", term: "Some Title", work: FAKE_WORK },
    { type: "creator", term: "Some Creator", work: FAKE_WORK },
  ],
};

const FAKE_RECOMMEND_RESPONSE = {
  result: [
    { work: FAKE_WORK, manifestation: FAKE_MANIFESTATION_1 },
    { work: FAKE_WORK, manifestation: FAKE_MANIFESTATION_1 },
  ],
};

export const resolvers = {
  Query: {
    draft() {
      return {};
    },
  },
  Draft_Query: {
    work(parent, args, context) {
      return FAKE_WORK;
    },
    works(parent, args, context) {
      const count =
        args?.id?.length || args?.faust?.length || args?.pid?.length || 0;
      return Array(count)
        .fill(0)
        .map(() => FAKE_WORK);
    },
    manifestation() {
      return FAKE_MANIFESTATION_1;
    },
    manifestations(parent, args, context) {
      const count =
        args?.id?.length || args?.faust?.length || args?.pid?.length || 0;
      return Array(count)
        .fill(0)
        .map(() => FAKE_MANIFESTATION_1);
    },
    suggest() {
      return FAKE_SUGGEST_RESPONSE;
    },
    recommend() {
      return FAKE_RECOMMEND_RESPONSE;
    },
    search() {
      return {
        facets: {
          categories: [
            {
              facetCategory: "materialType",
              values: [
                {
                  term: "Ebog",
                  count: 8,
                  facetName: "materialType",
                  popular: true,
                },
                {
                  term: "Fysisk",
                  count: 18,
                  facetName: "materialType",
                  popular: false,
                },
              ],
            },
            {
              facetCategory: "subjects",
              values: [
                {
                  term: "Fantasy",
                  count: 8,
                  facetName: "subjects",
                  popular: true,
                },
                {
                  term: "Heste",
                  count: 2,
                  facetName: "subjects",
                  popular: false,
                },
              ],
            },
          ],
          popular: [
            {
              term: "Ebog",
              count: 8,
              facetCategory: "materialType",
              popular: true,
            },
            {
              term: "Fantasy",
              count: 82,
              facetCategory: "subjects",
              popular: true,
            },
          ],
        },
      };
    },
  },
};
