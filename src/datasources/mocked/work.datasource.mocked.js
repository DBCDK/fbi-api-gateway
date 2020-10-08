export default {
  load: workId => {
    const data = {
      "work-of:870970-basis:26521556": {
        trackingId: "032113e2-a929-46f9-8a28-8217611d75e9",
        work: {
          creators: [{ type: "aut", value: "karl ove knausgård" }],
          description: "Selvbiografisk roman",
          fullTitle: "Min kamp : roman. 1. bog",
          records: [
            {
              id: "800010-katalog:99121962154805763__1",
              types: ["Bog"]
            },
            {
              id: "300101-katalog:28486006",
              types: ["Ebog", "Bog"]
            },
            {
              id: "870970-basis:29433909",

              types: ["Bog"]
            }
          ],
          subjects: [
            { type: "dcterms:LCSH", value: "krimi" },
            { type: "genre", value: "krimi" },
            { value: "småbørnsbog" }
          ],
          title: "min kamp",
          workId: "work-of:870970-basis:28329490"
        }
      }
    };
    return data[workId];
  }
};
