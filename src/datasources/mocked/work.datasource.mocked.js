export default {
  get: ({ workId }) => {
    const data = {
      "work-of:870970-basis:26521556": {
        trackingId: "032113e2-a929-46f9-8a28-8217611d75e9",
        work: {
          creators: ["karl ove knausgård"],
          description: "Selvbiografisk roman",
          fullTitle: "Min kamp : roman. 1. bog",
          records: [
            {
              creators: [],
              fullTitle: "Min kamp : roman. 1. bog",
              id: "800010-katalog:99121962154805763__1",
              subjects: ["2000-2009"],
              title: "min kamp",
              types: ["Bog"]
            },
            {
              creators: ["karl ove knausgård"],
              description:
                "I sin kontroversielle selvbiografiske skildring beretter Knausgård om sit dilemma mellem at være uforstyrret, ambitiøs forfatter og samtidig være familiefar med kone og tre børn",
              fullTitle: "Min kamp : roman. 2. bog",
              id: "300101-katalog:28486006",
              subjects: ["alkoholmisbrug"],
              title: "min kamp",
              types: ["Ebog", "Bog"]
            },
            {
              creators: ["karl ove knausgård"],
              description:
                "Selvbiografisk roman med nærgående beskrivelse af at vokse op og blive til i en sammensat verden med udgangspunkt i faderens død og hovedpersonens selvrealisering som forfatter",
              fullTitle: "Min kamp : roman. 1. bog",
              id: "870970-basis:29433909",
              subjects: ["biografiske romaner"],
              title: "min kamp",
              types: ["Bog"]
            }
          ],
          subjects: ["livsfilosofi", "barndom"],
          title: "min kamp",
          workId: "work-of:870970-basis:28329490"
        }
      }
    };
    return data[workId];
  }
};
