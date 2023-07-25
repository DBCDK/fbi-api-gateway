export async function load(pid) {
  return (
    {
      "870970-basis:26521556": {
        thumbnail: "link-to-thumbnail",
        detail_117: "link-to-detail_117",
        detail_207: "link-to-detail_207",
        detail_42: "link-to-detail_42",
        detail_500: "link-to-detail_500",
        detail: "link-to-detail",
      },
      "870970-basis:29433909": {
        thumbnail: "link-to-thumbnail",
        detail_117: "link-to-detail_117",
        detail_207: "link-to-detail_207",
        detail_42: "link-to-detail_42",
        detail_500: "link-to-detail_500",
        detail: "link-to-detail",
      },
      moreinfo_working_pid: {
        thumbnail: "link-to-thumbnail",
        detail_117: "link-to-detail_117",
        detail_207: "link-to-detail_207",
        detail_42: "link-to-detail_42",
        detail_500: "link-to-detail_500",
        detail: "link-to-detail",
        origin: "moreinfo",
      },
      moreinfo_bad_object_missing_important_fields: {
        miav: "vuf",
        thumbnail: "link-to-thumbnail",
      },
      moreinfo_empty_object: {},
      moreinfo_string_instead_of_object: "Miav vuf",
      moreinfo_null_instead_of_object: null,
      moreinfo_undefined_instead_of_object: undefined,
    }[pid] || {}
  );
}
