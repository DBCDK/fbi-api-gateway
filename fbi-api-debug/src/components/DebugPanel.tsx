/**
 * DebugPanel component
 *
 * Provides a developer panel to inspect GraphQL requests and their related service calls.
 * Allows filtering, selecting, and viewing detailed information about each request,
 * including queries, variables, responses, and underlying service interactions.
 */
import React, { useEffect, useState } from "react";
import styles from "./DebugPanel.module.css";
import TabMenu from "./TabMenu";
import {
  RequestData,
  ServiceCall,
  useGraphQLRequests,
} from "@/hooks/useGraphQLRequests";
import { JSONText } from "./JsonText";
import { Collapse } from "./Collapse";
import { BanIcon } from "./BanIcon";
import { Divider } from "./Divider";

function ServiceCallContent({ call }: { call: ServiceCall }) {
  return (
    <div>
      <Collapse title="Request">
        <JSONText text={{ ...call.request, timings: undefined }} />
      </Collapse>
      <Collapse title="Response">
        <JSONText text={call.response} />
      </Collapse>
      <Collapse title="Timings">
        <JSONText text={call.request.timings || ""} />
      </Collapse>
    </div>
  );
}

function GraphQLRequestContent({ request }: { request: RequestData }) {
  const [selectedServiceCall, setSelectedServiceCall] =
    useState<ServiceCall | null>();
  const [selectedTab, setSelectedTab] = useState("Query");
  const req = request;
  useEffect(() => {
    setSelectedServiceCall(null);
  }, [request]);

  return (
    <div className={styles.graphqlrequestcontent}>
      <TabMenu
        onSelect={(tab) => setSelectedTab(tab)}
        tabs={["Query", "Variables", "Response", "Services"]}
      />
      <div
        className={`${styles.content} ${selectedServiceCall ? styles.serviceIsSelected : ""}`}
      >
        {selectedTab === "Query" && (
          <div>
            <span className={styles.querytext}>{req.query}</span>
          </div>
        )}
        {selectedTab === "Variables" && (
          <div>
            <JSONText text={req.variables} />
          </div>
        )}
        {selectedTab === "Response" && (
          <div>
            <JSONText text={{ ...req.responseJson, extensions: undefined }} />
          </div>
        )}
        {selectedTab === "Services" && (
          <>
            <div className={styles.services}>
              {req.serviceCalls.length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "70%" }}>Service URL</th>
                      {!selectedServiceCall && <th>Status</th>}
                      {!selectedServiceCall && <th>Duration</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {req.serviceCalls.map((call, i) => (
                      <React.Fragment key={i}>
                        <tr
                          className={
                            call === selectedServiceCall ? styles.selected : ""
                          }
                          onClick={() =>
                            setSelectedServiceCall(
                              call === selectedServiceCall ? null : call
                            )
                          }
                        >
                          <td>{call.request.url}</td>
                          {!selectedServiceCall && (
                            <td>{call.response.status}</td>
                          )}
                          {!selectedServiceCall && (
                            <td>
                              {call.request.timings?.total?.toFixed(1) || "-"}
                            </td>
                          )}
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {selectedServiceCall && (
              <div className={styles.servicecallwrapper}>
                <ServiceCallContent call={selectedServiceCall} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const DebugPanel: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>();

  const [filterVal, setFilterVal] = useState("");
  const { requests, clearRequests } = useGraphQLRequests({ filter: filterVal });

  return (
    <div className={styles.panel}>
      <div className={styles.settings}>
        <input
          className={styles.filterinput}
          value={filterVal}
          onChange={(e) => setFilterVal(e.target.value)}
          placeholder="Filter"
        />
        <Divider />
        <BanIcon
          title="Clear Log"
          onClick={() => {
            clearRequests();
          }}
        />
      </div>

      <div className={styles.section}>
        <div></div>
        <table>
          <thead>
            <tr>
              <th>Operation</th>
              <th>Variables</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, index) => (
              <React.Fragment key={index}>
                <tr
                  className={req === selectedRequest ? styles.selected : ""}
                  onClick={() => setSelectedRequest(req)}
                >
                  <td className={styles.nowrap}>{req.operationName}</td>
                  <td className={styles.nowrap}>
                    <JSONText text={req.variables} collapsed={true} />
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {selectedRequest && (
        <div className={styles.section}>
          <GraphQLRequestContent request={selectedRequest} />
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
