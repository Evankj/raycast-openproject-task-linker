import { List, ActionPanel, Action } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";
import { getPreferences } from "./preferences";
import { WP } from "op-client";

export default function Command() {
  const { openProjectUrl, apiKey } = getPreferences();
  const token = Buffer.from(`apikey:${apiKey}`).toString("base64");
  const [searchText, setSearchText] = useState("");

  function getSearchURL(text: string): URL {
    if (text === "") {
      return new URL(`${openProjectUrl}/api/v3/work_packages`);
    }
    const search = JSON.stringify([
      { subject: { operator: "~", values: [encodeURIComponent(text)] } },
    ]);
    const url = new URL(`${openProjectUrl}/api/v3/work_packages?filters=${search}`);

    return url;
  }

  const { data, isLoading } = useFetch<{
    _embedded: { elements: WP[] };
  }>(getSearchURL(searchText).href, {
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    keepPreviousData: true,
    keepalive: true,
  });

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search work packages..."
      throttle
      onSearchTextChange={(text) => {
        setSearchText(text);
      }}
      filtering={true}
    >
      {data &&
        data._embedded.elements.map((workPackage) => {
          console.log(workPackage.subject);
          return (
            <List.Item
              title={`OP#${workPackage.id} - ${workPackage.subject}`}
              actions={
                <ActionPanel>
                  <Action.Paste
                    content={`[OP#${workPackage.id}](${openProjectUrl}/work_packages/${workPackage.id})`}
                  ></Action.Paste>
                </ActionPanel>
              }
            />
          );
        })}
    </List>
  );
}
