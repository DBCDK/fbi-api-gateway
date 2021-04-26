export const typeDef = `
type Recommendation {
  manifestation: WorkManifestation!
  value: Float
}`;

export const resolvers = {
  Recommendation: {
    value(parent) {
      return parent.value;
    },
    manifestation(parent) {
      return { id: parent.pid };
    },
  },
};
