import { useEffect, useState } from "react";
import Input from "@/components/base/input";
import Chip from "@/components/base/chip";
import styles from "./Search.module.css";

const SCOPES = [
  { value: "fields", label: "Fields", placeholder: "Search fields…" },
  {
    value: "arguments",
    label: "Arguments",
    placeholder: "Search arguments…",
  },
  {
    value: "inputFields",
    label: "Input fields",
    placeholder: "Search input fields…",
  },
];

const FILTERS = [
  { command: "client", key: "clientId", label: "Client" },
  { command: "agency", key: "agencyId", label: "Agency" },
  { command: "profile", key: "profileName", label: "Profile" },
];

function parseFilter(value) {
  const trimmed = value.trim();
  const command = trimmed.match(/^\/(client|agency|profile)(?::|\s+)\s*(.+)$/i);
  if (command) {
    const config = FILTERS.find(
      ({ command: name }) => name === command[1].toLowerCase()
    );
    return { key: config.key, value: command[2].trim() };
  }

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed
    )
  ) {
    return { key: "clientId", value: trimmed };
  }
  if (/^\d{6}$/.test(trimmed)) {
    return { key: "agencyId", value: trimmed };
  }
  return null;
}

function displayFilterValue(key, value) {
  if (key === "clientId" && value.length > 4) {
    return `${value.slice(0, 4)}\u2026`;
  }
  return value;
}

function getFilter(filters, key) {
  const filter = filters[key];
  if (typeof filter === "string") {
    return { mode: filter ? "include" : "off", value: filter };
  }
  return {
    mode: filter?.mode || "off",
    value: filter?.value || "",
  };
}

export default function Search({
  value = "",
  onChange,
  scope = "fields",
  onScopeChange,
  filters = {},
  onFiltersChange,
}) {
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const selectedScope = SCOPES.find(({ value: key }) => key === scope);
  const commandQuery = value
    .trim()
    .match(/^\/([^\s:]*)$/)?.[1]
    ?.toLowerCase();
  const suggestions =
    commandQuery === undefined
      ? []
      : FILTERS.filter(({ command }) => command.startsWith(commandQuery));
  const hasSuggestions = suggestions.length > 0;
  const safeCommandIndex = hasSuggestions
    ? Math.min(activeCommandIndex, suggestions.length - 1)
    : 0;
  const activeCommand = suggestions[safeCommandIndex];

  useEffect(() => {
    setActiveCommandIndex(0);
  }, [commandQuery]);

  const selectCommand = (item) => {
    onChange?.(`/${item.command} `);
  };

  const commitFilter = () => {
    const parsed = parseFilter(value);
    if (!parsed?.value) return false;
    onFiltersChange?.({
      ...filters,
      [parsed.key]: { mode: "include", value: parsed.value },
    });
    onChange?.("");
    return true;
  };

  const removeFilter = (key) => {
    onFiltersChange?.({
      ...filters,
      [key]: { mode: "off", value: "" },
    });
  };

  const changeFilterMode = (key, mode) =>
    onFiltersChange?.({
      ...filters,
      [key]: { ...getFilter(filters, key), mode },
    });

  return (
    <div className={styles.container}>
      <div className={styles.control}>
        <label className={styles.scopeLabel}>
          <span className={styles.srOnly}>Search in</span>
          <select
            className={styles.scope}
            value={scope}
            onChange={(event) => onScopeChange?.(event.target.value)}
          >
            {SCOPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.inputWrap}>
          <Input
            type="search"
            className={styles.input}
            value={value}
            placeholder={selectedScope?.placeholder}
            aria-label={selectedScope?.placeholder}
            aria-autocomplete="list"
            aria-expanded={hasSuggestions}
            aria-controls={
              hasSuggestions ? "insights-filter-commands" : undefined
            }
            aria-activedescendant={
              hasSuggestions
                ? `insights-filter-command-${activeCommand.key}`
                : undefined
            }
            onChange={(event) => onChange?.(event.target.value)}
            onBlur={commitFilter}
            onKeyDown={(event) => {
              if (hasSuggestions && event.key === "ArrowDown") {
                event.preventDefault();
                setActiveCommandIndex(
                  (safeCommandIndex + 1) % suggestions.length
                );
                return;
              }
              if (hasSuggestions && event.key === "ArrowUp") {
                event.preventDefault();
                setActiveCommandIndex(
                  (safeCommandIndex - 1 + suggestions.length) %
                    suggestions.length
                );
                return;
              }
              if (hasSuggestions && event.key === "Enter") {
                event.preventDefault();
                selectCommand(activeCommand);
                return;
              }
              if (hasSuggestions && event.key === "Escape") {
                event.preventDefault();
                onChange?.("");
                return;
              }
              if (event.key === "Enter" && commitFilter()) {
                event.preventDefault();
              }
            }}
          />

          {suggestions.length > 0 && (
            <div
              id="insights-filter-commands"
              className={styles.commands}
              role="listbox"
            >
              {suggestions.map((item, index) => (
                <button
                  id={`insights-filter-command-${item.key}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeCommandIndex}
                  key={item.key}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveCommandIndex(index)}
                  onClick={() => selectCommand(item)}
                >
                  <code>/{item.command}</code>
                  <span>Filter by {item.label.toLowerCase()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {FILTERS.some(({ key }) => getFilter(filters, key).value) && (
        <div className={styles.activeFilters} aria-label="Active filters">
          {FILTERS.filter(({ key }) => getFilter(filters, key).value).map(
            (item) => {
              const filter = getFilter(filters, item.key);
              return (
                <span className={styles.filterChip} key={item.key}>
                  <Chip
                    mode="tri"
                    state={filter.mode}
                    onChange={(mode) => changeFilterMode(item.key, mode)}
                  >
                    <span>{item.label}</span>
                    <code title={filter.value}>
                      {displayFilterValue(item.key, filter.value)}
                    </code>
                  </Chip>
                  <button
                    type="button"
                    className={styles.removeFilter}
                    aria-label={`Remove ${item.label} filter`}
                    onClick={() => removeFilter(item.key)}
                  >
                    ×
                  </button>
                </span>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
