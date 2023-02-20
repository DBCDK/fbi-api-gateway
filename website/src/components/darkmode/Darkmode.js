import Form from "react-bootstrap/Form";

import useTheme from "@/hooks/useTheme";

import styles from "./Darkmode.module.css";

export function Darkmode({ theme, onClick, className = "" }) {
  const isDark = theme === "dark";

  return (
    <Form className={`${styles.wrap} ${className}`}>
      <span>🌞</span>
      <Form.Switch
        type="switch"
        id="custom-switch"
        checked={isDark}
        onClick={() => onClick(isDark ? "light" : "dark")}
      />
      <span>🌛</span>
    </Form>
  );
}

export default function Wrap(props) {
  const { theme, setTheme } = useTheme();
  return (
    <Darkmode
      theme={theme}
      onClick={(newTheme) => setTheme(newTheme)}
      {...props}
    />
  );
}
