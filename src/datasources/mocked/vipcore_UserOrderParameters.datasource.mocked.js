export async function load(agencyId) {
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
