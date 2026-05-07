import useConfiguration from "@/hooks/useConfiguration";
import useUser from "@/hooks/useUser";

import ItemContent, { ItemIsLoading } from "./ItemContent";

function Item(props) {
  const { configuration, status, isLoading } = useConfiguration(props);
  const { user } = useUser(props);

  if (isLoading) {
    return <ItemIsLoading />;
  }

  return (
    <ItemContent
      {...props}
      user={user}
      configuration={configuration}
      configurationStatus={status}
    />
  );
}

export default Item;
