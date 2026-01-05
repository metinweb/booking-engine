// Date and time formatting utilities

export const formatDate = date => {
  if (!date) return '-'

  const d = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now - d) / 1000)

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'Az önce'
  }

  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} dakika önce`
  }

  // Less than 24 hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} saat önce`
  }

  // Less than 7 days
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} gün önce`
  }

  // Default: show full date
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export const formatDateTime = date => {
  if (!date) return '-'

  const d = new Date(date)
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatTime = date => {
  if (!date) return '-'

  const d = new Date(date)
  return d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDuration = seconds => {
  if (!seconds) return '0s'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts = []
  if (hours > 0) parts.push(`${hours}s`)
  if (minutes > 0) parts.push(`${minutes}d`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}
