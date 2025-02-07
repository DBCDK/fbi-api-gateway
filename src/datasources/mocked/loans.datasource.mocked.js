const data = {
  DUMMY_TOKEN: [
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
};

export async function load({ accessToken }) {
  return data[accessToken];
}

export { teamLabel };
