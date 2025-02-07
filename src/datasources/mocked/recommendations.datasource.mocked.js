export function load({ pid, limit = 10 }) {
  // these examples are used in recommendations.test.js

  if (pid === "check_no_null") {
    return {
      responseHeader: testan.responseHeader,
      response: testan.response?.slice(0, limit),
    };
  } else if (pid === "check_with_nulls_should_be_removed") {
    return {
      responseHeader: testan.responseHeader,
      response: [
        {
          pid: "vroevl:46157753",
          faust: "vroevl",
          work: "vroevl:870970-basis:46157753",
          value: 6,
          "based-on": "vroevl",
          reader: ["_booklens_webtrekk"],
        },
        ...testan?.response?.slice(1, limit),
      ],
    };
  } else if (pid === "check_with_too_many_nulls") {
    return {
      responseHeader: testan.responseHeader,
      response: [
        new Array(limit - 2).fill({
          pid: "vroevl:46157753",
          faust: "vroevl",
          work: "vroevl:870970-basis:46157753",
          value: 6,
          "based-on": "vroevl",
          reader: ["_booklens_webtrekk"],
        }),
        ...testan?.response?.slice(0, 2),
      ],
    };
  }
}

const testan = {
  responseHeader: {
    build: "230",
    git: "d6397d03b1f4c730ad0247c75ecd418076e45f81",
    version: "1.1.0",
    "ab-id": 1,
    recommender: "booklens",
    timings: {
      faust_map: 0.023,
      "read-from-db": 16.115000000000002,
      "fetch-metadata": 122.46300000000001,
      "filter-candidates": 204.497,
      recommend: 347.922,
    },
    "active-connections": 0,
    time: 351.53000000000003,
  },
  response: [
    {
      pid: "870970-basis:46310039",
      faust: "46310039",
      work: "work-of:870970-basis:46310039",
      value: 7,
      "based-on": "work:1367595",
      reader: ["_booklens_webtrekk"],
    },
    {
      pid: "870970-basis:05245796",
      faust: "54430760",
      work: "work-of:870970-basis:05245796",
      value: 2,
      "based-on": "work:1367595",
      reader: ["_booklens_metacompass"],
    },
    {
      pid: "870970-basis:54958897",
      faust: "39450836",
      work: "work-of:870970-basis:54958897",
      value: 8,
      "based-on": "work:1367595",
      reader: ["_booklens_search_clicks"],
    },
    {
      pid: "870970-basis:46442938",
      faust: "46442938",
      work: "work-of:870970-basis:46442938",
      value: 7,
      "based-on": "work:1367595",
      reader: ["_booklens_search_clicks"],
    },
    {
      pid: "870970-basis:46157753",
      faust: "46157753",
      work: "work-of:870970-basis:46157753",
      value: 6,
      "based-on": "work:1367595",
      reader: ["_booklens_webtrekk"],
    },
    {
      pid: "870970-basis:46237773",
      faust: "46237773",
      work: "work-of:870970-basis:46237773",
      value: 6,
      "based-on": "work:1367595",
      reader: ["_booklens_webtrekk"],
    },
    {
      pid: "870970-basis:22950290",
      faust: "23970120",
      work: "work-of:870970-basis:22950290",
      value: 2,
      "based-on": "work:1367595",
      reader: ["_booklens_metacompass"],
    },
    {
      pid: "870970-basis:46313852",
      faust: "46313852",
      work: "work-of:870970-basis:46313852",
      value: 7,
      "based-on": "work:1367595",
      reader: ["_booklens_search_clicks"],
    },
    {
      pid: "870970-basis:46325338",
      faust: "46325338",
      work: "work-of:870970-basis:46325338",
      value: 6,
      "based-on": "work:1367595",
      reader: ["_booklens_webtrekk"],
    },
    {
      pid: "870970-basis:51081323",
      faust: "51081323",
      work: "work-of:870970-basis:51081323",
      value: 2,
      "based-on": "work:1367595",
      reader: ["_booklens_metacompass"],
    },
  ],
};

export { teamLabel };
