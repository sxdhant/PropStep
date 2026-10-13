import InlineCrud from "@/components/admin/InlineCrud";

export default function Page() {
  return (
    <InlineCrud
      title="Search areas"
      intro="The localities offered in the property search, and the zone each belongs to (Central, North, East, South or West)."
      endpoint="/api/admin/areas"
      cols={[
        { key: "name", label: "Locality" },
        { key: "zone", label: "Zone", placeholder: "South" },
        { key: "city", label: "City" },
      ]}
      defaults={{ city: "Bengaluru" }}
    />
  );
}
