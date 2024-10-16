import { useEffect, useRef, useState } from "react";
import Text from "@/components/base/text";
import Overlay from "@/components/base/overlay";
import Input from "@/components/base/input";
import Button from "@/components/base/button";

import useStorage from "@/hooks/useStorage";
import useParseCurl from "@/hooks/useParseCurl";
import useQuery from "@/hooks/useQuery";
import { useGraphQLUrl } from "@/hooks/useSchema";
import { useCreateCurl } from "@/hooks/useCreateCurl";
import { ToolbarButton } from "@graphiql/react";

import styles from "./Curl.module.css";

export default function CurlButton({ className }) {
  const { setSelectedToken } = useStorage();
  const { params, updateParams } = useQuery();

  const curl = useCreateCurl({
    ...params,
  });

  console.log("ccccurl", curl);

  const [value, setValue] = useState("");
  const { json } = useParseCurl(value);

  // update if curl
  useEffect(() => {
    if (curl && value === "") {
      setValue(curl);
    }
  }, [curl]);

  console.log("... Curl", { params, json: json?.data });

  const [curlVisible, setCurlVisibility] = useState(false);
  const [copyVisible, setCopyVisibility] = useState(false);

  const elRef = useRef();
  const btnRef = useRef();

  // Hide buttons according to input
  const runHiddenClass = curl === value ? styles.hidden : "";
  const copyHiddenClass = value !== curl ? styles.hidden : "";

  return (
    <span ref={elRef} className={`${styles.curl} ${className}`}>
      <ToolbarButton
        className={styles.button}
        onClick={() => setCurlVisibility(!curlVisible)}
        label="Copy request as curl"
      >
        <Text type="text1">curl</Text>
      </ToolbarButton>
      <Overlay
        show={curlVisible}
        container={elRef}
        rootClose={true}
        onHide={() => setCurlVisibility(false)}
        className={styles.overlay}
      >
        <div className={styles.wrap}>
          <Input
            value={value}
            className={styles.input}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button
            secondary
            className={styles.clear}
            onClick={() => setValue("")}
            title="Clear input"
          >
            ✖
          </Button>
        </div>
        <Button
          secondary
          disabled={!value}
          className={`${styles.run} ${runHiddenClass}`}
          onClick={() => {
            updateParams({ ...json?.data });
          }}
          title="Excecute curl"
        >
          🚀
        </Button>
        <Button
          secondary
          className={`${styles.copy} ${copyHiddenClass}`}
          onClick={() => {
            navigator?.clipboard?.writeText?.(curl);
            setCopyVisibility(true);
            setTimeout(() => setCopyVisibility(false), 2000);
          }}
          title="Copy curl"
          elRef={btnRef}
        >
          📋
        </Button>
      </Overlay>
      <Overlay
        show={navigator?.clipboard && copyVisible}
        container={btnRef}
        className={styles.copied}
      >
        <Text type="text1">Copied to clipboard 📋</Text>
      </Overlay>
    </span>
  );
}
