export const FAKE_GENERAL_SERIES = {
  title: 'Some Series',
  parallelTitles: [
    'Some Series, parallel title',
    'Some Series, another parallel title',
  ],
  numberInSeries: {
    display: 'number one',
    number: 1,
  },
  works: [],
};

export const FAKE_SERIES_CONTAINER = {
  all: [FAKE_GENERAL_SERIES],
  popular: [
    {
      title: 'Some Series',
      alternativeTitles: [
        'Some Series, parallel title',
        'Some Series, another parallel title',
      ],
      numberInSeries: {
        display: 'number one',
        number: 1,
      },
      readThisFirst: true,
      readThisWhenever: false,
      works: [],
    },
  ],
};

export const FAKE_TRANSLATION = {
  singular: 'forfatter',
  plural: 'forfattere',
};

export const FAKE_ROLE = {
  functionCode: 'aut',
  'function': FAKE_TRANSLATION,
};

export const FAKE_PERSON = {
  __typename: 'Draft_Person',
  display: 'Jens Jensen',
  nameSort: 'Jensen Jens',
  firstName: 'Jens',
  lastName: 'Jensen',
  birthYear: '1950',
  romanNumeral: 'Jens Jensen IV',
  attributeToName: 'Jens Jensen, testperson',
  aliases: [
    {display: 'Svend Svendsen, personen bag Jens Jensen'},
    {display: 'Kirsten Kirstensen, personen bag Jens Jensen'},
  ],
  roles: [FAKE_ROLE],
};

export const FAKE_ACCESS = {

  __typename: 'Draft_URL',
  origin: 'DBC Webarkiv',
  url: 'https://moreinfo.dbc.dk',
};

export const FAKE_CORPORATION = {
  __typename: 'Draft_Corporation',
  display: 'Some Corporation',
  nameSort: 'Some Corporation for sorting',
  main: 'Some Corporation',
  sub: 'Some Sub Corporation',
  location: 'Some location',
  year: '1950',
  number: '5',
  attributeToName: 'Some Corporation ...',
  roles: [],
};

export const FAKE_SUBJECTS = {
  all: [
    {
      __typename: 'Draft_SubjectText',
      type: 'TOPIC',
      display: 'Some fictional subject',
    },
    {
      __typename: 'Draft_TimePeriod',
      display: '1950-1980',
      period: {begin: 1950, end: 1980, display: '1950-1980'},
    },
    FAKE_PERSON,
    FAKE_CORPORATION,
  ],
  dbcVerified: [
    {
      __typename: 'Draft_SubjectText',
      type: 'TOPIC',
      display: 'Some fictional subject',
    },
    {
      __typename: 'Draft_TimePeriod',
      display: '1950-1980',
      period: {begin: 1950, end: 1980, display: '1950-1980'},
    },
    FAKE_PERSON,
    FAKE_CORPORATION,
  ],
};

export const FAKE_MANIFESTATION_TITLE = {
  main: ['Some Title'],
  full: ['Some Title: Full'],
  alternative: ['Some Title: Alternative'],
  identifyingAddition: 'Indlæst af Jens Jensen',
  original: ['Some Title: Original'],
  parallel: ['Parallel Title 1', 'Parallel Title 2'],
  sort: 'Some Title Sort',
  standard: 'Some Title Standard',
  translated: ['En Oversat Titel'],
};

export const FAKE_AUDIENCE = {
  generalAudience: ['general audience'],
  ages: [{display: '10-14', begin: 10, end: 14}],
  libraryRecommendation: 'some library recommendation',
  childrenOrAdults: [{display: 'til børn', code: 'FOR_CHILDREN'}],
  schoolUse: [{display: 'til skolebrug', code: 'FOR_SCHOOL_USE'}],
  primaryTarget: ['Some primary target'],
  let: 'some let',
  lix: 'some lix',
}

export const FAKE_CLASSIFICATION = {
  system: 'DK5',
  code: '86-096',
  display: 'Skønlitteratur',
  entryType: 'NATIONAL_BIBLIOGRAPHY_ENTRY',
}

export const FAKE_EDITION = {
  summary: '3. i.e. 2 udgave, 2005',
  edition: '3. i.e. 2 udgave',
  contributors: [],
  publicationYear: {
    display: '2005',
    year: 2005,
  },
}

export const FAKE_LATEST_PRINTING = {
  summary: '11. oplag, 2020',
  printing: '11. oplag',
  publicationYear: {
    display: '2020',
    year: 2020,
  },
}

export const FAKE_HOST_PUBLICATION = {
  title: 'Årsskrift / Carlsbergfondet',
  creator: 'Some Creator',
  isbn: 'some isbn',
  issue: 'some issue',
  notes: ['a note'],
  pages: '140-145',
  publisher: 'Some Publisher',
  summary: 'Årsskrift / Carlsbergfondet, 2006',
  issn: '1395-7961',
  year: {
    display: '2006',
    year: 2006,
  },
  series: FAKE_GENERAL_SERIES,
}


export const FAKE_LANGUAGES = {
  main: [{display: 'dansk', isoCode: 'dan'}],
  original: [{display: 'dansk', isoCode: 'dan'}],
  parallel: [{display: 'dansk', isoCode: 'dan'}],
  spoken: [{display: 'dansk', isoCode: 'dan'}],
  subtitles: [{display: 'dansk', isoCode: 'dan'}],
  abstract: [{display: 'dansk', isoCode: 'dan'}],
}

export const FAKE_MANIFESTATION_PARTS = {
  type: 'MUSIC_TRACKS',
  heading: 'Indhold:',
  parts: [
    {
      title: 'Bouquet royal',
      creators: [
        {
          __typename: 'Draft_Person',
          display: 'H. C. Lumbye',
          nameSort: 'Lumbye, H.C.',
          firstName: 'H. C.',
          lastName: 'Lumbye',
          roles: [],
        },
      ],
      creatorsFromDescription: ['arr.: Peter Ettrup Larsen'],
      classifications: [
        {
          system: 'DK5',
          code: '78.424',
          display: 'Klaver og strygere. Orgel og strygere',
        },
      ],
    },
  ],
}

export const FAKE_MANIFESTATION_1 = {
  pid: 'some-pid-1',
  titles: FAKE_MANIFESTATION_TITLE,
  abstract: ['Some abstract ...'],
  accessTypes: [
    {display: 'fysisk', code: 'FYSISK'},
    {display: 'online', code: 'ONLINE'},
  ],
  access: FAKE_ACCESS,
  audience: FAKE_AUDIENCE,
  contributors: [
    {
      ...FAKE_PERSON,
      roles: [
        {
          functionCode: 'ill',
          function: {
            singular: 'illustrator',
            plural: 'illustratorer',
          },
        },
      ],
    },
  ],
  contributorsFromDescription: ['på dansk ved Vivi Berendt'],
  creators: [FAKE_PERSON, FAKE_CORPORATION],
  creatorsFromDescription: ['tekst af William Warren'],
  classifications: [FAKE_CLASSIFICATION],
  edition: FAKE_EDITION,
  latestPrinting: FAKE_LATEST_PRINTING,
  fictionNonfiction: {display: 'skønlitteratur', code: 'FICTION'},
  genreAndForm: ['some genre'],
  hostPublication: FAKE_HOST_PUBLICATION,
  identifiers: [
    {
      type: 'ISBN',
      value: '1234567891234',
    },
  ],
  languages: FAKE_LANGUAGES,
  manifestationParts: FAKE_MANIFESTATION_PARTS,
  materialTypes: {general: ['bøger', 'ebøger'], specific: ['bog', 'ebog']},
  notes: [
    {
      type: 'NOT_SPECIFIED',
      display: ['Indspillet i Ꜳrhus Musikhus 12.-14. juni 2020'],
    },
  ],
  relatedPublications: [
    {
      heading: 'Tidligere titel:',
      title: ['Yngre læger'],
      issn: '0105-0508',
    },
    {
      heading: 'Udgave i andet medium: Også på cd-rom',
      title: ['Ugeskrift for læger'],
      issn: '1399-4174',
    },
  ],
  physicalDescriptions: [
    {
      summary:
          '1 dvd-rom Xbox One Nødvendigt udstyr Xbox One. - Med multiplayerfunktion Spiludvikler fremgår ikke af materialet',
      extent: '1 dvd-rom',
      requirements: 'Nødvendigt udstyr Xbox One. - Med multiplayerfunktion',
      technicalInformation: 'Xbox One',
    },
  ],
  publicationYear: {
    display: '1839',
    year: 1839,
    frequency: 'ugentlig',
  },
  publisher: ['Lægeforeningen'],
  recordCreationDate: '19830414',
  series: FAKE_SERIES_CONTAINER,
  shelfmark: {
    prefix: 'some prefix',
    shelfmark: 'some shelfmark',
  },
  source: ['some source'],
  subjects: FAKE_SUBJECTS,
  volume: 'Bind 2',
  tableOfContents: {
    heading: 'Indhold',
    listOfContent: [
      {
        heading: 'Puderne',
        listOfContent: [{content: 'Bruddet'}, {content: 'Hustelefonen'}],
      },
      {
        content: 'Tykke-Olsen m.fl.',
      },
      {
        content: 'Over skulderen',
      },
    ],
  },
};

export const FAKE_MANIFESTATION_2 = {
  ...FAKE_MANIFESTATION_1,
  pid: 'some-pid-2',
};

export const hest = {
  fisk: 'hest',
};

export const FAKE_WORKTITLES = {
  main: ['Some Title'],
  full: ['Some Title: Full'],
  parallel: ['Parallel Title 1', 'Parallel Title 2'],
  sort: 'Some Title Sort',
  original: ['Some Title Origintal'],
  standard: 'Some Title Standard',
  translated: ['Oversat titel'],
};

export const FAKE_MATERIALTYPE = {
  general: 'ENMATERIALETYPE',
  specific: 'ebog',
};

export const FAKE_DK5MAINENTRY = {
  display: 'some dk5 display',
  code: 'some dk5 code',
};

export const FAKE_WORK = {
  workId: 'work-of:870970-basis:54029519',
  titles: {
    FAKE_WORKTITLES,
  },
  abstract: ['The abstract'],
  creators: [FAKE_PERSON, FAKE_CORPORATION],
  dk5MainEntry: FAKE_DK5MAINENTRY,
  fictionNonfiction: {display: 'skønlitteratur', code: 'FICTION'},
  materialTypes: [FAKE_MATERIALTYPE],
  series: FAKE_SERIES_CONTAINER,
  universe: {title: 'Some Universe'},
  genreAndForm: ['some genre'],
  workTypes: ['LITERATURE'],
  workYear: '1950',
  mainLanguages: [{display: 'dansk', isoCode: 'dan'}],
  subjects: FAKE_SUBJECTS,
  manifestations: {
    first: FAKE_MANIFESTATION_1,
    latest: FAKE_MANIFESTATION_2,
    all: [FAKE_MANIFESTATION_1, FAKE_MANIFESTATION_2],
  },
};

export const FAKE_SUGGEST_RESPONSE = {
  result: [
    {type: 'title', term: 'Some Title', work: FAKE_WORK},
    {type: 'creator', term: 'Some Creator', work: FAKE_WORK},
  ],
};

export const FAKE_RECOMMEND_RESPONSE = {
  result: [
    {work: FAKE_WORK, manifestation: FAKE_MANIFESTATION_1},
    {work: FAKE_WORK, manifestation: FAKE_MANIFESTATION_1},
  ],
};
