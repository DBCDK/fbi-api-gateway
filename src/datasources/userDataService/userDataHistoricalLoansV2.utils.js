export function getHistoricalLoanV2Response(response) {
  if (response?.ok) {
    return response.body;
  }

  const error = new Error(
    `UserData Historical Loan V2 request failed with status ${response?.status}`
  );
  error.status = response?.status;
  error.serviceErrorCode = response?.body?.error?.code;
  throw error;
}
