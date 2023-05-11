import request from "superagent";
import config from "../config";

/**
 * Fetch user info
 */
export async function load({accessToken}, context) {
    const url = config.datasources.openplatform.url + "/user";
    return (
        await request.post(url).send({
            access_token: accessToken,
            userinfo: ["userOrder"],
        })
    ).body.data;
    /*const fisk =
        await context.fetch(url, {
            method: "POST",
            body: JSON.stringify({
                access_token: accessToken,
                userinfo: ["userOrder"],
            }),
        })
    console.log(fisk, "FISK")
    return fisk.body.data;*/
}
