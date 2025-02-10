export async function load(agencyId) {
  if (agencyId === "820050") {
    return {
      userParameter: [
        { userParameterType: "userId", parameterRequired: true },
        { userParameterType: "userMail", parameterRequired: false },
      ],
      agencyParameters: {
        borrowerCheckParameters: [
          { borrowerCheckSystem: "login.bib.dk", borrowerCheck: false },
        ],
      },
    };
  }
  return {
    userParameter: [
      { userParameterType: "userId", parameterRequired: true },
      { userParameterType: "userMail", parameterRequired: false },
    ],
    agencyParameters: {
      borrowerCheckParameters: [
        { borrowerCheckSystem: "login.bib.dk", borrowerCheck: true },
      ],
    },
  };
}
