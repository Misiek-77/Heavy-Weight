import type { SetKind } from '../domain/types';

/** Names and one-letter marks of the set kinds, as shown in the workout and in history. */
export const SET_KIND_INFO: Record<SetKind, { label: string; mark: string; hint: string }> = {
  normal: { label: 'Zwykła', mark: '', hint: 'Seria robocza.' },
  warmup: { label: 'Rozgrzewkowa', mark: 'R', hint: 'Nie liczy się do rekordów ani wykresu postępów.' },
  failure: { label: 'Do upadku', mark: 'U', hint: 'Do ostatniego możliwego powtórzenia.' },
  drop: { label: 'Drop set', mark: 'D', hint: 'Od razu po poprzedniej serii, z mniejszym ciężarem.' },
};

/** "2", or "4+" for the top value that stands for "four or more". */
export const rirLabel = (rir: number) => (rir >= 4 ? '4+' : String(rir));
