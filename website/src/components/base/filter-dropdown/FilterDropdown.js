import { forwardRef, useEffect, useId, useRef, useState } from "react";

import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";

import styles from "./FilterDropdown.module.css";

const CustomToggle = forwardRef(({ children, onClick, title }, ref) => (
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
    <span className={styles.value} title={title}>
      {children}
    </span>
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
      hasScrolledList,
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
      {menuLabel && (
        <div
          className={`${styles.menuLabel} ${
            hasScrolledList ? styles.menuLabelScrolled : ""
          }`}
        >
          {menuLabel}
        </div>
      )}
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
  itemTitle = itemToString,
  selectedItemTitle = selectedItemToString,
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
  const [hasScrolledList, setHasScrolledList] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef([]);
  const menuListRef = useRef(null);
  const previousIsOpenRef = useRef(false);
  const previousSelectedItemKeyRef = useRef(null);
  const listboxId = useId();

  const filteredItems = items.filter((item) => {
    const label = itemToString(item).toLowerCase();
    return !filterValue || label.includes(filterValue.trim().toLowerCase());
  });
  const selectedItemKeyValue =
    selectedItem === undefined || selectedItem === null
      ? null
      : itemKey(selectedItem);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        setHasScrolledList((menuListRef.current?.scrollTop ?? 0) > 0);
      });
    } else {
      setFilterValue("");
      setActiveIndex(-1);
      setHasScrolledList(false);
    }
  }, [isOpen]);

  useEffect(() => {
    listRef.current = listRef.current.slice(0, filteredItems.length);

    if (!filteredItems.length) {
      setActiveIndex(-1);
      previousIsOpenRef.current = isOpen;
      previousSelectedItemKeyRef.current = selectedItemKeyValue;
      return;
    }

    const selectedIndex = filteredItems.findIndex(
      (item) => itemKey(item) === itemKey(selectedItem),
    );
    const didOpen = isOpen && !previousIsOpenRef.current;
    const didSelectedItemChange =
      previousSelectedItemKeyRef.current !== selectedItemKeyValue;

    setActiveIndex((currentIndex) => {
      if (didOpen || didSelectedItemChange) {
        return selectedIndex >= 0 ? selectedIndex : 0;
      }

      if (currentIndex >= 0 && currentIndex < filteredItems.length) {
        return currentIndex;
      }

      return selectedIndex >= 0 ? selectedIndex : 0;
    });

    previousIsOpenRef.current = isOpen;
    previousSelectedItemKeyRef.current = selectedItemKeyValue;
  }, [filteredItems, isOpen, itemKey, selectedItem, selectedItemKeyValue]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current[activeIndex]?.scrollIntoView({
        block: "nearest",
      });
      setHasScrolledList((menuListRef.current?.scrollTop ?? 0) > 0);
    });
  }, [activeIndex, isOpen, filteredItems.length]);

  useEffect(() => {
    setHasScrolledList((menuListRef.current?.scrollTop ?? 0) > 0);
  }, [filteredItems.length]);

  const handleSelect = (item) => {
    onSelect?.(item);
    setIsOpen(false);
  };

  const handleListScroll = (event) => {
    setHasScrolledList(event.currentTarget.scrollTop > 0);
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
      <Dropdown.Toggle
        as={CustomToggle}
        id={id}
        title={selectedItemTitle(selectedItem)}
      >
        {selectedItemToString(selectedItem)}
      </Dropdown.Toggle>

      <Dropdown.Menu
        as={CustomMenu}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        inputRef={inputRef}
        filterPlaceholder={filterPlaceholder}
        menuLabel={menuLabel}
        hasScrolledList={hasScrolledList}
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
          ref: menuListRef,
          onScroll: handleListScroll,
        }}
      >
        {filteredItems.map((item, index) => {
          const key = itemKey(item);
          const label = itemToString(item);
          const title = itemTitle(item);
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
              <span className={styles.itemContent} title={title}>
                {renderItem ? renderItem(item) : label}
              </span>
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
}
