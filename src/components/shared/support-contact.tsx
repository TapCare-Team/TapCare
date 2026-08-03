export const TAPCARE_SUPPORT_EMAIL = "tapcare1234@gmail.com";

export function SupportContact({
  className = "text-center text-sm text-muted"
}: {
  className?: string;
}) {
  return (
    <p className={className}>
      Need help? Contact TapCare at{" "}
      <a className="font-medium text-accent" href={`mailto:${TAPCARE_SUPPORT_EMAIL}`}>
        {TAPCARE_SUPPORT_EMAIL}
      </a>
      .
    </p>
  );
}
