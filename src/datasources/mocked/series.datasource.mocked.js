export async function load({ workId }) {
  const mock = {
    "work-of:870970-basis:52557240": {
      body: {
        seriesMembers: [
          "work-of:870970-basis:52557240",
          "work-of:870970-basis:53247768",
          "work-of:870970-basis:53557791",
        ],
        trackingId: "1db2364b-62dc-4ba2-a158-772ea9e21c47",
      },
    },
    "work-of:870970-basis:28329490": {
      body: null,
    },
  };

  return mock[workId].body;
}
