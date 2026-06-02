/**
 * @file Expanded content for a history item, including note editing, token and
 * client details, optional clientSecret entry, and user/login metadata.
 */
import Text from "@/components/base/text";

import AgencyList from "../agency-list/AgencyList";
import ItemClientSecretForm from "../item-client-secret-form";
import styles from "./ItemExpandedDetails.module.css";

export default function ItemExpandedDetails({
  item,
  ui,
  form,
  actions,
}) {
  const {
    id,
    type,
    token,
    clientId,
    profile,
    note,
    configuration,
    user,
    hasCulrAccount,
    submitted,
    expires,
    expireStatus,
  } = item;
  const { open, scrollRef, showExpandedClientSecretForm } = ui;
  const { clientSecret, clientSecretError, clientSecretInputId } = form;
  const agencyIdsList = configuration?.agencies;
  const defaultAgencyId = configuration?.defaultAgency;
  const alwaysRequireAgencyId = configuration?.alwaysRequireAgencyId;
  const isAuthenticated = user?.isAuthenticated;
  const agencies = user?.agencies;
  const hasOmittedCulrData = user?.omittedCulrData;
  const noteInputId = `input-note-${id || token || clientId}`;

  return (
    <div className={styles.collapsed} ref={scrollRef}>
      <div className={styles.user}>
        <div className={styles.heading}>
          <Text type="text1">Token details</Text>
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

      <hr className={styles.divider} />

      <div className={styles.user}>
        <div className={styles.heading}>
          <Text type="text1">Client details</Text>
        </div>

        <div className={styles.clientId}>
          <Text type="text4">ClientID</Text>
          <Text type="text1">{clientId}</Text>
        </div>

        <div className={styles.details}>
          <div>
            <Text type="text4">Default AgencyId</Text>
            <Text type="text1">{defaultAgencyId || "None"}</Text>
          </div>
          <div>
            <Text type="text4">Profile</Text>
            <Text type="text1">
              {profile || "None 😵‍💫"} {profile === "none" && "⚠️"}
            </Text>
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

        {showExpandedClientSecretForm && (
          <>
            <hr className={styles.divider} />

            <div className={styles.attachments}>
              <div className={styles.heading}>
                <Text type="text1">Client attachments</Text>
              </div>

              <div className={styles.clientNote}>
                <Text type="text4">Client note</Text>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldIcon} aria-hidden="true">
                    📝
                  </span>
                  <input
                    id={noteInputId}
                    value={note}
                    disabled={!open}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.keyCode === 13) {
                        const el = document.getElementById(noteInputId);
                        el.blur();
                      }
                    }}
                    autoComplete="off"
                    maxLength="50"
                    placeholder={open ? "Add client note ..." : false}
                    onChange={(e) => actions.setNote(e.target.value)}
                    onBlur={() => actions.saveNote()}
                  />
                </div>
              </div>

              {showExpandedClientSecretForm && (
                <ItemClientSecretForm
                  inputId={clientSecretInputId}
                  clientSecret={clientSecret}
                  clientSecretError={clientSecretError}
                  setClientSecret={actions.setClientSecret}
                  showAction={false}
                />
              )}
            </div>
          </>
        )}
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
