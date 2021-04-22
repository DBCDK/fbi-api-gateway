/**
 * @file libraries type definition and resolvers
 *
 */

import {getArray} from '../utils/utils';
import {get} from 'lodash';

export const typeDef = `
  type Library {
    agencies: [branch!]
  }
  type branch{
    agencyId: String!
    branchId: String!
    branchName: [String!]
    openingHours: [String!]
  }`;

export const resolvers = {
  Library: {
    agencies(parent, args, context, info) {
      return context.datasources.library.load(parent);
    }
  },
  branch: {
    agencyId(parent, args, context, info) {
      return parent.agencyId;
    },
    branchId(parent, args, context, info){
      return parent.branchId;
    },
    branchName(parent, args, context, info){
      return parent.branchName;
    },
    openingHours(parent, args, context, info){
      return parent.openingHours;
    }
  },
};



