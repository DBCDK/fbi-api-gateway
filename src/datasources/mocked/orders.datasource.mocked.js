const data = {
  DUMMY_TOKEN: [
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

export async function load({ accessToken }) {
  return data[accessToken];
}
