import allagenciesresponse from "./librarysearch_alllibraries.json";
import { search } from "../library.datasource";

export async function load(props) {
  return await search(props, () => allagenciesresponse.allLibraries);
}
