'use client'

import { useState, useEffect } from 'react'
import Header from '../Header'
import FilterBar from './FilterBar'
import MessageList from './MessageList'
import MessageDetail from './MessageDetail'

const CATEGORIES = [
  { value: 'ALL', label: 'All', color: null },
  { value: 'SCHOOL', label: 'School', color: '#DBEAFE' },
  { value: 'MEDICAL', label: 'Medical', color: '#FEE2E2' },
  { value: 'APPOINTMENTS', label: 'Appointments', color: '#CCFBF1' },
  { value: 'PAYMENTS', label: 'Payments', color: '#FEF3C7' },
  { value: 'ACTIVITIES', label: 'Activities', color: '#DCFCE7' },
  { value: 'PTA', label: 'PTA', color: '#F3E8FF' },
  { value: 'ADMIN', label: 'Admin', color: '#F1F5F9' },
  { value: 'NEWSLETTER', label: 'Newsletter', color: '#F1F5F9' },
  { value: 'PERSONAL', label: 'Personal', color: '#F1F5F9' },
  { value: 'OTHER', label: 'Other', color: '#F1F5F9' },
]

const URGENCY_COLORS = {
  HIGH: '#DC2626',
  MEDIUM: '#D97706',
  LOW: '#6B7280',
}

export default function InboxPage({ user, familySpaceId, familySpace, connectors }) {
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [category, setCategory] = useState('ALL')
  const [connectorFilter, setConnectorFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there'
  const avatar = user.user_metadata?.avatar_url
  const email = user.email

  useEffect(() => {
    fetchMessages()
  }, [category, connectorFilter, page])

  async function fetchMessages() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(category !== 'ALL' && { category }),
        ...(connectorFilter !== 'ALL' && { connectorId: connectorFilter }),
      })
      const res = await fetch(`/api/messages?${params}`)
      const data = await res.json()
      setMessages(data.messages || [])
      setTotalPages(data.totalPages || 0)
      setTotal(data.total || 0)
      setSelectedMessage(null)
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', flexDirection: 'column' }}>
      <Header
        user={user}
        title={`${familySpace?.name || 'Family'} Inbox`}
        subtitle={`${total} messages`}
        showNav={true}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel: Message list */}
        <div style={{ flex: '0 0 40%', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
          <FilterBar
            category={category}
            setCategory={setCategory}
            connectorFilter={connectorFilter}
            setConnectorFilter={setConnectorFilter}
            categories={CATEGORIES}
            connectors={connectors}
          />

          <MessageList
            messages={messages}
            selectedMessageId={selectedMessage?.id}
            onSelectMessage={setSelectedMessage}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        {/* Right panel: Message detail */}
        <div style={{ flex: '0 0 60%', background: 'white', display: 'flex', flexDirection: 'column' }}>
          {selectedMessage ? (
            <MessageDetail message={selectedMessage} />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                fontSize: '15px',
              }}
            >
              {messages.length === 0 ? '📭 No messages' : '← Select a message'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
