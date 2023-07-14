const DEFAULT = {
  id: "x",
  name: "Freja Damgaard",
  address: "Borgmesterskoven 45",
  postalCode: "8660",
  ddbcmsapi: "https://cmscontent.dbc.dk/",
  agency: "790900",
  mail: "test@dbc.dk",
  country: "DK",
  debt: [
    {
      title: "",
      amount: "224",
      creator: null,
      date: "1969-12-31T23:00:00.000Z",
      currency: "DKK",
      agencyId: "790900",
    },
    {
      title: "",
      amount: "50",
      creator: null,
      date: "1969-12-31T23:00:00.000Z",
      currency: "DKK",
      agencyId: "790900",
    },
  ],
  loans: [
    {
      materialType: "Bog",
      loanId: "5301555018",
      dueDate: "2023-07-31T22:00:00.000Z",
      edition: "2. udgave",
      pages: "299 sider",
      publisher: "Voice & Writing 2019",
      agencyId: "790900",
      manifestation: {
        pid: "870970-basis:48623549",
        titles: {
          main: ["Digitale nomader"],
        },
        ownerWork: {
          workId: "work-of:870970-basis:48623549",
        },
        creators: [
          {
            __typename: "Person",
            display: "Mille Bruun Sjøgren",
            nameSort: "sjøgren mille bruun",
            roles: [
              {
                function: {
                  plural: "forfattere",
                  singular: "forfatter",
                },
                functionCode: "aut",
              },
            ],
          },
          {
            __typename: "Person",
            display: "Kristian Peter Sjøgren",
            nameSort: "sjøgren kristian peter",
            roles: [
              {
                function: {
                  plural: "forfattere",
                  singular: "forfatter",
                },
                functionCode: "aut",
              },
            ],
          },
        ],
        materialTypes: [
          {
            specific: "bog",
          },
        ],
        cover: {
          thumbnail:
            "https://moreinfo.addi.dk/2.11/more_info_get.php?lokalid=48623549&attachment_type=forside_lille&bibliotek=870970&source_id=150020&key=081f8c0481e077420cdd",
        },
        recordCreationDate: "20200731",
      },
    },
    {
      materialType: "Bog",
      loanId: "5085535759",
      dueDate: "2023-08-10T22:00:00.000Z",
      edition: "1. udgave",
      pages: "159 sider",
      publisher: "People's Press 2018",
      agencyId: "790900",
      manifestation: {
        pid: "870970-basis:52037794",
        titles: {
          main: ["Fermentering"],
        },
        ownerWork: {
          workId: "work-of:870970-basis:52037794",
        },
        creators: [
          {
            __typename: "Person",
            display: "Shane Peterson",
            nameSort: "peterson shane",
            roles: [
              {
                function: {
                  plural: "forfattere",
                  singular: "forfatter",
                },
                functionCode: "aut",
              },
            ],
          },
          {
            __typename: "Person",
            display: "Søren Ejlersen",
            nameSort: "ejlersen søren",
            roles: [
              {
                function: {
                  plural: "forfattere",
                  singular: "forfatter",
                },
                functionCode: "aut",
              },
            ],
          },
          {
            __typename: "Person",
            display: "Ditte Ingemann",
            nameSort: "ingemann ditte",
            roles: [
              {
                function: {
                  plural: "forfattere",
                  singular: "forfatter",
                },
                functionCode: "aut",
              },
              {
                function: {
                  plural: "illustratorer",
                  singular: "illustrator",
                },
                functionCode: "ill",
              },
            ],
          },
        ],
        materialTypes: [
          {
            specific: "bog",
          },
        ],
        cover: {
          thumbnail:
            "https://moreinfo.addi.dk/2.11/more_info_get.php?lokalid=52037794&attachment_type=forside_lille&bibliotek=870970&source_id=150020&key=2747c6a55d37e7c5131e",
        },
        recordCreationDate: "20151102",
      },
    },
  ],
  orders: [
    {
      orderId: "79182543",
      status: "UNKNOWN",
      pickUpBranch: {
        agencyName: "Roskilde Bibliotekerne",
      },
      pickUpExpiryDate: null,
      holdQueuePosition: "1",
      creator: "Thorborg, Martin",
      orderType: "normal",
      orderDate: "2023-06-27T13:42:35.000Z",
      title: "Skab din egen succes: leveregler der kan bringe dig langt",
      pages: "151 sider",
      edition: "1. udgave",
      agencyId: "790900",
      manifestation: {
        pid: "870970-basis:135689122",
        titles: {
          main: ["Skab din egen succes"],
        },
        ownerWork: {
          workId: "work-of:870970-basis:135689122",
        },
        creators: [
          {
            __typename: "Person",
            display: "Martin Thorborg",
            nameSort: "thorborg martin",
            roles: [
              {
                function: {
                  plural: "forfattere",
                  singular: "forfatter",
                },
                functionCode: "aut",
              },
              {
                function: {
                  plural: "(hovedansvarlige)",
                  singular: "(hovedansvarlig)",
                },
                functionCode: "led",
              },
            ],
          },
          {
            __typename: "Person",
            display: "Anders Gisselmann",
            nameSort: "gisselmann anders",
            roles: [
              {
                function: {
                  plural: "forfattere",
                  singular: "forfatter",
                },
                functionCode: "aut",
              },
            ],
          },
        ],
        materialTypes: [
          {
            specific: "bog",
          },
        ],
        cover: {
          thumbnail:
            "https://moreinfo.addi.dk/2.11/more_info_get.php?lokalid=135689122&attachment_type=forside_lille&bibliotek=870970&source_id=150020&key=12d8b127df5a2cdb850d",
        },
        recordCreationDate: "20230306",
      },
    },
  ],
};

const data = {
  DUMMY_TOKEN: {
    ...DEFAULT,
  },
  DUMMY_TOKEN_UNSUBSCRIPED_MUNICIPALITY: {
    ...DEFAULT,
  },
  DUMMY_TOKEN_NO_MAIL: {
    ...DEFAULT,
    mail: undefined,
  },
};
export function load({ accessToken }) {
  return data[accessToken];
}
