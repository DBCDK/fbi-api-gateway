import styles from "./DeLorean.module.css";

export default function DeLorean() {
  return (
    <div className={styles.container}>
      <div className={styles.delorean}>
        <div className={styles.pen} />
        <div className={`${styles.mae_blue} ${styles.blue}`} />
        <div className={styles.mae_hako} />
        <div className={styles.code} />
        <div className={styles.code2} />
        <div className={styles.code3} />
        <div className={`${styles.ushiro_blue_ue} ${styles.blue}`} />
        <div className={`${styles.ushiro_blue_naka} ${styles.blue}`} />
        <div className={`${styles.ushiro_blue_shita} ${styles.blue}`} />
        <div className={styles.kanki} />
        <div className={styles.kanki2} />
        <div className={styles.mrfusion}>
          <div className={styles.mark} />
          <div className={styles.dai} />
        </div>
        <div className={styles.body}>
          <div className={styles.window_fuchi} />
          <div className={styles.window_fuchi2} />
          <div className={styles.window1} />
          <div className={styles.window2} />
          <div className={styles.window3}>
            <div className={styles.window3_red} />
          </div>
          <div className={styles.hide1} />
          <div className={styles.line}>
            <div className={styles.hilight} />
            <div className={styles.orange} />
            <div className={styles.red} />
            <div className={styles.hold} />
          </div>
          <div className={styles.yoko_mae_top} />
          <div className={styles.yoko_mae_bottom} />
          <div className={styles.yoko_mae_center} />
          <div className={styles.yoko_mae_bottom2} />
          <div className={styles.yoko_ushiro_bottom} />
          <div className={styles.hide2} />
          <div className={styles.hide3} />
          <div className={styles.hide4}>
            <div className={styles.hide4_gray} />
          </div>
          <div className={styles.hide5} />
          <div className={styles.zenrin_space} />
          <div className={styles.korin_space} />
          <div className={styles.gray} />
          <div className={styles.mae_line} />
          <div className={styles.ushiro_ue_line} />
          <div className={styles.ushiro_shita_line} />
        </div>
        <div className={styles.black} />
        <div className={styles.black_ushiro} />
        <div className={styles.black_mae} />
        <div className={styles.tokki} />
        <div className={styles.sentan_ue} />
        <div className={styles.sentan_shita} />
        <div className={styles.ushiro_ue} />
        <div className={styles.ushiro_tokki} />
        <div className={styles.ushiro_shita_tokki} />
        <div className={styles.hide6} />
        <div className={styles.zenrin}>
          <div className={styles.moyo}>
            <div className={styles.top} />
            <div className={styles.right} />
            <div className={styles.bottom} />
            <div className={styles.left} />
            <div className={styles.center} />
          </div>
        </div>
        <div className={styles.korin}>
          <div className={styles.moyo}>
            <div className={styles.top} />
            <div className={styles.right} />
            <div className={styles.bottom} />
            <div className={styles.left} />
            <div className={styles.center} />
          </div>
        </div>
      </div>
    </div>
  );
}
