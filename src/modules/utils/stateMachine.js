/**
 * Config-driven state machine for task lifecycle.
 * Reads task-lifecycle.json from workspace configs/, with built-in defaults.
 */

const DEFAULT_CONFIG = {
  media: {
    label: '素材任务',
    states: ['initialized', 'generating', 'pending_review', 'approved', 'rejected'],
    kanban_states: ['generating', 'pending_review', 'approved'],
    transitions: {
      initialized: ['generating'],
      generating: ['pending_review'],
      pending_review: ['approved', 'rejected'],
      approved: [],
      rejected: []
    },
    final_states: ['approved', 'rejected'],
    color: '#4a90d9'
  },
  copywriting: {
    label: '文案任务',
    states: ['initialized', 'generating', 'pending_review', 'approved', 'scheduled', 'published', 'archived', 'rejected'],
    kanban_states: ['generating', 'pending_review', 'approved', 'scheduled', 'published'],
    transitions: {
      initialized: ['generating'],
      generating: ['pending_review'],
      pending_review: ['approved', 'rejected'],
      approved: ['scheduled'],
      scheduled: ['published'],
      published: ['archived'],
      archived: [],
      rejected: []
    },
    final_states: ['approved', 'archived', 'rejected'],
    color: '#27ae60'
  }
};

export class StateMachine {
  constructor(config = {}) {
    this._config = this._mergeDefaults(config);
  }

  /** Load configuration from a parsed JSON object (from api.readJSON) */
  loadConfig(configData) {
    if (!configData || typeof configData !== 'object') return;
    this._config = this._mergeDefaults(configData);
  }

  /** Return config for a specific task type */
  getTypeConfig(taskType) {
    return this._config[taskType] || null;
  }

  /** Return all configured task types */
  getTaskTypes() {
    return Object.keys(this._config);
  }

  /** Get all possible states for a task type */
  getStates(taskType) {
    const cfg = this.getTypeConfig(taskType);
    return cfg ? cfg.states : [];
  }

  /** Get kanban-visible states for a task type */
  getKanbanStates(taskType) {
    const cfg = this.getTypeConfig(taskType);
    return cfg ? cfg.kanban_states : [];
  }

  /** Get valid next states from a given state for a task type */
  getNextStates(taskType, currentState) {
    const cfg = this.getTypeConfig(taskType);
    if (!cfg || !cfg.transitions) return [];
    return cfg.transitions[currentState] || [];
  }

  /** Check if a transition is valid */
  isValidTransition(taskType, fromState, toState) {
    const nextStates = this.getNextStates(taskType, fromState);
    return nextStates.includes(toState);
  }

  /** Check if a state is a final state (no further transitions) */
  isFinalState(taskType, state) {
    const cfg = this.getTypeConfig(taskType);
    if (!cfg) return false;
    return cfg.final_states && cfg.final_states.includes(state);
  }

  /** Get the display color for a task type */
  getColor(taskType) {
    const cfg = this.getTypeConfig(taskType);
    return cfg ? cfg.color : '#888';
  }

  /** Get the display label for a task type */
  getLabel(taskType) {
    const cfg = this.getTypeConfig(taskType);
    return cfg ? cfg.label : taskType;
  }

  /** Merge user config over defaults (user config wins per task type) */
  _mergeDefaults(userConfig) {
    const merged = {};
    const allTypes = new Set([
      ...Object.keys(DEFAULT_CONFIG),
      ...Object.keys(userConfig)
    ]);
    for (const type of allTypes) {
      const defaults = DEFAULT_CONFIG[type] || {};
      const user = userConfig[type] || {};
      merged[type] = { ...defaults, ...user };
      // Deep merge arrays/objects
      if (user.states) merged[type].states = [...user.states];
      if (user.kanban_states) merged[type].kanban_states = [...user.kanban_states];
      if (user.final_states) merged[type].final_states = [...user.final_states];
      if (user.transitions) merged[type].transitions = { ...defaults.transitions, ...user.transitions };
    }
    return merged;
  }

  /** Load config from an api.readJSON result */
  async loadFromAPI(api) {
    try {
      const data = await api.readJSON('configs/workflows/task-lifecycle.json');
      this.loadConfig(data);
    } catch {
      // Use defaults
    }
  }
}

/** Convenience: create a pre-loaded instance */
export async function createStateMachine(api) {
  const sm = new StateMachine();
  await sm.loadFromAPI(api);
  return sm;
}

export default StateMachine;
