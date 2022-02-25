import Dropdown from "react-bootstrap/Dropdown";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import Button from "@/components/base/button";

import styles from "./History.module.css";

const Item = (props) => {
  const { selectedToken } = useStorage();
  const { configuration } = useConfiguration(props.token);

  return (
    <Dropdown.Item onClick={() => setToken(token)}>{`${
      configuration?.displayName
    }: ${token?.slice(0, 4)}...`}</Dropdown.Item>
  );
};

export default function History({ className = "" }) {
  const { history } = useToken();

  return (
    <Dropdown className={`${styles.history} ${className}`}>
      <Dropdown.Toggle className={styles.button} id="dropdown-basic">
        🔑
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {history?.map((h) => (
          <Item key={h.token} token={h.token} />
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
