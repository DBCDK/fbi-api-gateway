import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

describe("Session", () => {
  test("retrieve - no session", async () => {
    const result = await performTestQuery({
      query: `
          query{
            session {
              userParameters {
                userTelephone
              }
              storeSession
              pickupBranch
            }
          }
        `,
      variables: {},
      context: {
        datasources: createMockedDataLoaders(),
        accessToken: "dummy-access-token-no-session-stored",
      },
    });
    expect(result).toMatchSnapshot();
  });
  test("retrieve", async () => {
    const result = await performTestQuery({
      query: `
          query{
            session {
              userParameters {
                cpr
                userId
                barcode
                cardno
                customId
                userDateOfBirth
                userName
                userAddress
                userMail
                userTelephone
              }
              storeSession
              pickupBranch
            }
          }
        `,
      variables: {},
      context: {
        datasources: createMockedDataLoaders(),
        accessToken: "dummy-access-token",
      },
    });
    expect(result).toMatchSnapshot();
  });
  test("submit", async () => {
    const result = await performTestQuery({
      query: `
        mutation($input: SessionInput!) {
          submitSession(input: $input)
        }
        `,
      variables: {
        input: {
          userParameters: {
            cpr: "some-cpr",
            userId: "some-userid",
            barcode: "some-barcode",
            cardno: "some-cardno",
            customId: "some-customid",
            userDateOfBirth: "10-10-2021",
            userName: "Ost Ostesen",
            userAddress: "some-address",
            userMail: "some@mail.dk",
            userTelephone: "123123123",
          },
          storeSession: true,
          pickupBranch: "790900",
        },
      },
      context: {
        datasources: createMockedDataLoaders(),
        accessToken: "dummy-access-token",
      },
    });
    expect(result).toMatchSnapshot();
  });
});
