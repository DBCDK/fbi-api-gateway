export async function load({ agencyId, recordId }, context) {
  if (recordId && agencyId) {
    const LIST = {
      12345678: {
        updateStatusEnumDTO: "OK",
      },
      1234: {
        updateStatus: "FAILED",
        messageEntryDTOS: [
          {
            type: "FAILED",
            message: `Record ${recordId} doesn't exist`,
          },
        ],
      },
    };

    return LIST[recordId];
  }

  if (!recordId) {
    return {
      status: "FAILED",
      message: "Missing BibliographicRecordId.",
    };
  }

  return {};
}
