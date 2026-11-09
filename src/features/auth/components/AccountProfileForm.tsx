"use client";

import type React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { GraduationCap, Home, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AL_STREAMS, DISTRICTS } from "@/lib/constants";
import { isNormalizedApiError } from "@/lib/api";
import { useUpdateProfileMutation } from "../authApi";
import type { User as AuthUser } from "../authTypes";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().regex(/^0\d{9}$/, "Invalid Sri Lankan phone number format (e.g., 0757451258)"),
  address: z.string().min(1, "Address is required"),
  district: z.enum(DISTRICTS, { message: "Please select a district" }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  alStream: z.enum(AL_STREAMS, { message: "Please select an A/L stream" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Dashboard field style (plain white, standard corners) rather than the
// public sign-up form's tall grey pills. h-11 keeps the Select/DatePicker
// leading icons (fixed at top-3.5) vertically centred.
const fieldIconClassName = "absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none";
const inputClassName = "h-11 rounded-lg border-input bg-background pl-10";
const pickerClassName = "h-11 rounded-lg bg-background";

// One settings group: its name and purpose on the left (on wide screens),
// its fields on the right — so a long form reads as a few short topics.
function FieldGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="@container grid grid-cols-1 gap-4 border-b border-border p-5 last:border-b-0 sm:p-6 lg:grid-cols-[14rem_1fr] lg:gap-8">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 @md:grid-cols-2">{children}</div>
    </div>
  );
}

/** Edits the current user's own profile fields (name, contact, personal details). */
export default function AccountProfileForm({ user }: { user: AuthUser }) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    setError,
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
      address: user.address ?? "",
      district: (user.district ?? undefined) as ProfileFormValues["district"],
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
      alStream: (user.alStream ?? undefined) as ProfileFormValues["alStream"],
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const updated = await updateProfile(values).unwrap();
      toast.success("Profile updated successfully");
      reset({
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone ?? "",
        address: updated.address ?? "",
        district: (updated.district ?? undefined) as ProfileFormValues["district"],
        dateOfBirth: updated.dateOfBirth ? updated.dateOfBirth.slice(0, 10) : "",
        alStream: (updated.alStream ?? undefined) as ProfileFormValues["alStream"],
      });
    } catch (error: unknown) {
      if (isNormalizedApiError(error) && error.field) {
        setError(error.field as keyof ProfileFormValues, { type: "server", message: error.message });
      } else {
        toast.error(isNormalizedApiError(error) ? error.message : "Could not update your profile");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="overflow-hidden rounded-xl border border-border bg-card">
      <FieldGroup title="Personal details" description="Your name as it appears on certificates, plus your date of birth.">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <div className="relative">
            <User className={fieldIconClassName} />
            <Input id="firstName" className={inputClassName} error={!!errors.firstName} disabled={isLoading} {...register("firstName")} />
          </div>
          {errors.firstName ? <p className="text-xs font-medium text-destructive">{errors.firstName.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <div className="relative">
            <User className={fieldIconClassName} />
            <Input id="lastName" className={inputClassName} error={!!errors.lastName} disabled={isLoading} {...register("lastName")} />
          </div>
          {errors.lastName ? <p className="text-xs font-medium text-destructive">{errors.lastName.message}</p> : null}
        </div>

        <div className="space-y-2 @md:col-span-2 @md:max-w-[calc(50%-0.5rem)]">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <DatePicker id="dateOfBirth" className={pickerClassName} value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={!!errors.dateOfBirth} disabled={isLoading} />
            )}
          />
          {errors.dateOfBirth ? <p className="text-xs font-medium text-destructive">{errors.dateOfBirth.message}</p> : null}
        </div>
      </FieldGroup>

      <FieldGroup title="Contact" description="How our team reaches you about enrollments and payments. Never shown publicly.">

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <div className="relative">
            <Phone className={fieldIconClassName} />
            <Input id="phone" className={inputClassName} error={!!errors.phone} disabled={isLoading} {...register("phone")} />
          </div>
          {errors.phone ? <p className="text-xs font-medium text-destructive">{errors.phone.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">District</Label>
          <Controller
            name="district"
            control={control}
            render={({ field }) => (
              <Select id="district" className={pickerClassName} accent="black" value={field.value} onChange={field.onChange} onBlur={field.onBlur} options={DISTRICTS} placeholder="Select district" icon={MapPin} error={!!errors.district} disabled={isLoading} />
            )}
          />
          {errors.district ? <p className="text-xs font-medium text-destructive">{errors.district.message}</p> : null}
        </div>


        <div className="space-y-2 @md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <div className="relative">
            <Home className={fieldIconClassName} />
            <Input id="address" className={inputClassName} error={!!errors.address} disabled={isLoading} {...register("address")} />
          </div>
          {errors.address ? <p className="text-xs font-medium text-destructive">{errors.address.message}</p> : null}
        </div>
      </FieldGroup>

      <FieldGroup title="Education" description="Helps us recommend the right courses for your background.">
        <div className="space-y-2 @md:col-span-2 @md:max-w-[calc(50%-0.5rem)]">
          <Label htmlFor="alStream">A/L stream</Label>
          <Controller
            name="alStream"
            control={control}
            render={({ field }) => (
              <Select id="alStream" className={pickerClassName} accent="black" value={field.value} onChange={field.onChange} onBlur={field.onBlur} options={AL_STREAMS} placeholder="Select A/L stream" icon={GraduationCap} error={!!errors.alStream} disabled={isLoading} />
            )}
          />
          {errors.alStream ? <p className="text-xs font-medium text-destructive">{errors.alStream.message}</p> : null}
        </div>
      </FieldGroup>

      {/* Save bar: only asks for attention once something has changed. */}
      <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-muted-foreground">{isDirty ? "You have unsaved changes." : "All changes saved."}</p>
        <div className="flex gap-2">
          {isDirty ? (
            <Button type="button" variant="outline" disabled={isLoading} onClick={() => reset()}>
              Discard
            </Button>
          ) : null}
          <Button type="submit" disabled={isLoading || !isDirty} className="bg-[#191919] bg-none text-white hover:bg-[#27272A]">
            {isLoading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
