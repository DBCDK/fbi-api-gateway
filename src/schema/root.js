/**
 * @file Root type definition and resolvers
 *
 */

import { log } from "dbc-node-logger";
import { createHistogram } from "../utils/monitor";
import {
  fetchOrderStatus,
  getUserId,
  resolveLocalizations,
  resolveLocalizationsWithHoldings,
  resolveManifestation,
  resolveWork,
} from "../utils/utils";

import translations from "../utils/translations.json";
import isEmpty from "lodash/isEmpty";

/**
 * The root type definitions
 */
export const typeDef = `

"""
Complexity directive to evaluate query complexity 
"""
directive @complexity(
  # The complexity value for the field
  value: Int!
  # Optional multipliers
  multipliers: [String!]
) on FIELD_DEFINITION

type Query {
  manifestation(pid: String, faust: String): Manifestation @complexity(value: 3)
  manifestations(faust: [String!], pid: [String!]): [Manifestation]! @complexity(value: 3, multipliers: ["pid", "faust"])
  monitor(name: String!): String!
  user: User
  work(id: String, faust: String, pid: String, oclc: String, language: LanguageCode): Work @complexity(value: 5)
  works(id: [String!], faust: [String!], pid: [String!], oclc:[String!], language: LanguageCode): [Work]! @complexity(value: 5, multipliers: ["id", "pid", "faust", "oclc"])
  search(q: SearchQuery!, filters: SearchFilters, search_exact: Boolean): SearchResponse!
  complexSearch(cql: String!, filters: ComplexSearchFilters): ComplexSearchResponse!
  linkCheck: LinkCheckService! @complexity(value: 10, multipliers: ["urls"])

  localSuggest(
    """
    The query to get suggestions from
    """
    q: String!
    """    
    suggest type to include in result
    """
    suggestType: [SuggestionType!]
    """
    Number of items to return
    """
    limit: Int 
    """
    Id of branch to filter by
    """
    branchId: String    
  ): localSuggestResponse! @complexity(value: 2, multipliers: ["limit"])
  
  complexSuggest(
    """
    The query to get suggestions for
    """
    q: String!
    """    
    the type of index to get suggestions from
    """
    type: ComplexSuggestionType!    
  ): ComplexSuggestResponse!
  
  suggest(
    workType: WorkType
    """
    The query to get suggestions from
    """
    q: String!
    """    
    suggest type to include in result
    """
    suggestType: SuggestionType
    """
    Number of items to return
    """
    limit: Int
  ): SuggestResponse! @complexity(value: 3, multipliers: ["limit"])

  """
  Get recommendations
  """
  recommend(id: String, pid: String, faust: String, limit: Int, branchId: String): RecommendationResponse! @complexity(value: 3, multipliers: ["limit"])
  help(q: String!, language: LanguageCode): HelpResponse
  branches(agencyid: String, branchId: String, language: LanguageCode, q: String, offset: Int, limit: PaginationLimit, status: LibraryStatus, bibdkExcludeBranches:Boolean, agencyTypes: [AgencyType!]): BranchResult! @complexity(value: 5, multipliers: ["limit"])
  deleteOrder(orderId: String!, orderType: OrderType!): SubmitOrder
  infomedia(id: String!): InfomediaResponse!
  session: Session
  howru:String
  localizations(pids:[String!]!): Localizations @complexity(value: 35, multipliers: ["pids"])
  """
  localizationsWithHoldings parses ALL localizations and ALL detailedholdings. Returns agencies with holdings on shelf
  """
  localizationsWithHoldings(pids: [String!]!, limit: Int, offset: Int, language: LanguageCode, status: LibraryStatus, bibdkExcludeBranches:Boolean): Localizations 
  refWorks(pid:String!):String!
  ris(pids: [String!]!):String!
  relatedSubjects(q:[String!]!, limit:Int ): [String!] @complexity(value: 3, multipliers: ["q", "limit"])
  inspiration(language: LanguageCode, limit: Int): Inspiration! 
  orderStatus(orderIds: [String!]!): [OrderStatusResponse]!
}

type Mutation {
  data_collect(input: DataCollectInput!): String!
  deleteOrder(
    """
    id of the order to be deleted
    """
    orderId: String!

    """
    The agency where the order is placed.
    """
    agencyId: String!

    """
    If this is true, the order is not actually deleted (is useful when generating examples).
    """
    dryRun: Boolean
    ): DeleteOrderResponse
   renewLoan(
    """
    id of the loan to be renewed
    """
    loanId: String!

    """
    The agency where the loan is to be renewed.
    """
    agencyId: String!

    """
    If this is true, the loan is not actually renewed (is useful when generating examples).
    """
    dryRun: Boolean
    ): RenewLoanResponse  
  
  submitSession(input: SessionInput!): String!
  deleteSession: String!
}`;

function translateFilters(filters) {
  const res = {};

  // Reverse translate facet terms
  Object.entries(filters).forEach(([filter, values]) => {
    res[filter] = [];

    // Get entries for the filter/facet in an array
    const filterTranslations =
      translations.facets[filter] &&
      Object.entries(translations.facets[filter]);

    // Loop through each of the provided filters
    values.forEach((value) => {
      // Find a translation for a given value, (could be 'Dansk')
      const found = filterTranslations?.find(
        ([key, translation]) => translation.da === value
      );

      // Push the key for the filter (could be 'dan' if filter was 'Dansk')
      // or if we do not have a translation, use the provided value
      res[filter].push(found ? found[0] : value);
    });
  });
  return res;
}

/**
 * Root resolvers
 */
export const resolvers = {
  Query: {
    async orderStatus(parent, args, context, info) {
      return fetchOrderStatus(args, context);
    },
    async inspiration(parent, args, context, info) {
      return {};
    },
    async relatedSubjects(parent, args, context, info) {
      const related = await context.datasources
        .getLoader("relatedSubjects")
        .load({ q: args.q, limit: args.limit });
      return related.response;
    },
    async ris(parent, args, context, info) {
      const ris = await context.datasources.getLoader("ris").load({
        pids: args.pids,
      });

      /**
       * Temporary fix until openformat handles multiple pids
       * Removes trailing string "ER - " which isn't closed
       */
      const formated = ris.replaceAll("ER  -", "");

      return formated;
    },
    async refWorks(parent, args, context, info) {
      const ref = await context.datasources
        .getLoader("refworks")
        .load(args.pid);
      return ref;
    },
    async localizations(parent, args, context, info) {
      return await resolveLocalizations(args, context);
    },
    async localizationsWithHoldings(parent, args, context, info) {
      if (!args.pids || isEmpty(args.pids)) {
        return { count: 0, agencies: [] };
      }

      const offset = args.offset ?? 0;
      const limit = args.limit ?? 10;
      const language = args.language ?? "da";
      const status = args.status ?? "ALLE";
      const bibdkExcludeBranches = args.bibdkExcludeBranches;

      return await resolveLocalizationsWithHoldings({
        args: args,
        context: context,
        offset: offset,
        limit: limit,
        language: language,
        status: status,
        bibdkExcludeBranches: bibdkExcludeBranches,
      });
    },
    howru(parent, args, context, info) {
      return "gr8";
    },
    async manifestation(parent, args, context, info) {
      return resolveManifestation(args, context);
    },
    async manifestations(parent, args, context, info) {
      if (args.faust) {
        return Promise.all(
          args.faust.map((faust) => resolveManifestation({ faust }, context))
        );
      } else if (args.pid) {
        return Promise.all(
          args.pid.map((pid) => resolveManifestation({ pid }, context))
        );
      }
      return [];
    },
    async works(parent, args, context, info) {
      if (args.id) {
        return Promise.all(args.id.map((id) => resolveWork({ id }, context)));
      } else if (args.faust) {
        return Promise.all(
          args.faust.map((faust) => resolveWork({ faust }, context))
        );
      } else if (args.pid) {
        return Promise.all(
          args.pid.map((pid) => resolveWork({ pid }, context))
        );
      } else if (args.oclc) {
        return Promise.all(
          args.oclc.map((oclc) => resolveWork({ oclc }, context))
        );
      }
      return [];
    },
    monitor(parent, args, context, info) {
      try {
        context.monitorName = args.name;
        createHistogram(args.name);
        return "OK";
      } catch (e) {
        return e.message;
      }
    },
    async help(parent, args, context, info) {
      return { ...args };
    },
    async user(parent, args, context, info) {
      if (!context?.smaug?.user?.id) {
        return null;
      }
      return { ...args };
    },
    async work(parent, args, context, info) {
      return resolveWork(args, context);
    },
    async search(parent, args, context, info) {
      if (args.filters) {
        const filters = translateFilters(args.filters);

        return { ...args, filters };
      }

      return args;
    },
    async complexSearch(parent, args, context, info) {
      return args;
    },
    async linkCheck(parent, args, context, info) {
      return args;
    },
    async branches(parent, args, context, info) {
      return await context.datasources.getLoader("library").load({
        q: args.q,
        limit: args.limit,
        offset: args.offset,
        language: args.language,
        agencyid: args.agencyid,
        branchId: args.branchId,
        status: args.status || "ALLE",
        agencyTypes: args.agencyTypes,
        bibdkExcludeBranches: args.bibdkExcludeBranches || false,
      });
    },
    async suggest(parent, args, context, info) {
      return args;
    },
    async complexSuggest(parent, args, context, info) {
      return args;
    },

    async localSuggest(parent, args, context, info) {
      return args;
    },
    recommend(parent, args, context, info) {
      return args;
    },
    infomedia(parent, args, context, info) {
      return args;
    },
    async session(parent, args, context, info) {
      return await context.datasources.getLoader("session").load({
        accessToken: context.accessToken,
      });
    },
  },
  Mutation: {
    data_collect(parent, args, context, info) {
      // Check that exactly one input type is given
      const inputObjects = Object.values(args.input);
      if (inputObjects.length !== 1) {
        throw new Error("Exactly 1 input must be specified");
      }

      // Convert keys, replace _ to -
      const data = { ip: context.smaug.app.ips[0] };
      Object.entries(inputObjects[0]).forEach(([key, val]) => {
        data[key.replace(/_/g, "-")] = val;
      });

      // Remove keys where value is empty array
      if (data?.["search-request"]?.filters) {
        const filters = {};
        Object.entries(data["search-request"].filters).forEach(
          ([key, value]) => {
            if (value?.length > 0) {
              filters[key] = value;
            }
          }
        );
        data["search-request"].filters = filters;
      }

      // We log the object, setting 'type: "data"' on the root level
      // of the log entry. In this way the data will be collected
      // by the AI data collector
      log.info(JSON.stringify(data), { type: "data" });

      return "OK";
    },
    async deleteOrder(parent, args, context, info) {
      // NOTE FOR FURTHER DEVELOPMENT
      //
      // When an order is placed, the order is not available in the local system
      // immediately. It has to go through ORS. Therefore, the user is not able to
      // delete the order before it has reached the local system.
      //
      // This is not a great user experience, if the user must wait hours until
      // the order can be cancelled.
      //
      // BUT, hopefully we can use ORS-maintain to cancel the order as soon as
      // it has been placed.
      //
      // It should probably be handled here as the UI should just make a single call,
      // and not having to deal with the complexity of ORS and openUserStatus.

      const { orderId, agencyId, dryRun } = args;

      if (!orderId || !agencyId) {
        return {
          deleted: false,
          error: "Please provide orderId and agencyId",
        };
      }

      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      const userId = await getUserId({ agencyId, userinfo });

      if (!userId) {
        return {
          deleted: false,
          error: "User or agency not found",
        };
      }

      //if dry run, we will not actually execute the deleteOrder function
      if (dryRun) {
        return { deleted: true };
      }

      // Delete order in the local library system, via openUserStatus
      const res = await context.datasources.getLoader("deleteOrder").load({
        orderId,
        agencyId,
        userId,
        smaug: context.smaug,
        accessToken: context.accessToken,
      });

      return { deleted: !res.error, error: res.error };
    },
    async renewLoan(parent, args, context, info) {
      // NOTE FOR FURTHER DEVELOPMENT
      // In the long run, we would like to be able to retrieve the loans status from a. o. cicero to see if the loan can be renewed.
      // This way, we can check if the loan can be renewed without calling the renewLoan function, which would be a better user experience.

      const { loanId, agencyId, dryRun = false } = args;

      if (!loanId || !agencyId) {
        return {
          renewed: false,
          error: "Please provide loanId and agencyId",
        };
      }

      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      const userId = await getUserId({ agencyId, userinfo });

      if (!userId) {
        return {
          renewed: false,
          error: "User or agency not found",
        };
      }

      //if dry run, we will not actually execute the renewLoan function
      if (dryRun) {
        return { renewed: true, dueDate: "2100-08-13T00:00:00+02:00" };
      }

      // Renew loan in the local library system, via openUserStatus
      const res = await context.datasources.getLoader("renewLoan").load({
        loanId,
        agencyId,
        userId,
        smaug: context.smaug,
        accessToken: context.accessToken,
      });
      return { renewed: !res.error, error: res.error, dueDate: res.dueDate };
    },

    async submitSession(parent, args, context, info) {
      await context.datasources.getLoader("submitSession").load({
        accessToken: context.accessToken,
        session: args.input,
      });
      return "OK";
    },
    async deleteSession(parent, args, context, info) {
      await context.datasources.getLoader("deleteSession").load({
        accessToken: context.accessToken,
      });
      return "OK";
    },
  },
};
