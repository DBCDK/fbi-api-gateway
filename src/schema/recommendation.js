import {resolveManifestation} from '../utils/utils';

export const typeDef = `
type Recommendation {
  work: Work!
  manifestation: Draft_Manifestation!
  reader: String
  value: Float
}`;

export const resolvers = {
  Recommendation: {
    value(parent) {
      return parent.value;
    },
    manifestation(parent, context) {
      return resolveManifestation({pid: parent.pid}, context);
    },
    async work(parent, args, context, info) {
      const res = await context.datasources.workservice.load({
        workId: parent.work,
        profile: context.profile,
      });
      return res?.work;
    },
    reader(parent) {
      return Array.isArray(parent.reader) ? parent.reader[0] : parent.reader;
    },
  },
};
