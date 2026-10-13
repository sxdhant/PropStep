import ListEditor from "@/components/admin/ListEditor";

export default function Page() {
  return (
    <ListEditor
      title="Testimonials"
      intro="Shown on the home page, in this order."
      endpoint="/api/admin/testimonials"
      noun="testimonial"
      fields={[
        { key: "quote", label: "Quote", area: true },
        { key: "name", label: "Name" },
        { key: "meta", label: "Detail (e.g. Bought in Whitefield)" },
      ]}
    />
  );
}
