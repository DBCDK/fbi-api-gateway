import { restructureCategories } from "../catInspire.datasource";

export async function load() {
  // response from catInspire service
  const repsonse = {
    categories: {
      fiction: {
        nyeste: [
          "work-of:870970-basis:04778502",
          "work-of:870970-basis:134131039",
        ],
        populære: [
          "work-of:870970-basis:52557240",
          "work-of:870970-basis:06162533",
        ],
      },
      games: {
        nyeste: [
          "work-of:870970-basis:61629475",
          "work-of:870970-basis:62413344",
        ],
        populære: [
          "work-of:870970-basis:45938247",
          "work-of:870970-basis:28505000",
        ],
      },
    },
  };

  return restructureCategories(repsonse.categories);
}
