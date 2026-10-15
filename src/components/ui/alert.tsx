import { CircleAlert, CircleCheck } from "lucide-react";

type AlertProps = {
  variant: "success" | "error";
  children: React.ReactNode;
};

export function Alert({ variant, children }: AlertProps) {
  const Icon = variant === "success" ? CircleCheck : CircleAlert;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex gap-2 rounded-lg border px-3 py-2.5 text-sm ${
        variant === "success"
          ? "border-success/30 bg-success/10 text-success"
          : "border-danger/30 bg-danger/10 text-danger"
      }`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}
