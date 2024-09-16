import { Color } from "@raycast/api";

export const statusColourLUT: Map<string, Color> = new Map(
  Object.entries({
    BLOCKED: Color.Red,
    "On hold": Color.Orange,
  })
);
type CommonAttributes = {
  id: string;
  name: string;
  _links: { self: { href: string } };
}

type ResponseType<T extends CommonAttributes> = {
  _embedded: { elements: T[] };
}

export type Project = CommonAttributes;

export type ProjectResponse = ResponseType<Project>;

export type Version = CommonAttributes;

export type VersionResponse = ResponseType<Version>;

export type Assignee = CommonAttributes;

export type AssigneeResponse = ResponseType<Assignee>;

export type CreateWorkPackageFormValues = {
  workPackageId: string;
  subject: string;
  description?: string;
  project: string;
  version?: string;
  assignee?: string;
}

export const DEFAULT_STATUS_COLOUR = Color.SecondaryText;
