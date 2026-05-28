import JobStockApp from "@/features/jobstock/JobStockApp";
import SupabaseBridge from "@/features/jobstock/SupabaseBridge";

export default function Home() {
  return (
    <SupabaseBridge>
      <JobStockApp />
    </SupabaseBridge>
  );
}
