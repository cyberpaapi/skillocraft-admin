"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReferralSettings, updateReferralSettings } from "@/lib/api";
import { Loader2, Save, Users, TrendingUp, Gift } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface Settings {
  discountPercent: number;
  earningsPercent: number;
}

export default function ReferralSettingsPage() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch } = useForm<Settings>({
    defaultValues: { discountPercent: 20, earningsPercent: 20 },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["referral-settings"],
    queryFn: async () => {
      const { data } = await getReferralSettings();
      return data as Settings;
    },
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: Settings) => updateReferralSettings(values),
    onSuccess: () => {
      toast.success("Referral settings updated");
      queryClient.invalidateQueries({ queryKey: ["referral-settings"] });
    },
    onError: () => toast.error("Failed to update settings"),
  });

  const discountVal = watch("discountPercent");
  const earningsVal = watch("earningsPercent");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Referral Program Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure discount given to referred users and earnings paid to
          referrers.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <form onSubmit={handleSubmit((v) => save(v))} className="space-y-6">
              <div className="space-y-5">
                {/* Discount percent */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Friend's Discount (%)
                  </label>
                  <p className="text-xs text-slate-400 mb-2">
                    How much discount the referred user gets on their first
                    purchase.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={80}
                      step={1}
                      {...register("discountPercent", {
                        valueAsNumber: true,
                        required: true,
                        min: 1,
                        max: 80,
                      })}
                      className="flex-1 accent-indigo-600"
                    />
                    <div className="w-16 text-center border border-slate-200 rounded-lg py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50">
                      {discountVal}%
                    </div>
                  </div>
                </div>

                {/* Earnings percent */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Referrer's Earnings (%)
                  </label>
                  <p className="text-xs text-slate-400 mb-2">
                    How much the person who shared the code earns from each
                    referred purchase.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={80}
                      step={1}
                      {...register("earningsPercent", {
                        valueAsNumber: true,
                        required: true,
                        min: 1,
                        max: 80,
                      })}
                      className="flex-1 accent-indigo-600"
                    />
                    <div className="w-16 text-center border border-slate-200 rounded-lg py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50">
                      {earningsVal}%
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save Settings
              </button>
            </form>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">
                Live Preview
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <Users size={18} className="text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Friend signs up</p>
                    <p className="text-sm font-semibold text-slate-800">
                      Gets {discountVal}% off
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <TrendingUp
                    size={18}
                    className="text-emerald-600 flex-shrink-0"
                  />
                  <div>
                    <p className="text-xs text-slate-500">Referrer earns</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {earningsVal}% per purchase
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                  <Gift size={18} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Example: ₹1000 order</p>
                    <p className="text-sm font-semibold text-slate-800">
                      Friend pays ₹{Math.round(1000 * (1 - discountVal / 100))},
                      you earn ₹{Math.round(1000 * (earningsVal / 100))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
              <p className="font-medium">Defaults</p>
              <p>
                If no settings are saved, the platform uses{" "}
                <strong>20% discount</strong> and{" "}
                <strong>20% earnings</strong> as defaults.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
