import styles from "./Section.module.css";

export default function Section({ children, bgColor, color }) {
  return (
    <div className={styles.Section} style={{ backgroundColor: bgColor, color }}>
      <div className={styles.SectionChildren}>{children}</div>
    </div>
  );
}
