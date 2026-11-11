import { addClient } from "@/actions/clients";
import { ClientForm } from "@/components/admin/ClientForm";

export const instant = false;

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Add Client</h1>
      <p className="mt-0.5 text-sm text-zinc-400">
        Create a business with its own public review page and QR code.
        Fields marked * are required.
      </p>
      <div className="mt-6">
        <ClientForm
          action={addClient}
          submitLabel="Add Client"
          showPrefill
        />
      </div>
    </div>
  );
}
