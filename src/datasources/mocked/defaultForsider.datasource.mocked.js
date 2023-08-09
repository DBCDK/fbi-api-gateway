export async function load({ pid, title, materialType, colors }) {
  return (
    {
      default_forsider_working_pid__title: {
        origin: "default",
        thumbnail: "link-to-thumbnail",
        detail: "link-to-detail",
      },
      default_forsider_bad_object_missing_important_fields__title: {
        miav: "vuf",
        thumbnail: "link-to-thumbnail",
      },
      default_forsider_empty_object__title: {},
      default_forsider_string_instead_of_object__title: "Miav vuf",
      default_forsider_null_instead_of_object__title: null,
      default_forsider_undefined_instead_of_object__title: undefined,
    }[title] || {}
  );
}
