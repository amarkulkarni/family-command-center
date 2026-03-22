'use client'

import { useState } from 'react'

const CONNECTOR_INFO = {
  GMAIL_FORWARD: {
    icon: '📧',
    name: 'Gmail Forwarding',
    description: 'Automatically capture emails to a family inbox email address',
    setupSteps: [
      {
        title: 'Create a forwarding email address',
        description: "You'll need to set up a forwarding filter in Gmail. This can be a simple email like \"family-inbox@example.com\" or use the provided forwarding address.",
      },
      {
        title: 'Set up Gmail filter',
        description: "In Gmail, go to Settings → Filters and Blocked Addresses → Create a new filter. Set the criteria to match emails you want to track (e.g., from specific domains like @school.edu, @hospital.org).",
      },
      {
        title: 'Configure forwarding',
        description: "In the filter action, select \"Forward to\" and enter the forwarding email address. The app will receive these emails and categorize them.",
      },
      {
        title: 'Set up for spouse',
        description: "Repeat the process for your spouse's Gmail account to capture their emails too.",
      },
    ],
  },
  TWILIO_WHATSAPP: {
    icon: '💬',
    name: 'WhatsApp Bot',
    description: 'Text family reminders and tasks to a WhatsApp number',
    setupSteps: [
      {
        title: 'Save the bot number',
        description: 'Save the WhatsApp number to your phone contacts as "Family Inbox".',
      },
      {
        title: 'Send a message',
        description: 'Text the bot anytime to add a task. Example: "dentist for Arjun April 15 3pm"',
      },
      {
        title: 'Get confirmation',
        description: 'You\'ll receive a reply: "Got it — added to family inbox ✓"',
      },
      {
        title: 'Both parents can use it',
        description: 'Your spouse can also text the same number. All messages appear in the shared inbox.',
      },
    ],
  },
  WHATSAPP_WEB: {
    icon: '💻',
    name: 'WhatsApp Web Extension (Coming Soon)',
    description: 'Capture forwarded messages directly from WhatsApp Web',
    setupSteps: [
      {
        title: 'Install extension',
        description: 'Coming in v2 — will auto-install via Chrome Web Store',
      },
    ],
  },
}

export default function Channels({ familySpaceId, connectors, user }) {
  const [expandedType, setExpandedType] = useState(null)
  const [showNewConnector, setShowNewConnector] = useState(false)

  const connectedTypes = connectors.map((c) => c.type)

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2e4a', marginBottom: '24px' }}>
        Connected Channels
      </h2>

      {/* Connected connectors */}
      {connectors.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Active
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {connectors.map((conn) => {
              const info = CONNECTOR_INFO[conn.type]
              return (
                <div
                  key={conn.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '2px solid #DCFCE7',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '24px' }}>{info?.icon}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a2e4a' }}>
                        {conn.display_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7A8A99', marginTop: '4px' }}>
                        {conn.owner_email && `Email: ${conn.owner_email}`}
                        {conn.last_received_at && (
                          <div>
                            Last message: {new Date(conn.last_received_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: '#DCFCE7',
                      color: '#166534',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    ✓ Connected
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available to add */}
      {connectedTypes.length < Object.keys(CONNECTOR_INFO).length && (
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Add More Channels
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(CONNECTOR_INFO).map(([type, info]) => {
              const isConnected = connectedTypes.includes(type)
              const isExpanded = expandedType === type

              if (isConnected && type !== 'WHATSAPP_WEB') return null

              return (
                <div
                  key={type}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setExpandedType(isExpanded ? null : type)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isConnected) e.currentTarget.parentElement.style.background = '#F8FAFC'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.parentElement.style.background = 'white'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                      <div style={{ fontSize: '24px' }}>{info.icon}</div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a2e4a' }}>
                          {info.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#7A8A99', marginTop: '4px' }}>
                          {info.description}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '18px', marginLeft: '12px' }}>
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '16px', borderTop: '1px solid #E2E8F0', background: '#FAFBFC' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {info.setupSteps.map((step, i) => (
                          <div key={i}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a2e4a', marginBottom: '6px' }}>
                              {i + 1}. {step.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#7A8A99', lineHeight: '1.5' }}>
                              {step.description}
                            </div>
                          </div>
                        ))}

                        {type === 'TWILIO_WHATSAPP' && (
                          <div style={{
                            background: '#F0F4F8',
                            border: '1px solid #CBD5E1',
                            borderRadius: '8px',
                            padding: '12px',
                            marginTop: '12px',
                          }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a2e4a', marginBottom: '6px' }}>
                              📱 Bot Number
                            </div>
                            <div style={{
                              fontFamily: 'monospace',
                              fontSize: '14px',
                              color: '#064E3B',
                              fontWeight: '600',
                            }}>
                              {process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || '+1 (XXX) XXX-XXXX'}
                            </div>
                          </div>
                        )}

                        {!isConnected && type !== 'WHATSAPP_WEB' && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/connectors/create', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    familySpaceId,
                                    type,
                                    ownerEmail: user.email,
                                  }),
                                })
                                if (res.ok) {
                                  window.location.reload()
                                }
                              } catch (err) {
                                console.error('Error creating connector:', err)
                              }
                            }}
                            style={{
                              background: '#16A34A',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '10px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              marginTop: '12px',
                            }}
                          >
                            Set Up {info.name}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {connectedTypes.length === Object.keys(CONNECTOR_INFO).length && (
        <div style={{
          background: '#DCFCE7',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          color: '#166534',
        }}>
          ✓ All available channels are connected!
        </div>
      )}
    </div>
  )
}
