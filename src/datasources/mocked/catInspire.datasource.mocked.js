import { restructureCategories } from "../catInspire.datasource";

export async function load() {
  // response from catInspire service
  const repsonse = {
    categories: {
      fiction: {
        nyeste: [
          {
            work: "work-of:870970-basis:04778502",
            pid: "870970-basis:04778502",
          },
          {
            work: "work-of:870970-basis:134131039",
            pid: "870970-basis:134131039",
          },
        ],
        populære: [
          {
            work: "work-of:870970-basis:52557240",
            pid: "870970-basis:52557240",
          },
          {
            work: "work-of:870970-basis:06162533",
            pid: "870970-basis:06162533",
          },
        ],
      },
      games: {
        nyeste: [
          {
            work: "work-of:870970-basis:61629475",
            pid: "870970-basis:61629475",
          },
          {
            work: "work-of:870970-basis:62413344",
            pid: "870970-basis:62413344",
          },
        ],
        populære: [
          {
            work: "work-of:870970-basis:45938247",
            pid: "870970-basis:45938247",
          },
          {
            work: "work-of:870970-basis:28505000",
            pid: "870970-basis:28505000",
          },
        ],
      },
    },
  };

  return restructureCategories(repsonse.categories);
}

export { teamLabel };
