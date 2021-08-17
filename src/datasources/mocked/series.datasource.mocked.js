export async function load({ workId }) {
  const mock = {
    "work-of:870970-basis:38500775": {
      body: {
        seriesMembers: [
          "work-of:870970-basis:52557240",
          "work-of:870970-basis:53247768",
          "work-of:870970-basis:53557791",
          "work-of:870970-basis:54088558",
          "work-of:870970-basis:45942570",
          "work-of:870970-basis:46656172",
          "work-of:870970-basis:38500775",
        ],
        trackingId: "1db2364b-62dc-4ba2-a158-772ea9e21c47",
      },
    },
    "work-of:870970-basis:22629344": {
      body: {
        seriesMembers: [
          "work-of:870970-basis:22629344",
          "work-of:870970-basis:22677780",
          "work-of:870970-basis:22995154",
          "work-of:870970-basis:23540703",
          "work-of:870970-basis:25245784",
          "work-of:870970-basis:25807995",
          "work-of:870970-basis:27267912",
          "work-of:870970-basis:52646251",
        ],
        trackingId: "c86f4bb1-b075-4740-977c-eca39fdde1c7",
      },
    },
    "work-of:870970-basis:51701763": {
      body: null,
    },
  };

  return mock[workId].body;
}
