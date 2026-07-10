import Offcanvas from "react-bootstrap/Offcanvas";
import styles from "./Modal.module.css";

export default function Modal({
  show,
  onHide,
  title,
  showCloseButton = Boolean(title),
  children,
  className = "",
}) {
  return (
    <Offcanvas
      show={show}
      placement="end"
      onHide={onHide}
      className={`${styles.offcanvas} ${className}`}
      // onScroll={(e) => setDistance(e.target.scrollY)}
    >
      {(title || showCloseButton) && (
        <Offcanvas.Header className={styles.header} closeButton>
          {title && <Offcanvas.Title>{title}</Offcanvas.Title>}
        </Offcanvas.Header>
      )}

      <Offcanvas.Body id="modal" className={styles.body}>
        {children}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
