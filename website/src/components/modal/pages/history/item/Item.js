import Text from "@/components/base/text";
import Button from "@/components/base/button";

import ExpandButton from "./expand-button/ExpandButton";
import ItemClientSecretForm from "./item-client-secret-form";
import ItemExpandedDetails from "./item-expanded-details";
import useHistoryItemController from "./useHistoryItemController";
import styles from "./Item.module.css";

function HistoryItemView({ item, ui, form, actions }) {
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
        >
          {ui.removed || ui.hasValidationError ? (
            <div>
              <Text type="text4">
                {ui.removed ? "This token was removed 🗑️" : item.statusMessage}
              </Text>
              <Text type="text1">{item.token || item.clientId}</Text>
            </div>
          ) : (
            <>
              <Text type={ui.open ? "text6" : "text4"}>
                {item.displayName || item.clientId}
              </Text>

              {!ui.needsClientSecret && item.token && (
                <Text className={styles.authentication}>
                  {`This token is ${
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
                !ui.showInlineClientSecretForm && (
                  <Text className={styles.authentication}>
                    This token will need a{" "}
                    <button
                      type="button"
                      className={styles.inlineAction}
                      onClick={actions.focusClientSecret}
                    >
                      clientSecret
                    </button>{" "}
                    to renew on <i>External</i> network 🌍
                  </Text>
                )}

              {ui.missingConfiguration && (
                <Text type="text4" className={styles.missingConfigWarn}>
                  Client has missing configuration 😵‍💫
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
          {!ui.needsClientSecret && <hr />}
          <div className={styles.buttons}>
            <div className={styles.removeSlot}>
              <Button
                className={`${styles.remove} ${
                  ui.isConfirmingRemove ? styles.removeHidden : styles.removeVisible
                }`}
                size="small"
                onClick={actions.requestRemove}
                secondary
              >
                Remove
              </Button>
              <div
                className={`${styles.removeConfirmActions} ${
                  ui.isConfirmingRemove
                    ? styles.confirmVisible
                    : styles.confirmHidden
                }`}
              >
                <Button
                  className={styles.removeCancelButton}
                  size="small"
                  onClick={actions.cancelRemove}
                  secondary
                  aria-label="Cancel remove"
                >
                  ❌
                </Button>
                <Button
                  className={styles.removeConfirmButton}
                  size="small"
                  onClick={actions.confirmRemove}
                  secondary
                  aria-label="Confirm remove"
                >
                  ✅
                </Button>
              </div>
            </div>
            <Button
              className={styles.use}
              disabled={ui.isUseDisabled}
              size="small"
              onClick={actions.useCredential}
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
  const controller = useHistoryItemController(props);

  if (controller.isLoadingView) {
    return <ItemIsLoading isEntering={props.isEntering} />;
  }

  return <HistoryItemView {...controller} />;
}

export default Item;
