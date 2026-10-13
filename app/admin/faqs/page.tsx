import ListEditor from "@/components/admin/ListEditor";

export default function Page() {
  return (
    <ListEditor
      title="FAQs"
      intro="Shown on the Services page and in search results, in this order."
      endpoint="/api/admin/faqs"
      noun="question"
      fields={[
        { key: "q", label: "Question" },
        { key: "a", label: "Answer", area: true },
      ]}
    />
  );
}
