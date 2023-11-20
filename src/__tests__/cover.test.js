import { performTestQuery } from "../utils/utils";
import { createMockedDataLoaders } from "../datasourceLoader";

async function queryBuilder(pid) {
  return await performTestQuery({
    query: `query ($pid: String!) {
      manifestation(pid: $pid) {
        pid
        cover {
          origin
          thumbnail
          detail
        }
      }
    }`,
    variables: {
      pid: pid,
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: {
        user: {
          uniqueId: "1234561234",
        },
        defaultForsider: {
          colors: [
            {
              background: "#E9B9AA",
            },
            {
              background: "#D98481",
            },
            {
              text: "#FFFFFF",
              background: "#7892B5",
            },
            {
              background: "#8CB9C0",
            },
            {
              background: "#91B5A9",
            },
            {
              background: "#EDCA7F",
            },
          ],
        },
      },
    },
  });
}

test("Good response from defaultForsider-service", async () => {
  const pid = "default_forsider_working_pid";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: "default",
      thumbnail: "link-to-thumbnail",
      detail: "link-to-detail",
    },
  };
  expect(result.data.manifestation).toEqual(expected);
});

test("Bad fields in non-empty object response from defaultForsider-service", async () => {
  const logSpy = jest.spyOn(console, "log");
  const pid = "default_forsider_bad_object_missing_important_fields";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: null,
      thumbnail: null,
      detail: null,
    },
  };
  expect(logSpy).toHaveBeenCalledWith(
    expect.stringContaining(
      `"Response from defaultForsider was a non-empty object, but somehow missing fields 'detail' and/or 'thumbnail'. The actual response was","unexpectedResponse":{"miav":"vuf","thumbnail":"link-to-thumbnail"},"unexpectedResponseType":"object"`
    )
  );
  expect(result.data.manifestation).toMatchObject(expected);
});

test("Empty object response from defaultForsider-service", async () => {
  const pid = "default_forsider_empty_object";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: null,
      thumbnail: null,
      detail: null,
    },
  };
  expect(result.data.manifestation).toMatchObject(expected);
});

test("String instead of object response from defaultForsider-service", async () => {
  const logSpy = jest.spyOn(console, "log");
  const pid = "default_forsider_string_instead_of_object";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: null,
      thumbnail: null,
      detail: null,
    },
  };

  expect(logSpy).toHaveBeenCalledWith(
    expect.stringContaining(
      `"Response from defaultForsider was not of type 'object'. The actual type of response was: 'string'. The actual response was","unexpectedResponse":"Miav vuf","unexpectedResponseType":"string"`
    )
  );
  expect(result.data.manifestation).toMatchObject(expected);
});

test("Check response with null response from defaultForsider-service", async () => {
  const pid = "default_forsider_null_instead_of_object";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: null,
      thumbnail: null,
      detail: null,
    },
  };
  expect(result.data.manifestation).toMatchObject(expected);
});

test("Check response with undefined response from defaultForsider-service", async () => {
  const pid = "default_forsider_undefined_instead_of_object";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: null,
      thumbnail: null,
      detail: null,
    },
  };
  expect(result.data.manifestation).toMatchObject(expected);
});

test("Good response from Moreinfo-service", async () => {
  const pid = "moreinfo_working_pid";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: "moreinfo",
      thumbnail: "link-to-thumbnail",
      detail: "link-to-detail",
    },
  };
  expect(result.data.manifestation).toEqual(expected);
});

test("Bad fields in non-empty object response from Moreinfo-service", async () => {
  const pid = "moreinfo_bad_object_missing_important_fields";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: null,
      thumbnail: null,
      detail: null,
    },
  };
  expect(result.data.manifestation).toMatchObject(expected);
});

test.skip("Empty object response from Moreinfo-service", async () => {
  const logSpy = jest.spyOn(console, "log");
  const pid = "moreinfo_empty_object";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: null,
      thumbnail: null,
      detail: null,
    },
  };

  expect(logSpy).toHaveBeenCalledWith(
    expect.stringContaining(
      `"Response from moreinfo was a non-empty object, but somehow missing fields 'detail' and/or 'thumbnail'. The actual response was","unexpectedResponse":{"miav":"vuf","thumbnail":"link-to-thumbnail"},"unexpectedResponseType":"object"`
    )
  );
  expect(result.data.manifestation).toMatchObject(expected);
});

test("String instead of object response from Moreinfo-service", async () => {
  const logSpy = jest.spyOn(console, "log");
  const pid = "moreinfo_string_instead_of_object";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: null,
      thumbnail: null,
      detail: null,
    },
  };

  expect(logSpy).toHaveBeenCalledWith(
    expect.stringContaining(
      `"Response from moreinfo was not of type 'object'. The actual type of response was: 'string'. The actual response was","unexpectedResponse":"Miav vuf","unexpectedResponseType":"string"`
    )
  );
  expect(result.data.manifestation).toMatchObject(expected);
});

test("Check response with null response from Moreinfo-service", async () => {
  const pid = "moreinfo_null_instead_of_object";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: null,
      thumbnail: null,
      detail: null,
    },
  };
  expect(result.data.manifestation).toMatchObject(expected);
});

test("Check response with undefined response from Moreinfo-service", async () => {
  const pid = "moreinfo_undefined_instead_of_object";
  const result = await queryBuilder(pid);

  const expected = {
    pid: pid,
    cover: {
      origin: null,
      thumbnail: null,
      detail: null,
    },
  };
  expect(result.data.manifestation).toMatchObject(expected);
});
