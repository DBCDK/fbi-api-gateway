import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";

const STATUS_MAP = { 200: "OK", 404: "EXPIRED", 401: "INVALID", 500: "ERROR" };

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
  });

  const status = response.status;

  if (response.status !== 200) {
    return {
      config: {},
      statusCode: status,
      status: STATUS_MAP[status] || "ERROR",
    };
  }

  const config = await response.json();

  return { config, statusCode: 200, status: "OK" };
};

export default function useConfiguration(props) {
  const token = props?.token?.replace(/test.*:/, "");
  const agency = props?.agency;
  const isValid = isToken(props?.token);
  const baseUrl = token ? `/api/smaug?token=${token}` : null;
  const agencyUrl =
    token && agency ? `/api/smaug?token=${token}&agency=${agency}` : null;

  const { data: baseData, error: baseError } = useSWR(
    isValid && baseUrl,
    fetcher
  );

  const { data: agencyData, error: agencyError } = useSWR(
    isValid && agencyUrl,
    fetcher
  );

  const data = agencyData || baseData;
  const error = agencyError || baseError;
  const isLoadingBase = isValid && !baseData && !baseError;
  const isLoadingAgency = Boolean(agencyUrl) && !agencyData && !agencyError;

  return (
    {
      configuration: data?.config,
      status: data?.status,
      isLoading: isLoadingBase || isLoadingAgency,
    } || {}
  );
}
