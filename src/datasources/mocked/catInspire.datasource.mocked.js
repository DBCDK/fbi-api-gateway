export async function load() {
  const works = [
    "work-of:870970-basis:61629475",
    "work-of:870970-basis:62413344",
    "work-of:870970-basis:62304286",
    "work-of:870970-basis:46146816",
    "work-of:870970-basis:39544016",
  ];

  const mock = {
    fiction: [
      {
        title: "nyeste",
        works: [
          "work-of:870970-basis:04778502",
          "work-of:870970-basis:134131039",
        ],
      },
      {
        title: "populære",
        works: [
          "work-of:870970-basis:52557240",
          "work-of:870970-basis:06162533",
        ],
      },
    ],
    games: [
      {
        title: "nyeste",
        works: [
          "work-of:870970-basis:61629475",
          "work-of:870970-basis:62413344",
        ],
      },
      {
        title: "populære",
        works: [
          "work-of:870970-basis:45938247",
          "work-of:870970-basis:28505000",
        ],
      },
    ],
  };

  return mock;
}
