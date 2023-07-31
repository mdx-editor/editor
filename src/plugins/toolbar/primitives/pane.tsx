import React from 'react'
interface PaneContextValue {
  activePane: string
  setActivePane: (pane: string) => void
}

const PaneContext = React.createContext<PaneContextValue>({
  activePane: '',
  setActivePane: () => {
    throw new Error('use PaneContextProvider')
  }
})

export const PaneContextProvider: React.FC<{ initialActivePane: string; children: React.ReactNode }> = ({
  initialActivePane,
  children
}) => {
  const [activePane, setActivePane] = React.useState(initialActivePane)
  return <PaneContext.Provider value={{ activePane, setActivePane }}>{children}</PaneContext.Provider>
}

export const usePaneSwitcher = () => {
  return React.useContext(PaneContext).setActivePane
}

export const Pan: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { activePane } = React.useContext(PaneContext)
  return activePane === id ? <>{children}</> : null
}
