import { Container } from "react-bootstrap";

import styles from "./Layout.module.css";

export default function Layout({ children, className = "" }) {
  return (
    <Container
      className={`${styles.container} ${className}`}
      as="section"
      fluid
    >
      {children}
    </Container>
  );
}
