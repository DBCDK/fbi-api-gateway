/**
 * @file This file handles "ove" requests from the rawrepo service.
 *
 */

export const typeDef = `
    extend type Mutation {
    """
    Represents the overall reservability status across all items according to the Cicero API (booking allowed).
    """
       rawrepo: RawRepo
    }
    
    type RawRepo {
        updateOveCode(bibliographicRecordId: String! dryRun: Boolean): UpdateOveCodeResponse!
    }

    type UpdateOveCodeResponse {
        status: UpdateOveCodeStatusEnum!
        message: String
    }

    enum UpdateOveCodeStatusEnum {
      OK
      FORBIDDEN
      FAILED
      ERROR @fallback
    }

 `;

export const resolvers = {
  Mutation: {
    async rawrepo(parent, args, context) {
      return {};
    },
  },
  RawRepo: {
    async updateOveCode(parent, args, context, info) {
      const recordId = args?.bibliographicRecordId;
      const agencyId = context?.smaug.agencyId;

      // Used for systematic fbs-test specific fbi-api - can be removed in future
      const isFBSTest = agencyId === "877000";

      // Return OK for FBSTest dryRun or not
      if (isFBSTest) {
        return {
          status: "OK",
          message: "FBSTest mode - no changes made.",
        };
      }

      // Check library VIP rights
      const libraryRules = await context.datasources
        .getLoader("viplibraryrules")
        .load({ agencyId });

      // Get agency's 'regional_obligations' from VIP
      const hasAccess = libraryRules?.[0]?.libraryRule?.find(
        ({ name }) => name === "regional_obligations"
      )?.bool;

      // Check if token client has permission to update OVE codes
      if (!hasAccess) {
        return {
          status: "FORBIDDEN",
          message: "Agency does not have permission to update OVE codes.",
        };
      }

      // Return if dry run mode is enabled
      if (args.dryRun) {
        return {
          status: "OK",
          message: "Dry run mode - no changes made.",
        };
      }

      const res = await context.datasources
        .getLoader("updateovecode")
        .load({ agencyId, recordId });

      return res;
    },
  },
  UpdateOveCodeResponse: {
    status(parent, args, context, info) {
      return (
        // Status from 'updateOveCode' resolver
        parent.status ||
        // Status from api response
        parent.updateStatusEnumDTO ||
        // Status from api Error messages entries response
        parent.messageEntryDTOS?.[0]?.type ||
        // Fallback
        "ERROR"
      );
    },
    message(parent, args, context, info) {
      const STATES = { OK: "Ovecode was successfully updated." };

      return (
        // Message from 'updateOveCode' resolver
        parent.message ||
        // Status from api Error messages entries response
        parent.messageEntryDTOS?.[0]?.message ||
        // Translated message according to API response status
        STATES[parent.updateStatusEnumDTO] ||
        // Fallback
        "Some unknown error occured."
      );
    },
  },
};
