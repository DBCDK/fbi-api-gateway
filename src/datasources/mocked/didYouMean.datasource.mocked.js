export async function load({ limit = 5 }) {
  // response from did you mean service

  const data = {
    responseHeader: {
      build: "26",
      git: "60870847499d1d9fe5136d743ff5d243b76e7717",
      version: "0.1.0",
      "ab-id": 1,
      q: "anders mathesen",
      limit: 5,
      similarity_boost: 1,
      holdings_boost: 1,
      click_boost: 1,
      "score-func": "similarity * 1.0 + holdings * 1.0 + clicks * 1.0",
      min_sim: 0.5,
      hits: 5,
      time: 118.118,
    },
    response: [
      {
        match: "anders matthesen",
        query: "Anders Matthesen",
        score: 1.0312077993008424,
      },
      {
        match: "anders mathiesen",
        query: "Anders Mathiesen",
        score: 0.9398803754066467,
      },
      {
        match: "anders mathiasen",
        query: "Anders Mathiasen",
        score: 0.9387356948225403,
      },
      {
        match: "anders matthensen",
        query: "Anders Matthensen",
        score: 0.9317854186357116,
      },
      {
        match: "anders hedman",
        query: "Anders Hedman",
        score: 0.9013658265267944,
      },
    ],
  };

  return data.response.slice(0, limit);
}

export { teamLabel };
