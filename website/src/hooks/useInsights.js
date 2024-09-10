import fetch from "isomorphic-unfetch";
import useSWR from "swr";
import useStorage from "./useStorage";

function getByField(data) {
  const clients = data?.data?.insights?.clients;

  const res = {};
  clients?.forEach(({ clientId, fields }) => {
    fields?.forEach((obj) => {
      const { field, type } = obj;
      const key = `${type}.${field}`;

      if (res[key]) {
        res[key].count + obj.count;
        res[key].clients.push(clientId);
      } else {
        res[key] = { ...obj, clients: [clientId] };
      }

      // res[key] ? res[key].count + obj.count : (res[key] = obj);
    });
  });

  console.log("res", res);

  return res;
}

function getByClient(data) {
  return data?.data?.insights?.clients;
}

export function useGraphQLUrl(origin) {
  const url = origin
    ? origin
    : typeof window !== "undefined" && window.location.origin;

  const { selectedToken } = useStorage();
  const { profile = "default" } = selectedToken || {};

  return `${url}/${profile}/graphql`;
}

export default function useSchema(token) {
  const url = useGraphQLUrl();

  const query = `query($clientId: String) {
                  insights {
                    start
                    end
                    clients(clientId: $clientId) {
                      clientId
                      fields {
                        path
                        type
                        field
                        kind
                        count
                      }
                    }
                  }
                }`;

  const fetcher = async (url) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `bearer ${token?.token}`,
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (response.status !== 200) {
      return {};
    }

    return await response.json();
  };

  const { data } = useSWR(token?.token && [url, query, token?.token], fetcher);

  console.log("######### data", data);

  return {
    json: data,
    byField: getByField(data),
    byClient: getByClient(data),
    isLoading: !data,
  };
}
