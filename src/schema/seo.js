/**
 * @file Creator type definition and resolvers
 *
 */
import { get } from "lodash";

export const typeDef = `
type SEO {
  title: String!
  description: String!
}`;

export const resolvers = {
  SEO: {}
};
