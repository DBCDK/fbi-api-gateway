import whatsNewNews from "./whatsNewNews";
import {
  getVisibleWhatsNew,
  getWhatsNewStorageKey,
  markWhatsNewSeen,
  restoreWhatsNew,
} from "./utils";

const NOW = Date.parse("2026-07-30T12:00:00Z");

describe("what's new visibility", () => {
  beforeEach(() => {
    localStorage.clear();
    delete process.env.NEXT_PUBLIC_WHATS_NEW_ENABLED;
    delete process.env.NEXT_PUBLIC_WHATS_NEW_PUBLISHED_AT;
    delete process.env.NEXT_PUBLIC_WHATS_NEW_EXPIRES_AFTER_DAYS;
  });

  test("tracks each viewed news item independently", () => {
    const news = [
      {
        id: "first",
        publishedAt: "2026-07-01",
        expiresAfterDays: 60,
        title: "First",
        body: "First body",
      },
      {
        id: "second",
        publishedAt: "2026-07-01",
        expiresAfterDays: 60,
        title: "Second",
        body: "Second body",
      },
    ];

    markWhatsNewSeen(news[0], { now: NOW, storage: localStorage });

    expect(
      getVisibleWhatsNew(news, { now: NOW, storage: localStorage }).map(
        (item) => item.id
      )
    ).toEqual(["second"]);
  });

  test("marks every news item in a dismissed carousel as seen", () => {
    const news = [
      {
        id: "first",
        publishedAt: "2026-07-01",
        expiresAfterDays: 60,
        title: "First",
        body: "First body",
      },
      {
        id: "second",
        publishedAt: "2026-07-01",
        expiresAfterDays: 60,
        title: "Second",
        body: "Second body",
      },
    ];

    expect(
      getVisibleWhatsNew(news, { now: NOW, storage: localStorage })
    ).toHaveLength(2);

    markWhatsNewSeen(news, { now: NOW, storage: localStorage });

    expect(
      getVisibleWhatsNew(news, { now: NOW, storage: localStorage })
    ).toEqual([]);
  });

  test("shows a recurring reminder again after its interval", () => {
    const reminder = {
      id: "reminder",
      publishedAt: "2026-07-01",
      expiresAfterDays: null,
      repeatAfterDays: 30,
      title: "Reminder",
      body: "Reminder body",
    };

    markWhatsNewSeen(reminder, { now: NOW, storage: localStorage });

    expect(
      getVisibleWhatsNew([reminder], {
        now: NOW + 29 * 24 * 60 * 60 * 1000,
        storage: localStorage,
      })
    ).toEqual([]);
    expect(
      getVisibleWhatsNew([reminder], {
        now: NOW + 30 * 24 * 60 * 60 * 1000,
        storage: localStorage,
      }).map((item) => item.id)
    ).toEqual(["reminder"]);
  });

  test("ignores the previous carousel dismissal", () => {
    localStorage.setItem(
      "fbi:news:client-based-access-v1:dismissed",
      "true"
    );

    expect(
      getVisibleWhatsNew(whatsNewNews, {
        now: NOW,
        storage: localStorage,
      }).map((item) => item.id)
    ).toEqual(whatsNewNews.map((item) => item.id));
  });

  test("restores all individually viewed active news", () => {
    for (const item of whatsNewNews) {
      markWhatsNewSeen(item, { now: NOW, storage: localStorage });
    }

    expect(
      localStorage.getItem(getWhatsNewStorageKey("draft-fields-v1"))
    ).not.toBeNull();

    restoreWhatsNew(whatsNewNews, { storage: localStorage });

    expect(
      getVisibleWhatsNew(whatsNewNews, {
        now: NOW,
        storage: localStorage,
      }).map((item) => item.id)
    ).toEqual(whatsNewNews.map((item) => item.id));
  });
});
