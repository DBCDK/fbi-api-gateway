import { useEffect, useState } from "react";

export default function useKeyPress(targetKey) {
  // State for keeping track of whether key is pressed
  const [keyPressed, setKeyPressed] = useState(false);

  // If pressed key is our target key then set to true
  function downHandler(e) {
    if (e.key === targetKey) {
      setKeyPressed(e);
    }
  }

  // If released key is our target key then set to false
  function upHandler(e) {
    if (e.key === targetKey) {
      setKeyPressed(false);
    }
  }

  // Add event listeners
  useEffect(() => {
    if (!targetKey) {
      return;
    }

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, [targetKey]); // Empty array ensures that effect is only run on mount and unmount

  return keyPressed;
}
