/** Note fiable, provisoire ou en vérification : on ne publie pas un chiffre que les données contredisent. */
import { ScoreRing } from "./Fun";
import type { DataState } from "../lib/api";

export function ScoreOrReview({ score, tone, size, data }: {
  score: number; tone: "good" | "mid" | "low"; size: number; data?: DataState;
}) {
  if (data?.under_review?.length) {
    return (
      <span className="review-ring" style={{ width: size, height: size }} title={`En vérification : ${data.under_review.join(" ; ")}`}>
        ?
      </span>
    );
  }
  return <ScoreRing score={score} tone={tone} size={size} />;
}

export function DataFlag({ data }: { data?: DataState }) {
  if (data?.under_review?.length) {
    return <span className="data-flag review" title={data.under_review.join("\n")}>en vérification</span>;
  }
  if (data && data.complete === false) {
    return <span className="data-flag provisional" title="Une source n'a pas répondu au dernier relevé : la note peut être sous-estimée.">provisoire</span>;
  }
  return null;
}
