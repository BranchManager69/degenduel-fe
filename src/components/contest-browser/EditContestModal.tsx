// src/components/contests/browser/EditContestModal.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { createPortal } from "react-dom";
import { Controller, ControllerRenderProps, useForm } from "react-hook-form";

import {
  contestFormSchema,
  type ContestFormData,
} from "../../schemas/contestSchema";
import { Contest, ContestSettings } from "../../types/index";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { MultiSelect } from "../ui/MultiSelect";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

// TODO: Move to types/index.ts
interface EditContestModalProps {
  contest: Contest | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contestId: number, data: Partial<Contest>) => Promise<void>;
}

export const EditContestModal: React.FC<EditContestModalProps> = ({
  contest,
  isOpen,
  onClose,
  onSave,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ContestFormData>({
    resolver: zodResolver(contestFormSchema),
    defaultValues: {
      name: contest?.name || "",
      description: contest?.description || "",
      entry_fee: contest?.entry_fee || "0.01",
      prize_pool: contest?.prize_pool || "0",
      current_prize_pool: contest?.current_prize_pool || "0",
      start_time: contest?.start_time || getNextHourDateTime(),
      end_time: contest?.end_time || getNextHourDateTime(2),
      entry_deadline: contest?.entry_deadline || getNextHourDateTime(),
      allowed_buckets: contest?.allowed_buckets || [1, 2, 3, 4, 5, 6, 7, 8, 9],
      participant_count: contest?.participant_count || 0,
      status: contest?.status || "pending",
      settings: {
        difficulty: contest?.settings.difficulty || "shark",
        minParticipants: contest?.settings.minParticipants || 2,
        maxParticipants: contest?.settings.maxParticipants ?? null,
        tokenTypesAllowed: contest?.settings.tokenTypesAllowed || [],
        startingPortfolioValue: contest?.settings.startingPortfolioValue || "1000",
      },
    },
  });

  const entryFee = watch("entry_fee");
  const maxParticipantsForm = watch("settings.maxParticipants");

  React.useEffect(() => {
    if (contest) {
      reset({
        name: contest.name,
        description: contest.description,
        entry_fee: contest.entry_fee,
        prize_pool: contest.prize_pool,
        current_prize_pool: contest.current_prize_pool,
        start_time: contest.start_time,
        end_time: contest.end_time,
        entry_deadline: contest.entry_deadline,
        allowed_buckets: contest.allowed_buckets,
        participant_count: contest.participant_count,
        status: contest.status,
        settings: {
          difficulty: contest.settings.difficulty,
          minParticipants: contest.settings.minParticipants || 2,
          maxParticipants: contest.settings.maxParticipants ?? null,
          tokenTypesAllowed: contest.settings.tokenTypesAllowed || [],
          startingPortfolioValue: contest.settings.startingPortfolioValue || "1000",
        },
      });
    }
  }, [contest, reset]);

  const onSubmit = async (data: ContestFormData) => {
    if (!contest) return;

    try {
      setLoading(true);
      const settingsPayload: ContestSettings = {
        difficulty: data.settings.difficulty,
        maxParticipants: data.settings.maxParticipants,
        minParticipants: data.settings.minParticipants,
        tokenTypesAllowed: data.settings.tokenTypesAllowed || [],
        startingPortfolioValue: data.settings.startingPortfolioValue,
      };

      const saveData: Partial<Contest> = {
        name: data.name,
        description: data.description,
        entry_fee: data.entry_fee,
        prize_pool: data.prize_pool,
        start_time: data.start_time,
        end_time: data.end_time,
        entry_deadline: data.entry_deadline,
        allowed_buckets: data.allowed_buckets,
        status: data.status,
        settings: settingsPayload,
      };

      await onSave(contest.id, saveData);
      onClose();
    } catch (error) {
      console.error("Failed to save contest:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !contest) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-dark-200 rounded-lg w-full max-w-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-6 border-b border-dark-300">
            <h2 className="text-xl font-bold text-gray-100">Edit Contest</h2>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              ✕
            </Button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="overflow-y-auto p-6 space-y-6"
          >
            <div className="grid grid-cols-2 gap-6">
              <Controller
                name="name"
                control={control}
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<ContestFormData, "name">;
                }) => (
                  <FormField label="Contest Name" error={errors.name?.message}>
                    <Input {...field} className="w-full" />
                  </FormField>
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<ContestFormData, "description">;
                }) => (
                  <FormField
                    label="Description"
                    error={errors.description?.message}
                    className="col-span-2"
                  >
                    <Textarea {...field} rows={4} className="w-full" />
                  </FormField>
                )}
              />

              <Controller
                name="allowed_buckets"
                control={control}
                render={({
                  field: { value, onChange },
                }: {
                  field: ControllerRenderProps<
                    ContestFormData,
                    "allowed_buckets"
                  >;
                }) => (
                  <FormField
                    label="Allowed Buckets"
                    error={errors.allowed_buckets?.message}
                  >
                    <MultiSelect
                      value={value}
                      onChange={onChange}
                      options={[
                        { value: 1, label: "Bucket 1" },
                        { value: 2, label: "Bucket 2" },
                        { value: 3, label: "Bucket 3" },
                        { value: 4, label: "Bucket 4" },
                        { value: 5, label: "Bucket 5" },
                      ]}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="settings.minParticipants"
                control={control}
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    ContestFormData,
                    "settings.minParticipants"
                  >;
                }) => (
                  <FormField
                    label="Min Participants"
                    error={errors.settings?.minParticipants?.message}
                  >
                    <Input
                      {...field}
                      type="number"
                      min={2}
                      className="w-full"
                      onChange={e => field.onChange(parseInt(e.target.value,10) || 0)}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="settings.maxParticipants"
                control={control}
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    ContestFormData,
                    "settings.maxParticipants"
                  >;
                }) => (
                  <FormField
                    label="Max Participants"
                    error={errors.settings?.maxParticipants?.message}
                  >
                    <Input
                      {...field}
                      type="number"
                      min={2}
                      max={1000}
                      className="w-full"
                      onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value,10) || 0)}
                      value={field.value ?? ''}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="entry_fee"
                control={control}
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<ContestFormData, "entry_fee">;
                }) => (
                  <FormField
                    label="Entry Fee"
                    error={errors.entry_fee?.message}
                  >
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className="w-full pr-12"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        SOL
                      </div>
                    </div>
                  </FormField>
                )}
              />

              <div>
                <FormField label="Max Prize Pool">
                  <Input
                    type="text"
                    value={`${
                      Number(entryFee) * Number(maxParticipantsForm) * 0.9
                    } SOL`}
                    className="w-full"
                    disabled
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    90% of entry fee × max participants
                  </p>
                </FormField>
              </div>

              <Controller
                name="start_time"
                control={control}
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<ContestFormData, "start_time">;
                }) => (
                  <FormField
                    label="Start Time"
                    error={errors.start_time?.message}
                  >
                    <Input
                      {...field}
                      type="datetime-local"
                      className="w-full"
                    />
                  </FormField>
                )}
              />

              <Controller
                name="end_time"
                control={control}
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<ContestFormData, "end_time">;
                }) => (
                  <FormField label="End Time" error={errors.end_time?.message}>
                    <Input
                      {...field}
                      type="datetime-local"
                      className="w-full"
                    />
                  </FormField>
                )}
              />

              <Controller
                name="entry_deadline"
                control={control}
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    ContestFormData,
                    "entry_deadline"
                  >;
                }) => (
                  <FormField
                    label="Entry Deadline"
                    error={errors.entry_deadline?.message}
                  >
                    <Input
                      {...field}
                      type="datetime-local"
                      className="w-full"
                    />
                  </FormField>
                )}
              />

              <Controller
                name="current_prize_pool"
                control={control}
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    ContestFormData,
                    "current_prize_pool"
                  >;
                }) => (
                  <FormField
                    label="Current Prize Pool"
                    error={errors.current_prize_pool?.message}
                  >
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      className="w-full"
                      disabled={watch("status") !== "active"}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="participant_count"
                control={control}
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    ContestFormData,
                    "participant_count"
                  >;
                }) => (
                  <FormField
                    label="Seats Claimed"
                    error={errors.participant_count?.message}
                  >
                    <Input
                      {...field}
                      type="number"
                      className="w-full"
                      disabled={watch("status") === "pending"}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="settings.difficulty"
                control={control}
                render={({
                  field: { value, onChange },
                }: {
                  field: ControllerRenderProps<
                    ContestFormData,
                    "settings.difficulty"
                  >;
                }) => (
                  <FormField
                    label="Difficulty"
                    error={errors.settings?.difficulty?.message}
                  >
                    <Select
                      value={value}
                      onChange={onChange}
                      options={[
                        { value: "guppy", label: "Guppy" },
                        { value: "tadpole", label: "Tadpole" },
                        { value: "squid", label: "Squid" },
                        { value: "dolphin", label: "Dolphin" },
                        { value: "shark", label: "Shark" },
                        { value: "whale", label: "Whale" },
                      ]}
                      className="w-full"
                    />
                  </FormField>
                )}
              />

              <Controller
                name="settings.startingPortfolioValue"
                control={control}
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    ContestFormData,
                    "settings.startingPortfolioValue"
                  >;
                }) => (
                  <FormField
                    label="Starting Portfolio Value (SOL)"
                    error={errors.settings?.startingPortfolioValue?.message}
                  >
                    <Input
                      {...field}
                      type="text"
                      className="w-full"
                      placeholder="e.g., 1000"
                    />
                  </FormField>
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({
                  field: { value, onChange },
                }: {
                  field: ControllerRenderProps<ContestFormData, "status">;
                }) => (
                  <FormField label="Status" error={errors.status?.message}>
                    <Select
                      value={value}
                      onChange={onChange}
                      options={[
                        { value: "pending", label: "Pending" },
                        { value: "active", label: "Active" },
                        { value: "completed", label: "Completed" },
                        { value: "cancelled", label: "Cancelled" },
                      ]}
                      className="w-full"
                    />
                  </FormField>
                )}
              />

              {watch("status") === "cancelled" && (
                <>
                  <Controller
                    name="cancelled_at"
                    control={control}
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<
                        ContestFormData,
                        "cancelled_at"
                      >;
                    }) => (
                      <FormField
                        label="Cancelled At"
                        error={errors.cancelled_at?.message}
                      >
                        <Input
                          {...field}
                          type="datetime-local"
                          className="w-full"
                          disabled
                        />
                      </FormField>
                    )}
                  />

                  <Controller
                    name="cancellation_reason"
                    control={control}
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<
                        ContestFormData,
                        "cancellation_reason"
                      >;
                    }) => (
                      <FormField
                        label="Cancellation Reason"
                        error={errors.cancellation_reason?.message}
                        className="col-span-2"
                      >
                        <Textarea {...field} rows={2} className="w-full" />
                      </FormField>
                    )}
                  />
                </>
              )}

              <div className="col-span-2 border-t border-dark-300 pt-6">
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
};

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children,
  className = "",
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      {label}
    </label>
    {children}
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
);

function getNextHourDateTime(hoursToAdd = 1): string {
  const date = new Date();
  date.setHours(date.getHours() + hoursToAdd, 0, 0, 0);
  return date.toISOString().slice(0, 16);
}
