export async function load(pid) {
  return (
    {
      "870970-basis:29433909": {
        thumbnail: "link-to-thumbnail",
        detail_117: "link-to-detail_117",
        detail_207: "link-to-detail_207",
        detail_42: "link-to-detail_42",
        detail_500: "link-to-detail_500",
        detail: "link-to-detail",
      },
    }[pid] || {}
  );
}
