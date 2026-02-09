
# Provider "Mensajes" Screen

## Overview
Replace the current placeholder `ProviderMessages.tsx` with a full mobile-first messaging screen featuring a search bar, tabbed navigation (Soporte / Clientes), mock conversation lists, and polished empty states.

## UI Structure

```text
+----------------------------------+
|  Mensajes              (title)   |
|  [  Search bar               ]   |
+----------------------------------+
|  [ Soporte ]  [ Clientes ]       |  <-- Tabs
+----------------------------------+
|                                  |
|  Conversation list items:        |
|  +------------------------------+|
|  | Avatar | Title        time   ||
|  |        | Preview...   * dot  ||
|  +------------------------------+|
|  | Avatar | Title        time   ||
|  |        | Preview...          ||
|  +------------------------------+|
|                                  |
|  -- or Empty State --            |
|  Icon + message                  |
+----------------------------------+
```

## Details

### 1. Header
- "Mensajes" as a bold page title (`text-xl font-bold font-jakarta`)
- Search input below with a `Search` icon, placeholder "Buscar conversaciones..."

### 2. Tabs (Radix Tabs)
- Two tabs: **Soporte** and **Clientes**
- Default active: **Soporte**
- Uses existing `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` components

### 3. Conversation List Items
- Mock data array within the component (no backend calls)
- Each item renders:
  - **Avatar**: `Headset` icon in a colored circle for support threads; customer initial letter for client threads
  - **Title**: "Soporte Chamby" or "Cliente: {name}"
  - **Last message preview**: single line, truncated
  - **Timestamp**: relative time string (e.g., "hace 2 min")
  - **Unread indicator**: small primary-colored dot if `unread: true`
- Items use `motion.div` with `whileTap={{ scale: 0.98 }}` for subtle press feedback
- Clicking a conversation is a no-op for now (or shows a toast "Proximamente")

### 4. Empty States
- **Soporte tab**: `Headset` icon + "Escribenos si necesitas ayuda" + subtle secondary text
- **Clientes tab**: `MessageSquare` icon + "Aun no tienes conversaciones con clientes"
- Both use `motion.div` fade-in animation, consistent with existing portal empty states

### 5. Search Filtering
- Filters mock conversations by title or last message content (client-side only)

## Technical Plan

### File: `src/pages/provider-portal/ProviderMessages.tsx`
Rewrite this single file with:
- Imports: `useState` from React, `motion` from framer-motion, UI components (`Input`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`), Lucide icons (`Search`, `Headset`, `MessageSquare`)
- Mock data: two arrays (`supportThreads`, `clientThreads`) with `id`, `title`, `lastMessage`, `timestamp`, `unread`, `avatarInitial?` fields
- `ConversationItem` inline component rendering each row
- Empty state components per tab
- Search state filtering both lists

### No other files changed
- Routing already exists (`/provider-portal/messages`)
- Bottom nav already wired with unread badge
- No backend, no new hooks, no new dependencies
