import styles from "./Spinner.module.css";

export default function Spinner({ className }) {
  return <div className={`${styles.spinner} ${className}`} />;
}
