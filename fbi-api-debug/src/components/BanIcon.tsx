/**
 * BanIcon component
 *
 * Renders a clickable icon that triggers an action when clicked.
 * Commonly used for actions like clearing or resetting content.
 */

import { MouseEventHandler } from "react";
import styles from "./BanIcon.module.css";

export function BanIcon({
  onClick,
  title,
}: {
  onClick: MouseEventHandler<HTMLDivElement>;
  title: string;
}) {
  return <div className={styles.banicon} title={title} onClick={onClick}></div>;
}
