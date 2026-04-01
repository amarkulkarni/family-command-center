'use client'

import { useState } from 'react'

export default function Children({ familySpaceId, children: initialChildren, user }) {
  const [children, setChildren] = useState(initialChildren || [])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', grade: '', school: '', activities: '' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const getToken = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const token = await getToken()
      const activitiesArr = form.activities
        ? form.activities.split(',').map(a => a.trim()).filter(Boolean)
        : []

      const body = {
        name: form.name.trim(),
        grade: form.grade.trim() || null,
        school: form.school.trim() || null,
        activities: activitiesArr,
      }

      if (editingId) {
        body.id = editingId
        const res = await fetch('/api/children', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.child) {
          setChildren(prev => prev.map(c => c.id === editingId ? data.child : c))
        }
      } else {
        const res = await fetch('/api/children', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.child) {
          setChildren(prev => [...prev, data.child])
        }
      }
      setForm({ name: '', grade: '', school: '', activities: '' })
      setShowAdd(false)
      setEditingId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this child?')) return
    try {
      const token = await getToken()
      await fetch('/api/children', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setChildren(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (child) => {
    setEditingId(child.id)
    setForm({
      name: child.name,
      grade: child.grade || '',
      school: child.school || '',
      activities: (child.activities || []).join(', '),
    })
    setShowAdd(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2e4a' }}>
          Children
        </h2>
        {!showAdd && (
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); setForm({ name: '', grade: '', school: '', activities: '' }) }}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              background: '#127A66', color: 'white', border: 'none', cursor: 'pointer',
            }}
          >
            + Add child
          </button>
        )}
      </div>

      <p style={{ color: '#7A8A99', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
        Add your children so emails can be organized by child. The AI uses their name, grade, school, and activities to match incoming emails.
      </p>

      {/* Existing children */}
      {children.map(child => (
        <div key={child.id} style={{
          background: 'white', borderRadius: '12px', padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a2e4a', marginBottom: '4px' }}>
              {child.name}
            </div>
            <div style={{ fontSize: '13px', color: '#64748B' }}>
              {[child.grade, child.school].filter(Boolean).join(' \u00B7 ')}
            </div>
            {child.activities?.length > 0 && (
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                {child.activities.join(', ')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => startEdit(child)}
              style={{
                padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                background: 'white', color: '#1a2e4a', border: '1px solid #E2E8F0', cursor: 'pointer',
              }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(child.id)}
              style={{
                padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                background: 'white', color: '#DC2626', border: '1px solid #FCA5A5', cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {children.length === 0 && !showAdd && (
        <div style={{
          background: 'white', borderRadius: '12px', padding: '32px',
          textAlign: 'center', color: '#94A3B8', fontSize: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          No children added yet. Click "Add child" to get started.
        </div>
      )}

      {/* Add/edit form */}
      {showAdd && (
        <div style={{
          background: 'white', borderRadius: '12px', padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginTop: '12px',
          border: '2px solid #127A66',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1a2e4a', marginBottom: '16px' }}>
            {editingId ? 'Edit child' : 'Add a child'}
          </h3>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name *"
            style={{
              width: '100%', padding: '10px 12px', fontSize: '14px',
              border: '1px solid #E2E8F0', borderRadius: '8px',
              marginBottom: '8px', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              value={form.grade}
              onChange={(e) => setForm(f => ({ ...f, grade: e.target.value }))}
              placeholder="Grade (e.g. 5th grade)"
              style={{
                flex: 1, padding: '10px 12px', fontSize: '14px',
                border: '1px solid #E2E8F0', borderRadius: '8px', boxSizing: 'border-box',
              }}
            />
            <input
              type="text"
              value={form.school}
              onChange={(e) => setForm(f => ({ ...f, school: e.target.value }))}
              placeholder="School"
              style={{
                flex: 1, padding: '10px 12px', fontSize: '14px',
                border: '1px solid #E2E8F0', borderRadius: '8px', boxSizing: 'border-box',
              }}
            />
          </div>
          <input
            type="text"
            value={form.activities}
            onChange={(e) => setForm(f => ({ ...f, activities: e.target.value }))}
            placeholder="Activities (comma-separated, e.g. basketball, boy scouts, dance)"
            style={{
              width: '100%', padding: '10px 12px', fontSize: '14px',
              border: '1px solid #E2E8F0', borderRadius: '8px',
              marginBottom: '16px', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                background: saving ? '#CBD5E1' : '#127A66', color: 'white',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add child'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setEditingId(null); setError('') }}
              style={{
                padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                background: 'white', color: '#64748B',
                border: '1px solid #E2E8F0', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
          {error && (
            <div style={{
              background: '#FEE2E2', color: '#991B1B', padding: '10px',
              borderRadius: '8px', fontSize: '12px', marginTop: '12px',
            }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
