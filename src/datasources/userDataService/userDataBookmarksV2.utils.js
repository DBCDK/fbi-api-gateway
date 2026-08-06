export function getBookmarkV2Response(response) {
  if (response?.ok) {
    return response.body;
  }

  const error = new Error(
    `UserData Bookmark V2 request failed with status ${response?.status}`
  );
  error.status = response?.status;
  error.serviceErrorCode = response?.body?.error?.code;
  throw error;
}
