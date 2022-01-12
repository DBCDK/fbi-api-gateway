export const typeDef = `
type Recommendation {
  work: Work!
  manifestation: WorkManifestation!
  reader: String
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
    async work(parent, args, context, info) {
      const res = await context.datasources.workservice.load(parent.work);
      return res?.work;
    },
  },
};
