export interface ChunkingStrategyOption {
  label: string;
  value: ChunkingStrategy;
  apiStrategy: string;
  usesTokenBudget: boolean;
}

export type ChunkingStrategy =
  | 'mixed'
  | 'recursive'
  | 'semantic'
  | 'heading'
  | 'table-aware'
  | 'table-aware-v2'
  | 'token-budget';

export const CHUNKING_STRATEGIES: ChunkingStrategyOption[] = [
  { label: 'Mixed (recommended)', value: 'mixed', apiStrategy: 'MIXED', usesTokenBudget: false },
  { label: 'Recursive', value: 'recursive', apiStrategy: 'RECURSIVE', usesTokenBudget: false },
  { label: 'Semantic', value: 'semantic', apiStrategy: 'SEMANTIC', usesTokenBudget: false },
  { label: 'Heading-based', value: 'heading', apiStrategy: 'HEADING', usesTokenBudget: false },
  { label: 'Table aware', value: 'table-aware', apiStrategy: 'TABLE_AWARE', usesTokenBudget: false },
  { label: 'Table aware v2', value: 'table-aware-v2', apiStrategy: 'TABLE_AWARE_V2', usesTokenBudget: false },
  {
    label: 'Fixed size (token budget)',
    value: 'token-budget',
    apiStrategy: 'MIXED',
    usesTokenBudget: true
  }
];

export function findChunkingStrategy(value: ChunkingStrategy): ChunkingStrategyOption {
  return CHUNKING_STRATEGIES.find((strategy) => strategy.value === value) ?? CHUNKING_STRATEGIES[0];
}
