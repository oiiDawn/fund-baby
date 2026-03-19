export const panelClass =
  'rounded-[22px] border border-border bg-surface-elevated text-text shadow-panel';

export const floatingPanelClass =
  'rounded-[22px] border border-border bg-surface-floating text-text shadow-panel';

export const modalOverlayClass =
  'fixed inset-0 z-[10001] flex items-center justify-center bg-overlay px-4 py-6 backdrop-blur-sm';

export const modalCardClass =
  'w-full rounded-[24px] border border-border bg-surface-floating p-5 text-text shadow-panel';

export const modalHeaderClass = 'mb-5 flex items-start justify-between gap-3';

export const titleRowClass =
  'flex items-center gap-2.5 text-base font-semibold';

export const iconButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-soft text-muted transition duration-200 hover:-translate-y-px hover:border-border-strong hover:bg-surface-strong hover:text-text disabled:pointer-events-none disabled:opacity-60';

export const iconButtonGhostClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition duration-200 hover:bg-surface-soft hover:text-text disabled:pointer-events-none disabled:opacity-60';

export const iconButtonDangerClass =
  'border-[rgba(181,122,119,0.24)] bg-danger-soft text-danger hover:border-[rgba(181,122,119,0.32)] hover:bg-danger-soft hover:text-danger';

export const buttonBaseClass =
  'inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-60';

export const primaryButtonClass = `${buttonBaseClass} bg-primary text-interactive-contrast hover:-translate-y-px hover:bg-primary-strong`;

export const secondaryButtonClass = `${buttonBaseClass} border border-border bg-surface-soft text-text hover:-translate-y-px hover:border-border-strong hover:bg-surface-strong`;

export const dangerButtonClass = `${buttonBaseClass} bg-danger text-interactive-contrast hover:-translate-y-px`;

export const softButtonClass = `${buttonBaseClass} border border-border bg-surface-soft text-text hover:-translate-y-px hover:border-border-strong hover:bg-surface-strong`;

export const inputClass =
  'h-11 w-full rounded-[14px] border border-border bg-surface px-3.5 text-[0.95rem] text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-[color:var(--ui-focus-ring)]';

export const inputInsetClass =
  'h-10 w-full rounded-xl border border-border bg-surface-inset px-3 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-[color:var(--ui-focus-ring)]';

export const mutedTextClass = 'text-sm text-muted';
export const subtleTextClass = 'text-xs text-muted';
export const strongMutedTextClass = 'text-sm text-muted-strong';
export const upTextClass = 'text-up';
export const downTextClass = 'text-down';

export const badgeClass =
  'inline-flex items-center gap-2 rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs';

export const surfaceBadgeClass =
  'inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1 text-xs';

export const tabClass =
  'inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-medium text-muted transition duration-200 hover:bg-surface-soft hover:text-text';

export const activeTabClass =
  'border-[rgba(103,167,255,0.24)] bg-primary-soft text-text';

export const chipClass =
  'inline-flex h-[34px] items-center justify-center rounded-xl border border-border bg-transparent px-3 text-xs font-medium text-muted transition duration-200 hover:bg-surface-soft hover:text-text';

export const activeChipClass =
  'border-[rgba(103,167,255,0.24)] bg-primary-soft text-text';

export const sectionLabelClass = 'mb-2 block text-sm text-muted';

export const emptyStateClass =
  'flex flex-col items-center justify-center rounded-[22px] border border-dashed border-border bg-surface-elevated px-5 py-14 text-center text-muted';

export const listItemClass =
  'flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5';

export const checkboxClass =
  'flex h-5 w-5 items-center justify-center rounded-md border-2 border-border bg-surface-soft transition';

export const checkboxCheckedClass = 'border-primary bg-primary';
