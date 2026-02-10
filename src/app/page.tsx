import StormDrainLayout from "@/components/StormDrainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <StormDrainLayout />
    </ErrorBoundary>
  );
}
