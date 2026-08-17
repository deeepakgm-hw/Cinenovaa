// ShowtimeChip — interactive showtime element
// States: available | past | selected

export default function ShowtimeChip({ time, state = 'available', onClick }) {
  const stateClass = {
    available: 'cn-chip-available',
    past:      'cn-chip-past',
    selected:  'cn-chip-selected',
  }[state] || 'cn-chip-available'

  return (
    <button
      type="button"
      disabled={state === 'past'}
      onClick={state !== 'past' ? onClick : undefined}
      className={['cn-chip', stateClass].join(' ')}
    >
      {time}
    </button>
  )
}
