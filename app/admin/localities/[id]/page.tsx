import { LocalityForm } from "@/components/admin/LocalityAdmin";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <LocalityForm id={(await params).id} />;
}
