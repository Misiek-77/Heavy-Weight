/** Quiet free-text note that grows with its content. */
export function NoteField(props: { label: string; placeholder: string; value: string; onChange(value: string): void }) {
  return (
    <textarea
      className="note"
      rows={1}
      maxLength={500}
      aria-label={props.label}
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}
