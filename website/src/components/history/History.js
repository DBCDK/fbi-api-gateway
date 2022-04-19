import { useEffect, useState } from "react";
import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";
import { useModal } from "@/components/modal";

import { isToken } from "@/components/utils";

import Button from "@/components/base/button";

import styles from "./History.module.css";

function GetConfiguration({ token, callback }) {
  const { configuration } = useConfiguration(token);
  useEffect(() => {
    if (configuration && Object.keys(configuration).length) {
      callback?.(true);
    }
  }, [configuration]);
  return null;
}

export function History({ onClick, compact, disabled, className = "" }) {
  const compactClass = compact ? styles.compact : "";

  return (
    <Button
      className={`${styles.history} ${compactClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      secondary
    >
      <span>✏️</span>
      {/* <span>🗝️</span> */}
    </Button>
  );
}

export default function Wrap(props) {
  const [state, setState] = useState(false);
  const { history } = useStorage();
  const modal = useModal();

  const hasValidTokens = !!history?.filter((obj) => isToken(obj.token)).length;

  return (
    <History
      {...props}
      // disabled={!hasValidTokens}
      onClick={() => modal.push("history")}
    />
  );

  return (
    <>
      {history?.map((obj) => (
        <GetConfiguration
          callback={(state) => setState(state)}
          key={obj.token}
          token={obj.token}
        />
      ))}
      <History
        {...props}
        disabled={!state}
        onClick={() => modal.push("history")}
      />
    </>
  );
}
