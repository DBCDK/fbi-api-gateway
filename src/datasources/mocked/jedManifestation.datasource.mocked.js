import * as consts from "../../schema/draft/FAKE";

export function load({ pid }) {
  return { data: { manifestation: { ...consts.FAKE_MANIFESTATION_1, pid } } };
}
