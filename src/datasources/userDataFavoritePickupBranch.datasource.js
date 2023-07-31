import config from "../config";
import request from "superagent";

/**
 * set favorite pickup branch in userdata service
 */
export async function load({ smaugUserId, favoritePickUpBranch }) {
  const { url } = config.datasources.userdata;
  const addUserEndpoint = url + "user/favoritePickupBranch";

  console.log('\n\nin fav pickupbranch',favoritePickUpBranch)

  await request.post(addUserEndpoint).send({
    smaugUserId: smaugUserId,
    favoritePickUpBranch: favoritePickUpBranch,
  });
}

export const options = {
  redis: {
    prefix: "userinfo",
    ttl: 60 * 5,
  },
};
