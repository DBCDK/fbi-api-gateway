import { forwardRef, useEffect, useId, useRef, useState } from "react";

import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";

import styles from "./FilterDropdown.module.css";

const CustomToggle = forwardRef(({ children, onClick }, ref) => (
  <button
    ref={ref}
    type="button"
    className={styles.toggle}
    onClick={(event) => onClick(event)}
    onKeyDown={(event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        onClick(event);
      }
    }}
  >
    <span className={styles.value}>{children}</span>
    <span className={styles.chevron} aria-hidden="true">
      ▾
    </span>
  </button>
));

CustomToggle.displayName = "CustomToggle";

const CustomMenu = forwardRef(
  (
    {
      children,
      style,
      className,
      "aria-labelledby": labeledBy,
      filterValue,
      onFilterChange,
      inputRef,
      inputProps,
      listProps,
      filterPlaceholder,
      menuLabel,
      noResultsLabel,
      hasItems,
    },
    ref,
  ) => (
    <div
      ref={ref}
      style={style}
      className={`${styles.menu} ${className || ""}`}
      aria-labelledby={labeledBy}
    >
      <div className={styles.menuInputWrap}>
        <Form.Control
          ref={inputRef}
          value={filterValue}
          className={styles.input}
          placeholder={filterPlaceholder}
          onChange={(event) => onFilterChange(event.target.value)}
          {...inputProps}
        />
      </div>
      {menuLabel && <div className={styles.menuLabel}>{menuLabel}</div>}
      {hasItems ? (
        <ul className={styles.list} {...listProps}>
          {children}
        </ul>
      ) : (
        <div className={styles.empty}>{noResultsLabel}</div>
      )}
    </div>
  ),
);

CustomMenu.displayName = "CustomMenu";

function defaultItemToString(item) {
  return String(item ?? "");
}

function defaultItemKey(item) {
  return String(item ?? "");
}

export default function FilterDropdown({
  id = "dropdown",
  className = "",
  items = [],
  selectedItem,
  onSelect,
  itemToString = defaultItemToString,
  selectedItemToString = itemToString,
  renderItem,
  itemKey = defaultItemKey,
  filterPlaceholder = "Filter options ...",
  menuLabel = "Options",
  noResultsLabel = "No matches found",
  align = "end",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef([]);
  const listboxId = useId();

  const filteredItems = items.filter((item) => {
    const label = itemToString(item).toLowerCase();
    return !filterValue || label.includes(filterValue.trim().toLowerCase());
  });

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      setFilterValue("");
      setActiveIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    listRef.current = listRef.current.slice(0, filteredItems.length);

    if (!filteredItems.length) {
      setActiveIndex(-1);
      return;
    }

    const selectedIndex = filteredItems.findIndex(
      (item) => itemKey(item) === itemKey(selectedItem),
    );

    setActiveIndex((currentIndex) => {
      if (currentIndex >= 0 && currentIndex < filteredItems.length) {
        return currentIndex;
      }

      return selectedIndex >= 0 ? selectedIndex : 0;
    });
  }, [filteredItems, itemKey, selectedItem]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }

    listRef.current[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex]);

  const handleSelect = (item) => {
    onSelect?.(item);
    setIsOpen(false);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        Math.min(currentIndex + 1, filteredItems.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(filteredItems[activeIndex]);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(filteredItems.length - 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const activeDescendant =
    activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;

  return (
    <Dropdown
      className={`${styles.dropdown} ${className}`}
      align={align}
      show={isOpen}
      onToggle={(nextShow) => setIsOpen(nextShow)}
    >
      <Dropdown.Toggle as={CustomToggle} id={id}>
        {selectedItemToString(selectedItem)}
      </Dropdown.Toggle>

      <Dropdown.Menu
        as={CustomMenu}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        inputRef={inputRef}
        filterPlaceholder={filterPlaceholder}
        menuLabel={menuLabel}
        noResultsLabel={noResultsLabel}
        hasItems={filteredItems.length > 0}
        inputProps={{
          role: "combobox",
          "aria-autocomplete": "list",
          "aria-controls": listboxId,
          "aria-expanded": isOpen,
          "aria-activedescendant": activeDescendant,
          onKeyDown: handleInputKeyDown,
        }}
        listProps={{
          id: listboxId,
          role: "listbox",
        }}
      >
        {filteredItems.map((item, index) => {
          const key = itemKey(item);
          const label = itemToString(item);
          const isSelected = itemKey(item) === itemKey(selectedItem);

          return (
            <Dropdown.Item
              key={key}
              as="li"
              active={isSelected}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={isSelected}
              className={`${styles.item} ${
                index === activeIndex ? styles.highlighted : ""
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => handleSelect(item)}
              ref={(node) => {
                listRef.current[index] = node;
              }}
            >
              {renderItem ? renderItem(item) : label}
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
}
