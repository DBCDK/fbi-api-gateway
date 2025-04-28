/**
 * Collapse component
 *
 * Renders a collapsible container that can show or hide its children when clicked.
 * Automatically injects a `collapsed` prop into child elements.
 */

import React, { cloneElement, isValidElement, useState } from "react";
import styles from "./Collapse.module.css";
export const Collapse: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const [collapsed, setCollapsed] = useState(true);

  const enhancedChildren = React.Children.map(children, (child) => {
    if (isValidElement<{ collapsed?: boolean }>(child)) {
      return cloneElement(child, { collapsed });
    }
    return child;
  });

  return (
    <div
      className={`${styles.collapsable} ${collapsed ? styles.collapsed : ""}`}
      onClick={() => collapsed && setCollapsed(false)}
    >
      <div
        className={styles.title}
        onClick={() => !collapsed && setCollapsed(true)}
      >
        {title}
      </div>
      <div className={styles.collapsecontent}>{enhancedChildren}</div>
    </div>
  );
};
