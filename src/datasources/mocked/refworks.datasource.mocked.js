export async function load({ pid }) {
  const data = {
    "870970-basis:55132194":
      "RT Book, Whole\nT1 Børnegrisene og det mega store monster\n",
    "870970-basis:26521556": "RT Book, Whole\nT1 Some other title\n",
  };

  return data[pid] || "";
}
