"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StaffForm } from "@/components/staff/staff-form";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NewStaffPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      await api.post("/api/v1/staff", data);
      toast.success("Staff member added successfully!");
      router.push("/staff");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating staff:", error);
      
      if (error.status === 409) {
        toast.error("A staff member with this phone number already exists");
      } else if (error.status === 400) {
        toast.error("Please check the form for errors");
      } else {
        toast.error("Failed to add staff member. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Staff Member</h1>
        <p className="text-muted-foreground">
          Create a new staff profile for your catering service
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
          <CardDescription>
            Enter the details for the new staff member. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
