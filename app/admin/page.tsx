"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FieldSet,
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProjectFormState = {
  name: string;
  description: string;
  budget: string;
  ownerId: string;
  ministryId: string;
  locationId: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>({
    name: "",
    description: "",
    budget: "",
    ownerId: "",
    ministryId: "",
    locationId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [ministries, setMinistries] = useState<Array<{ id: string; name: string }>>([]);
  const [locations, setLocations] = useState<Array<{ id: string; city: string | null; region: string | null }>>([]);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ministrySearch, setMinistrySearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          setIsCheckingAuth(false);
          setIsAuthorized(false);
          return;
        }
        const data = await res.json();
        const role = data?.user?.role;
        if (role === "ADMIN") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch {
        setIsAuthorized(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, ministriesRes, locationsRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/ministry"),
          fetch("/api/location"),
        ]);

        const usersJson = await usersRes.json();
        const ministriesJson = await ministriesRes.json();
        const locationsJson = await locationsRes.json();

        setUsers(
          (usersJson?.data ?? []).map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          }))
        );
        setMinistries(ministriesJson?.data ?? []);
        setLocations(locationsJson?.data ?? []);
      } catch {
        // swallow; form will still be usable if these fail
      }
    };

    loadData();
  }, []);

  const handleChange =
    (field: keyof ProjectFormState) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.name || !form.budget || !form.ownerId || !form.ministryId || !form.locationId) {
      setError("Please fill in all required fields.");
      return;
    }

    const numericBudget = Number(form.budget);
    if (Number.isNaN(numericBudget) || numericBudget <= 0) {
      setError("Budget must be a positive number.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          budget: numericBudget.toString(),
          ownerId: form.ownerId,
          ministryId: form.ministryId,
          locationId: form.locationId,
          status: "PLANNED",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Failed to create project.");
        return;
      }

      router.push(`/project/${data.project.id}`);
    } catch {
      setError("Unexpected error while creating project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOwners = useMemo(
    () =>
      users.filter((u) => {
        const term = ownerSearch.toLowerCase();
        return (
          !term ||
          u.email.toLowerCase().includes(term) ||
          (u.name ?? "").toLowerCase().includes(term)
        );
      }),
    [users, ownerSearch]
  );

  const filteredMinistries = useMemo(
    () =>
      ministries.filter((m) =>
        !ministrySearch
          ? true
          : m.name.toLowerCase().includes(ministrySearch.toLowerCase())
      ),
    [ministries, ministrySearch]
  );

  const filteredLocations = useMemo(
    () =>
      locations.filter((l) => {
        const label = `${l.city ?? ""} ${l.region ?? ""}`.toLowerCase();
        return !locationSearch || label.includes(locationSearch.toLowerCase());
      }),
    [locations, locationSearch]
  );

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Typography variant="muted">Checking permissions…</Typography>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Typography variant="muted">
          You do not have access to this page.
        </Typography>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Typography variant="h2" className="mb-4">
        Admin Panel
      </Typography>
      <Typography variant="muted" className="mb-6">
        Create a new project by filling in the details below.
      </Typography>

      <form onSubmit={handleSubmit}>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Project name</FieldLabel>
              <Input
                id="name"
                value={form.name}
                onChange={handleChange("name")}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Input
                id="description"
                value={form.description}
                onChange={handleChange("description")}
                placeholder="Optional"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="budget">Budget</FieldLabel>
              <Input
                id="budget"
                value={form.budget}
                onChange={handleChange("budget")}
                type="number"
                min="0"
                step="0.01"
                required
              />
              <FieldDescription>
                Enter the budget as a number (e.g. 70000).
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Owner</FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    {form.ownerId
                      ? users.find((u) => u.id === form.ownerId)?.email ?? "Select owner"
                      : "Select owner"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <DropdownMenuLabel>Search owner</DropdownMenuLabel>
                  <div className="px-2 pb-2">
                    <Input
                      placeholder="Search by name or email"
                      value={ownerSearch}
                      onChange={(e) => setOwnerSearch(e.target.value)}
                    />
                  </div>
                  <DropdownMenuSeparator />
                  {filteredOwners.map((user) => (
                    <DropdownMenuItem
                      key={user.id}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, ownerId: user.id }))
                      }
                      className={cn(
                        "flex flex-col items-start",
                        form.ownerId === user.id && "bg-accent"
                      )}
                    >
                      <span className="text-sm font-medium">
                        {user.name ?? user.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  {filteredOwners.length === 0 && (
                    <DropdownMenuItem disabled>No users found</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <FieldDescription>
                Only existing users can be project owners.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Ministry</FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    {form.ministryId
                      ? ministries.find((m) => m.id === form.ministryId)?.name ??
                      "Select ministry"
                      : "Select ministry"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <DropdownMenuLabel>Search ministry</DropdownMenuLabel>
                  <div className="px-2 pb-2">
                    <Input
                      placeholder="Search ministries"
                      value={ministrySearch}
                      onChange={(e) => setMinistrySearch(e.target.value)}
                    />
                  </div>
                  <DropdownMenuSeparator />
                  {filteredMinistries.map((ministry) => (
                    <DropdownMenuItem
                      key={ministry.id}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, ministryId: ministry.id }))
                      }
                      className={cn(
                        form.ministryId === ministry.id && "bg-accent"
                      )}
                    >
                      {ministry.name}
                    </DropdownMenuItem>
                  ))}
                  {filteredMinistries.length === 0 && (
                    <DropdownMenuItem disabled>No ministries found</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>
            <Field>
              <FieldLabel>Location</FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    {form.locationId
                      ? (() => {
                        const loc = locations.find(
                          (l) => l.id === form.locationId
                        );
                        if (!loc) return "Select location";
                        return loc.city ?? loc.region ?? "Unnamed location";
                      })()
                      : "Select location"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <DropdownMenuLabel>Search location</DropdownMenuLabel>
                  <div className="px-2 pb-2">
                    <Input
                      placeholder="Search locations"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                    />
                  </div>
                  <DropdownMenuSeparator />
                  {filteredLocations.map((loc) => (
                    <DropdownMenuItem
                      key={loc.id}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, locationId: loc.id }))
                      }
                      className={cn(
                        form.locationId === loc.id && "bg-accent"
                      )}
                    >
                      {loc.city ?? loc.region ?? "Unnamed location"}
                    </DropdownMenuItem>
                  ))}
                  {filteredLocations.length === 0 && (
                    <DropdownMenuItem disabled>No locations found</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>
            {error && (
              <Field>
                <p className="text-sm text-red-600">{error}</p>
              </Field>
            )}
            <Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating project..." : "Create project"}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  );
}

