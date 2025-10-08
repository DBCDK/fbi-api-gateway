import { validateAgencyId } from "../validateAgencyId";

describe("Test validateAgencyId", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      profile: {},
      smaug: {
        agencyId: "default-agency",
        gateway: {
          agencies: {
            ids: ["agency1", "agency2"],
          },
        },
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    next = jest.fn();
  });

  test("should call next when selectedAgencyId is allowed", async () => {
    req.profile.agency = "agency1";

    await validateAgencyId(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  test("should call next when selectedAgencyId is the default agencyId", async () => {
    req.profile.agency = "default-agency";

    await validateAgencyId(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  test("should respond with 403 when selectedAgencyId is not in allowedAgencies", async () => {
    req.profile.agency = "unknown-agency";

    await validateAgencyId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith({
      statusCode: 403,
      message: "Invalid agencyId",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should respond with 403 when selectedAgencyId is undefined", async () => {
    req.profile.agency = undefined;

    await validateAgencyId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith({
      statusCode: 403,
      message: "Invalid agencyId",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should call next when gatewaySettings is undefined but defaultAgencyId matches", async () => {
    req.smaug.gateway = undefined;
    req.profile.agency = "default-agency";

    await validateAgencyId(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  test("should handle the case when gatewaySettings and defaultAgencyId are both undefined", async () => {
    req.smaug = undefined;
    req.profile.agency = "agency1";

    await validateAgencyId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith({
      statusCode: 403,
      message: "Invalid agencyId",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should respond with 403 when selectedAgencyId is not in lockedAgencyIds", async () => {
    process.env.LOCKED_AGENCY_ID_LIST = '["locked1","locked2"]';
    req.profile.agency = "agency1";

    await validateAgencyId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith({
      statusCode: 403,
      message: "Invalid agencyId",
    });
    expect(next).not.toHaveBeenCalled();

    delete process.env.LOCKED_AGENCY_ID_LIST;
  });

  test("should call next when selectedAgencyId is in lockedAgencyIds", async () => {
    process.env.LOCKED_AGENCY_ID_LIST = '["agency1","locked2"]';
    req.profile.agency = "agency1";

    await validateAgencyId(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();

    delete process.env.LOCKED_AGENCY_ID_LIST;
  });

  test("should ignore lockedAgencyIds when env is missing", async () => {
    delete process.env.LOCKED_AGENCY_ID_LIST;
    req.profile.agency = "agency1";

    await validateAgencyId(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });
});
