import { ArrowIcon } from "./icons";

export default function AuthSubmitButton({
  loading,
  loadingLabel,
  children,
}: {
  loading: boolean;
  loadingLabel: string;
  children: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-[51px] w-full items-center justify-center gap-2 rounded-md bg-theme-crimson text-[15px] font-semibold text-white transition-colors hover:bg-theme-crimson-hover disabled:opacity-60"
    >
      {loading ? loadingLabel : children}
      {!loading && <ArrowIcon />}
    </button>
  );
}
