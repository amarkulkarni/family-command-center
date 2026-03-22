export default function FilterBar({
  category,
  setCategory,
  connectorFilter,
  setConnectorFilter,
  categories,
  connectors,
}) {
  return (
    <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', background: '#FAFBFC' }}>
      {/* Category filters */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
          Category
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setCategory(cat.value)
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: category === cat.value ? `2px solid #1a2e4a` : '1px solid #E2E8F0',
                background: category === cat.value ? (cat.color || '#F1F5F9') : 'white',
                color: category === cat.value ? '#1a2e4a' : '#64748B',
                fontSize: '12px',
                fontWeight: category === cat.value ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Connector filters */}
      {connectors.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Source
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setConnectorFilter('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: connectorFilter === 'ALL' ? '2px solid #1a2e4a' : '1px solid #E2E8F0',
                background: connectorFilter === 'ALL' ? '#F1F5F9' : 'white',
                color: connectorFilter === 'ALL' ? '#1a2e4a' : '#64748B',
                fontSize: '12px',
                fontWeight: connectorFilter === 'ALL' ? '600' : '500',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            {connectors.map((conn) => (
              <button
                key={conn.id}
                onClick={() => setConnectorFilter(conn.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: connectorFilter === conn.id ? '2px solid #1a2e4a' : '1px solid #E2E8F0',
                  background: connectorFilter === conn.id ? '#F1F5F9' : 'white',
                  color: connectorFilter === conn.id ? '#1a2e4a' : '#64748B',
                  fontSize: '12px',
                  fontWeight: connectorFilter === conn.id ? '600' : '500',
                  cursor: 'pointer',
                }}
              >
                {conn.display_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
