"use client";

import { useEffect, useState } from "react";
import { UserPlus, Users, Mail, Loader2, Sparkles, Edit, Trash2 } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
  updatedAt: string;
}

interface TeamResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  users: TeamUser[];
}

interface CurrentUserSession {
  userId: string;
  tenantId: string;
  email: string;
  role: "owner" | "admin" | "member";
}

export function TeamContent({ tenantName, tenantSlug }: { tenantName: string; tenantSlug: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserSession | null>(null);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    role: "member",
    password: "",
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [usersResponse, authResponse] = await Promise.all([
          fetch("/api/team/users"),
          fetch("/api/auth/me"),
        ]);

        const data = await usersResponse.json();

        if (!usersResponse.ok) {
          throw new Error(data.error || "Failed to load team members");
        }

        if (authResponse.ok) {
          const authData = (await authResponse.json()) as { user?: CurrentUserSession | null };
          setCurrentUser(authData.user || null);
        }

        const payload = data as TeamResponse;
        setUsers(payload.users || []);
      } catch (error) {
        toast({
          title: "Team load failed",
          description: (error as Error).message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [toast]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);

    try {
      const response = await fetch("/api/team/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add team member");
      }

      setUsers((current) => [data.user, ...current]);
      setForm({ name: "", email: "", password: "", role: "member" });

      toast({
        title: "Member added",
        description: `${data.user.name} is now part of ${tenantName}`,
      });
    } catch (error) {
      toast({
        title: "Add user failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const canManageTarget = (user: TeamUser) => {
    if (!currentUser) {
      return false;
    }

    if (user.id === currentUser.userId) {
      return false;
    }

    if (user.role === "owner") {
      return false;
    }

    if (currentUser.role === "owner") {
      return true;
    }

    return currentUser.role === "admin" && user.role === "member";
  };

  const startEdit = (user: TeamUser) => {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name,
      role: user.role === "admin" ? "admin" : "member",
      password: "",
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm({ name: "", role: "member", password: "" });
  };

  const handleUpdateUser = async (userId: string) => {
    setUpdatingUserId(userId);

    try {
      const response = await fetch(`/api/team/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update member");
      }

      setUsers((current) => current.map((user) => (user.id === userId ? data.user : user)));
      cancelEdit();

      toast({
        title: "Member updated",
        description: `${data.user.name} has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (user: TeamUser) => {
    const confirmed = window.confirm(`Remove ${user.name} from ${tenantName}?`);

    if (!confirmed) {
      return;
    }

    setDeletingUserId(user.id);

    try {
      const response = await fetch(`/api/team/users/${user.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete member");
      }

      setUsers((current) => current.filter((item) => item.id !== user.id));

      toast({
        title: "Member removed",
        description: `${user.name} was removed from ${tenantName}.`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const roleColors: Record<string, string> = {
    owner: "bg-violet-500",
    admin: "bg-blue-500",
    member: "bg-emerald-500",
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card className="border-0 shadow-lg shadow-primary/5 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10 px-6 py-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Workspace users
              </div>
              <CardTitle className="text-2xl">Team Management</CardTitle>
              <CardDescription className="mt-2">
                Add users to <span className="font-medium text-foreground">{tenantName}</span>.
                <br />
                Tenant slug: <span className="font-medium text-foreground">{tenantSlug}</span>
              </CardDescription>
            </div>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-secondary/30 p-4">
                  <div className="text-xs font-medium text-muted-foreground">Total members</div>
                  <div className="mt-1 text-2xl font-bold">{users.length}</div>
                </div>
                <div className="rounded-xl border bg-secondary/30 p-4">
                  <div className="text-xs font-medium text-muted-foreground">Roles supported</div>
                  <div className="mt-1 text-2xl font-bold">3</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                Add tenant user
              </CardTitle>
              <CardDescription>
                Create a new login for this tenant. Only admins and owners can use this form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateUser}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@company.com" className="pl-9" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Temporary or permanent password" required />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {creating ? "Adding user..." : "Add user to tenant"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Tenant members
            </CardTitle>
            <CardDescription>Everyone who can access this tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                No users have been added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-xl border p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex-1 pr-4">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Added {formatDate(user.createdAt)}</div>

                      {editingUserId === user.id && (
                        <div className="mt-3 space-y-3 rounded-lg border bg-secondary/20 p-3">
                          <div className="space-y-1">
                            <Label htmlFor={`edit-name-${user.id}`}>Name</Label>
                            <Input
                              id={`edit-name-${user.id}`}
                              value={editForm.name}
                              onChange={(event) =>
                                setEditForm((current) => ({ ...current, name: event.target.value }))
                              }
                              placeholder="Updated name"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label>Role</Label>
                            <Select
                              value={editForm.role}
                              onValueChange={(value) =>
                                setEditForm((current) => ({ ...current, role: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                {currentUser?.role === "owner" && (
                                  <SelectItem value="admin">Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`edit-password-${user.id}`}>New password (optional)</Label>
                            <Input
                              id={`edit-password-${user.id}`}
                              type="password"
                              value={editForm.password}
                              onChange={(event) =>
                                setEditForm((current) => ({ ...current, password: event.target.value }))
                              }
                              placeholder="Leave blank to keep current password"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateUser(user.id)}
                              disabled={updatingUserId === user.id}
                            >
                              {updatingUserId === user.id ? "Saving..." : "Save changes"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`${roleColors[user.role]} text-white`}>
                        {user.role}
                      </Badge>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => startEdit(user)}
                        disabled={!canManageTarget(user) || deletingUserId === user.id}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleDeleteUser(user)}
                        disabled={!canManageTarget(user) || deletingUserId === user.id}
                      >
                        {deletingUserId === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}