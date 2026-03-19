export interface CommandDefinition {
  description?: string;
  template: string;
  model?: string;
  agent?: string;
  subtask?: boolean;
}
