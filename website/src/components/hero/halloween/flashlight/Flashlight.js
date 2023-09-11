import { useEffect } from "react";

import styles from "./Flashlight.module.css";

export default function Flashlight() {
  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;

    const flashlight = document.getElementById("flashlight");
    const container = document.getElementById("container");
    const bounds = container.getBoundingClientRect();

    //Detect touch device
    const isTouchDevice = () => {
      try {
        //We try to create TouchEvent(it would fail for desktops and throw error)
        document.createEvent("TouchEvent");
        return true;
      } catch (e) {
        return false;
      }
    };

    flashlight.style.setProperty("background-color", "red");

    function getMousePosition(e) {
      mouseX =
        (!isTouchDevice() ? e.clientX : e.touches[0].clientX) - bounds.left;
      mouseY =
        (!isTouchDevice() ? e.clientY : e.touches[0].clientY) - bounds.top;

      flashlight.style.setProperty("--Xpos", mouseX + "px");
      flashlight.style.setProperty("--Ypos", mouseY + "px");
    }

    document.addEventListener("mousemove", getMousePosition);
    document.addEventListener("touchmove", getMousePosition);
  }, []);

  return (
    <div className={styles.bg} id="container">
      <div id="flashlight" className={styles.flashlight}></div>
    </div>
  );
}
