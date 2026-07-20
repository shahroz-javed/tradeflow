const WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
  a: 1, an: 1, oh: 0, o: 0,
}

function wordsToInt(str) {
  const tokens = str.trim().split(/\s+/)
  let total = 0
  let current = 0
  for (const tok of tokens) {
    const val = WORDS[tok]
    if (val === undefined) continue
    if (val === 100) {
      current = (current || 1) * 100
    } else if (val === 1000) {
      total = (total + current) * 1000
      current = 0
    } else {
      current += val
    }
  }
  return total + current
}

/** Converts spoken words to a number: "one sixty point zero two" -> 160.02 */
export function parseSpokenNumber(text) {
  const t = text.toLowerCase().trim()

  const directMatch = t.replace(/[^0-9.]/g, '')
  if (directMatch && !isNaN(parseFloat(directMatch))) return parseFloat(directMatch)

  const parts = t.replace(/\band\b/g, '').split(/\bpoint\b/)

  let result
  if (parts.length === 1) {
    result = wordsToInt(parts[0])
  } else {
    const intPart = wordsToInt(parts[0])
    const decTokens = parts[1].trim().split(/\s+/)
    const decStr = decTokens.map((w) => (WORDS[w] !== undefined ? WORDS[w] : '')).join('')
    result = parseFloat(`${intPart}.${decStr}`)
  }
  return isFinite(result) && result > 0 ? result : null
}
