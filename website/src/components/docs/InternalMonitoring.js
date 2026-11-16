import React from "react";
import useCredentialNetwork from "@/hooks/credentials/useCredentialNetwork";
import useInternalNetworkCheck from "@/hooks/credentials/useInternalNetworkCheck";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Link from "@/components/base/link";

export default function InternalMonitoring() {
  const { isInternal, monitoringBaseUrl, environments } = useCredentialNetwork();
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
        Environments 🪐
      </Title>
      <Text type="text2">
        Use the environment dropdown in the top bar to switch environments.
        Select a name to switch in the current tab, or use the icon on the right
        to open it in a new tab. The current page and section are preserved.
      </Text>
      <Text type="text2">
        If a clientId is selected, the destination connects that application
        using its own session. Agency and profile are carried over when available;
        otherwise, you will be notified of the replacement selections.
      </Text>
      {environments.length > 0 && (
        <ul>
          {environments.map(({ name, url }) => (
            <li key={url}>
              <Link href={url} target="_blank" rel="noopener noreferrer" underline>
                {name}
              </Link>{" "}
              — {url}
            </li>
          ))}
        </ul>
      )}
      <Text type="text1">
        - This section is only visible on the internal network. Most environments
        are only accessible internally.
      </Text>

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
