import styles from "./Highlight.module.css";

/**
 * Highlight wrapper – bruges i MDX til at farve overskrifter eller tekst.
 *
 * Eksempel i MDX:
 * ## <Highlight>Stay Updated 📬</Highlight>
 * eller:
 * <Highlight><h2>Stay Updated 📬</h2></Highlight>
 */
export default function Highlight({ children, color }) {
  return (
    <span
      className={`${styles.highlightedHeading}`}
      data-highlighted="true"
      style={color ? { color } : undefined}
    >
      {children}
    </span>
  );
}
