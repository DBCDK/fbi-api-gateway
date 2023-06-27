import config from "../config";

const { serviceRequester, url, ttl, prefix } = config.datasources.openorder;

/*
const url =
  "http://copa-rs.iscrum-ors-staging.svc.cloud.dbc.dk/copa-rs/api/v1/checkorderpolicy/";
const serviceRequester = "190101";
*/

/**
 * Creates date three months in the future. Used if a date is not provided
 */
function createNeedBeforeDate() {
  let offsetInDays = 90;
  let offsetInMilliseconds = offsetInDays * 24 * 60 * 60 * 1000;
  let date = new Date(Date.now() + offsetInMilliseconds);
  let dateStr = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(
    -2
  )}-${("0" + date.getDate()).slice(-2)}T00:00:00`;
  return dateStr;
}

/**
 *
 * @param input
 * @param context
 * @returns {{[p: number]: [string, unknown], shift(): ([string, unknown] | undefined), pid: *, authorOfComponent: (string|*), serviceRequester: string, slice(start?: number, end?: number): [string, unknown][], find: {<S extends [string, unknown]>(predicate: (this:void, value: [string, unknown], index: number, obj: [string, unknown][]) => value is S, thisArg?: any): (S | undefined), (predicate: (value: [string, unknown], index: number, obj: [string, unknown][]) => unknown, thisArg?: any): ([string, unknown] | undefined)}, join(separator?: string): string, copyWithin(target: number, start: number, end?: number): this, indexOf(searchElement: [string, unknown], fromIndex?: number): number, needBeforeDate: string, reduce: {(callbackfn: (previousValue: [string, unknown], currentValue: [string, unknown], currentIndex: number, array: [string, unknown][]) => [string, unknown]): [string, unknown], (callbackfn: (previousValue: [string, unknown], currentValue: [string, unknown], currentIndex: number, array: [string, unknown][]) => [string, unknown], initialValue: [string, unknown]): [string, unknown], <U>(callbackfn: (previousValue: U, currentValue: [string, unknown], currentIndex: number, array: [string, unknown][]) => U, initialValue: U): U}, titleOfComponent: (string|*), author: *, concat: {(...items: ConcatArray<[string, unknown]>): [string, unknown][], (...items: ConcatArray<[string, unknown]> | [string, unknown][]): [string, unknown][]}, sort(compareFn?: (a: [string, unknown], b: [string, unknown]) => number): this, fill(value: [string, unknown], start?: number, end?: number): this, push(...items: [string, unknown]): number, [Symbol.unscopables](): {copyWithin: boolean, entries: boolean, fill: boolean, find: boolean, findIndex: boolean, keys: boolean, values: boolean}, volume: (string|number|*), entries(): IterableIterator<[number, [string, unknown]]>, toLocaleString(): string, some(predicate: (value: [string, unknown], index: number, array: [string, unknown][]) => unknown, thisArg?: any): boolean, pagination: (string|*), keys(): IterableIterator<number>, values(): IterableIterator<[string, unknown]>, verificationReferenceSource: string, title, pop(): ([string, unknown] | undefined), copy: boolean, reduceRight: {(callbackfn: (previousValue: [string, unknown], currentValue: [string, unknown], currentIndex: number, array: [string, unknown][]) => [string, unknown]): [string, unknown], (callbackfn: (previousValue: [string, unknown], currentValue: [string, unknown], currentIndex: number, array: [string, unknown][]) => [string, unknown], initialValue: [string, unknown]): [string, unknown], <U>(callbackfn: (previousValue: U, currentValue: [string, unknown], currentIndex: number, array: [string, unknown][]) => U, initialValue: U): U}, publicationDate, every: {<S extends [string, unknown]>(predicate: (value: [string, unknown], index: number, array: [string, unknown][]) => value is S, thisArg?: any): this is S[], (predicate: (value: [string, unknown], index: number, array: [string, unknown][]) => unknown, thisArg?: any): boolean}, map<U>(callbackfn: (value: [string, unknown], index: number, array: [string, unknown][]) => U, thisArg?: any): U[], splice: {(start: number, deleteCount?: number): [string, unknown][], (start: number, deleteCount: number, ...items: [string, unknown]): [string, unknown][]}, forEach(callbackfn: (value: [string, unknown], index: number, array: [string, unknown][]) => void, thisArg?: any): void, [Symbol.iterator](): IterableIterator<[string, unknown]>, length: number, orderSystem: (string|*), userIdAuthenticated: (*|boolean), reverse(): [string, unknown][], userId: (string|*), publicationDateOfComponent: (string|*), filter: {<S extends [string, unknown]>(predicate: (value: [string, unknown], index: number, array: [string, unknown][]) => value is S, thisArg?: any): S[], (predicate: (value: [string, unknown], index: number, array: [string, unknown][]) => unknown, thisArg?: any): [string, unknown][]}, findIndex(predicate: (value: [string, unknown], index: number, obj: [string, unknown][]) => unknown, thisArg?: any): number, lastIndexOf(searchElement: [string, unknown], fromIndex?: number): number, exactEdition: (boolean|*), toString(): string, unshift(...items: [string, unknown]): number, pickUpAgencyId: ((function(*, *, *, *): Promise<*>)|*|string|string)}}
 */
function setPost(input, context) {
  // If id is found the user is authenticated via some agency
  // otherwise the token is anonymous
  const userIdFromToken = input.smaug.user.id;

  // Check if the user is authenticated on the given pickUpBranch
  const userIdAuthenticated =
    (userIdFromToken && input.branch.agencyId === input.smaug.user.agency) ||
    false;

  const userIdTypes = ["cpr", "userId", "barcode", "cardno", "customId"];
  // Use the userId from token, if user is authenticated,
  // otherwise the userId must be provided via args
  const userId = userIdAuthenticated
    ? ["userId", userIdFromToken]
    : Object.entries(input.userParameters).find(([key]) =>
        userIdTypes.includes(key)
      );

  if (!userId) {
    throw new Error(
      "User must be authenticated via the pickUpBranch, or provide userId manually"
    );
  }

  let userParameters = Object.entries(input.userParameters).filter(
    ([key]) => !userIdTypes.includes(key)
  );

  // defaults
  const postParameters = {
    copy: false,
    exactEdition: input.exactEdition || false,
    needBeforeDate: createNeedBeforeDate(),
    orderSystem: input.smaug.orderSystem,
    pickUpAgencyId: input.pickUpBranch,
    author: input.author,
    authorOfComponent: input.authorOfComponent,
    pagination: input.pagination,
    publicationDate: input.publicationDate,
    publicationDateOfComponent: input.publicationDateOfComponent,
    title: input.title,
    titleOfComponent: input.titleOfComponent,
    volume: input.volume,
    pid: input.pids.map((pid) => pid),
    serviceRequester: serviceRequester,
    userId: userId[1],
    userIdAuthenticated: userIdAuthenticated,
    ...input.userParameters,
    verificationReferenceSource: "dbcdatawell",
  };

  // @TODO filter out empties
  Object.keys(postParameters).forEach(
    (k) => postParameters[k] == null && delete postParameters[k]
  );

  return postParameters;
}

const checkPost = (post) => {
  //@TODO - more checks
  return post != null;
};

export async function load(input, context) {
  console.log(input, "ORIGINAL INPUT");
  console.log(input.accessToken, "ACCESSTOKEN");

  const post = setPost(input, context);

  if (!checkPost(post)) {
    return null;
  }

  console.log(post, "POST");
  const order = await context.fetch(`${url}placeorder/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify(post),
  });

  console.log(order, "ORDER");

  return order.body;
}
