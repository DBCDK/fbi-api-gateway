import qs from "querystring";

export default function Test() {
  return (
    <div>
      <form
        method="post"
        action="http://localhost:5000/api/auth/callback/testuserprovider"
      >
        <input
          name="csrfToken"
          type="hidden"
          defaultValue={
            "034e666e84beff4242640baf22ac40fdf2e1cd2c28a97e7e8d3f9422878e83c5"
          }
        />

        <label>
          <div>uniqueId</div>
          <input
            className="disable"
            readOnly
            name="uniqueId"
            type="text"
            value={"test:469b0831-1eef-5aca-bbe6-f6519fd922c9"}
          />
        </label>
        <label>
          <div>accessToken</div>
          <input
            className="disable"
            readOnly
            name="accessToken"
            type="text"
            value={"test_nemlogin_kfu:8d8221c29294c0e3fbca0fdbe8bf5f4d640f79d0"}
          />
        </label>

        <button type="submit">Log ind</button>
      </form>
    </div>
  );
}

async function getBody({ req }) {
  return new Promise((resolve) => {
    let postBody = "";
    req.on("data", (data) => {
      postBody += data.toString();
    });
    req.on("end", () => {
      resolve(qs.parse(postBody));
    });
  });
}

export async function getServerSideProps(context) {
  // This is a incoming POST request, lets check the body
  const body = await getBody(context);

  console.log({ body });

  return { props: {} };
}
