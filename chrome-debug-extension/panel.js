// panel.js
const output = document.getElementById("output");

// Create and insert reset button
const resetBtn = document.getElementById("reset-btn");
resetBtn.addEventListener("click", () => {
  output.innerHTML = "";
});

document.body.insertBefore(resetBtn, output.parentElement);

// Toggle header checkbox sync
const toggle = document.getElementById("toggle-debug-header");
chrome.runtime.sendMessage({ getDebugHeaderStatus: true }, (res) => {
  if (res && typeof res.enabled === "boolean") {
    toggle.checked = res.enabled;
  }
});

toggle.addEventListener("change", () => {
  chrome.runtime.sendMessage(
    { toggleDebugHeader: toggle.checked },
    (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Runtime error:", chrome.runtime.lastError.message);
      } else {
        console.log("Header toggle response:", response);
      }
    }
  );
});

output.innerHTML = "";

function extractOperationName(query) {
  const match = query.match(/\b(query|mutation|subscription)\s+(\w+)/);
  return match ? match[2] : "(unnamed)";
}

function createVariableRow(variables, query, serviceCalls, responseJson) {
  const row = document.createElement("tr");
  row.className = "variables-row";
  const cell = document.createElement("td");
  cell.colSpan = 4;

  const wrapper = document.createElement("div");
  wrapper.className = "subrequests-wrapper";

  const queryEl = document.createElement("div");
  queryEl.className = "sub-json";
  queryEl.innerHTML = `<strong>Query:</strong><pre class="query-wrap" style="font-size: 12px;">${query}</pre>`;
  wrapper.appendChild(queryEl);

  const varEl = document.createElement("div");
  varEl.className = "sub-json";
  varEl.innerHTML = `<strong>Variables:</strong><pre class="json-wrap">${syntaxHighlight(variables)}</pre>`;
  wrapper.appendChild(varEl);

  const resEl = document.createElement("div");
  resEl.className = "sub-json";
  const trimmed = { ...responseJson };
  delete trimmed.extensions;
  resEl.innerHTML = `<strong>GraphQL Response:</strong><pre class="json-wrap">${syntaxHighlight(trimmed)}</pre>`;
  wrapper.appendChild(resEl);

  const label = document.createElement("strong");
  label.style.display = "block";
  label.style.marginTop = "24px";
  label.textContent = "Underlying service calls:";
  wrapper.appendChild(label);

  if (serviceCalls.length > 0) {
    const subTable = document.createElement("table");
    subTable.style.tableLayout = "fixed";
    subTable.style.width = "100%";
    subTable.innerHTML = `
      <thead>
        <tr><th>Service URL</th><th>Method</th><th>Status</th><th>Duration (ms)</th></tr>
      </thead>
    `;
    const subTbody = document.createElement("tbody");

    serviceCalls.forEach((r) => {
      const url = r.request?.url || "-";
      const method = r.request?.options?.method || "-";
      const status = r.response?.status || "-";
      const duration = r.request?.timings?.total?.toFixed(1) || "-";

      const tr = document.createElement("tr");
      tr.className = "sub-expandable";
      tr.innerHTML = `
        <td><span class="truncate" title="${url}" style="display:block; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${url}</span></td>
        <td>${method}</td>
        <td class="${status >= 500 ? "status-5xx" : status >= 400 ? "status-4xx" : "status-2xx"}">${status}</td>
        <td>${duration}</td>
      `;

      const jsonRow = document.createElement("tr");
      jsonRow.className = "sub-json-container";
      jsonRow.style.display = "none";
      const jsonCell = document.createElement("td");
      jsonCell.colSpan = 4;

      const cleanRequest = { ...r.request };
      delete cleanRequest.timings;

      const reqBox = document.createElement("div");
      reqBox.className = "sub-json";
      reqBox.innerHTML = `<strong>Request:</strong><pre class="json-wrap">${syntaxHighlight(cleanRequest)}</pre>`;

      const resBox = document.createElement("div");
      resBox.className = "sub-json";
      resBox.innerHTML = `<strong>Response:</strong><pre class="json-wrap">${syntaxHighlight(r.response)}</pre>`;

      const timeBox = document.createElement("div");
      timeBox.className = "sub-json";
      timeBox.innerHTML = `<strong>Timings:</strong><pre class="json-wrap">${syntaxHighlight(r.request?.timings || {})}</pre>`;

      jsonCell.appendChild(reqBox);
      jsonCell.appendChild(resBox);
      jsonCell.appendChild(timeBox);

      jsonRow.appendChild(jsonCell);

      tr.addEventListener("click", () => {
        jsonRow.style.display =
          jsonRow.style.display === "table-row" ? "none" : "table-row";
      });

      subTbody.appendChild(tr);
      subTbody.appendChild(jsonRow);
    });

    subTable.appendChild(subTbody);
    wrapper.appendChild(subTable);
  } else {
    const empty = document.createElement("em");
    empty.textContent = "No sub-requests found";
    wrapper.appendChild(empty);
  }

  cell.appendChild(wrapper);
  row.appendChild(cell);
  return row;
}

chrome.devtools.network.onRequestFinished.addListener(function (request) {
  if (
    request.request.method === "POST" &&
    request.request.url.includes("/graphql")
  ) {
    const requestBody = request.request.postData?.text;
    request.getContent(function (responseBody) {
      try {
        const requestJson = JSON.parse(requestBody || "{}");
        const responseJson = JSON.parse(responseBody || "{}");

        if (requestJson.query && responseJson.extensions?.debug) {
          const operationName = extractOperationName(requestJson.query);
          const status = request.response.status.toString();
          const time = new Date().toLocaleTimeString();
          const variables = requestJson.variables || {};
          const query = requestJson.query;
          const serviceCalls = responseJson.extensions.debug.requests || [];

          const row = document.createElement("tr");
          row.classList.add("collapsible");
          row.innerHTML = `
            <td><span class="nowrap" title="${operationName}">${operationName}</span></td>
            <td><span class="nowrap" title='${JSON.stringify(variables, null, 2)}'>${syntaxHighlight(JSON.stringify(variables).slice(0, 100))}${JSON.stringify(variables).length > 100 ? "..." : ""}</span></td>
            <td class="${status.startsWith("2") ? "status-2xx" : status.startsWith("4") || status.startsWith("5") ? "status-4xx status-5xx" : ""}">${status}</td>
            <td>${time}</td>
          `;

          const variablesRow = createVariableRow(
            variables,
            query,
            serviceCalls,
            responseJson
          );
          variablesRow.style.display = "none";

          row.addEventListener("click", () => {
            row.classList.toggle("expanded");
            variablesRow.style.display =
              variablesRow.style.display === "table-row" ? "none" : "table-row";
          });

          output.appendChild(row);
          output.appendChild(variablesRow);
        }
      } catch (e) {
        // ignore parse errors
      }
    });
  }
});

function syntaxHighlight(json) {
  if (typeof json != "string") {
    json = JSON.stringify(json, null, 2);
  }
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      var cls = "json-number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "json-key";
        } else {
          cls = "json-string";
        }
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    }
  );
}
