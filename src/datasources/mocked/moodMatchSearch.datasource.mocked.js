// 20240411155803
// http://mood-match-search-1-0.mi-prod.svc.cloud.dbc.dk/search?q=uhyggelig&field=title&debug=true
export async function load({
  q,
  field,
  offset = 0,
  limit,
  agency,
  profile,
  debug = false,
}) {
  const mock = {
    responseHeader: {
      time: 14.062,
    },
    response: [
      {
        workid: "work-of:870970-basis:51863437",
        title: ["Uhyggelig sommer"],
        creator: ["Vibeke Marx"],
        abstract: [
          "Krimi. Tre noveller om tasketyveri, mord og overfald. Lasse har ingen penge, så han overfalder en gammel dame. Zander bliver mistænkt for et mord på en pige, han har mødt på stranden og Lones mormor er blevet overfaldet og ligger i koma.",
        ],
      },
      {
        workid: "work-of:870970-basis:05681332",
        title: ["Uhyggelig håndgribeligt Mad"],
        creator: ["Al Jaffee"],
        abstract: ["Sort/hvide tegneserieepisoder."],
      },
      {
        workid: "work-of:870970-basis:06753035",
        title: ["Ti uhyggelige fortællinger"],
        creator: ["Bent Waagepetersen"],
        abstract: [
          "Noveller om spøgelser og genfærd, overnaturlige begivenheder og handlinger, der udspringer af irrationelle lag i menneskesindet. Foregår dels i Danmark, dels i Italien.",
        ],
      },
      {
        workid: "work-of:870970-basis:47929814",
        title: ["Max Jordan - den uhyggelige dobbeltgænger"],
        creator: ["Maurice Tillieux"],
        abstract: [
          "Tegneserie. Lumske robotter og en mystisk LP-plade, der ikke er, hvad den giver sig ud for at være, er blot nogle af de sjove og spændende ting, privatedetektiven Max Jordan bliver udsat for i disse 7 historier.",
        ],
      },
      {
        workid: "work-of:870970-basis:21400009",
        title: ["Den grønne mil. 4. del : En uhyggelig død"],
        creator: ["Stephen King", "Ole Varde Lassen"],
        abstract: [
          "Fangevogteren Percy har i simpel ondskab trådt Eduard Delacroix' mus ihjel - og det er ham der skal forestå henrettelsen af Eduard.",
        ],
      },
    ],
  };
  return mock;
}

export { teamLabel };
