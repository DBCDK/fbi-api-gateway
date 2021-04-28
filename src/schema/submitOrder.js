/**
 * @file availability type definition and resolvers
 *
 */

import {getArray} from '../utils/utils';
import {get} from 'lodash';

export const typeDef = `
   type SubmitOrder {
    status: String,
    orderId: String,
    deleted: Boolean,
    orsId: String
   }
   input SubmitOrderInput{
    fields: [String!],
    pretty: Boolean,
    timings: Boolean,
    orderType: String,
    pids: [
      String!,
    ],
    pickUpBranch: String,
    name: String,
    address: String,
    email: String,
    phone: String,
    expires: String
  } `;


