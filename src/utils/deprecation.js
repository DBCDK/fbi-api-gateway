export const DRAFT_PREFIX = "@draft";

export function hasDeprecatedDirective(directives = []) {
  return directives?.some((directive) => directive?.name?.value === "deprecated");
}

export function getDeprecationReasonFromDirectives(directives = []) {
  const directive = directives?.find(
    (entry) => entry?.name?.value === "deprecated"
  );

  const reason = directive?.arguments?.find(
    ({ name }) => name?.value === "reason"
  );

  return reason?.value?.value?.trim() || null;
}

export function isDraftReason(reason) {
  return typeof reason === "string" && reason.trim().startsWith(DRAFT_PREFIX);
}

export function getDraftDetails(reason) {
  if (!isDraftReason(reason)) {
    return null;
  }

  const details = reason
    .trim()
    .slice(DRAFT_PREFIX.length)
    .replace(/^[:\-]\s*/, "")
    .trim();

  return details || null;
}

export function isDraftDeprecated(target) {
  return !!target?.isDeprecated && isDraftReason(target?.deprecationReason);
}

export function isTrueDeprecated(target) {
  return !!target?.isDeprecated && !isDraftReason(target?.deprecationReason);
}
