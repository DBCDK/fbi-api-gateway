import config from "../config";
import { load as getBookmarks } from "../datasources/userDataService/userDataV2GetBookmarks.datasource";
import { load as addBookmarks } from "../datasources/userDataService/userDataV2AddBookmarks.datasource";
import { load as deleteBookmarks } from "../datasources/userDataService/userDataV2DeleteBookmarks.datasource";

const accessToken = "forwarded-access-token";

function createContext(body) {
  return {
    fetch: jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body,
    }),
  };
}

describe("UserData Bookmark V2 datasources", () => {
  test.each(["710100", null, undefined])(
    "preserves agency %s in requests and responses",
    async (agencyId) => {
      const bookmark = {
        materialId: "pid:1",
        ...(agencyId !== undefined && { agencyId }),
      };
      const addResponse = {
        results: [{ ...bookmark, status: "already_exists" }],
      };
      const addContext = createContext(addResponse);
      await expect(
        addBookmarks({ accessToken, bookmarks: [bookmark] }, addContext)
      ).resolves.toEqual(addResponse);
      expect(JSON.parse(addContext.fetch.mock.calls[0][1].body)).toEqual({
        bookmarks: [bookmark],
      });

      const getResponse = { hitcount: 1, items: [bookmark] };
      await expect(
        getBookmarks({ accessToken }, createContext(getResponse))
      ).resolves.toEqual(getResponse);
    }
  );

  test("GET forwards the bearer token and functional read options", async () => {
    const context = createContext({ hitcount: 0, items: [] });

    await expect(
      getBookmarks(
        {
          accessToken,
          filterApplications: ["BIBLIOTEKDK", "STUDIESOEG"],
          orderBy: "CREATEDAT_DESC",
          offset: 0,
          limit: 10,
        },
        context
      )
    ).resolves.toEqual({ hitcount: 0, items: [] });

    expect(context.fetch).toHaveBeenCalledWith(
      `${config.datasources.userdata.url}v2/bookmark/get?filterApplications=BIBLIOTEKDK&filterApplications=STUDIESOEG&orderBy=CREATEDAT_DESC&offset=0&limit=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        method: "GET",
      }
    );
  });

  test("ADD sends only bookmarks and their snapshots", async () => {
    const context = createContext({ results: [] });
    const bookmarks = [
      {
        workId: "work-of:pid:1",
        materialId: "pid:1",
        snapshot: {
          workId: "work-of:pid:1",
          title: "Title",
          creator: null,
          materialType: "BOOK",
          workType: "LITERATURE",
        },
      },
    ];

    await addBookmarks({ accessToken, bookmarks }, context);

    expect(context.fetch).toHaveBeenCalledWith(
      `${config.datasources.userdata.url}v2/bookmark/add`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ bookmarks }),
      }
    );
  });

  test("GET forwards the work filter", async () => {
    const context = createContext({ hitcount: 0, items: [] });

    await getBookmarks(
      {
        accessToken,
        filterWorkId: "work-of:pid:1",
        offset: 0,
        limit: 10,
      },
      context
    );

    expect(context.fetch).toHaveBeenCalledWith(
      `${config.datasources.userdata.url}v2/bookmark/get?filterWorkId=work-of%3Apid%3A1&offset=0&limit=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        method: "GET",
      }
    );
  });

  test("DELETE sends public UUIDs without legacy context fields", async () => {
    const context = createContext({ results: [] });
    const bookmarkIds = ["45fb4d52-d7f7-4c36-a94f-37a00eb60163"];

    await deleteBookmarks({ accessToken, bookmarkIds }, context);

    expect(context.fetch).toHaveBeenCalledWith(
      `${config.datasources.userdata.url}v2/bookmark/delete`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        method: "DELETE",
        body: JSON.stringify({ bookmarkIds }),
      }
    );
  });

  test("rejects non-success responses with the stable service error code", async () => {
    const context = {
      fetch: jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        body: {
          error: {
            code: "INVALID_ACCESS_TOKEN",
            message: "Access token is invalid",
          },
        },
      }),
    };

    const request = getBookmarks(
      {
        accessToken,
        orderBy: "CREATEDAT_DESC",
        offset: 0,
        limit: 10,
      },
      context
    );

    await expect(request).rejects.toMatchObject({
      status: 401,
      serviceErrorCode: "INVALID_ACCESS_TOKEN",
    });
    await expect(request).rejects.not.toThrow(accessToken);
  });
});
