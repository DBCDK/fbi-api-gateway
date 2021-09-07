import allagenciesresponse from "./openplatform_all_agencies_response.json";
import { search } from "../library.datasource";

export async function load(props) {
  return await search(props, () => allagenciesresponse.data);
}
