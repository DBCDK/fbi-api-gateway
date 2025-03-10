import { useEffect, useRef, useState } from "react";
import Text from "@/components/base/text";
import Overlay from "@/components/base/overlay";
import Input from "@/components/base/input";
import Button from "@/components/base/button";

import useStorage from "@/hooks/useStorage";
import useParseCurl from "@/hooks/useParseCurl";
import useQuery from "@/hooks/useQuery";

import { useExecutionContext, usePrettifyEditors } from "@graphiql/react";

import { useCreateCurl } from "@/hooks/useCreateCurl";
import { ToolbarButton } from "@graphiql/react";

import styles from "./Curl.module.css";
import { debounce } from "lodash";

export default function CurlButton({ className }) {
  const { setSelectedToken } = useStorage();
  const { params, trimmedParams, updateInitialParams } = useQuery();

  const { run = null } = useExecutionContext({
    nonNull: true,
  });

  const prettifyEditors = usePrettifyEditors();

  const curl = useCreateCurl({
    ...params,
  });

  const [submitting, setSubmitting] = useState(false);

  const [curlVisible, setCurlVisibility] = useState(false);
  const [copyVisible, setCopyVisibility] = useState(false);

  const [value, setValue] = useState("");
  const { json, hasError, hasEmptyQuery } = useParseCurl(value);

  const inputRef = useRef();
  const elRef = useRef();
  const btnRef = useRef();

  // Old and submitted curl is defined equal
  // We only look on the query and variabels for this
  const isEqual =
    trimmedParams?.query === json?.data?.query &&
    trimmedParams?.variables === JSON.stringify(json?.data?.variables);

  // store curl in value if/when curl exist.
  useEffect(() => {
    if (curl && !isEqual) {
      setValue(curl);
    }
  }, [curl]);

  // Submitt
  useEffect(() => {
    if (submitting) {
      // Run if no curl parse errors found
      if (!hasError) {
        // submitted curl params + profile and token
        const { data: params, token, profile } = json;

        updateInitialParams({ ...params });
        token && profile && setSelectedToken(token, profile);

        // Run if no empty query
        if (!hasEmptyQuery) {
          //  Try to prettify and run
          //  Note that this only works inside a GraphiQL contextProvider
          setTimeout(() => prettifyEditors?.(), 100);
        }
        setTimeout(() => run?.(), 500);

        setSubmitting(false);
        setCurlVisibility(false);
      }
    }
  }, [submitting, hasError]);

  // Hide buttons according to input
  const inputHasValueClass = !!value ? styles.hasValue : "";
  const hasParseErrorClass = !!value && hasError ? styles.hasError : "";

  const runHiddenClass = !value || isEqual ? styles.hidden : "";
  const copyHiddenClass = !value || !isEqual ? styles.hidden : "";
  const restoreHiddenClass = value ? styles.hidden : "";

  const handleOnChange = debounce((value) => setValue(value), 300);

  return (
    <span ref={elRef} className={`${styles.curl}  ${className}`}>
      <ToolbarButton
        className={styles.button}
        onClick={() => setCurlVisibility(!curlVisible)}
        label="Copy or submit a curl"
      >
        <Text type="text1">curl</Text>
      </ToolbarButton>
      <Overlay
        show={curlVisible}
        container={elRef}
        rootClose={true}
        onHide={() => setCurlVisibility(false)}
        className={`${styles.overlay} ${hasParseErrorClass}`}
      >
        <div className={styles.wrap}>
          <Input
            elRef={inputRef}
            value={value}
            className={`${inputHasValueClass} ${styles.input}`}
            onChange={(e) => handleOnChange(e.target.value)}
          />
          <Button
            secondary
            className={styles.clear}
            onClick={() => {
              setValue("");
              setTimeout(() => inputRef?.current?.focus(), 100);
            }}
            title="Clear input"
          >
            ✖
          </Button>
          {navigator?.clipboard && (
            <Button
              secondary
              className={styles.paste}
              onClick={() => {
                if (!value) {
                  navigator?.clipboard?.readText?.().then((txt) => {
                    setValue(txt);
                  });
                }
              }}
              title="Paste from clipboard"
            >
              📋
            </Button>
          )}
        </div>

        <Button
          secondary
          className={`${styles.restore} ${restoreHiddenClass}`}
          onClick={() => setValue(curl)}
          title="Restore original curl"
        >
          <span>⤴️</span>
        </Button>
        <Button
          secondary
          disabled={hasError}
          className={`${styles.run} ${runHiddenClass}`}
          onClick={() => setSubmitting(true)}
          title="Submit curl"
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
          📄
          {/* 📝 */}
        </Button>
      </Overlay>
      <Overlay
        show={navigator?.clipboard && copyVisible}
        container={btnRef}
        className={styles.copied}
      >
        <Text type="text1">Copied to clipboard 📋</Text>
      </Overlay>

      <Overlay
        show={!!value && hasError}
        container={inputRef}
        className={styles.error}
      >
        <Text type="text1">This is not a valid curl 🧐</Text>
      </Overlay>
    </span>
  );
}
