/**
 * TabMenu component
 *
 * A simple tab navigation menu that allows users to switch between tabs.
 * Highlights the active tab and calls a callback when a new tab is selected.
 *
 */

import React, { useState } from "react";
import styles from "./TabMenu.module.css";

interface TabMenuProps {
  tabs: string[];
  onSelect: (tab: string) => void;
}

const TabMenu: React.FC<TabMenuProps> = ({ tabs, onSelect }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleClick = (index: number) => {
    setActiveIndex(index);
    onSelect(tabs[index]);
  };

  return (
    <div className={styles.tabContainer}>
      {tabs.map((tab, index) => (
        <button
          key={index}
          className={`${styles.tabButton} ${
            index === activeIndex ? styles.active : ""
          }`}
          onClick={() => handleClick(index)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TabMenu;
