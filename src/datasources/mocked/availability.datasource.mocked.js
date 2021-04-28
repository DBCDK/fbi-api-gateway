export function load({ pid, accessToken }) {
  const data = {
    qwerty: {
      "800010-katalog:99121962154805763__1": {
        willLend: true,
        expectedDelivery: "2021-05-15T00:00:00+02:00",
        orderPossible: false,
        orderPossibleReason: "owned_accepted",
      },
      "300101-katalog:28486006": {
        willLend: false,
        expectedDelivery: "2021-04-14T00:00:00+02:00",
        orderPossible: false,
        orderPossibleReason: "owned_accepted",
      },
      "870970-basis:29433909": {
        willLend: true,
        expectedDelivery: "2021-03-13T00:00:00+02:00",
        orderPossible: true,
        orderPossibleReason: "owned_accepted",
      },
    },
  };

  return data[accessToken][pid];
}
