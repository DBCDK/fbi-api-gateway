/**
 * @file Provides direct access for Netpunkt Skaf to Openorder.
 *
 * This functionality is necessary to allow librarians to create
 * loans on behalf of end users, ensuring efficient service
 * for library operations. This SubmitOrder is different than the others
 * because we do not have a PID to lean on here.
 *
 * If responderId is set, the librarian has taken an active stand
 * on where the material should come from.
 * If it is unset, that process is automated.
 */

export const typeDef = `

  input NetpunktSkafSubmitOrderInput {
    author: String
    authorOfComponent: String
    bibliographicCategory: String
    callNumber: String
    copy: Boolean
    exactEdition: Boolean
    initials: String
    isbn: String
    issn: String
    issue: String
    key: String
    latestRequesterNote: String
    mediumType: String
    """
    needBeforeDate is required to be iso 8601 dateTime eg. "2024-03-15T12:24:32Z"
    """
    needBeforeDate: String
    orderSystem: String
    orderType: OrderTypeEnum
    originalOrderId: String
    pagination: String
    pickUpAgencyId: String!
    pickUpAgencySubdivision: String
    """
    Indicates whether order is allowed to be put in queue
    """
    placeOnHold: String
    publicationDate: String
    publicationDateOfComponent: String
    requesterId: String
    requesterInitials: String
    """
    AgencyId of the desired responder for inter library loans. Kept unset if automation is wanted.
    """
    responderId: String
    seriesTitelNumber: String
    title: String!
    titleOfComponent: String
    userParameters: SubmitOrderUserParametersInput!
    verificationReferenceSource: String
    volume: String
  }
  extend type Netpunkt {
    """
    Submits a skaf order from Netpunkt to OpenOrder on behalf of an end user
    """
    submitSkafOrder(input: NetpunktSkafSubmitOrderInput!, dryRun: Boolean): SubmitOrder
  }
`;

export const resolvers = {
  Netpunkt: {
    async submitSkafOrder(parent, args, context) {
      if (args?.dryRun) {
        return { status: "OWNED_ACCEPTED", orderId: "654123" };
      }

      // The userId of the Netpunkt user (not the end user)
      const authUserId =
        context?.user?.userId || args?.input?.requesterInitials;

      const pickUpAgencyId = args?.input?.pickUpAgencyId;

      const branch = (
        await context.datasources.getLoader("library").load({
          branchId: pickUpAgencyId,
        })
      ).result?.[0];

      if (!branch) {
        return {
          status: "UNKNOWN_PICKUPAGENCY",
        };
      }

      if (args?.input?.title === undefined || args?.input?.title === "") {
        return {
          status: "TITLE_IS_MISSING",
        };
      }

      return await context.datasources.getLoader("submitOrder").load({
        branch,
        input: args.input,
        accessToken: context.accessToken,
        smaug: context.smaug,
        authUserId,
        caller: "netpunkt",
      });
    },
  },
};
