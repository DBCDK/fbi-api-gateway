const data = {
  statusCode: 200,
  data: {
    status: "ok",
    orsId: "1040184487",
  },
  timings: {
    total: 9349,
    external: 9346,
  },
};

export async function load({}) {
  return data.data;
}
