/**
 * @file Expanded content for an application item, including note editing, token and
 * client details, optional clientSecret entry, and user/login metadata.
 */
import Text from "@/components/base/text";

import AgencyList from "../agency-list/AgencyList";
import ItemClientSecretForm from "../item-client-secret-form";
import styles from "./ItemExpandedDetails.module.css";

export default function ItemExpandedDetails({ item, ui, form, actions }) {
  const {
    id,
    type,
    token,
    clientId,
    displayName,
    note,
    savedNote,
    profile,
    configuration,
    user,
    hasCulrAccount,
    submitted,
    expires,
    expireStatus,
  } = item;
  const {
    open,
    scrollRef,
    showExpandedClientSecretSection,
    showExpandedClientSecretForm,
    canManageAttachedClientSecret,
    isEditingClientSecret,
    isEditingNote,
  } = ui;
  const { clientSecret, clientSecretError, clientSecretInputId } = form;
  const agencyIdsList = configuration?.agencies;
  const defaultAgencyId = configuration?.defaultAgency;
  const alwaysRequireAgencyId = configuration?.alwaysRequireAgencyId;
  const isAuthenticated = user?.isAuthenticated;
  const agencies = user?.agencies;
  const hasOmittedCulrData = user?.omittedCulrData;
  const customNameInputId = `input-custom-name-${id || token || clientId}`;
  const hasCustomDisplayName =
    typeof savedNote === "string" &&
    savedNote.trim() &&
    savedNote.trim() !== displayName;
  const showValidatedClientSecretAction =
    canManageAttachedClientSecret && !isEditingClientSecret;
  const secretActionLabel = isEditingClientSecret
    ? "Cancel editing secret"
    : showValidatedClientSecretAction
      ? "Remove validated secret"
      : "Edit secret";
  const handleSecretAction = isEditingClientSecret
    ? actions.cancelEditingClientSecret
    : showValidatedClientSecretAction
      ? actions.prepareClientSecretRemoval
      : actions.startEditingClientSecret;
  const draftSecretActionLabel = clientSecret
    ? "Clear draft secret"
    : "Edit secret";
  const handleDraftSecretAction = clientSecret
    ? () => actions.setClientSecret("")
    : actions.startEditingClientSecret;

  return (
    <div
      className={styles.collapsed}
      ref={scrollRef}
      aria-hidden={!open}
      inert={!open ? "" : undefined}
    >
      <div className={styles.user}>
        <div className={styles.heading}>
          <Text type="text1">Client details</Text>
        </div>

        <div className={styles.clientDisplayName}>
          <Text type="text4">Display Name</Text>
          <div className={styles.nameSummaryRow}>
            <div className={styles.nameValue}>
              {isEditingNote ? (
                <div className={styles.nameInlineEditor}>
                  <input
                    id={customNameInputId}
                    className={styles.nameInput}
                    value={note}
                    autoComplete="off"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength="50"
                    placeholder="Custom client name ..."
                    onChange={(e) => actions.setNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        actions.useCredential();
                      }
                    }}
                  />
                </div>
              ) : (
                <Text as="span" type="text1" className={styles.nameText}>
                  {savedNote || displayName || "Unknown ⚠️"}
                </Text>
              )}
            </div>
            <button
              type="button"
              className={styles.secretAction}
              aria-label={
                isEditingNote
                  ? "Cancel editing custom name"
                  : "Edit custom name"
              }
              title={
                isEditingNote
                  ? "Cancel editing custom name"
                  : "Edit custom name"
              }
              onClick={
                isEditingNote
                  ? actions.cancelEditingNote
                  : actions.startEditingNote
              }
            >
              {isEditingNote ? "❌" : "✏️"}
            </button>
          </div>
        </div>

        {hasCustomDisplayName && (
          <div className={styles.clientOriginalDisplayName}>
            <Text type="text4">Original Display Name</Text>
            <Text type="text1">{displayName || "Unknown ⚠️"}</Text>
          </div>
        )}

        <div className={styles.clientId}>
          <Text type="text4">ClientID</Text>
          <Text type="text1">{clientId}</Text>
        </div>

        {showExpandedClientSecretSection && (
          <>
            {canManageAttachedClientSecret && (
              <div className={styles.clientSecretSummary}>
                <Text type="text4">Client secret</Text>
                <div className={styles.secretSummaryRow}>
                  <div className={styles.secretValue}>
                    {isEditingClientSecret ? (
                      <div className={styles.secretInlineForm}>
                        <ItemClientSecretForm
                          inputId={clientSecretInputId}
                          clientSecret={clientSecret}
                          clientSecretError={clientSecretError}
                          setClientSecret={actions.setClientSecret}
                          onEnter={actions.useCredential}
                          showAction={false}
                          hideLabel
                        />
                      </div>
                    ) : (
                      <Text as="span" type="text1" className={styles.secretMask}>
                        ************
                      </Text>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.secretAction}
                    aria-label={secretActionLabel}
                    title={secretActionLabel}
                    onClick={handleSecretAction}
                  >
                    {isEditingClientSecret ? "❌" : "✏️"}
                  </button>
                </div>
              </div>
            )}

            {showExpandedClientSecretForm && !canManageAttachedClientSecret && (
              <ItemClientSecretForm
                inputId={clientSecretInputId}
                clientSecret={clientSecret}
                clientSecretError={clientSecretError}
                setClientSecret={actions.setClientSecret}
                onEnter={actions.useCredential}
                showAction={false}
                trailingAction={
                  <button
                    type="button"
                    className={styles.secretAction}
                    aria-label={draftSecretActionLabel}
                    title={draftSecretActionLabel}
                    onClick={handleDraftSecretAction}
                  >
                    {clientSecret ? "❌" : "✏️"}
                  </button>
                }
              />
            )}
          </>
        )}

        <div className={styles.details}>
          <div>
            <Text type="text4">Default AgencyId</Text>
            <Text type="text1">{defaultAgencyId || "Not set ⚠️"}</Text>
          </div>
          <div>
            <Text type="text4">Profile</Text>
            <Text type="text1">{profile || "Not set ⚠️"}</Text>
          </div>
        </div>

        <div className={styles.alwaysRequireAgencyId}>
          <Text type="text4">AgencyId required in URL</Text>
          <Text type="text1">
            {alwaysRequireAgencyId?.toString() || "false"}
          </Text>
        </div>

        {agencyIdsList?.length > 0 && (
          <AgencyList
            title={`Client agencies (${agencyIdsList.length})`}
            items={agencyIdsList}
          />
        )}
      </div>

      <hr className={styles.divider} />

      <div className={styles.user}>
        <div className={styles.heading}>
          <Text type="text1">Resolved token details</Text>
        </div>

        <div className={styles.submitted}>
          <Text type="text4">Submitted at</Text>
          <Text type="text1">
            {submitted.date} <span>{submitted.time}</span>
          </Text>
        </div>

        <div className={styles.expires}>
          <Text type="text4">Expiration date</Text>
          <div>
            <i
              className={`${styles.indicator} ${
                expireStatus ? styles[expireStatus] : ""
              }`}
            />
            <Text type="text1">
              {expires.date}
              <span>{expires.time}</span>
            </Text>
          </div>
        </div>

        <div className={styles.token}>
          <Text type="text4">
            {type === "client" ? "Resolved token" : "Access token"}
          </Text>
          <Text type="text1">{token || "Not resolved yet"}</Text>
        </div>
      </div>

      {isAuthenticated && token && <hr className={styles.divider} />}

      {isAuthenticated && token && (
        <div className={styles.user}>
          <div className={styles.heading}>
            <Text type="text1">User informations</Text>
          </div>

          {user?.name && (
            <div className={styles.name}>
              <Text type="text4">Name</Text>
              <Text type="text1">{user?.name}</Text>
            </div>
          )}
          {user?.mail && (
            <div className={styles.mail}>
              <Text type="text4">Mail</Text>
              <Text type="text1">{user?.mail}</Text>
            </div>
          )}

          {user?.municipalityAgencyId && (
            <div className={styles.municipalityAgencyId}>
              <Text type="text4">MunicipalityAgencyId</Text>
              <Text type="text1">{user?.municipalityAgencyId}</Text>
            </div>
          )}

          <div className={styles.details}>
            <div className={styles.isCPRValidated}>
              <Text type="text4">IsCPRValidated</Text>
              <Text type="text1">{user?.isCPRValidated.toString()}</Text>
            </div>

            <div className={styles.culr}>
              <Text type="text4">HasCulrUniqueId</Text>
              <Text type="text1">{`${hasCulrAccount.toString()} ${
                !hasCulrAccount ? " ⚠️" : ""
              }`}</Text>
            </div>
          </div>

          {agencies?.length > 0 && (
            <AgencyList
              title={`Token user agencies (${agencies.length})`}
              items={agencies}
            />
          )}
        </div>
      )}

      {isAuthenticated && token && <hr className={styles.divider} />}

      {isAuthenticated && token && (
        <div className={styles.user}>
          <div className={styles.heading}>
            <Text type="text1">Login details</Text>
          </div>

          <div className={styles.details}>
            {user?.loggedInBranchId && (
              <div className={styles.loggedInBranchId}>
                <Text type="text4">LoggedInBranchId</Text>
                <Text type="text1">{user?.loggedInBranchId}</Text>
              </div>
            )}
            {user?.loggedInAgencyId && (
              <div className={styles.loggedInAgencyId}>
                <Text type="text4">LoggedInAgencyId</Text>
                <Text type="text1">{user?.loggedInAgencyId}</Text>
              </div>
            )}
          </div>
          {user?.identityProviderUsed && (
            <div>
              <Text type="text4">IdentityProviderUsed</Text>
              <Text type="text1">{user?.identityProviderUsed}</Text>
            </div>
          )}
        </div>
      )}

      {hasOmittedCulrData && <hr className={styles.divider} />}

      {hasOmittedCulrData && (
        <div className={styles.user}>
          <div className={styles.heading}>
            <Text type="text1">Omitted Culr data</Text>
          </div>

          <div className={styles.details}>
            <div className={styles.hasOmittedCulrUniqueId}>
              <Text type="text4">UniqueId</Text>
              <Text type="text1">
                {hasOmittedCulrData?.hasOmittedCulrUniqueId.toString()}
              </Text>
            </div>

            <div className={styles.culr}>
              <Text type="text4">Accounts</Text>
              <Text type="text1">
                {hasOmittedCulrData?.hasOmittedCulrAccounts.toString()}
              </Text>
            </div>
          </div>

          <div className={styles.details}>
            <div className={styles.isCPRValidated}>
              <Text type="text4">Municipality</Text>
              <Text type="text1">
                {hasOmittedCulrData?.hasOmittedCulrMunicipality.toString()}
              </Text>
            </div>

            <div className={styles.culr}>
              <Text type="text4">MunicipalityAgencyId</Text>
              <Text type="text1">
                {hasOmittedCulrData?.hasOmittedCulrMunicipalityAgencyId.toString()}
              </Text>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
