export const panelClass =
  'rounded-[var(--ui-radius-lg)] border border-border bg-surface-elevated text-text shadow-panel';

export const floatingPanelClass =
  'rounded-[var(--ui-radius-lg)] border border-border bg-surface-floating text-text shadow-panel';

export const modalOverlayClass =
  'fixed inset-0 z-[10001] flex items-center justify-center bg-overlay px-4 py-6 backdrop-blur-sm';

export const modalCardClass =
  'w-full rounded-[var(--ui-radius-lg)] border border-border bg-surface-floating p-[var(--space-md)] text-text shadow-panel';

export const modalHeaderClass =
  'mb-[var(--space-md)] flex items-start justify-between gap-[var(--space-sm)]';

export const titleRowClass =
  'flex items-center gap-2.5 text-[1.0625rem] font-semibold tracking-[0.01em]';

export const iconButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-[var(--ui-radius-md)] border border-border bg-surface-soft text-muted transition duration-200 hover:-translate-y-px hover:border-border-strong hover:bg-surface-strong hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ui-focus-ring)] disabled:pointer-events-none disabled:opacity-60';

export const iconButtonGhostClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-[var(--ui-radius-sm)] text-muted transition duration-200 hover:bg-surface-soft hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ui-focus-ring)] disabled:pointer-events-none disabled:opacity-60';

export const iconButtonDangerClass =
  'border-[color:var(--ui-danger-border)] bg-danger-soft text-danger hover:border-[color:var(--ui-danger-border-strong)] hover:bg-danger-soft hover:text-danger';

export const buttonBaseClass =
  'inline-flex h-11 items-center justify-center gap-[var(--space-2xs)] rounded-[var(--ui-radius-md)] px-[var(--space-sm)] text-[0.9375rem] font-semibold tracking-[0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ui-focus-ring)] disabled:pointer-events-none disabled:opacity-60';

export const primaryButtonClass = `${buttonBaseClass} bg-primary text-interactive-contrast hover:-translate-y-px hover:bg-primary-strong`;

export const secondaryButtonClass = `${buttonBaseClass} border border-border bg-surface-soft text-text hover:-translate-y-px hover:border-border-strong hover:bg-surface-strong`;

export const dangerButtonClass = `${buttonBaseClass} bg-danger text-interactive-contrast hover:-translate-y-px`;

export const softButtonClass = `${buttonBaseClass} border border-border bg-surface-soft text-text hover:-translate-y-px hover:border-border-strong hover:bg-surface-strong`;

export const inputClass =
  'h-11 w-full rounded-[var(--ui-radius-md)] border border-border bg-surface px-[var(--space-sm)] text-base text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-[color:var(--ui-focus-ring)]';

export const inputInsetClass =
  'h-10 w-full rounded-[var(--ui-radius-md)] border border-border bg-surface-inset px-[var(--space-sm)] text-[0.9375rem] text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-[color:var(--ui-focus-ring)]';

export const mutedTextClass = 'text-[0.9375rem] text-muted';
export const subtleTextClass = 'text-[0.8125rem] text-muted';
export const strongMutedTextClass = 'text-[0.9375rem] text-muted-strong';
export const upTextClass = 'text-up';
export const downTextClass = 'text-down';

export const badgeClass =
  'inline-flex items-center gap-[var(--space-2xs)] rounded-full border border-border bg-surface-soft px-[var(--space-xs)] py-1 text-xs';

export const surfaceBadgeClass =
  'inline-flex items-center gap-[var(--space-2xs)] rounded-[var(--ui-radius-md)] border border-border bg-surface px-[var(--space-xs)] py-1 text-xs';

export const tabClass =
  'inline-flex h-9 shrink-0 items-center justify-center rounded-[var(--ui-radius-md)] border border-border bg-transparent px-[var(--space-sm)] text-sm font-medium text-muted transition duration-200 hover:bg-surface-soft hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ui-focus-ring)]';

export const activeTabClass =
  'border-[color:var(--ui-primary-border)] bg-primary-soft text-text';

export const chipClass =
  'inline-flex h-[34px] items-center justify-center rounded-[var(--ui-radius-md)] border border-border bg-transparent px-[var(--space-sm)] text-[0.8125rem] font-medium tracking-[0.01em] text-muted transition duration-200 hover:bg-surface-soft hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ui-focus-ring)]';

export const activeChipClass =
  'border-[color:var(--ui-primary-border)] bg-primary-soft text-text';

export const sectionLabelClass =
  'mb-2 block text-[0.875rem] font-medium tracking-[0.01em] text-muted';

export const emptyStateClass =
  'flex flex-col items-center justify-center rounded-[var(--ui-radius-lg)] border border-dashed border-border bg-surface-elevated px-[var(--space-md)] py-[var(--space-2xl)] text-center text-muted';

export const listItemClass =
  'flex items-center justify-between gap-[var(--space-sm)] rounded-[var(--ui-radius-md)] border border-border bg-surface px-[var(--space-sm)] py-[var(--space-xs)]';

export const checkboxClass =
  'flex h-5 w-5 items-center justify-center rounded-[0.5rem] border-2 border-border bg-surface-soft transition';

export const checkboxCheckedClass = 'border-primary bg-primary';
