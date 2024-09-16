import { ActionPanel, Action, Form, showToast, Toast, showHUD, PopToRootType } from "@raycast/api";
import { FormValidation, useFetch, useForm } from "@raycast/utils";
import { useState } from "react";
import { getPreferences } from "./preferences";
import { AssigneeResponse, CreateWorkPackageFormValues, ProjectResponse, VersionResponse } from "./types";


export default function Command() {
  const { openProjectUrl, apiKey } = getPreferences();

  const [submitting, setSubmitting] = useState(false);

  function getProjectURL(text: string): URL {
    if (text === "") {
      return new URL(`${openProjectUrl}/api/v3/projects`);
    }
    const search = JSON.stringify([
      { name: { operator: "~", values: [encodeURIComponent(text)] } },
    ]);
    const url = new URL(`${openProjectUrl}/api/v3/projects?filters=${search}`);

    return url;
  }

  function getVersionURL(text: string): URL {
    if (text === "") {
      return new URL(`${openProjectUrl}/api/v3/versions`);
    }
    // const search = JSON.stringify([
    //   { name_and_identifier: { operator: "**", values: [encodeURIComponent(text)] } },
    // ]);
    const url = new URL(`${openProjectUrl}/api/v3/versions`);

    return url;
  }

  function getAssigneeURL(text: string): URL {
    if (text === "") {
      return new URL(`${openProjectUrl}/api/v3/users`);
    }
    const search = JSON.stringify([
      { name: { operator: "~", values: [encodeURIComponent(text)] } },
    ]);
    const url = new URL(`${openProjectUrl}/api/v3/users?filters=${search}`);

    return url;
  }

  const token = Buffer.from(`apikey:${apiKey}`).toString("base64");
  const [project, setProject] = useState('');
  const [version, setVersion] = useState('');
  const [assignee, setAssignee] = useState('');

  const [submittedProject, setSubmittedProject] = useState('');
  const [submittedVersion, setSubmittedVersion] = useState<string | undefined>();
  const [submittedAssignee, setSubmittedAssignee] = useState<string | undefined>();



  const { data: projectsData } = useFetch<ProjectResponse>(getProjectURL(project).href, {
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    keepalive: true,
    keepPreviousData: true,
  });
  const { data: versionsData } = useFetch<VersionResponse>(getVersionURL("").href, {
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    keepalive: true,
    keepPreviousData: true,
  });
  const { data: assigneesData } = useFetch<AssigneeResponse>(getAssigneeURL(assignee).href, {
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
    keepalive: true,
    keepPreviousData: true,
  });

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState<string | undefined>('');

  const { isLoading, revalidate } = useFetch<{ id: string }>(`${openProjectUrl}/api/v3/work_packages`, {
    method: 'POST',
    onError: (error) => {
      showToast({
        title: "Failed to create work package.",
        message: error.message,
        style: Toast.Style.Failure,
      });
    },
    onData: (data) => {
      showHUD(`✅ Work package OP#${data.id} created successfully!`, {
        popToRootType: PopToRootType.Default,
      });
    },
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject,
      description: { raw: description },
      _links: {
        project: { href: submittedProject },
        version: submittedVersion ? { href: submittedVersion } : null,
        assignee: submittedAssignee ? { href: submittedAssignee } : null,
      },
    }),
    execute: false,
  });

  const { handleSubmit, itemProps } = useForm<CreateWorkPackageFormValues>({
    onSubmit(values) {

      setSubject(values.subject);
      setDescription(values.description);

      setSubmittedProject(values.project);
      setSubmittedVersion(values.version);
      setSubmittedAssignee(values.assignee);

      setTimeout(() => {
        setSubmitting(false);
      }, 500);

      setSubmitting(true);
      revalidate();
    },
    validation: {
      project: FormValidation.Required,
      subject: FormValidation.Required,
    },
  });


  return (
    <Form actions={!submitting && <ActionPanel>
      <Action.SubmitForm title="Create Work Package" onSubmit={handleSubmit} />
    </ActionPanel>}>
      <Form.TextField storeValue={false} title="Subject" {...itemProps.subject} />
      <Form.TextArea storeValue={false} title="Description" {...itemProps.description} />
      <Form.Dropdown throttle title="Project" {...itemProps.project} onSearchTextChange={setProject}>
        {projectsData && projectsData._embedded.elements.map((project) => (
          <Form.Dropdown.Item key={project.id} value={project._links.self.href} title={project.name} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown title="Version" {...itemProps.version} filtering>
        {versionsData && versionsData._embedded.elements.map((version) => (
          <Form.Dropdown.Item key={version.id} value={version._links.self.href} title={version.name} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown throttle title="Assignee" {...itemProps.assignee} onSearchTextChange={setAssignee}>
        {assigneesData && assigneesData._embedded.elements.map((assignee) => (
          <Form.Dropdown.Item key={assignee.id} value={assignee._links.self.href} title={assignee.name} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
