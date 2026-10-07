import { useParams, useSearchParams } from "../compat";
import { CompanyDetail } from "../components/CompanyDetail";

export default function CompanyPage() {
  const { id } = useParams() as { id: string };
  const market = useSearchParams().get("market") ?? undefined;
  return <CompanyDetail id={id} market={market} />;
}
