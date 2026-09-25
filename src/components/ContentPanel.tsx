"use client";

import { useEffect, useState } from "react";
import { LIMITS } from "@/lib/config";
import { CONTENT_LABELS, CONTENT_TYPES } from "@/lib/content";
import { useStore } from "@/lib/store";
import { Field, Section, Segmented, Select, TextArea, TextInput, Toggle } from "./ui";

/** Looks like a bare domain ("example.com/page") that scanners wouldn't open as a link. */
function needsScheme(v: string) {
  const t = v.trim();
  return t !== "" && !/^[a-z][a-z0-9+.-]*:/i.test(t) && /^[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(t);
}

function UrlField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [canPaste, setCanPaste] = useState(false);
  useEffect(() => setCanPaste(typeof navigator !== "undefined" && !!navigator.clipboard?.readText), []);
  const paste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text) onChange(text);
    } catch {
      /* permission denied — ignore */
    }
  };
  const small = "inline-flex min-h-11 shrink-0 items-center rounded-lg border border-line bg-surface-2 px-3 text-sm text-muted hover:text-fg sm:min-h-10";
  return (
    <Field
      label="Website URL"
      hint={
        needsScheme(value) ? (
          <span className="flex flex-wrap items-center gap-x-2 text-amber-700 dark:text-amber-300">
            Without https:// most phones show this as plain text.
            <button type="button" className="min-h-9 font-semibold underline" onClick={() => onChange("https://" + value.trim())}>
              Add https://
            </button>
          </span>
        ) : undefined
      }
    >
      {(id) => (
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <TextInput
              id={id}
              type="url"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="https://example.com"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="pr-10"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Clear URL"
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-lg text-muted hover:text-fg"
              >
                ×
              </button>
            )}
          </div>
          {canPaste && (
            <button type="button" onClick={paste} className={small}>
              Paste
            </button>
          )}
        </div>
      )}
    </Field>
  );
}

export function ContentPanel() {
  const { contentType, fields, config, setContentType, setFields } = useStore();

  return (
    <div className="space-y-6">
      <Section title="Type">
        <Segmented
          label="Content type"
          value={contentType}
          onChange={setContentType}
          options={CONTENT_TYPES.map((t) => ({ value: t, label: CONTENT_LABELS[t] }))}
        />
      </Section>

      <Section title="Content">
        {contentType === "url" && <UrlField value={fields.url} onChange={(v) => setFields("url", v)} />}

        {contentType === "text" && (
          <Field label="Text">
            {(id) => (
              <TextArea
                id={id}
                placeholder="Anything you like…"
                value={fields.text}
                maxLength={LIMITS.dataMaxChars}
                onChange={(e) => setFields("text", e.target.value)}
              />
            )}
          </Field>
        )}

        {contentType === "wifi" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Network name (SSID)">
              {(id) => (
                <TextInput id={id} value={fields.wifi.ssid} onChange={(e) => setFields("wifi", { ...fields.wifi, ssid: e.target.value })} />
              )}
            </Field>
            <Field label="Security">
              {(id) => (
                <Select
                  id={id}
                  value={fields.wifi.security}
                  onChange={(security) => setFields("wifi", { ...fields.wifi, security })}
                  options={[
                    { value: "WPA", label: "WPA / WPA2 / WPA3" },
                    { value: "WEP", label: "WEP" },
                    { value: "nopass", label: "None (open)" },
                  ]}
                />
              )}
            </Field>
            {fields.wifi.security !== "nopass" && (
              <Field label="Password">
                {(id) => (
                  <TextInput
                    id={id}
                    type="text"
                    autoComplete="off"
                    value={fields.wifi.password}
                    onChange={(e) => setFields("wifi", { ...fields.wifi, password: e.target.value })}
                  />
                )}
              </Field>
            )}
            <div className="flex items-end pb-2">
              <Toggle label="Hidden network" checked={fields.wifi.hidden} onChange={(hidden) => setFields("wifi", { ...fields.wifi, hidden })} />
            </div>
          </div>
        )}

        {contentType === "vcard" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["firstName", "First name", "text"],
                ["lastName", "Last name", "text"],
                ["org", "Organisation", "text"],
                ["title", "Job title", "text"],
                ["phone", "Phone", "tel"],
                ["email", "Email", "email"],
                ["url", "Website", "url"],
                ["address", "Address", "text"],
              ] as const
            ).map(([key, label, type]) => (
              <Field key={key} label={label}>
                {(id) => (
                  <TextInput
                    id={id}
                    type={type}
                    value={fields.vcard[key]}
                    onChange={(e) => setFields("vcard", { ...fields.vcard, [key]: e.target.value })}
                  />
                )}
              </Field>
            ))}
          </div>
        )}

        {contentType === "email" && (
          <div className="space-y-3">
            <Field label="To">
              {(id) => (
                <TextInput id={id} type="email" value={fields.email.to} onChange={(e) => setFields("email", { ...fields.email, to: e.target.value })} />
              )}
            </Field>
            <Field label="Subject">
              {(id) => (
                <TextInput id={id} value={fields.email.subject} onChange={(e) => setFields("email", { ...fields.email, subject: e.target.value })} />
              )}
            </Field>
            <Field label="Message">
              {(id) => (
                <TextArea id={id} value={fields.email.body} onChange={(e) => setFields("email", { ...fields.email, body: e.target.value })} />
              )}
            </Field>
          </div>
        )}

        {contentType === "phone" && (
          <Field label="Phone number">
            {(id) => (
              <TextInput id={id} type="tel" placeholder="+1 555 123 4567" value={fields.phone} onChange={(e) => setFields("phone", e.target.value)} />
            )}
          </Field>
        )}

        {contentType === "sms" && (
          <div className="space-y-3">
            <Field label="Phone number">
              {(id) => (
                <TextInput id={id} type="tel" value={fields.sms.phone} onChange={(e) => setFields("sms", { ...fields.sms, phone: e.target.value })} />
              )}
            </Field>
            <Field label="Message">
              {(id) => (
                <TextArea id={id} value={fields.sms.message} onChange={(e) => setFields("sms", { ...fields.sms, message: e.target.value })} />
              )}
            </Field>
          </div>
        )}
      </Section>

      {config.data && (
        <details className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
          <summary className="flex min-h-9 cursor-pointer items-center gap-1 text-muted">
            Encoded data <span className="font-mono text-xs">({new TextEncoder().encode(config.data).length} bytes)</span>
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">{config.data}</pre>
        </details>
      )}
    </div>
  );
}
