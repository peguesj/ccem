/**
 * CCEM-UI Pages
 * Centralized export for all page components
 */

// Home Page
export { HomePage } from './Home';
export type { QuickAction, HomeActionDetail, HomeStats } from './Home';

// Sessions Page
export { SessionsPage } from './Sessions';
export type { Session } from './Sessions';

// Agents Page
export { AgentsPage } from './Agents';

// Chats Page
export { ChatsPage } from './Chats';

// Settings Page
export { SettingsPage } from './Settings';
export type { AppSettings } from './Settings';

// Default exports
export { default as HomePageDefault } from './Home';
export { default as SessionsPageDefault } from './Sessions';
export { default as AgentsPageDefault } from './Agents';
export { default as ChatsPageDefault } from './Chats';
export { default as SettingsPageDefault } from './Settings';
