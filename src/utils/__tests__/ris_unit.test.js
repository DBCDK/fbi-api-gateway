import { formatResponseToRis } from "../../datasources/ris.datasource";

const formattedestring = `TY  - BOOK
AU  - Rowling, Joanne K.
A4  - Lützen, Hanna
TI  - Harry Potter og Dødsregalierne
CY  - Kbh.
PB  - Gyldendal
PY  - 2023
ET  - 25-års jubilæumsudgave (1. udgave)
SP  - 648 sider
SN  - 9788702390292
N1  - Film med titel: Harry Potter og dødsregalierne
N1  - Joanne K. Rowling bruger også pseudonymet: Robert Galbraith
N1  - På omslaget: Wizarding World
AB  - Harry Potter er sammen med sine gode venner Ron og Hermione taget ud på en farlig færd. De skal finde den onde troldmand Voldemorts Horcruxer og ødelægge dem. Deres søgen bringer dem mange steder hen og ofte er de i livsfare. Men Voldemort og hans kumpaner er også på jagt efter de forsvundne Horcruxer

T3  - Serien om Harry Potter, 7
LA  - dan
KW  - magi
KW  - troldmænd
KW  - fantasy
KW  - romaner
KW  - for 12 år
KW  - for 13 år
KW  - for 14 år
KW  - for 15 år
KW  - for 16 år
CN  - 83-296
CN  - sk
DP  - dbc
ER  -`;

const rispart = {
  ris: {
    TY: ["Bog"],
    AU: {
      value: ["Rowling, Joanne K."],
    },
    A4: {
      value: ["Lützen, Hanna"],
    },
    TI: {
      value: ["Harry Potter og Dødsregalierne"],
    },
    CY: {
      value: ["Kbh."],
    },
    PB: {
      value: ["Gyldendal"],
    },
    PY: {
      value: ["2023"],
    },
    ET: {
      value: ["25-års jubilæumsudgave (1. udgave)"],
    },
    SP: {
      value: ["648 sider"],
    },
    SN: {
      value: ["9788702390292"],
    },
    N1: {
      value: [
        "Film med titel: Harry Potter og dødsregalierne",
        "Joanne K. Rowling bruger også pseudonymet: Robert Galbraith",
        "På omslaget: Wizarding World",
      ],
    },
    AB: {
      value: [
        "Harry Potter er sammen med sine gode venner Ron og Hermione taget ud på en farlig færd. De skal finde den onde troldmand Voldemorts Horcruxer og ødelægge dem. Deres søgen bringer dem mange steder hen og ofte er de i livsfare. Men Voldemort og hans kumpaner er også på jagt efter de forsvundne Horcruxer\n",
      ],
    },
    T3: {
      value: ["Serien om Harry Potter, 7"],
    },
    LA: ["dan"],
    KW: {
      value: [
        "magi",
        "troldmænd",
        "fantasy",
        "romaner",
        "for 12 år",
        "for 13 år",
        "for 14 år",
        "for 15 år",
        "for 16 år",
      ],
    },
    CN: {
      value: ["83-296", "sk"],
    },
    DP: {
      value: "dbc",
    },
  },
};

test("formatObjectToRis", () => {
  const actual = formatResponseToRis(rispart);
  expect(actual).toEqual(formattedestring);
});
