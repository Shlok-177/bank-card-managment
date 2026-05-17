"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validators/auth";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@bankpayout.local", password: "Admin@12345" }
  });

  async function onSubmit(values: LoginForm) {
    setMessage("");
    const response = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify(values) });
    const data = await response.json();
    if (data.ok) router.push("/dashboard");
    else setMessage(data.error ?? "Login failed");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <CardTitle>Bank Payout Management System</CardTitle>
          <CardDescription>Sign in to manage uploads, bank rules, reports, and analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...form.register("email")} type="email" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input {...form.register("password")} type="password" />
            </div>
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
