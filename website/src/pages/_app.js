import Modal from "@/components/modal";
import Pages from "@/components/modal/pages";

import "@/scss/custom-bootstrap.scss";
import "@/css/styles.css";

function MyApp({ Component, pageProps, router }) {
  return (
    <Modal.Provider
      router={{
        pathname: router.pathname,
        query: router.query,
        push: (obj) => router.push(obj),
        replace: (obj) => router.replace(obj),
        go: (index) => window.history.go(index),
      }}
    >
      <Modal.Container>
        <Modal.Page id="menu" component={Pages.Menu} />
        <Modal.Page id="history" component={Pages.History} />
      </Modal.Container>
      <div id="layout">
        <Component {...pageProps} />
      </div>
    </Modal.Provider>
  );
}

export default MyApp;
