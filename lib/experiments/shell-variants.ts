export type ShellVariant = 'control' | 'cockpit' | 'board_os';
export type ProjectShellView = 'plan' | 'status';

export function normalizeProjectShellView(value?: string | null): ProjectShellView {
  return value === 'status' ? 'status' : 'plan';
}

export function describeShellVariant(variant: ShellVariant) {
  switch (variant) {
    case 'cockpit':
      return {
        title: 'Option 2: Twin-Cockpit',
        summary: 'Board and Assistant share the workspace. Memory and review stay in the same flow.',
      };
    case 'board_os':
      return {
        title: 'Option 3: Board OS',
        summary: 'The board drives the shell. Assistant, memory, and review support the board rather than co-own it.',
      };
    case 'control':
    default:
      return {
        title: 'Control',
        summary: 'Current product routes and interaction model.',
      };
  }
}
