import _Overlay from "react-bootstrap/Overlay";
import _Popover from "react-bootstrap/Popover";

export default function Overlay({ show = false, container, children }) {
  return (
    <_Overlay
      show={show}
      target={container?.current}
      placement="bottom"
      containerPadding={20}
    >
      <_Popover id="popover-contained">
        <_Popover.Body>{children}</_Popover.Body>
      </_Popover>
    </_Overlay>
  );
}
