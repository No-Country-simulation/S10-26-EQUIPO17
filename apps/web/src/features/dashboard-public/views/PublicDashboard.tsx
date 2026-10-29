import { PublicLayout } from "../../../shared/layouts/PublicLayout";
import { HeroSection } from "../components/HeroSection";
import { SimulationSection } from "../components/SimulationSection";
import { RolesSection } from "../components/RolesSection";
import { CtaBanner } from "../components/CtaBanner";

export function PublicDashboard() {
  return (
    <PublicLayout>
      <HeroSection />
      <SimulationSection />
      <RolesSection />
      <CtaBanner />
    </PublicLayout>
  );
}
