import Text from "@/components/base/text";
import Button from "@/components/base/button";

import ExpandButton from "./expand-button/ExpandButton";
import ItemClientSecretForm from "./item-client-secret-form";
import ItemExpandedDetails from "./item-expanded-details";
import useApplicationItemController from "@/hooks/useApplicationItemController";
import styles from "./Item.module.css";

function getReadableTextColor(hex) {
  if (typeof hex !== "string") {
    return null;
  }

  const normalized = hex.trim().replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 155 ? "#111111" : "#ffffff";
}

function ApplicationItemView({ item, ui, form, actions }) {
  const expireStatusClass = item.expireStatus ? styles[item.expireStatus] : "";
  const expiredClass = ui.hasValidationError ? styles.expired : "";
  const inUseClass = item.inUse ? styles.inUse : "";
  const expandedClass = ui.open ? styles.expanded : "";
  const expandedGlobalClass = ui.open ? "expanded" : "";
  const missingConfigClass = ui.missingConfiguration
    ? styles.missingConfig
    : "";
  const missingConfigGlobalClass = ui.missingConfiguration
    ? "missingConfig"
    : "";
  const removedClass = ui.removed ? styles.removed : "";
  const removingClass = item.isRemoving ? styles.removing : "";
  const enteringClass = item.isEntering ? styles.entering : "";
  const revealClass = ui.reveal ? styles.reveal : "";
  const expandedHeaderColor = item.logoColor || "var(--divider)";
  const expandedDisplayStyle = ui.open
    ? {
        backgroundColor: expandedHeaderColor,
        color: getReadableTextColor(item.logoColor) || undefined,
      }
    : undefined;
  const shouldShowBottomRemove = ui.open || (item.type === "client" && !ui.canExpand);

  function renderRemoveActions(className = "") {
    return (
      <div className={`${styles.removeSlot} ${className}`.trim()}>
        <Button
          className={`${styles.remove} ${
            ui.isConfirmingRemove ? styles.removeHidden : styles.removeVisible
          }`}
          size="small"
          onClick={actions.requestRemove}
          tabIndex={ui.isConfirmingRemove ? "-1" : "0"}
          secondary
        >
          Remove
        </Button>
        <div
          className={`${styles.removeConfirmActions} ${
            ui.isConfirmingRemove ? styles.confirmVisible : styles.confirmHidden
          }`}
        >
          <Button
            className={styles.removeCancelButton}
            size="small"
            onClick={actions.cancelRemove}
            tabIndex={ui.isConfirmingRemove ? "0" : "-1"}
            secondary
            aria-label="Cancel remove"
          >
            ❌
          </Button>
          <Button
            className={styles.removeConfirmButton}
            size="small"
            onClick={actions.confirmRemove}
            tabIndex={ui.isConfirmingRemove ? "0" : "-1"}
            secondary
            aria-label="Confirm remove"
          >
            ✅
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ui.elRef}
      className={`${styles.item} ${expiredClass} ${expireStatusClass} ${inUseClass} ${expandedClass} ${expandedGlobalClass} ${missingConfigClass} ${missingConfigGlobalClass} ${removedClass} ${removingClass} ${enteringClass} ${revealClass}`}
    >
      <div
        className={styles.content}
        style={{
          top: `${ui.contentTop}px`,
        }}
      >
        <div
          className={`${styles.display} ${
            ui.open && ui.isScrolled ? styles.displayScrolled : ""
          }`}
          style={expandedDisplayStyle}
        >
          {ui.removed || ui.hasValidationError ? (
            <div>
              <Text type="text4">
                {ui.removed ? "This client was removed 🗑️" : item.statusMessage}
              </Text>
              <Text type="text1">{item.token || item.clientId}</Text>
              {!ui.removed && ui.canExpand && (
                <ExpandButton
                  onClick={() => actions.setOpen(!ui.open)}
                  open={ui.open}
                />
              )}
            </div>
          ) : (
            <>
              <Text type={ui.open ? "text6" : "text4"}>
                {item.displayName || item.clientId}
              </Text>

              {!ui.needsClientSecret && item.token && (
                <Text className={styles.authentication}>
                  {`Resolved token is ${
                    item.user?.isAuthenticated ? "AUTHENTICATED" : "ANONYMOUS"
                  }`}
                  {item.user?.isAuthenticated && (
                    <span> 🧑 {!item.hasCulrAccount && <i>⚠️</i>}</span>
                  )}
                </Text>
              )}

              {ui.needsClientSecret && (
                <Text className={styles.authentication}>
                  {item.clientSecretMessage}
                </Text>
              )}

              {!ui.needsClientSecret &&
                ui.shouldPromptForGlobalClientSecret &&
                !ui.open &&
                !ui.showInlineClientSecretForm && (
                  <Text className={styles.authentication}>
                    Add a{" "}
                    <button
                      type="button"
                      className={styles.inlineAction}
                      onClick={actions.focusClientSecret}
                    >
                      secret
                    </button>{" "}
                    for automatic renewal 🤫
                  </Text>
                )}

              {!ui.open && ui.missingConfiguration && (
                <Text
                  className={`${styles.authentication} ${styles.missingConfigText}`}
                >
                  Missing client configuration 😵‍💫
                </Text>
              )}

              {ui.canExpand && (
                <ExpandButton
                  onClick={() => actions.setOpen(!ui.open)}
                  open={ui.open}
                />
              )}

              {item.note && <Text className={styles.note}>{item.note}</Text>}
            </>
          )}
        </div>

        {ui.showInlineClientSecretForm && (
          <ItemClientSecretForm
            inputId={form.clientSecretInputId}
            clientSecret={form.clientSecret}
            clientSecretError={form.clientSecretError}
            setClientSecret={actions.setClientSecret}
            inlineWarning
            showAction={false}
          />
        )}

        <ItemExpandedDetails
          item={item}
          ui={ui}
          form={form}
          actions={actions}
        />

        <div className={styles.bottom}>
          <hr />
          <div className={styles.buttons}>
            {shouldShowBottomRemove && renderRemoveActions()}
            <Button
              className={styles.use}
              disabled={ui.isUseDisabled}
              size="small"
              onClick={actions.useCredential}
              onMouseEnter={() => actions.setUseButtonHovered(true)}
              onMouseLeave={() => actions.setUseButtonHovered(false)}
              onFocus={() => actions.setUseButtonHovered(true)}
              onBlur={() => actions.setUseButtonHovered(false)}
              primary
            >
              {ui.useButtonLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ItemIsLoading({ isEntering = false }) {
  return (
    <div
      className={`${styles.item} ${styles.isLoading} ${
        isEntering ? styles.entering : ""
      }`}
    >
      <div className={styles.loadingMeta}></div>
    </div>
  );
}

function Item(props) {
  const controller = useApplicationItemController(props);

  if (controller.isLoadingView) {
    return <ItemIsLoading isEntering={props.isEntering} />;
  }

  return <ApplicationItemView {...controller} />;
}

export default Item;
