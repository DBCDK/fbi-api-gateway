/**
 * @file Root type definition and resolvers
 *
 */

import { log } from "dbc-node-logger";
import { createHistogram } from "../utils/monitor";
import { resolveBorrowerCheck, resolveOnlineAccess } from "../utils/utils";
import translations from "../utils/translations.json";

/**
 * The root type definitions
 */
export const typeDef = `
type Query {
  manifestation(pid: String!): WorkManifestation!
  monitor(name: String!): String!
  user: User!
  work(id: String!): Work
  works(id: [String!]!): [Work]!
  search(q: SearchQuery!, filters: SearchFilters): SearchResponse!
  suggest(q: String!, worktype: WorkType): SuggestResponse!
  help(q: String!, language: LanguageCode): HelpResponse
  branches(agencyid: String, branchId: String, language: LanguageCode, q: String, offset: Int, limit: PaginationLimit): BranchResult!
  deleteOrder(orderId: String!, orderType: OrderType!): SubmitOrder
  borchk(libraryCode: String!, userId: String!, userPincode: String!): BorchkRequestStatus!
  infomediaContent(pid: String!): [InfomediaContent]
  session: Session
  howru:String
  holdingStatus(agencyId:String, pids:[String]): DetailedHoldings
  localizations(pids:[String!]!):Localizations
}

type Mutation {
  data_collect(input: DataCollectInput!): String!
  submitPeriodicaArticleOrder(input: PeriodicaArticleOrder!): PeriodicaArticleOrderResponse!
  submitOrder(input: SubmitOrderInput!): SubmitOrder
  submitSession(input: SessionInput!): String!
  deleteSession: String!
}`;

/**
 * Root resolvers
 */
export const resolvers = {
  Query: {
    async localizations(parent, args, context, info) {
      // get localizations from openholdingstatus
      const localizations = await context.datasources.localizations.load({
        pids: args.pids,
      });
      return localizations;
    },
    /**
     * Holding status does a number of calls to external services.
     * localisationRequest (openHoldingStatus - see localizations.datasource.js) : to get localizations (agencies where material is located)
     * detailedHoldingsRequest (openHoldingStatus - see detailedholdings.datasource.js): to get detail for a localization (can the material
     *  be borrowed? - is the material home ? when is the expected delivery date ?)
     * holdingitems (openplatform - see holdingsitems.datasource.js): to get additional information (which branch is the material located at? shelf? etc.)
     *
     * It returns a merge af the information gathered (schema/detailedholdings.js)
     *
     * @param parent
     * @param args
     * @param context
     * @param info
     * @return {Promise<{count: string}|*>}
     */
    async holdingStatus(parent, args, context, info) {
      // get localizations from openholdingstatus
      const localizations = await context.datasources.localizations.load({
        pids: args.pids,
      });

      const localHoldings =
        localizations.agencies &&
        localizations.agencies.find((lok) => lok.agencyId === args.agencyId);

      const localids =
        localHoldings &&
        localHoldings.holdingItems.map((item) => item.localIdentifier);

      if (!localids) {
        // there are no localizations - no library has the material - eg. digital
        // ressource - make an answer for detailedHoldings to handle.
        return { count: "0" };
      }
      // get detailed holdings from openholdingsstatus.
      const detailedHoldings = await context.datasources.detailedholdings.load({
        localIds: localids,
        agencyId: args.agencyId,
      });

      // NOTICE .. if we are not allowed to use itemholdings -> remove next block
      // of code
      /** START HOLDING ITEMS **/
      let holdingsitems;
      try {
        // get holdingitems
        holdingsitems = await context.datasources.holdingsitems.load({
          accessToken: context.accessToken,
          pids: args.pids,
          agencyId: args.agencyId,
        });
      } catch (e) {
        holdingsitems = null;
      }

      // filter out holdingsitems present at this library.
      //  + merge holdingitems with detailedHoldings.holdingstatus
      const mergedholdings = [];
      holdingsitems &&
        holdingsitems.forEach((item) => {
          detailedHoldings.holdingstatus.forEach((detail) => {
            const locals = item.holdingsitems.filter(
              (item) => item.bibliographicRecordId === detail.localHoldingsId
            );
            if (locals) {
              locals.forEach((local) => {
                const merged = {
                  ...detail,
                  ...local,
                };
                mergedholdings.push(merged);
              });
            }
          });
        });
      // replace detailHoldings.holdingstatus with the merged holdings
      detailedHoldings.holdingstatus = mergedholdings;
      /** END HOLDING ITEMS **/

      return detailedHoldings;
    },

    howru(parent, args, context, info) {
      return "gr8";
    },
    async manifestation(parent, args, context, info) {
      return { id: args.pid };
    },
    async works(parent, args, context, info) {
      return Promise.all(
        args.id.map(async (id) => {
          return (await context.datasources.workservice.load(id))?.work;
        })
      );
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
      const res = await context.datasources.workservice.load(args.id);
      return res?.work;
    },
    async search(parent, args, context, info) {
      if (args.filters) {
        const filters = {};

        // Reverse translate facet terms
        Object.entries(args.filters).forEach(([filter, values]) => {
          filters[filter] = [];

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
            filters[filter].push(found ? found[0] : value);
          });
        });
        return { ...args, filters };
      }

      return args;
    },
    async branches(parent, args, context, info) {
      const digitalAccessSubscriptions = await context.datasources.statsbiblioteketSubscribers.load(
        ""
      );
      const infomediaSubscriptions = await context.datasources.idp.load("");
      return await context.datasources.library.load({
        q: args.q,
        limit: args.limit,
        offset: args.offset,
        language: args.language,
        agencyid: args.agencyid,
        branchId: args.branchId,
        digitalAccessSubscriptions,
        infomediaSubscriptions,
      });
    },
    async suggest(parent, args, context, info) {
      return { q: args.q, worktype: args.worktype };
    },
    async deleteOrder(parent, args, context, info) {
      return await context.datasources.deleteOrder.load({
        orderId: args.orderId,
        orderType: args.orderType,
        accessToken: context.accessToken,
      });
    },
    async borchk(parent, args, context, info) {
      return context.datasources.borchk.load({
        libraryCode: args.libraryCode,
        userId: args.userId,
        userPincode: args.userPincode,
      });
    },
    async infomediaContent(parent, args, context, info) {
      return await context.datasources.infomedia.load({
        pid: args.pid,
        accessToken: context.accessToken,
      });
    },
    async session(parent, args, context, info) {
      return await context.datasources.session.load({
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

      // We log the object, setting 'type: "data"' on the root level
      // of the log entry. In this way the data will be collected
      // by the AI data collector
      log.info("data", { type: "data", message: JSON.stringify(data) });

      return "OK";
    },
    async submitPeriodicaArticleOrder(parent, args, context, info) {
      let { userName, userMail } = args.input;

      // Fetch and check existence of branch
      const digitalAccessSubscriptions = await context.datasources.statsbiblioteketSubscribers.load(
        ""
      );
      const infomediaSubscriptions = await context.datasources.idp.load("");
      const branch = (
        await context.datasources.library.load({
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
        const user = await context.datasources.user.load({
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
      const subscriptions = await context.datasources.statsbiblioteketSubscribers.load(
        ""
      );
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
        await context.datasources.statsbiblioteketSubmitArticleOrder.load({
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
      const digitalAccessSubscriptions = await context.datasources.statsbiblioteketSubscribers.load(
        ""
      );
      const infomediaSubscriptions = await context.datasources.idp.load("");
      const input = {
        ...args.input,
        accessToken: context.accessToken,
        smaug: context.smaug,
        branch: (
          await context.datasources.library.load({
            branchId: args.input.pickUpBranch,
            digitalAccessSubscriptions,
            infomediaSubscriptions,
          })
        ).result[0],
      };

      return await context.datasources.submitOrder.load(input);
    },
    async submitSession(parent, args, context, info) {
      await context.datasources.submitSession.load({
        accessToken: context.accessToken,
        session: args.input,
      });
      return "OK";
    },
    async deleteSession(parent, args, context, info) {
      await context.datasources.deleteSession.load({
        accessToken: context.accessToken,
      });
      return "OK";
    },
  },
};
