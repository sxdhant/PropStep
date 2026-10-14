import InlineCrud from "@/components/admin/InlineCrud";

export default function Page() {
  return (
    <InlineCrud
      title="Advisors"
      intro="The people shown on listing pages. The key (e.g. karthik) is what a listing is assigned to, so it can't be reused. The phone number is this advisor's own line: the Call and WhatsApp buttons on their listings use it, in international format such as +919187103101. Leave it empty to use the company number. An advisor with listings can't be deleted."
      endpoint="/api/admin/advisors"
      cols={[
        { key: "key", label: "Key", placeholder: "karthik" },
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "languages", label: "Languages", placeholder: "English, Kannada" },
        { key: "years", label: "Years", type: "number" },
        { key: "phone", label: "Phone (calls and WhatsApp)", placeholder: "+919187103101" },
      ]}
      showListingCount
    />
  );
}
