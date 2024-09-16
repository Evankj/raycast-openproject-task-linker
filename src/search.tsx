import { List, ActionPanel, Action, Icon, showHUD } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";
import { getPreferences } from "./preferences";
import { WP } from "op-client";
import { DEFAULT_STATUS_COLOUR, statusColourLUT } from "./types";


export default function Command() {
  const { openProjectUrl, apiKey } = getPreferences();
  const token = Buffer.from(`apikey:${apiKey}`).toString("base64");
  const [searchText, setSearchText] = useState("");

  function getSearchURL(text: string): URL {
    if (text === "") {
      return new URL(`${openProjectUrl}/api/v3/work_packages`);
    }
    const search = JSON.stringify([
      { subjectOrId: { operator: "**", values: [encodeURIComponent(text)] } },
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
      <List.EmptyView
        icon={{ source: "icon.png" }}
        title="No work packages found"
      />
      {data &&
        data._embedded.elements.map((workPackage) => {
          const workPackageUrl = `${openProjectUrl}/work_packages/${workPackage.id}`;
          const wp_links = workPackage._links as {
            assignee?: {
              href: string | undefined;
              title?: string;
            };
            status?: {
              title?: string;
            };
          };

          const status = wp_links.status?.title || "";

          return (
            <List.Item
              key={workPackage.id}
              title={`OP#${workPackage.id} - ${workPackage.subject}`}
              accessories={[
                {
                  text: {
                    value: wp_links.assignee?.title,
                  },
                  icon: wp_links.assignee?.title ? Icon.Person : undefined,
                },
                {
                  text: {
                    value: wp_links.status?.title,
                    color: statusColourLUT.get(status) || DEFAULT_STATUS_COLOUR,
                  },
                  icon: Icon.Info,
                },
              ]}
              actions={
                <ActionPanel>
                  <Action.Paste
                    title="Paste markdown link"
                    content={`[OP#${workPackage.id}](${workPackageUrl})`}
                  />
                  <Action.Paste
                    title="Paste markdown link with subject"
                    content={`[OP#${workPackage.id} - ${workPackage.subject}](${workPackageUrl})`}
                  />
                  <Action.CopyToClipboard content={workPackageUrl} title="Copy URL to Clipboard" onCopy={(_) => showHUD("Copied to clipboard")} />
                  <Action.OpenInBrowser url={workPackageUrl} title="Open in Browser" />
                </ActionPanel>
              }
            />
          );
        })}
    </List>
  );
}

