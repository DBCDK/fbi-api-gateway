import {get} from 'lodash';

export const typeDef = `
type Creator {
  functionCode: String!
  functionSingular: String!
  functionPlural: String!
  name: String!
  searchQuery: SearchQuery!
}`;

export const resolvers = {
  Creator: {
    functionCode(parent) {
      return get(parent, 'functionCode.$', 'unknown');
    },
    functionSingular(parent) {
      return get(parent, 'functionSingular.$', 'unknown');
    },
    functionPlural(parent) {
      return get(parent, 'functionPlural.$', 'unknown');
    },
    name(parent) {
      return get(parent, 'name.$', 'unknown');
    },
    searchQuery(parent) {
      return {...parent, value: parent.name};
    }
  }
};
