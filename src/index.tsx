import { List, ActionPanel, Action, Icon, Color, showHUD } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";
import { getPreferences } from "./preferences";
import { WP } from "op-client";

const statusColourLUT: Map<string, Color> = new Map(
  Object.entries({
    BLOCKED: Color.Red,
    "On hold": Color.Orange,
  }),
);

const defaultStatusColour = Color.SecondaryText;

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
          const workPackageUrl = `${openProjectUrl}/work_packages/${workPackage.id}`;
          // HACK: OP client library with WP type is outdated but I don't have time to make my own types for this currently

          // @ts-ignore
          const wp_data = workPackage._links as {
            assignee?: {
              href: string | undefined;
              title?: string;
            };
            status?: {
              title?: string;
            };
          };

          const status = wp_data.status?.title || "";

          return (
            <List.Item
              key={workPackage.id}
              title={`OP#${workPackage.id} - ${workPackage.subject}`}
              accessories={[
                {
                  text: {
                    value: wp_data.assignee?.title,
                  },
                  icon: wp_data.assignee?.title ? Icon.Person : undefined,
                },
                {
                  text: {
                    value: wp_data.status?.title,
                    color: statusColourLUT.get(status) || defaultStatusColour,
                  },
                  icon: Icon.Info,
                },
              ]}
              actions={
                <ActionPanel>
                  <Action.Paste
                    title="Paste markdown link"
                    content={`[OP#${workPackage.id}](${workPackageUrl})`}
                  ></Action.Paste>
                  <Action.Paste
                    title="Paste markdown link with subject"
                    content={`[OP#${workPackage.id} - ${workPackage.subject}](${workPackageUrl})`}
                  ></Action.Paste>
                  <Action.CopyToClipboard content={workPackageUrl} title="Copy URL to Clipboard" onCopy={(_) => showHUD("Copied to clipboard")}/>
                  <Action.OpenInBrowser url={workPackageUrl} title="Open in Browser" />
                </ActionPanel>
              }
            />
          );
        })}
    </List>
  );
}
