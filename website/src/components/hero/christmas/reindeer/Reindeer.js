import styles from "./Reindeer.module.css";

export default function Reindeer() {
  return (
    <div className={styles.container}>
      <div className={styles.artboard}>
        <div className={styles.deer}>
          <div className={styles.rocking}>
            <div className={styles.head}>
              <div className={styles.horns}>
                <div className={`${styles.horn} ${styles["horn-left"]}`}>
                  <div className={`${styles.line} ${styles["line-one"]}`} />
                  <div className={styles.line} />
                  <div className={`${styles.line} ${styles["line-three"]}`} />
                </div>

                <div className={`${styles.horn} ${styles["horn-right"]}`}>
                  <div className={`${styles.line} ${styles["line-one"]}`} />
                  <div className={styles.line} />
                  <div className={`${styles.line} ${styles["line-three"]}`} />
                </div>
              </div>

              <div className={styles.ears}>
                <div className={`${styles.ear} ${styles["ear-left"]}`} />
                <div className={`${styles.ear} ${styles["ear-right"]}`} />
              </div>

              <div className={styles.eyes}>
                <div className={`${styles.eye} ${styles["eye-left"]}`} />
                <div className={`${styles.eye} ${styles["eye-right"]}`} />
              </div>

              <div className={styles.nose} />
            </div>

            <div className={styles.body}>
              <div className={styles.shadow} />
              <div className={styles.hooves}>
                <div className={styles["hoof-one"]}>
                  <div className={styles.line} />
                  <div className={styles["anim-part"]}>
                    <div className={styles.circle}>
                      <div className={styles.circle}>
                        <div className={styles.circle}>
                          <div className={styles.circle}>
                            <div
                              className={`${styles.circle} ${styles["circle-last"]}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles["hoof-two"]}>
                  <div className={styles["line-one"]} />
                  <div className={styles["line-two"]} />
                </div>
              </div>
            </div>
            <div className={styles.tail}>
              <div className={styles.circle}>
                <div className={styles.circle}>
                  <div className={styles.circle}>
                    <div className={styles.circle}>
                      <div className={styles.circle} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.legs}>
            <div className={styles["leg-left"]}>
              <div className={styles["anim-part"]}>
                <div className={styles.line} />
              </div>
            </div>
            <div className={styles["leg-right"]}>
              <div className={styles["anim-part"]}>
                <div className={styles.circle}>
                  <div className={styles.circle}>
                    <div className={styles.circle}>
                      <div className={styles.circle}>
                        <div className={styles.circle}>
                          <div className={styles.circle}>
                            <div className={styles.circle}>
                              <div className={styles.circle}>
                                <div
                                  className={`${styles.circle} ${styles["circle-last"]}`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.presents}>
          <div className={`${styles.present} ${styles["present-one"]}`} />
          <div className={`${styles.present} ${styles["present-two"]}`} />
          <div
            className={`${styles.present} ${styles["present-two"]} ${styles["present-two-right"]}`}
          />
          <div className={`${styles.present} ${styles["present-three"]}`} />
        </div>
      </div>
    </div>
  );
}
