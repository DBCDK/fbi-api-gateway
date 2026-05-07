import styles from "./ExpandButton.module.css";

function ExpandButton({ onClick, open }) {
  const crossClass = open ? styles.less : "";

  return (
    <button
      className={`${styles.cross} ${crossClass}`}
      onClick={onClick}
      aria-controls="example-collapse-text"
      aria-expanded={open}
    >
      <div>
        <span />
        <span />
      </div>
    </button>
  );
}

export default ExpandButton;
