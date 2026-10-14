import { usePathname, useRouter, useSearchParams } from "../compat";

// Filtre en liste déroulante : une ligne de contrôles au lieu de plusieurs lignes de puces.
export default function FilterSelect({ name, label, options }: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="row" style={{ flexDirection: "row", gap: 6, fontWeight: 500 }}>
      {label}
      <select
        id={`filter-${name}`}
        className="inline"
        value={params.get(name) ?? ""}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value) next.set(name, e.target.value);
          else next.delete(name);
          router.push(`${pathname}?${next}`);
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
