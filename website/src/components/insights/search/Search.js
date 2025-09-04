import Input from "@/components/base/input";
import styles from "./Search.module.css";

export default function Search({ onChange }) {
  return (
    <div className={styles.container}>
      <Input
        type="search"
        className={styles.input}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
