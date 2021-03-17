import { createIndexer } from "../searcher";

// Indexer options
const options = {
  fields: ["body"], // fields to index for full-text search
  storeFields: ["body"] // fields to return with search results
};

const docs = [
  {
    id: 0,
    body:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nec convallis turpis. Praesent porttitor fringilla purus, eu auctor urna blandit at. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam volutpat lacus orci, eget iaculis est dapibus in. Nulla id congue nisl. Sed mollis mi vel nulla bibendum, eget rhoncus urna ornare. Quisque fermentum ultrices sagittis. Phasellus cursus venenatis metus ut iaculis. Proin ut aliquet sapien, non accumsan arcu. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Phasellus tristique mattis cursus. Nunc sed odio lorem. Curabitur facilisis massa a ex commodo, vitae ullamcorper lectus efficitur. Nam nec tellus nec nulla blandit consectetur condimentum id nisl. Morbi ante libero, accumsan nec auctor a, suscipit sed massa."
  }
];

describe("Test searcher", () => {
  test("search: dots in end", () => {
    const index = createIndexer({ options });
    const res = index.search("sit", docs);
    expect(res).toMatchSnapshot();
  });
  test("search: dots in beginning", () => {
    const index = createIndexer({ options });
    const res = index.search("suscipit", docs);
    expect(res).toMatchSnapshot();
  });
  test("search: dots in begging and end", () => {
    const index = createIndexer({ options });
    const res = index.search("fermentum", docs);
    expect(res).toMatchSnapshot();
  });
  test("search: no result", () => {
    const index = createIndexer({ options });
    const res = index.search("conse", docs);
    expect(res).toMatchSnapshot();
  });
  test("search: prefix search", () => {
    const index = createIndexer({ options });
    const res = index.search("conse", docs, { prefix: true });
    expect(res).toMatchSnapshot();
  });
  test("search: fuzzy search", () => {
    const index = createIndexer({ options });
    const res = index.search("consectetyr", docs, { prefix: true, fuzzy: 0.2 });
    expect(res).toMatchSnapshot();
  });
});
