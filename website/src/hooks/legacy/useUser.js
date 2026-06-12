import useResolvedUser from "../resolved/useResolvedUser";

export default function useUser(
  props,
  { enabled = true, syncResolvedToken = false } = {}
) {
  return useResolvedUser(props, { enabled });
}
