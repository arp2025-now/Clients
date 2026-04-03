import { getClientFiles } from "./actions";
import { DocumentsList } from "@/components/documents/DocumentsList";

export default async function DocumentsPage() {
  const files = await getClientFiles();

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">המסמכים שלי</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          חוזים, מסמכים וקבצים הקשורים לפרויקט
        </p>
      </div>
      <DocumentsList files={files} />
    </div>
  );
}
