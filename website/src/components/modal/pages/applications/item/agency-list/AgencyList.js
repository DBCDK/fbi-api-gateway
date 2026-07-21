import Text from "@/components/base/text";

import styles from "./AgencyList.module.css";

function AgencyList({ title, items }) {
  return (
    <div className={styles.agencies}>
      <Text type="text4">{title}</Text>
      <div className={styles.list}>
        {items?.map((agencyId, i) => {
          return (
            <div key={`${agencyId}-${i}`} className={styles.listItem}>
              <Text as="span" type="text1">
                {agencyId}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AgencyList;
