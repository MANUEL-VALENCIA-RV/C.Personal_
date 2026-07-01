const clients = new Set()

export function addClient(res) {
  const client = { res, id: Date.now() }
  clients.add(client)

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId: client.id })}\n\n`)

  res.on('close', () => {
    clients.delete(client)
  })

  return client.id
}

export function broadcast(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  clients.forEach(client => {
    try {
      client.res.write(message)
    } catch {
      clients.delete(client)
    }
  })
}

export function getClientCount() {
  return clients.size
}
