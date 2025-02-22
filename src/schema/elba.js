import { resolveAccess } from "../utils/access";
import { filterAgenciesByProps } from "../utils/accounts";
import getUserBorrowerStatus from "../utils/getUserBorrowerStatus";

export const typeDef = `

 enum CopyRequestStatusEnum {
   OK
   ERROR_UNAUTHENTICATED_USER
   ERROR_AGENCY_NOT_SUBSCRIBED
   ERROR_INVALID_PICKUP_BRANCH
   ERROR_PID_NOT_RESERVABLE
   ERROR_MISSING_CLIENT_CONFIGURATION
   ERROR_MUNICIPALITYAGENCYID_NOT_FOUND
   ERROR_MISSING_MUNICIPALITYAGENCYID

   UNKNOWN_USER
   BORCHK_USER_BLOCKED_BY_AGENCY
   BORCHK_USER_NO_LONGER_EXIST_ON_AGENCY
   BORCHK_USER_NOT_VERIFIED
   INTERNAL_ERROR  @fallback
 }

 type CopyRequestResponse {
    status: CopyRequestStatusEnum!
 }

 type ElbaServices {
   placeCopyRequest(input: CopyRequestInput!, 
    
    """
    If this is true, the copy request will not be send to the elba service
    Use it for testing
    """
    dryRun: Boolean): CopyRequestResponse!
 }

input CopyRequestInput {

    """
    The pid of an article or periodica
    """
    pid: String!

    userName: String,
    userMail: String
    publicationTitle: String
    publicationDateOfComponent: String
    publicationYearOfComponent: String
    volumeOfComponent: String
    authorOfComponent: String
    titleOfComponent: String
    pagesOfComponent: String
    userInterestDate: String
    pickUpAgencySubdivision: String
    issueOfComponent: String
    openURL: String
}

 extend type Mutation {
  elba: ElbaServices!
}
 `;

export const resolvers = {
  Mutation: {
    async elba(parent, args, context, info) {
      return {};
    },
  },
  ElbaServices: {
    async placeCopyRequest(parent, args, context, info) {
      return await placeCopyRequest({
        input: args?.input,
        dryRun: args?.dryRun,
        context: context,
      });
    },
  },
};

/**
 * Function that conducts checks and if checks are successful, sends an article order to elba
 * @param {Object} input
 * @param {String} input.pid
 * @param {String} input.userName
 * @param {String} input.userMail
 * @param {String} input.publicationTitle
 * @param {String} input.publicationDateOfComponent
 * @param {String} input.publicationYearOfComponent
 * @param {String} input.volumeOfComponent
 * @param {String} input.authorOfComponent
 * @param {String} input.titleOfComponent
 * @param {String} input.pagesOfComponent
 * @param {String} input.userInterestDate
 * @param {String} input.pickUpAgencySubdivision
 * @param {String} input.issueOfComponent
 * @param {String} input.openURL
 * @param {Boolean} dryRun
 * @param {Object} context
 * @returns
 */
export const placeCopyRequest = async ({ input, dryRun, context }) => {
  const { pid, userName, userMail } = input;

  // token is not authenticated
  if (!context?.user?.userId) {
    return {
      status: "ERROR_UNAUTHENTICATED_USER",
    };
  }

  const originRequester =
    context?.smaug?.digitalArticleService?.originRequester;

  if (!originRequester) {
    return {
      status: "ERROR_MISSING_CLIENT_CONFIGURATION",
    };
  }

  // Basic user information (e.g. name, email)
  const account = filterAgenciesByProps(context?.user?.agencies, {
    type: "CPR",
  })?.[0];

  const userData =
    (await context.datasources.getLoader("user").load({
      userId: account?.userId || context?.user?.userId,
      agencyId: account?.agencyId || context?.user?.loggedInAgencyId,
    })) || {};

  const user = { ...userData, ...context?.user };

  // Ensure an email can be set
  if (!(userMail || user.mail)) {
    return {
      status: "ERROR_UNAUTHENTICATED_USER",
    };
  }

  // Ensure user has municipalityAgencyId
  if (!user.municipalityAgencyId) {
    return {
      status: "ERROR_MISSING_MUNICIPALITYAGENCYID",
    };
  }

  // Fetch list of digitalAccess subscribers
  const digitalAccessSubscriptions = await context.datasources
    .getLoader("statsbiblioteketSubscribers")
    .load("");

  if (!digitalAccessSubscriptions[user.municipalityAgencyId]) {
    return {
      status: "ERROR_AGENCY_NOT_SUBSCRIBED",
    };
  }

  // Pid must be a manifestation with a valid issn (valid journal)
  let issn;
  try {
    const onlineAccess = await resolveAccess(pid, context);
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

  // Verify that the user is allowed to place an order
  // checking the municipality exist is redundant - but we still want the blocked check.
  const { status, statusCode } = await getUserBorrowerStatus(
    { agencyId: user.municipalityAgencyId },
    context
  );

  if (!status) {
    return { ok: status, status: statusCode };
  }

  // Then send order
  return await context.datasources
    .getLoader("statsbiblioteketSubmitArticleOrder")
    .load({
      ...input,
      userName: userName || user.name,
      userMail: userMail || user.mail,
      agencyId: user.municipalityAgencyId, //TODO - which agency should pay? BIBDK2021-1824
      dryRun,
      originRequester,
    });
};
