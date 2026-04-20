export function WorkflowsPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 md:px-10 md:py-12">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-step-trigger">
          Workflows
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Workflows
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Manage workflow templates, drafts, and active automations from one place.
        </p>
      </header>

      <div className="rounded-[2rem] border border-slate-200 bg-[#f8fafb] p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-step-trigger">
          Placeholder
        </p>
        <p className="mt-4 text-lg text-slate-700">
          Workflow list and editor content will be migrated next.
        </p>
      </div>
    </section>
  );
}
