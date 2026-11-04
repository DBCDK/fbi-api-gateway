import React from "react";
import useCredentialNetwork from "@/hooks/credentials/useCredentialNetwork";
import useInternalNetworkCheck from "@/hooks/credentials/useInternalNetworkCheck";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Link from "@/components/base/link";

export default function InternalMonitoring() {
  const { isInternal, monitoringBaseUrl } = useCredentialNetwork();
  const { disableInternalNetworkCheck } = useInternalNetworkCheck();
  if (!isInternal || disableInternalNetworkCheck) return null;

  const endpoint = (name) =>
    monitoringBaseUrl ? (
      <Link
        href={`${monitoringBaseUrl.replace(/\/$/, "")}/${name}`}
        target="_blank"
        rel="noopener noreferrer"
        underline
      >
        /{name}
      </Link>
    ) : (
      <Text type="text2">
        Available at <code>/{name}</code> on the internal monitoring address
        (port 9599).
      </Text>
    );

  return (
    <>
      <Title type="title4" as="h2">
        Services 🔗
      </Title>
      <Text type="text2">
        View the configured service URLs, grouped by team, including whether a
        service is enabled when explicitly configured.
      </Text>
      {endpoint("services")}
      <Text type="text1">
        - This section is only visible on the internal network. The endpoint is
        only accessible internally.
      </Text>

      <Title type="title4" as="h2">
        Howru 🩺
      </Title>
      <Text type="text2">
        Check the gateway and its underlying services. The JSON response
        includes the overall status and individual checks. HTTP 200 indicates a
        healthy result; HTTP 500 indicates that one or more checks failed.
      </Text>
      {endpoint("howru")}
      <Text type="text1">
        - This section is only visible on the internal network. The endpoint is
        only accessible internally.
      </Text>
    </>
  );
}
