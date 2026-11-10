// Money fields show the amount the way people read it ("3,200,000") while they type; the form keeps the plain
// whole number ("3200000"), so validation and saving don't change. The ₦ stays beside the field.

// "3200000" (or 3200000) → "3,200,000"; anything that isn't a digit is dropped
export function groupAmount(value: string | number | null | undefined) {
  const digits = String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  return digits ? Number(digits).toLocaleString('en-NG') : ''
}

// On input: rewrite the field with commas and keep the caret after the same digit it was after. Deleting a
// comma deletes the digit beside it, as people expect. Returns the plain digits for the form.
export function formatAmountInput(el: HTMLInputElement, e?: Event): string {
  const kind = (e as InputEvent | undefined)?.inputType ?? ''
  let raw = el.value
  let caret = el.selectionStart ?? raw.length
  const before = el.dataset.digits ?? ''
  // Only a comma went: take the digit before it (Backspace) or after it (Delete) too
  if (kind.startsWith('delete') && raw.replace(/\D/g, '') === before && before) {
    if (kind === 'deleteContentBackward') {
      let i = caret - 1
      while (i >= 0 && !/\d/.test(raw[i]!)) i--
      if (i >= 0) {
        raw = raw.slice(0, i) + raw.slice(i + 1)
        caret = i
      }
    }
    else {
      let i = caret
      while (i < raw.length && !/\d/.test(raw[i]!)) i++
      if (i < raw.length) raw = raw.slice(0, i) + raw.slice(i + 1)
    }
  }
  const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 13)
  const shown = groupAmount(digits)
  el.value = shown
  el.dataset.digits = digits
  let pos = 0
  for (let seen = 0; pos < shown.length && seen < digitsBeforeCaret; pos++) if (/\d/.test(shown[pos]!)) seen++
  el.setSelectionRange(pos, pos)
  return digits
}
