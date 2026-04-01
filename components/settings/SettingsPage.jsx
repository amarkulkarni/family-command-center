'use client'

import { useState } from 'react'
import Header from '../Header'
import Channels from './Channels'
import Children from './Children'

export default function SettingsPage({ user, familySpaceId, familySpace, connectors, children }) {
  const [activeTab, setActiveTab] = useState('children')

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there'
  const avatar = user.user_metadata?.avatar_url
  const email = user.email

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', flexDirection: 'column' }}>
      <Header
        user={user}
        title="Settings"
        subtitle="Manage your family space"
        showNav={true}
      />

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid #E2E8F0',
          background: 'white',
          paddingLeft: '28px',
        }}
      >
        {[
          { id: 'children', label: '👧 Children' },
          { id: 'channels', label: '📧 Connected Channels' },
          { id: 'invite', label: '🔗 Invite Code' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? '#1a2e4a' : '#7A8A99',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '3px solid #1a2e4a' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '28px' }}>
          {activeTab === 'children' && (
            <Children
              familySpaceId={familySpaceId}
              children={children}
              user={user}
            />
          )}

          {activeTab === 'channels' && (
            <Channels
              familySpaceId={familySpaceId}
              connectors={connectors}
              user={user}
            />
          )}

          {activeTab === 'invite' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2e4a', marginBottom: '16px' }}>
                Invite your spouse
              </h2>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: '16px',
              }}>
                <p style={{ color: '#7A8A99', fontSize: '14px', marginBottom: '16px', lineHeight: '1.6' }}>
                  Share this code with your spouse. They can use it to join this family space and see all messages, tasks, and reminders.
                </p>
                <div style={{
                  background: '#F1F5F9',
                  border: '2px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    Family Space Code
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#1a2e4a',
                    letterSpacing: '4px',
                  }}>
                    {familySpace?.invite_code}
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '12px', textAlign: 'center' }}>
                  They'll visit this website and enter this code to join.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
