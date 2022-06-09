import { parseResponse } from "../localizations.datasource";

export async function load({ pids }) {
  // response is a string
  //const response = `{"localisationsResponse":{"localisations":[{"pid":[{"$":"870970-basis:01362984"},{"$":"870970-basis:01362976"},{"$":"870970-basis:01568574"},{"$":"870970-basis:04118073"},{"$":"870970-basis:22137298"},{"$":"800010-katalog:99122167276005763"}],"agency":[{"localisationPid":{"$":"800010-katalog:99121992748605763"},"agencyId":{"$":"800022"},"localIdentifier":{"$":"99121992748605763"}},{"localisationPid":{"$":"800010-katalog:99122679672605763"},"agencyId":{"$":"800022"},"localIdentifier":{"$":"99122679672605763"}},{"localisationPid":{"$":"800010-katalog:99121992686705763"},"agencyId":{"$":"800022"},"localIdentifier":{"$":"99121992686705763"}},{"localisationPid":{"$":"800010-katalog:99122473022805763"},"agencyId":{"$":"800022"},"localIdentifier":{"$":"99122473022805763"}},{"localisationPid":{"$":"800010-katalog:99122797570705763"},"agencyId":{"$":"800022"},"localIdentifier":{"$":"99122797570705763"}},{"localisationPid":{"$":"800010-katalog:99121916951405763"},"agencyId":{"$":"800028"},"localIdentifier":{"$":"99121916951405763"}},{"localisationPid":{"$":"800010-katalog:99122658105305763"},"agencyId":{"$":"800028"},"localIdentifier":{"$":"99122658105305763"}},{"localisationPid":{"$":"800010-katalog:99122679672605763"},"agencyId":{"$":"800028"},"localIdentifier":{"$":"99122679672605763"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"710100"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:01568574"},"agencyId":{"$":"715700"},"localIdentifier":{"$":"01568574"}},{"localisationPid":{"$":"870970-basis:01362976"},"agencyId":{"$":"715700"},"localIdentifier":{"$":"01362976"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"831020"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"911130"},"codes":{"$":"a"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"765700"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"765700"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"761500"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"873630"},"codes":{"$":"g"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"873630"},"codes":{"$":"g"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"784900"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"774100"},"codes":{"$":"a"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"510167"},"codes":{"$":"g"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"779100"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"779100"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"800010-katalog:99122679672605763"},"agencyId":{"$":"800015"},"codes":{"$":"d"},"localIdentifier":{"$":"99122679672605763"}},{"localisationPid":{"$":"800010-katalog:99122990358105763"},"agencyId":{"$":"800015"},"codes":{"$":"d"},"localIdentifier":{"$":"99122990358105763"}},{"localisationPid":{"$":"800010-katalog:99122758687705763"},"agencyId":{"$":"800015"},"codes":{"$":"a"},"localIdentifier":{"$":"99122758687705763"}},{"localisationPid":{"$":"800010-katalog:99122167276005763"},"agencyId":{"$":"800015"},"codes":{"$":"d"},"localIdentifier":{"$":"99122167276005763"}},{"localisationPid":{"$":"800010-katalog:99122884103505763"},"agencyId":{"$":"800015"},"codes":{"$":"d"},"localIdentifier":{"$":"99122884103505763"}},{"localisationPid":{"$":"800010-katalog:99122990329905763"},"agencyId":{"$":"800015"},"codes":{"$":"d"},"localIdentifier":{"$":"99122990329905763"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"744000"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:04118073"},"agencyId":{"$":"744000"},"localIdentifier":{"$":"04118073"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"777900"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"727000"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"763000"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"763000"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"718700"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:01362984"},"agencyId":{"$":"785100"},"localIdentifier":{"$":"01362984"}},{"localisationPid":{"$":"870970-basis:01362976"},"agencyId":{"$":"774600"},"localIdentifier":{"$":"01362976"}},{"localisationPid":{"$":"870970-basis:01362976"},"agencyId":{"$":"872280"},"codes":{"$":"g"},"localIdentifier":{"$":"01362976"}},{"localisationPid":{"$":"870970-basis:01362976"},"agencyId":{"$":"770600"},"localIdentifier":{"$":"01362976"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"770600"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:01362976"},"agencyId":{"$":"300265"},"codes":{"$":"g"},"localIdentifier":{"$":"01362976"}},{"localisationPid":{"$":"870970-basis:01362976"},"agencyId":{"$":"872300"},"codes":{"$":"g"},"localIdentifier":{"$":"01362976"}},{"localisationPid":{"$":"870970-basis:01362976"},"agencyId":{"$":"547310"},"localIdentifier":{"$":"01362976"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"874410"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:01362976"},"agencyId":{"$":"874410"},"localIdentifier":{"$":"01362976"}},{"localisationPid":{"$":"870970-basis:01362976"},"agencyId":{"$":"726000"},"localIdentifier":{"$":"01362976"}},{"localisationPid":{"$":"870970-basis:01362976"},"agencyId":{"$":"300746"},"codes":{"$":"g"},"localIdentifier":{"$":"01362976"}},{"localisationPid":{"$":"870970-basis:01568574"},"agencyId":{"$":"876040"},"localIdentifier":{"$":"01568574"}},{"localisationPid":{"$":"870970-basis:01568574"},"agencyId":{"$":"871890"},"localIdentifier":{"$":"01568574"}},{"localisationPid":{"$":"870970-basis:01568574"},"agencyId":{"$":"874510"},"localIdentifier":{"$":"01568574"}},{"localisationPid":{"$":"870970-basis:04118073"},"agencyId":{"$":"745000"},"localIdentifier":{"$":"04118073"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"737600"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:04118073"},"agencyId":{"$":"737600"},"codes":{"$":"g"},"localIdentifier":{"$":"04118073"}},{"localisationPid":{"$":"870970-basis:04118073"},"agencyId":{"$":"875140"},"codes":{"$":"g"},"localIdentifier":{"$":"04118073"}},{"localisationPid":{"$":"870970-basis:04118073"},"agencyId":{"$":"775600"},"localIdentifier":{"$":"04118073"}},{"localisationPid":{"$":"870970-basis:04118073"},"agencyId":{"$":"872510"},"codes":{"$":"a"},"localIdentifier":{"$":"04118073"}},{"localisationPid":{"$":"870970-basis:04118073"},"agencyId":{"$":"731600"},"localIdentifier":{"$":"04118073"}},{"localisationPid":{"$":"870970-basis:04118073"},"agencyId":{"$":"773000"},"localIdentifier":{"$":"04118073"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"773000"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:04118073"},"agencyId":{"$":"753000"},"localIdentifier":{"$":"04118073"}},{"localisationPid":{"$":"874190-katalog:115441094"},"agencyId":{"$":"874190"},"localIdentifier":{"$":"115441094"}},{"localisationPid":{"$":"870970-basis:04118073"},"agencyId":{"$":"300316"},"localIdentifier":{"$":"04118073"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"717300"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"717500"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"715500"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"723000"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"748200"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"746100"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"776000"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"300621"},"codes":{"$":"g"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"537360"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"730600"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"734000"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"719000"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"770700"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"739000"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"726500"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"762100"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"872590"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"861720"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"733600"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"733000"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"777300"},"localIdentifier":{"$":"22137298"}},{"localisationPid":{"$":"870970-basis:22137298"},"agencyId":{"$":"737000"},"localIdentifier":{"$":"22137298"}}]}]},"@namespaces":{"ohs":"http:\\/\\/oss.dbc.dk\\/ns\\/openholdingstatus"}}`;
  // quick fix - @TODO fix in a proper way
  const response = {
    localisationsResponse: {
      localisations: [
        {
          pid: [{ $: "870970-basis:29433909" }],
          agency: [
            {
              localisationPid: { $: "800010-katalog:99122450879205763__1" },
              agencyId: { $: "800022" },
              localIdentifier: { $: "99122450879205763__1" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "710100" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "715700" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "852470-katalog:93142861" },
              agencyId: { $: "852470" },
              codes: { $: "a" },
              callNumber: { $: "V1 ph" },
              localIdentifier: { $: "93142861" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "911130" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "741000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "766100" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "874330" },
              codes: { $: "g" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "739000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "751000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "774600" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "754000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "300265" },
              codes: { $: "g" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "775100" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "779100" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "715900" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "876040" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "784000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "725000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "784600" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "911116" },
              codes: { $: "g" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "721000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "575112" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "700400" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "734000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "773000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "715500" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "800010-katalog:99122450879205763__1" },
              agencyId: { $: "809010" },
              localIdentifier: { $: "99122450879205763__1" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "715100" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "781300" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "760700" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "716900" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "785100" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "745000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "874510" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "724000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "776600" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "716700" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "774100" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "716500" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "716300" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "733000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "300561" },
              codes: { $: "g" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "727000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "730600" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "732900" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "725300" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "723000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "800010-katalog:99122160750405763__1" },
              agencyId: { $: "800015" },
              codes: { $: "d" },
              localIdentifier: { $: "99122160750405763__1" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "763000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "721700" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "872320-katalog:124246342" },
              agencyId: { $: "872320" },
              codes: { $: "g" },
              localIdentifier: { $: "124246342" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "719000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "732000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "717300" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "775600" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "781000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "714700" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "762100" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "872310" },
              codes: { $: "g" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "726000" },
              localIdentifier: { $: "29433909" },
            },
            {
              localisationPid: { $: "870970-basis:29433909" },
              agencyId: { $: "720100" },
              localIdentifier: { $: "29433909" },
            },
          ],
        },
      ],
    },
    "@namespaces": { ohs: "http://oss.dbc.dk/ns/openholdingstatus" },
  };
  return parseResponse(JSON.stringify(response));
}
