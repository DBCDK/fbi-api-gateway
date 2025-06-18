export async function load({ agencyId }, context) {
  const LIST = {
    715100: [{ libraryRule: [{ name: "regional_obligations", bool: true }] }],
    790900: [{ libraryRule: [{ name: "regional_obligations", bool: false }] }],
  };

  return LIST[agencyId];
}
