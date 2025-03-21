export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    console.warn('Invalid amount:', amount)
    return '€0,00'
  }
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'Onbekend'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Ongeldige datum'
    
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Ongeldige datum'
  }
} 