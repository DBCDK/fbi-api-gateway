/**
 * @file Root type definition and resolvers
 *
 */

import { log } from "dbc-node-logger";
import { createHistogram } from "../utils/monitor";
import {
  resolveBorrowerCheck,
  resolveManifestation,
  resolveOnlineAccess,
  resolveWork,
} from "../utils/utils";
import translations from "../utils/translations.json";

/**
 * The root type definitions
 */
export const typeDef = `
type Query {
  manifestation(pid: String, faust: String): Manifestation
  manifestations(faust: [String!], pid: [String!]): [Manifestation]!
  monitor(name: String!): String!
  user: User!
  work(id: String, faust: String, pid: String, language: LanguageCode): Work
  works(id: [String!], faust: [String!], pid: [String!], language: LanguageCode): [Work]!
  search(q: SearchQuery!, filters: SearchFilters): SearchResponse!
  complexSearch(cql: String!, filters: ComplexSearchFilters): ComplexSearchResponse!

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
    Name of branch to filter by
    """
    branch: String    
  ): localSuggestResponse!
  
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
  ): SuggestResponse!

  """
  Get recommendations
  """
  recommend(id: String, pid: String, faust: String, limit: Int): RecommendationResponse!


  help(q: String!, language: LanguageCode): HelpResponse
  branches(agencyid: String, branchId: String, language: LanguageCode, q: String, offset: Int, limit: PaginationLimit, status: LibraryStatus, bibdkExcludeBranches:Boolean): BranchResult!
  deleteOrder(orderId: String!, orderType: OrderType!): SubmitOrder
  borchk(libraryCode: String!, userId: String!, userPincode: String!): BorchkRequestStatus!
  infomedia(id: String!): InfomediaResponse!
  session: Session
  howru:String
  localizations(pids:[String!]!):Localizations
  refWorks(pid:String!):String!
  ris(pid:String!):String!
  relatedSubjects(q:[String!]!, limit:Int ):[String!]
  categoryInspiration: Category!
}

type Mutation {
  data_collect(input: DataCollectInput!): String!
  submitPeriodicaArticleOrder(input: PeriodicaArticleOrder!): PeriodicaArticleOrderResponse!
  submitOrder(input: SubmitOrderInput!): SubmitOrder
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
    async categoryInspiration(parent, args, context, info) {
      const inspiration = await context.datasources
        .getLoader("catInspire")
        .load(args);

      console.log("########### inspiration", inspiration);

      return inspiration.response;
    },
    async relatedSubjects(parent, args, context, info) {
      const related = await context.datasources
        .getLoader("relatedSubjects")
        .load({ q: args.q, limit: args.limit });
      return related.response;
    },
    async ris(parent, args, context, info) {
      const ris = await context.datasources.getLoader("ris").load({
        pid: args.pid,
      });
      return ris;
    },
    async refWorks(parent, args, context, info) {
      const ref = await context.datasources
        .getLoader("refworks")
        .load(args.pid);
      return ref;
    },
    async localizations(parent, args, context, info) {
      const allmanifestations = await Promise.all(
        args.pids.map((pid) => {
          return context.datasources.getLoader("openformat").load(pid);
        })
      );

      const pids = allmanifestations.map(
        (manifestation) =>
          manifestation?.details?.hostPublicationPid?.$ ||
          manifestation.admindata.pid.$
      );

      // get localizations from openholdingstatus
      const localizations = await context.datasources
        .getLoader("localizations")
        .load({
          pids: pids,
        });
      return localizations;
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
      if (args.filters) {
        const filters = translateFilters(args.filters);

        return { ...args, filters };
      }

      return args;
    },
    async branches(parent, args, context, info) {
      const digitalAccessSubscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");
      const infomediaSubscriptions = await context.datasources
        .getLoader("idp")
        .load("");
      return await context.datasources.getLoader("library").load({
        q: args.q,
        limit: args.limit,
        offset: args.offset,
        language: args.language,
        agencyid: args.agencyid,
        branchId: args.branchId,
        status: args.status || "ALLE",
        bibdkExcludeBranches: args.bibdkExcludeBranches || false,
        digitalAccessSubscriptions,
        infomediaSubscriptions,
      });
    },
    async suggest(parent, args, context, info) {
      return args;
    },
    async localSuggest(parent, args, context, info) {
      return args;
    },
    recommend(parent, args, context, info) {
      return args;
    },
    async deleteOrder(parent, args, context, info) {
      return await context.datasources.getLoader("deleteOrder").load({
        orderId: args.orderId,
        orderType: args.orderType,
        accessToken: context.accessToken,
      });
    },
    async borchk(parent, args, context, info) {
      return context.datasources.getLoader("borchk").load({
        libraryCode: args.libraryCode,
        userId: args.userId,
        userPincode: args.userPincode,
      });
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
    async submitPeriodicaArticleOrder(parent, args, context, info) {
      let { userName, userMail } = args.input;

      // Fetch and check existence of branch
      const digitalAccessSubscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");
      const infomediaSubscriptions = await context.datasources
        .getLoader("idp")
        .load("");
      const branch = (
        await context.datasources.getLoader("library").load({
          branchId: args.input.pickUpBranch,
          digitalAccessSubscriptions,
          infomediaSubscriptions,
        })
      ).result[0];

      if (!branch) {
        return {
          status: "ERROR_INVALID_PICKUP_BRANCH",
        };
      }

      const hasBorrowerCheck = await resolveBorrowerCheck(
        branch.agencyId,
        context
      );

      // If branch has borrowerCheck, we require the user to be authenticated via that agency
      if (hasBorrowerCheck) {
        if (!context.smaug || !context.smaug.user || !context.smaug.user.id) {
          return {
            status: "ERROR_UNAUTHORIZED_USER",
          };
        }
        const agencyId = context.smaug.user.agency;
        if (branch.agencyId !== agencyId) {
          return {
            status: "ERROR_INVALID_PICKUP_BRANCH",
          };
        }

        // We need users name and email
        const user = await context.datasources.getLoader("user").load({
          accessToken: context.accessToken,
        });
        userName = user.name ? user.name : userMail;
        userMail = user.mail ? user.mail : userMail;
      }

      if (!userName || !userMail) {
        return {
          status: "ERROR_UNAUTHORIZED_USER",
        };
      }

      // Agency must be subscribed
      const subscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");
      if (!subscriptions[branch.agencyId]) {
        return {
          status: "ERROR_AGENCY_NOT_SUBSCRIBED",
        };
      }

      // Pid must be a manifestation with a valid issn (valid journal)
      let issn;
      try {
        const onlineAccess = await resolveOnlineAccess(args.input.pid, context);
        issn = onlineAccess.find((entry) => entry.issn);
      } catch (e) {
        return {
          status: "ERROR_PID_NOT_RESERVABLE",
        };
      }
      if (!issn) {
        return {
          status: "ERROR_PID_NOT_RESERVABLE",
        };
      }

      // Then send order
      try {
        await context.datasources
          .getLoader("statsbiblioteketSubmitArticleOrder")
          .load({
            ...args.input,
            agencyId: branch.agencyId,
          });
        log.info("Periodica article order succes", {
          args,
          accessToken: context.accessToken,
        });
        return { status: "OK" };
      } catch (e) {
        log.error("Periodica article order failed", e);
        return {
          status: "ERROR_PID_NOT_RESERVABLE",
        };
      }
    },
    async submitOrder(parent, args, context, info) {
      const digitalAccessSubscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");
      const infomediaSubscriptions = await context.datasources
        .getLoader("idp")
        .load("");
      const input = {
        ...args.input,
        accessToken: context.accessToken,
        smaug: context.smaug,
        branch: (
          await context.datasources.getLoader("library").load({
            branchId: args.input.pickUpBranch,
            digitalAccessSubscriptions,
            infomediaSubscriptions,
          })
        ).result[0],
      };

      return await context.datasources.getLoader("submitOrder").load(input);
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
