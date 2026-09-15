import { fetchUserInfo } from "../fetchUserInfo";

describe("fetchUserInfo", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      smaug: {
        user: {
          id: "some-id",
          agency: "710100",
        },
      },
      accessToken: "AUTHENTICATED_TOKEN",
      datasources: {
        getLoader: jest.fn(),
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  test("returns 401 when userinfo responds with statusCode 401", async () => {
    req.datasources.getLoader.mockReturnValue({
      load: jest.fn().mockResolvedValue({ statusCode: 401 }),
    });

    await fetchUserInfo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      statusCode: 401,
      message: "Invalid access token",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
