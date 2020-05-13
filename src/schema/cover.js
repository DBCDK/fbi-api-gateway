export const typeDef = `
type Cover {
  detail_117: String
  detail_207: String
  detail_42: String
  detail_500: String
  thumbnail: String
  detail: String
}`;

export const resolvers = {
  Cover: {
    detail_117(parent) {
      return parent.detail_117;
    },
    detail_207(parent) {
      return parent.detail_207;
    },
    detail_42(parent) {
      return parent.detail_42;
    },
    detail_500(parent) {
      return parent.detail_500;
    },
    thumbnail(parent) {
      return parent.thumbnail;
    },
    detail(parent) {
      return parent.detail;
    }
  }
};
