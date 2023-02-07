import Offcanvas from "react-bootstrap/Offcanvas";
import styles from "./Modal.module.css";

export default function Modal({
  show,
  onHide,
  title,
  children,
  className = "",
}) {
  return (
    <Offcanvas
      show={show}
      placement="end"
      onHide={onHide}
      className={`${styles.offcanvas} ${className}`}
      onScroll={(e) => setDistance(e.target.scrollY)}
    >
      {title && (
        <Offcanvas.Header className={styles.header} closeButton>
          <Offcanvas.Title>{title}</Offcanvas.Title>
        </Offcanvas.Header>
      )}
      <Offcanvas.Body id="modal" className={styles.body}>
        {children}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
