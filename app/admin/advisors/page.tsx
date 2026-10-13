import InlineCrud from "@/components/admin/InlineCrud";

export default function Page() {
  return (
    <InlineCrud
      title="Advisors"
      intro="The people shown on listing pages. The key (e.g. karthik) is what a listing is assigned to, so it can't be reused. An advisor with listings can't be deleted."
      endpoint="/api/admin/advisors"
      cols={[
        { key: "key", label: "Key", placeholder: "karthik" },
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "languages", label: "Languages", placeholder: "English, Kannada" },
        { key: "years", label: "Years", type: "number" },
      ]}
      showListingCount
    />
  );
}
