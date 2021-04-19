export const typeDef = `
type Recommendation {
  manifestation: Manifestation!
  value: Float
}`;

export const resolvers = {
  Recommendation: {
    value(parent) {
      return parent.value;
    },
    manifestation(parent) {
      return { pid: parent.pid };
    },
  },
};
