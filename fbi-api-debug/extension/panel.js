const output = document.getElementById("output");
const resetBtn = document.getElementById("reset-btn");
const toggle = document.getElementById("toggle-debug-header");
const filterInput = document.getElementById("filter-input");

let requests = [];

// === UI SETUP ===

resetBtn.addEventListener("click", () => {
  requests = [];
  renderRows([]);
});

document.body.insertBefore(resetBtn, output.parentElement);

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

filterInput.addEventListener("input", () => {
  renderRows(filterRows());
});

// === LISTENER ===

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

          requests.push({
            operationName,
            variables,
            query,
            serviceCalls,
            responseJson,
            status,
            time,
          });
          renderRows(filterRows());
        }
      } catch (e) {
        // ignore parse errors
      }
    });
  }
});

// === FILTERING ===

function filterRows() {
  const filterValue = filterInput.value.toLowerCase();

  return requests.filter((req) => {
    const query = req.query || "";
    const vars = JSON.stringify(req.variables || {});
    const response = JSON.stringify(req.responseJson || {});
    return `${query} ${vars} ${response}`.toLowerCase().includes(filterValue);
  });
}

// === RENDERING ===

function renderRows(requestList) {
  output.innerHTML = "";

  for (const req of requestList) {
    const {
      operationName,
      variables,
      query,
      serviceCalls,
      responseJson,
      status,
      time,
    } = req;

    const row = document.createElement("tr");
    row.classList.add("collapsible");
    row.innerHTML = `
      <td><span class="nowrap" title="${operationName}">${operationName}</span></td>
      <td><span class="nowrap" title='${JSON.stringify(variables, null, 2)}'>
        ${syntaxHighlight(JSON.stringify(variables).slice(0, 100))}${JSON.stringify(variables).length > 100 ? "..." : ""}
      </span></td>
      <td class="${status.startsWith("2") ? "status-2xx" : status.startsWith("4") || status.startsWith("5") ? "status-4xx status-5xx" : ""}">${status}</td>
      <td>${time}</td>
    `;

    const detailRow = createVariableRow(
      variables,
      query,
      serviceCalls,
      responseJson
    );
    detailRow.style.display = "none";

    row.addEventListener("click", () => {
      row.classList.toggle("expanded");
      detailRow.style.display =
        detailRow.style.display === "table-row" ? "none" : "table-row";
    });

    output.appendChild(row);
    output.appendChild(detailRow);
  }
}

// === UTILITIES ===

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
  queryEl.className = "sub-json collapsed";
  queryEl.innerHTML = `<strong>Query:</strong><pre class="query-wrap" style="font-size: 12px;">${query}</pre>`;
  wrapper.appendChild(queryEl);
  queryEl.addEventListener("click", () =>
    queryEl.classList.toggle("collapsed")
  );

  const varEl = document.createElement("div");
  varEl.className = "sub-json collapsed";
  varEl.innerHTML = `<strong>Variables:</strong><pre class="json-wrap">${syntaxHighlight(variables)}</pre>`;
  wrapper.appendChild(varEl);
  varEl.addEventListener("click", () => varEl.classList.toggle("collapsed"));

  const resEl = document.createElement("div");
  resEl.className = "sub-json collapsed";
  const trimmed = { ...responseJson };
  delete trimmed.extensions;
  resEl.innerHTML = `<strong>GraphQL Response:</strong><pre class="json-wrap">${syntaxHighlight(trimmed)}</pre>`;
  wrapper.appendChild(resEl);
  resEl.addEventListener("click", () => resEl.classList.toggle("collapsed"));

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
      reqBox.className = "sub-json collapsed";
      reqBox.innerHTML = `<strong>Request:</strong><pre class="json-wrap">${syntaxHighlight(cleanRequest)}</pre>`;
      reqBox.addEventListener("click", () =>
        reqBox.classList.toggle("collapsed")
      );

      const resBox = document.createElement("div");
      resBox.className = "sub-json collapsed";
      resBox.innerHTML = `<strong>Response:</strong><pre class="json-wrap">${syntaxHighlight(r.response)}</pre>`;
      resBox.addEventListener("click", () =>
        resBox.classList.toggle("collapsed")
      );

      const timeBox = document.createElement("div");
      timeBox.className = "sub-json collapsed";
      timeBox.innerHTML = `<strong>Timings:</strong><pre class="json-wrap">${syntaxHighlight(r.request?.timings || {})}</pre>`;
      timeBox.addEventListener("click", () =>
        timeBox.classList.toggle("collapsed")
      );

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
