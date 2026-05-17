"use client";

import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Mapping = { id: string; internalField: string; aliases: string[]; required: boolean };

export default function SettingsPage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((response) => response.json()).then(setMappings);
  }, []);

  async function save() {
    await fetch("/api/settings", { method: "PUT", body: JSON.stringify(mappings) });
    setMessage("Column mappings saved.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Map changing Excel headers into stable internal payout fields."
        action={<Button onClick={save}><Save className="h-4 w-4" />Save</Button>}
      />
      <div className="grid gap-4">
        {mappings.map((mapping, index) => (
          <Card key={mapping.internalField}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {mapping.internalField}
                {mapping.required ? <Badge>Required</Badge> : <Badge>Optional</Badge>}
              </CardTitle>
              <CardDescription>Aliases are comma-separated and matched case-insensitively.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label>Aliases</Label>
              <Input
                value={mapping.aliases.join(", ")}
                onChange={(event) =>
                  setMappings((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, aliases: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) } : item
                    )
                  )
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>
      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </AppShell>
  );
}
