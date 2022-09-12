import * as consts from "../../schema/draft/FAKE";

export function load({ workId }) {
  return { data: { work: { ...consts.FAKE_WORK, workId } } };
}
