"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type User = { id: string; name: string; email: string; role: string; isActive: boolean };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "ANALYST" });
  const [message, setMessage] = useState("");

  async function load() {
    setUsers(await fetch("/api/users").then((response) => response.json()));
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser() {
    setMessage("");
    const response = await fetch("/api/users", { method: "POST", body: JSON.stringify({ ...form, isActive: true }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) {
      setMessage(data.error ?? "Unable to create user");
      return;
    }
    setMessage("User created. They can sign in with the password you set.");
    setForm({ name: "", email: "", password: "", confirmPassword: "", role: "ANALYST" });
    await load();
  }

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "role", header: "Role" },
      { header: "Status", cell: ({ row }) => <Badge>{row.original.isActive ? "Active" : "Disabled"}</Badge> }
    ],
    []
  );

  return (
    <AppShell>
      <PageHeader title="User Management" description="Prepare for RBAC, maker-checker flows, and tenant-specific teams." />
      <Card className="mb-4">
        <CardContent className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_180px_180px_auto]">
          <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></div>
          <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /></div>
          <div className="space-y-2"><Label>Confirm</Label><Input type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} /></div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
              {["SUPER_ADMIN", "ADMIN", "MANAGER", "ANALYST", "VIEWER"].map((role) => <option key={role}>{role}</option>)}
            </select>
          </div>
          <Button className="self-end" onClick={createUser} disabled={!form.name || !form.email || !form.password || form.password !== form.confirmPassword}>Add User</Button>
          {message ? <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-6">{message}</p> : null}
        </CardContent>
      </Card>
      <DataTable columns={columns} data={users} filterPlaceholder="Search users..." />
    </AppShell>
  );
}
