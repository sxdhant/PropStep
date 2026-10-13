import ListingForm from "@/components/admin/ListingForm";

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  return <ListingForm id={(await params).id} />;
}
