// Read and write values on nested objects by dotted path ("owner.name")
export function getNestedValue<T = unknown>(object: Record<string, any>, path: string): T | undefined {
  return path
    .split('.')
    .reduce<any>((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), object)
}

export function setNestedValue(obj: Record<string, any>, path: string, value: any) {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!
    if (!current[key] || typeof current[key] !== 'object') current[key] = {}
    current = current[key]
  }
  current[keys[keys.length - 1]!] = value
}
