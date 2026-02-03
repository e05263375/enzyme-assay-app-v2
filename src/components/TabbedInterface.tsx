import React, { useMemo, useState, useImperativeHandle, forwardRef } from 'react'

type TabId = string

export type TabSpec = {
  id: TabId
  label: string
  content: React.ReactNode
}

export interface TabbedInterfaceRef {
  setActiveTab: (tabId: TabId) => void
  getActiveTab: () => TabId
}

export const TabbedInterface = forwardRef<TabbedInterfaceRef, { tabs: TabSpec[]; defaultTabId?: TabId }>(({
  tabs,
  defaultTabId
}, ref) => {
  const initialId = useMemo(() => {
    if (defaultTabId && tabs.some(t => t.id === defaultTabId)) return defaultTabId
    return tabs[0]?.id ?? 'tab'
  }, [defaultTabId, tabs])

  const [active, setActive] = useState<TabId>(initialId)
  const activeTab = tabs.find(t => t.id === active) ?? tabs[0]

  useImperativeHandle(ref, () => ({
    setActiveTab: (tabId: TabId) => {
      if (tabs.some(t => t.id === tabId)) {
        setActive(tabId)
      }
    },
    getActiveTab: () => active
  }))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border">
        <div className="flex flex-wrap gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
          {tabs.map(t => {
            const isActive = t.id === active
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        <div className="p-6">{activeTab?.content}</div>
      </div>
    </div>
  )
})

TabbedInterface.displayName = 'TabbedInterface'

